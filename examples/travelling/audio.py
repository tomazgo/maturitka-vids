# Sound for "Travelling": voice plus code-generated effects only, no background music.
# Effects are placed from the voice's word timings (audio/words.json), like the shots, so a re-voice needs no edits.
import json
import re

import numpy as np
import soundfile as sf
from scipy import signal

SR = 44100
rng = np.random.default_rng(7)
WORDS = json.load(open("audio/words.json"))
DUR = sf.info("audio/vo.wav").duration + 1.4  # voice plus the closing hold
N = int(DUR * SR)
sfx = np.zeros(N)


# ---------------- timing helpers (mirror shots.js) ----------------
def normalise(word):
    return re.sub(r"[^\w']", "", word.lower())


def line_words(line):
    return [w for w in WORDS if w["line"] == line]


def word_at(word, line):
    found = next((w for w in line_words(line) if normalise(w["w"]) == word), None)
    return found["s"] if found else line_words(line)[0]["s"]


def cut_before(line):
    return (line_words(line - 1)[-1]["e"] + line_words(line)[0]["s"]) / 2


# ---------------- synth helpers ----------------
def T(n):
    return np.arange(n) / SR


def place(x, at, gain=1.0):
    start = int(at * SR)
    if start < 0 or start >= N:
        return
    end = min(N, start + len(x))
    sfx[start:end] += x[:end - start] * gain


def bandpass(x, low, high, order=2):
    b, a = signal.butter(order, [low / (SR / 2), min(high / (SR / 2), .99)], "band")
    return signal.lfilter(b, a, x)


def lowpass(x, freq, order=2):
    b, a = signal.butter(order, freq / (SR / 2), "low")
    return signal.lfilter(b, a, x)


