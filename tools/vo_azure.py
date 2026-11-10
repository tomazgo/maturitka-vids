# Slovak voiceover with Azure Speech neural voices, one sentence at a time, with real word timings.
# Run from a video folder (videos/<slug>/) that has script.json: a JSON list of sentences.
#
# Writes: audio/vo.wav, audio/lines/<n>.wav, audio/words.json, web/words.js, web/warp.js
#
# Credentials (never commit them): AZURE_SPEECH_KEY and AZURE_SPEECH_REGION, read from the environment,
# from <repo>/.env, or from the file named in AZURE_ENV_FILE.
#
# Optional: if the folder has retime-from.json (word timings of an older voice the shots were timed to),
# a time warp maps every old sentence onto the new one, so existing animation follows the new voice.
import json, os, sys
from pathlib import Path

import azure.cognitiveservices.speech as speechsdk
import numpy as np
import soundfile as sf
from dotenv import load_dotenv
from scipy import signal

SR = 44100
AZURE_SR = 48000
GAP = 0.28
EDGE_PAD = 0.05
REPO_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(REPO_ROOT / ".env")
if os.environ.get("AZURE_ENV_FILE"):
    load_dotenv(Path(os.environ["AZURE_ENV_FILE"]).expanduser())

VOICE = os.environ.get("AZURE_VOICE", "sk-SK-LukasNeural")
RATE = os.environ.get("AZURE_RATE", "+5%")


def first_env(*names):
    return next((os.environ[name] for name in names if os.environ.get(name)), None)


speech_key = first_env("AZURE_SPEECH_KEY", "AZURE_SPEECH_KEY_1", "AZURE_KEY", "SPEECH_KEY")
speech_region = first_env("AZURE_SPEECH_REGION", "AZURE_REGION", "SPEECH_REGION") or "westeurope"
if not speech_key:
    sys.exit("Missing AZURE_SPEECH_KEY (environment, <repo>/.env or AZURE_ENV_FILE)")

lines = json.load(open("script.json"))
retime_words = json.load(open("retime-from.json")) if os.path.exists("retime-from.json") else None


def build_synthesizer():
    config = speechsdk.SpeechConfig(subscription=speech_key, region=speech_region)
    config.set_speech_synthesis_output_format(speechsdk.SpeechSynthesisOutputFormat.Riff48Khz16BitMonoPcm)
    config.set_property(speechsdk.PropertyId.SpeechServiceResponse_RequestWordBoundary, "true")
    config.set_property(speechsdk.PropertyId.SpeechServiceResponse_RequestPunctuationBoundary, "false")
    return speechsdk.SpeechSynthesizer(speech_config=config, audio_config=None)


def escape_xml(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def speak(synthesizer, text):
    boundaries = []

    def on_boundary(event):
        if event.boundary_type == speechsdk.SpeechSynthesisBoundaryType.Word:
            boundaries.append((event.audio_offset / 1e7, event.duration.total_seconds()))

    synthesizer.synthesis_word_boundary.connect(on_boundary)
    ssml = (f'<speak version="1.0" xml:lang="sk-SK"><voice name="{VOICE}">'
            f'<prosody rate="{RATE}">{escape_xml(text)}</prosody></voice></speak>')
    result = synthesizer.speak_ssml_async(ssml).get()
    synthesizer.synthesis_word_boundary.disconnect_all()
    if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
        details = result.cancellation_details
        sys.exit(f"Azure synthesis failed: {details.reason} {details.error_details}")
    pcm = np.frombuffer(result.audio_data[44:], dtype=np.int16).astype(np.float32) / 32768
    return signal.resample_poly(pcm, SR, AZURE_SR), boundaries


def trim_to_speech(audio, boundaries):
    first_start = max(0.0, boundaries[0][0] - EDGE_PAD)
    last_end = min(len(audio) / SR, boundaries[-1][0] + boundaries[-1][1] + EDGE_PAD)
    shifted = [(start - first_start, length) for start, length in boundaries]
    return audio[int(first_start * SR):int(last_end * SR)], shifted


def time_words(tokens, boundaries, duration):
    # Azure may split or merge tokens (numbers, abbreviations); fall back to letter-count spreading then.
    if len(boundaries) == len(tokens):
        return [(start, start + length) for start, length in boundaries]
    print(f"  word count mismatch ({len(boundaries)} boundaries, {len(tokens)} tokens), spreading by letters")
    weights = [len(token) + 1.5 for token in tokens]
    total, cursor, spans = sum(weights), 0.0, []
    for weight in weights:
        length = duration * weight / total
        spans.append((cursor, cursor + length))
        cursor += length
    return spans


def retime_line_span(index):
    line_words = [w for w in retime_words if w["line"] == index]
    return line_words[0]["s"], line_words[-1]["e"]


def write_outputs(chunks, words, anchors, total):
    sf.write("audio/vo.wav", np.concatenate(chunks), SR)
    json.dump(words, open("audio/words.json", "w"), ensure_ascii=False, indent=0)
    os.makedirs("web", exist_ok=True)
    words_js = "const WORDS=" + json.dumps(words, ensure_ascii=False) + ";"
    if retime_words:
        warp = {"anchors": anchors, "new_end": round(total, 3)}
        json.dump(warp, open("audio/warp.json", "w"))
        words_js += "\nconst WORDS_OLD=" + json.dumps(retime_words, ensure_ascii=False) + ";"
        open("web/warp.js", "w").write("window.WARP=" + json.dumps(warp) + ";")
    else:
        if os.path.exists("audio/warp.json"):
            os.remove("audio/warp.json")
        open("web/warp.js", "w").write("window.WARP=null;")
    open("web/words.js", "w").write(words_js)


def main():
    synthesizer = build_synthesizer()
    os.makedirs("audio/lines", exist_ok=True)
    chunks, words, anchors, cursor = [], [], [], 0.0
    for index, text in enumerate(lines):
        audio, boundaries = trim_to_speech(*speak(synthesizer, text))
        duration = len(audio) / SR
        sf.write(f"audio/lines/{index}.wav", audio, SR)
        tokens = text.split()
        for token, (start, end) in zip(tokens, time_words(tokens, boundaries, duration)):
            words.append({"w": token, "s": round(cursor + start, 3), "e": round(cursor + end, 3), "line": index})
        if retime_words:
            old_start, old_end = retime_line_span(index)
            anchors += [[old_start, round(cursor, 3)], [old_end, round(cursor + duration, 3)]]
        chunks += [audio, np.zeros(int(GAP * SR))]
        print(f"{index}: {cursor:6.2f} - {cursor + duration:6.2f}  {text}")
        cursor += duration + GAP
    write_outputs(chunks, words, anchors, cursor)
    print("total", round(cursor, 2), "voice", VOICE)


main()
