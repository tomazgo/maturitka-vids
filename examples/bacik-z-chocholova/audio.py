import numpy as np, soundfile as sf, json
from scipy import fft, signal
SR = 44100
import json as _j, os as _os
WARP = _j.load(open('audio/warp.json')) if _os.path.exists('audio/warp.json') else None
def toNew(x):
    if not WARP: return x
    A = WARP['anchors']
    if x <= A[0][0]: return x - A[0][0] + A[0][1]
    for i in range(len(A) - 1):
        if x <= A[i + 1][0]: k = (x - A[i][0]) / (A[i + 1][0] - A[i][0]); return A[i][1] + k * (A[i + 1][1] - A[i][1])
    return x - A[-1][0] + A[-1][1]
DUR = sf.info('audio/vo.wav').duration + 1.2  # voice plus the closing hold
N = int(DUR * SR)
rng = np.random.default_rng(3)
def T(n): return np.arange(n) / SR
def env(n, a=.005, d=.2, curve=4):
    t = T(n); e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-4)); return e
def place(buf, x, at, g=1.0):
    i = int(toNew(at) * SR); j = min(len(buf), i + len(x))
    if i < 0 or i >= len(buf): return
    buf[i:j] += x[:j - i] * g
def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi / (SR / 2), .99)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)

# ---------------- SFX ----------------
def whoosh(dur=.35, up=True):
    n = int(dur * SR); x = rng.standard_normal(n); t = T(n)
    lo, hi = bp(x, 250, 1200), bp(x, 1500, 6000); k = np.linspace(0, 1, n) if up else np.linspace(1, 0, n)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return (lo * (1 - k) + hi * k) * e * 1.6
def thud(f0=70, dur=.35, g=1):
    n = int(dur * SR); t = T(n); f = f0 * (1 + 1.5 * np.exp(-t * 30))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12)
    x += lp(rng.standard_normal(n), 900) * np.exp(-t * 40) * .6
    return x * g
def clang(f0=520, dur=1.0):
    n = int(dur * SR); t = T(n); x = np.zeros(n)
    for k, (r, a, d) in enumerate([(1, 1, 5), (2.76, .6, 7), (5.4, .4, 10), (8.9, .25, 14), (1.5, .5, 6)]):
        x += a * np.sin(2 * np.pi * f0 * r * t + k) * np.exp(-t * d)
    x += hp(rng.standard_normal(n), 2000) * np.exp(-t * 60) * .8
    return x * .5 + thud(90, dur, .7)[:n]
def pluck(f, dur=.5, bright=.5):
    n = int(dur * SR); p = int(SR / f); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = bright * buf[i % p] + (1 - bright) * .5 * (buf[i % p] + buf[(i + 1) % p]) * .996 if False else .5 * (buf[i % p] + buf[(i + 1) % p]) * .995
    return out
def chime(f=1760, dur=.8):
    n = int(dur * SR); t = T(n)
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.01 * t) + .3 * np.sin(2 * np.pi * f * 3 * t)) * np.exp(-t * 6) * np.minimum(1, t / .003) * .5
def sparkle_sfx():
    out = np.zeros(int(.7 * SR))
    for i, f in enumerate([2093, 2637, 3136, 4186]): place(out, chime(f, .5) * .5, i * .05)
    return out
def tick(): n = int(.04 * SR); t = T(n); return hp(rng.standard_normal(n), 3000) * np.exp(-t * 200) * .8 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 150) * .4
def pop(f=600):
    n = int(.12 * SR); t = T(n); fr = f * (1 + 2 * t * 10); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 40)
def boing(f=220, dur=.5):
    n = int(dur * SR); t = T(n); fr = f * (1 + .35 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 3)) * (1 + t)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 5) * .6
def tweet():
    out = np.zeros(int(1.2 * SR))
    for i in range(4):
        n = int(.1 * SR); t = T(n); fr = 3200 + 900 * np.sin(2 * np.pi * 30 * t)
        place(out, np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * t / .1) * .25, i * .25)
    return out
def scribble(dur=.18):
    n = int(dur * SR); t = T(n); return bp(rng.standard_normal(n), 1500, 6000) * (0.5 + .5 * np.sin(2 * np.pi * 30 * t)) * np.sin(np.pi * t / dur) * .5
def riser(dur=2.8):
    n = int(dur * SR); t = T(n); f = 200 * (2 ** (t / dur * 2.5))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * .3 + bp(rng.standard_normal(n), 800, 5000) * .3 * (t / dur)
    return x * (t / dur) ** 2
def waves(dur):
    n = int(dur * SR); t = T(n); x = lp(rng.standard_normal(n), 700, 2)
    return x * (0.5 + .5 * np.sin(2 * np.pi * t / 4.5) ** 2) * .5