def highpass(x, freq, order=2):
    b, a = signal.butter(order, freq / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def whoosh(dur=.32):
    n = int(dur * SR); t = T(n); noise = rng.standard_normal(n); k = np.linspace(0, 1, n)
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return (bandpass(noise, 300, 1400) * (1 - k) + bandpass(noise, 1500, 6000) * k) * shape * 1.5


def pop(freq=650):
    n = int(.12 * SR); t = T(n); sweep = freq * (1 + 20 * t)
    return np.sin(2 * np.pi * np.cumsum(sweep) / SR) * np.exp(-t * 40)


def chime(freq=1760, dur=.7):
    n = int(dur * SR); t = T(n)
    tone = np.sin(2 * np.pi * freq * t) + .5 * np.sin(2 * np.pi * freq * 2.01 * t) + .3 * np.sin(2 * np.pi * freq * 3 * t)
    return tone * np.exp(-t * 6) * np.minimum(1, t / .003) * .5


def sparkle():
    out = np.zeros(int(.6 * SR))
    for i, freq in enumerate([2093, 2637, 3136, 4186]):
        part = chime(freq, .45) * .5; start = int(i * .05 * SR); out[start:start + len(part)] += part[:len(out) - start]
    return out


def check_ding():
    return chime(1568, .5) + chime(2093, .5) * .6


def cash_register():
    n = int(.5 * SR); t = T(n)
    click = highpass(rng.standard_normal(n), 3000) * np.exp(-t * 120) * .6
    return click + chime(2637, .5) * .8 + chime(3520, .5) * .5


def jet_flyby(dur=2.2):
    n = int(dur * SR); t = T(n); noise = rng.standard_normal(n)
    shape = np.sin(np.pi * t / dur) ** 2
    return (lowpass(noise, 900) * .8 + bandpass(noise, 2000, 5000) * .25) * shape


def train_clacks(dur, rate=.42):
    out = np.zeros(int(dur * SR)); k = 0
    while k * rate < dur - .1:
        n = int(.06 * SR); t = T(n)
        clack = lowpass(rng.standard_normal(n), 1800) * np.exp(-t * 70) + np.sin(2 * np.pi * 220 * t) * np.exp(-t * 60) * .5
        for offset in (0, .11):
            start = int((k * rate + offset) * SR); out[start:start + n] += clack[:len(out) - start] * .8
        k += 1
    return out


def engine_hum(dur):
    n = int(dur * SR); t = T(n); freq = 70 + 6 * np.sin(2 * np.pi * .7 * t)
    tone = np.sign(np.sin(2 * np.pi * np.cumsum(freq) / SR)) * .4
    return lowpass(tone, 400) * np.minimum(1, t / .3) * np.minimum(1, (dur - t) / .3)


def horn(freq=420, dur=.35):
    n = int(dur * SR); t = T(n)
    tone = np.sign(np.sin(2 * np.pi * freq * t)) + np.sign(np.sin(2 * np.pi * freq * 1.26 * t))
    return lowpass(tone * .25, 2200) * np.minimum(1, t / .02) * np.minimum(1, (dur - t) / .04)


def footsteps(at, count, interval=.33, gain=.25):
    for i in range(count):
        n = int(.07 * SR); t = T(n)
        place(lowpass(rng.standard_normal(n), 900) * np.exp(-t * 60), at + i * interval, gain)


def paper_drop():
    n = int(.25 * SR); t = T(n)
    return bandpass(rng.standard_normal(n), 1200, 6000) * np.exp(-t * 18) * .5


# ---------------- effect timeline ----------------
LAST = max(w["line"] for w in WORDS)
cuts = [cut_before(line) for line in range(1, LAST + 1)] + [word_at("traffic", 4) - .12]
for cut in cuts:
    place(whoosh(), cut - .18, .3)

# 0 hook: globe pops, tags
place(pop(500), .2, .4); place(sparkle(), .3, .25)
place(pop(700), word_at("travelling", 0), .4); place(pop(600), word_at("maturita", 0), .35)
# 1 reasons: rolling suitcase steps, three tags
footsteps(cut_before(1), 10, .32, .18)
for word in ("relax", "cultures", "friends"):
    place(pop(650), word_at(word, 1), .4)
# 2 plane: jet, money, smoke
place(jet_flyby(2.4), cut_before(2) - .2, .35)
place(pop(700), word_at("fastest", 2), .35)
place(cash_register(), word_at("expensive", 2), .35)
place(lowpass(rng.standard_normal(int(.8 * SR)), 500) * np.exp(-T(int(.8 * SR)) * 4) * .6, word_at("planet", 2), .4)
# 3 train: clacks under the whole sentence, sparkle on the view
place(train_clacks(cut_before(4) - cut_before(3)), cut_before(3), .22)
for word in ("slower", "comfortable", "view"):
    place(pop(650), word_at(word, 3), .35)
place(sparkle(), word_at("view", 3) + .1, .3)
# 4 car: engine, then the jam with horns
place(engine_hum(word_at("traffic", 4) - cut_before(4)), cut_before(4), .3)
place(sparkle(), word_at("freedom", 4) + .05, .3)
jam_start = word_at("traffic", 4)
for i, offset in enumerate((.05, .5, .8, 1.25, 1.6)):
    place(horn(380 + 60 * (i % 3), .3 if i % 2 else .45), jam_start + offset, .25)
# 5 places to stay: each building pops up, footsteps
for word in ("hotel", "hostel", "campsite"):
    place(pop(520), word_at(word, 5), .45)
footsteps(cut_before(5), 9, .36, .15)
# 6 packing: each item drops in and gets a tick
place(pop(800), cut_before(6) + .2, .35)
for word in ("passport", "currency", "insurance"):
    place(paper_drop(), word_at(word, 6) + .2, .5)
    place(check_ding(), word_at(word, 6) + .35, .25)
# 7 exam task: cards and the VS tag
compare_at = word_at("compare", 7)
place(paper_drop(), compare_at, .5); place(paper_drop(), compare_at + .25, .5); place(pop(900), compare_at + .5, .4)
place(pop(600), word_at("reasons", 7), .35)
# 8 model answer: bubble, ticks, final sparkle
place(pop(700), cut_before(8) + .1, .35)
place(check_ding(), word_at("cheaper", 8), .3)
place(pop(650), word_at("greener", 8), .35); place(sparkle(), word_at("greener", 8) + .1, .3)

# ---------------- voice + mix ----------------
voice, voice_sr = sf.read("audio/vo.wav")
if voice.ndim > 1:
    voice = voice.mean(1)
voice = highpass(signal.resample_poly(voice, SR, voice_sr), 90)
envelope = lowpass(np.abs(signal.hilbert(voice)), 20)
voice *= np.where(envelope > .15, (.15 / np.maximum(envelope, 1e-6)) ** .4, 1.0)  # gentle compression
voice = voice / np.max(np.abs(voice)) * .9
voice_track = np.zeros(N); voice_track[:min(N, len(voice))] = voice[:N]

mix = voice_track + sfx * .7  # no background music
fade_length = int(.5 * SR); mix[-fade_length:] *= np.linspace(1, 0, fade_length)
stereo = np.stack([mix, mix], 1)
stereo = stereo / np.max(np.abs(stereo)) * .89
sf.write("audio/mix.wav", stereo, SR)
print("done", stereo.shape)
