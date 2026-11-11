"""Append restrained, code-generated outro effects to the existing story mix."""
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal


def make_outro_effects(duration, sample_rate):
    effects = np.zeros((round(duration * sample_rate), 2))
    random = np.random.default_rng(71)

    def place(sound, at, gain, pan=0):
        start = round(at * sample_rate)
        end = min(len(effects), start + len(sound))
        if end <= start:
            return
        stereo_gain = np.array([1 - max(0, pan), 1 + min(0, pan)])
        effects[start:end] += sound[:end - start, None] * gain * stereo_gain

    def whoosh(duration, frequency):
        time = np.arange(round(duration * sample_rate)) / sample_rate
        noise = random.standard_normal(len(time))
        filtered = signal.sosfilt(signal.butter(2, [frequency, frequency * 4],
                                               btype='bandpass', fs=sample_rate, output='sos'), noise)
        return filtered * np.sin(np.pi * time / duration) ** 2

    def chime(frequency, duration=.45):
        time = np.arange(round(duration * sample_rate)) / sample_rate
        envelope = np.minimum(1, time / .012) * np.exp(-time * 11)
        return np.sin(2 * np.pi * frequency * time) * envelope

    place(whoosh(.6, 350), .03, .12)  # transition / logo
    for index, at in enumerate([.85, 1.3, 1.75]):
        place(whoosh(.32, 650 + index * 100), at, .075, .25)
        place(chime(660 + index * 110, .25), at + .24, .035, .2)
    place(whoosh(.45, 900), 1.65, .045, -.2)  # underline
    place(whoosh(.55, 400), 2.6, .11)  # URL banner
    place(chime(880), 3.45, .055)
    place(chime(1320), 3.6, .035)
    return effects


def main():
    timing = json.loads(Path('audio/render-timing.json').read_text())
    outro_start = timing['outroStart']
    if outro_start is None:
        raise ValueError('YouTube audio requires an outro in the render timeline')
    story, sample_rate = sf.read('audio/mix.wav', always_2d=True)
    if story.shape[1] == 1:
        story = np.repeat(story, 2, axis=1)
    mix = np.zeros((round(timing['duration'] * sample_rate), 2))
    start = round(outro_start * sample_rate)
    copied = min(start, len(story))
    mix[:copied] = story[:copied, :2]
    # Fade any remaining effect tail before the new end card begins.
    fade_length = min(copied, round(.08 * sample_rate))
    if fade_length:
        mix[copied - fade_length:copied] *= np.linspace(1, 0, fade_length)[:, None]
    effects = make_outro_effects(timing['duration'] - outro_start, sample_rate)
    length = min(len(effects), len(mix) - start)
    mix[start:start + length] += effects[:length]
    sf.write('audio/youtube-mix.wav', mix, sample_rate, subtype='PCM_24')
    print('YouTube mix: story + outro effects, no background music')


if __name__ == '__main__':
    main()