def heartbeat():
    out = np.zeros(int(.8 * SR)); place(out, thud(55, .3, .8), 0); place(out, thud(50, .3, .6), .22); return out

sfx = np.zeros(N)
def gurgle(dur=1.2):
    n = int(dur * SR); t = T(n); x = np.zeros(n)
    for k in range(9):
        f0 = 90 + rng.uniform(0, 120); t0 = rng.uniform(0, dur - .15); m = int(.14 * SR); tt = T(m)
        blip = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 2.5 * tt / .14)) / SR) * np.sin(np.pi * tt / .14)
        i = int(t0 * SR); x[i:i + m] += blip[:n - i] * .5
    return lp(x, 900)
def slurp():
    out = np.zeros(int(.25 * SR))
    place(out, bp(rng.standard_normal(int(.08 * SR)), 900, 3000) * np.exp(-T(int(.08 * SR)) * 30) * .6, 0)
    return out

def hoof(g=1.0):
    n = int(.09 * SR); t = T(n)
    return (lp(rng.standard_normal(n), 1400) * np.exp(-t * 60) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 45) * .6) * g
def gallop(t0, dur, g=.35, rate=.11):
    k = 0
    while k * rate < dur:
        place(sfx, hoof(.7 + .3 * (k % 4 == 0)), t0 + k * rate + (.03 if k % 4 == 1 else 0), g); k += 1
def crack():
    n = int(.12 * SR); t = T(n); return hp(rng.standard_normal(n), 2500) * np.exp(-t * 90) * 1.2 + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 80) * .4
def coin(): return chime(2637, .35) * .6 + chime(3520, .35) * .3
def neigh(dur=.9):
    n = int(dur * SR); t = T(n); f = 520 + 260 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 2) - 200 * t / dur
    return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .3, 2500) * np.sin(np.pi * t / dur) * .7
# ---------------- timeline (from the voice's word timings) ----------------
WORDS = json.load(open('audio/words.json'))
LAST_LINE = WORDS[-1]['line']
def normalize(word): return ''.join(ch for ch in word.lower() if ch.isalnum())
def line_start(line): return next(w['s'] for w in WORDS if w['line'] == line)
def word_at(word, line):
    return next((w['s'] for w in WORDS if w['line'] == line and normalize(w['w']) == word), line_start(line))

# the first sentence of every shot after the first (must match addShot calls in shots.js)
SHOT_FIRST_LINES = [1, 3, 4, 6, 7, 9, 10, 12, 14, 16, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 34, 35]
# soft whoosh centred on each 1.5 s ink-bleed cut (cut sits .25 s before the sentence)
for line in SHOT_FIRST_LINES: place(sfx, whoosh(.6), line_start(line) - .25 - .3, .2)

def pop_at(word, line, f=620, g=.35): place(sfx, pop(f), word_at(word, line), g)

# 0 dream money bag bursts
place(sfx, sparkle_sfx(), .4, .25); place(sfx, pop(500), word_at('nepríde', 0) + .1, .5)
# 1-2 book lands, tags
place(sfx, whoosh(.5, False), line_start(1) - .1, .35); place(sfx, thud(110, .25, .7), line_start(1) + .55)
pop_at('bencúr', 2); pop_at('tisícosemstodeväťdesiat', 2, 700)
# 3 tags, the manor cracks, a hat falls
pop_at('realizmu', 3); pop_at('humorom', 3, 680)
place(sfx, crack(), word_at('úpadok', 3), .5); place(sfx, thud(90, .3, .6), word_at('úpadok', 3) + 1.2)
# 4-5 name tag, footsteps to the fair
pop_at('ondrej', 4)
walk_start = word_at('neláka', 5) + .6
for i in range(8): place(sfx, thud(160, .06, .2), walk_start + i * .32)
# 6 cheap / dear, coins
pop_at('lacno', 6); pop_at('draho', 6, 720)
for i in range(5): place(sfx, coin(), word_at('draho', 6) + .1 + i * .18, .25)
# 7-8 tavern: name tag, mugs clink
pop_at('adušom', 7); place(sfx, chime(1320, .5), line_start(7) + .5, .2); place(sfx, sparkle_sfx(), word_at('veľkými', 8) + .3, .2)
# 9 uncle appears, coins fly
pop_at('báčikom', 9, 560)
for i in range(6): place(sfx, coin(), word_at('pomáha', 9) - .6 + i * .2, .22)
# 10-11 sacks, deposit
pop_at('jačmeň', 10); pop_at('ovos', 10, 680); pop_at('nízku', 10, 760)
for i in range(4): place(sfx, coin(), word_at('zálohu', 11) + i * .2, .25)
# 12-13 the shabby carriage rolls in, suspicion
gallop(line_start(12) - .1, 3.4, .18, .22); place(sfx, neigh(.8), line_start(12) + 2.6, .2)
pop_at('tušiť', 13, 480)
# 14-15 wagon rolls, breaks, night crickets
gallop(line_start(14) - .1, word_at('pokazí', 15) - line_start(14), .16, .18)
place(sfx, crack(), word_at('pokazí', 15), .7); place(sfx, thud(70, .4, .9), word_at('pokazí', 15) + .05)
for i in range(10): place(sfx, tick() * .5, word_at('prenocuje', 15) + i * .25, .18)
# 16-18 the truth: manor decays, façade falls, debts
place(sfx, sparkle_sfx(), word_at('zdedil', 17) - .3, .2); place(sfx, crack(), word_at('lenivosť', 17) + .4, .35)
pop_at('márnotratnosť', 17, 520)
for i in range(3): pop_at('zadĺžený', 18, 500 + i * 60, .3)
place(sfx, thud(55, .6, 1.0), word_at('zdanie', 18) + .55)
# 19-20 footsteps, creaking decay, rustling weeds
for i in range(6): place(sfx, thud(160, .06, .2), line_start(19) + i * .3)
place(sfx, crack(), word_at('chátra', 20), .3); place(sfx, bp(rng.standard_normal(int(1.2 * SR)), 1500, 6000) * .15, word_at('burinou', 20) - .5, .4)
# 21 empty pockets
place(sfx, boing(150, .5), word_at('nemá', 21), .3); pop_at('nemá', 21, 520)
# 22 dream of the uncle's money
place(sfx, sparkle_sfx(), word_at('báčik', 22) - .2, .3)
# 23 steam, then an idea
place(sfx, bp(rng.standard_normal(int(.8 * SR)), 2000, 7000) * .2, line_start(23), .4); pop_at('spôsob', 23, 700)
# 24 servants, the ash trees
pop_at('adam', 24); place(sfx, chime(1568, .8), word_at('jasene', 24), .25)
# 25 he turns pale, ancestors
place(sfx, heartbeat(), word_at('zbledne', 25), .5); place(sfx, chime(523, 1.2), word_at('predkovia', 25), .2)
# 26 conscience: soft chime
place(sfx, chime(1046, 1.2), word_at('svedomie', 26) - .2, .3); place(sfx, sparkle_sfx(), word_at('svedomie', 26), .2)
# 27 promise, coins back
for i in range(4): place(sfx, coin(), word_at('zaplatí', 27) + i * .2, .25)
place(sfx, sparkle_sfx(), word_at('poctivejšie', 27), .25)
# 28 the bell tolls
for i in range(3): place(sfx, clang(330, 1.2) * .5, word_at('umrie', 28) - .5 + i * .7, .25)
# 29 the will, the bag flies away
pop_at('nič', 29, 480); place(sfx, whoosh(.5), word_at('iní', 29) - .4, .3)
# 30 irony, bubble bursts
pop_at('ironický', 30, 700); place(sfx, pop(450), word_at('rozplynie', 30), .5)
# 31-33 tags for two worlds
for word, line in [('praktický', 32), ('podnikavý', 32), ('lenivý', 33), ('prázdnych', 33)]: pop_at(word, line)
# 34 the balance tips
place(sfx, thud(90, .3, .6), word_at('navrch', 34) + .3); pop_at('pracuje', 34); pop_at('sníva', 34, 520)
# 35-36 hoe strikes, closing sparkle
for i in range(5): place(sfx, thud(140, .08, .35), word_at('zmeniť', 36) + .3 + i * 1.26)
place(sfx, sparkle_sfx(), word_at('konať', 36), .35); place(sfx, chime(1046, 1.2), word_at('konať', 36) + .1, .3)

# ---------------- VO + mix ----------------
vo, vsr = sf.read('audio/vo.wav')
if vo.ndim > 1: vo = vo.mean(1)
vo = signal.resample_poly(vo, SR, vsr)
vo = hp(vo, 90)
# gentle compression
envv = np.abs(signal.hilbert(vo, N=fft.next_fast_len(len(vo)))[:len(vo)]); envv = lp(envv, 20)
gain = np.where(envv > .15, (.15 / np.maximum(envv, 1e-6)) ** .4, 1.0); vo = vo * gain
vo = vo / np.max(np.abs(vo)) * .9
VO = np.zeros(N); VO[:min(N, len(vo))] = vo[:N]
# no background music: voice plus sound effects only
mixL = VO * 1.0 + sfx * .45  # effects stay well under the voice
mixR = mixL.copy()
out = np.stack([mixL, mixR], 1)
fade = np.ones(N); fl = int(.5 * SR); fade[-fl:] = np.linspace(1, 0, fl); out *= fade[:, None]
pk = np.max(np.abs(out)); out = out / pk * .89
sf.write('audio/mix.wav', out, SR)
print('done', out.shape, 'rms dB', 20 * np.log10(np.sqrt(np.mean(out ** 2))))
