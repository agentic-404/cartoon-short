"""Fish-and-satay short: bouncy marimba bed + tense reveal + SFX cue table. Writes music.wav + sfx.wav only; mix.py sets levels."""
import os, numpy as np, subprocess, wave

SR = 48000
FRAMES = int(os.environ.get('FRAMES', 1144))   # total frames of the short (from timing.py)
DUR = FRAMES / 30
N = int(DUR * SR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def env(n, a=0.005, r=0.2, sus=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
    return e

def lp(x, k):  # one-pole low-pass, k in (0,1)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += k * (x[i] - acc); y[i] = acc
    return y

def lp_fast(x, cutoff):
    # FFT brick-ish low-pass (fast, fine for beds)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < N and j > i: buf[i:j] += sig[: j - i] * gain

midi = lambda m: 440 * 2 ** ((m - 69) / 12)


def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def at(sec): return int(sec * SR)
F = lambda f: f / 30
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(5))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def marimba(f, dur=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 9) + 0.4 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)
    return (s * np.minimum(1, t / 0.003)).astype(np.float32)
def brass(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        ph = 2 * np.pi * f * t + 0.003 * np.sin(2 * np.pi * 5 * t)
        s += sum(np.sin((k + 1) * ph) / (k + 1) ** 1.3 for k in range(8))
    a = np.minimum(1, t / 0.06) * np.minimum(1, np.maximum(0, (dur - t) / 0.15))
    return lp_fast((s * a).astype(np.float32), 2200) / len(fs)
def kick():
    n = int(0.3 * SR); t = np.arange(n) / SR; f = 55 + 80 * np.exp(-t * 30)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)).astype(np.float32)
def hat():
    n = int(0.06 * SR); t = np.arange(n) / SR
    return (hp_fast(noise(0.06), 6000) * np.exp(-t * 70) * 0.6).astype(np.float32)
def woodblock(f=900):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 45)).astype(np.float32)

# ---------------- music ----------------
music = np.zeros(N, np.float32)
BPM = 116; beat = 60 / BPM
prog = [(48, [60, 64, 67]), (45, [57, 60, 64]), (53, [57, 60, 65]), (43, [55, 59, 62])]     # C Am F G
mel = [72, 76, 79, 76, 74, 72, 69, 72, 77, 76, 72, 69, 71, 74, 67, 71]                      # bouncy marimba line
def bounce(t0, t1, amp=1.0):
    t = t0; k = 0
    while t < t1 - 0.01:
        bar_i = int((t - t0) / (beat * 4)); root, ch = prog[bar_i % 4]; b = int(((t - t0) / beat) % 4)
        place(music, pluck(midi(root), 0.3, 0.6), t, 0.55 * amp if b in (0, 2) else 0.0)            # tuba-ish bass on 1 and 3
        if b in (1, 3):
            for m in ch: place(music, pluck(midi(m), 0.16, 0.4), t, 0.16 * amp)                      # off-beat chop
        if b in (0, 2): place(music, kick(), t, 0.35 * amp)
        place(music, hat(), t, 0.22 * amp); place(music, hat(), t + beat / 2, 0.14 * amp)
        for h in (0, 1):                                                                              # eighth-note melody
            m = mel[(k * 2 + h) % len(mel)]; place(music, marimba(midi(m), 0.36), t + h * beat / 2, 0.30 * amp)
        t += beat; k += 1
def tense(t0, t1):
    n = int((t1 - t0) * SR); tt_ = np.arange(n) / SR
    drone = (np.sin(2 * np.pi * 55 * tt_) + 0.6 * np.sin(2 * np.pi * 82.4 * tt_ * (1 + 0.002 * np.sin(tt_ * 2)))) * 0.35
    drone *= np.minimum(1, tt_ / 0.4) * np.minimum(1, (t1 - t0 - tt_) / 0.4)
    place(music, drone.astype(np.float32), t0, 1.0)
    t = t0
    while t < t1 - 0.05: place(music, woodblock(620), t, 0.35); t += beat * 1.0 if int((t - t0) / beat) % 4 != 3 else beat * 1.0
    k = 0; t = t0 + beat * 0.5
    while t < t1 - 0.05: place(music, pluck(midi(45 + (k % 3) * 1), 0.5, 0.3), t, 0.25); t += beat * 2; k += 1
bounce(0.0, F(562) - 0.02)
tense(F(562) + 0.25, F(899))
bounce(F(899), F(975) - 0.02, 0.9)
sad = F(975)
bounce(F(1027), N / SR, 1.0)
# the music stops dead at the satay reveal, and fades on the last second
i0 = at(DUR - 0.8); music[i0:] *= np.linspace(1, 0, max(1, N - i0)) ** 2

# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
def thunk(f0=90, d=0.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 14) + lp_fast(noise(d), 1200) * np.exp(-t * 30) * 0.5).astype(np.float32)
def splash(d=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 4000) * (np.exp(-t * 4) * np.minimum(1, t / 0.01)) + lp_fast(noise(d), 400) * np.exp(-t * 7) * 1.5).astype(np.float32)
def whoosh(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 1500) * np.sin(np.pi * t / d) ** 2 * 0.6).astype(np.float32)
def pop():
    n = int(0.22 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (500 + 900 * np.exp(-t * 30)) * t) * np.exp(-t * 18)).astype(np.float32)
def boing(d=0.5, f0=300):
    n = int(d * SR); t = np.arange(n) / SR; f = f0 * (1 + 0.6 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 6)) * (1 + 1.2 * np.exp(-t * 9))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) * np.minimum(1, t / 0.005)).astype(np.float32)
def ting():
    n = int(1.2 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2093, 4), (3136, 6), (4186, 8)]) * 0.3).astype(np.float32)
def blup(f0=500):
    n = int(0.16 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (f0 + 700 * t / 0.16) * t) * np.exp(-t * 22) * np.minimum(1, t / 0.004)).astype(np.float32)
def chomp():
    n = int(0.16 * SR); t = np.arange(n) / SR
    return (lp_fast(noise(0.16), 3200) * np.exp(-t * 38) * 1.1 + np.sin(2 * np.pi * 110 * t * (1 + 0.5 * np.exp(-t * 40))) * np.exp(-t * 26) * 0.8).astype(np.float32)
def crunch():
    n = int(0.22 * SR); t = np.arange(n) / SR; g = (np.sin(2 * np.pi * 70 * t) > 0).astype(np.float32)
    return (hp_fast(noise(0.22), 900) * np.exp(-t * 22) * (0.5 + 0.5 * g) * 1.0).astype(np.float32)
def lick(d=0.4):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 2200) * np.sin(np.pi * t / d) ** 2 * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * 0.7).astype(np.float32)
def scratch(d=0.45):
    n = int(d * SR); t = np.arange(n) / SR; f = 1400 - 1100 * t / d
    return (hp_fast(noise(d), 900) * np.sin(np.pi * t / d) ** 0.5 * 0.9 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 * np.exp(-t * 3)).astype(np.float32)
def sting():
    n = int(2.0 * SR); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * 41 * t) * np.exp(-t * 1.5) * 1.2; hit = lp_fast(noise(2.0), 900) * np.exp(-t * 6) * 0.8
    stab = brass([midi(45), midi(48), midi(51)], 1.4); s = low + hit; s[: len(stab)] += stab * 2.2 * np.exp(-np.arange(len(stab)) / SR * 2)
    return s.astype(np.float32)
def gasp(d=0.35):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 3500), 700) * (t / d) ** 1.5 * np.exp(-((t / d - 1) ** 2) * 2) * 0.8).astype(np.float32)
def groan(d=0.7, f0=180):
    n = int(d * SR); t = np.arange(n) / SR; f = f0 * (1 + 0.25 * np.sin(2 * np.pi * 3.5 * t)) * (1 - 0.3 * t / d)
    ph = np.cumsum(f) / SR; s = np.sin(2 * np.pi * ph) + 0.5 * np.sin(4 * np.pi * ph)
    return (lp_fast(s.astype(np.float32), 900) * np.sin(np.pi * t / d) * 0.7).astype(np.float32)
def glug(d=0.3):
    n = int(d * SR); t = np.arange(n) / SR; f = 220 - 120 * t / d
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * np.minimum(1, t / 0.01)).astype(np.float32)
def water(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 700) * 0.5 + hp_fast(lp_fast(noise(d), 2600), 1000) * 0.12 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t))).astype(np.float32)
def fanfare():
    out = np.zeros(int(2.4 * SR), np.float32)
    for (m, t0, d) in [(67, 0, 0.18), (67, 0.2, 0.18), (67, 0.4, 0.18), (72, 0.62, 0.9), (76, 1.4, 0.8)]:
        s = brass([midi(m), midi(m + 4), midi(m + 7)], d); out[int(t0 * SR): int(t0 * SR) + len(s)] += s * 1.4
    return out
def trombone():
    out = np.zeros(int(3.0 * SR), np.float32)
    for (m, t0, d, bend) in [(62, 0.0, 0.5, 0), (61, 0.55, 0.5, 0), (60, 1.1, 0.5, 0), (59, 1.65, 1.2, -2.0)]:
        n = int(d * SR); t = np.arange(n) / SR; fr = midi(m) * 2 ** ((bend * (t / d) ** 2 + 0.25 * np.sin(2 * np.pi * 5.5 * t) * (t > 0.5 * d)) / 12)
        ph = np.cumsum(fr) / SR; s = sum(np.sin(2 * np.pi * ph * (k + 1)) / (k + 1) ** 1.2 for k in range(7))
        s = lp_fast(s.astype(np.float32), 1100) * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.08)
        out[int(t0 * SR): int(t0 * SR) + n] += s * 0.7
    return out

# water ambience under the surface
for a, b in [(0, 98), (201, 562), (562, 706), (764, 1027)]: place(sfx, water((b - a) / 30), F(a), 0.45)
for fr in (6, 20, 44, 78, 215, 236, 268, 300, 340, 372, 422, 470, 520, 640, 690): place(sfx, blup(380 + (fr * 7) % 300), F(fr), 0.35)
place(sfx, pop(), F(5), 0.7); place(sfx, whoosh(0.5), F(66), 0.5); place(sfx, boing(0.5), F(88), 0.35)             # hook: ?, skewer slides in
place(sfx, pop(), F(100), 0.7); place(sfx, ting(), F(102), 0.3); place(sfx, whoosh(0.5), F(124), 0.45)               # "kita tes", close-up
place(sfx, whoosh(0.5), F(172), 0.5); place(sfx, whoosh(0.4), F(183), 0.45)                                           # toss
place(sfx, splash(1.2), F(189), 0.95); place(sfx, blup(300), F(194), 0.6); place(sfx, splash(0.7), F(201), 0.5)      # splash
place(sfx, pop(), F(214), 0.7); place(sfx, pop(), F(259), 0.7)                                                       # LELE / CICHLID
place(sfx, pop(), F(314), 0.7); place(sfx, thunk(70, 0.4), F(340), 0.5); place(sfx, gasp(0.3), F(348), 0.5)          # curiga
place(sfx, pop(), F(358), 0.8)
for fr in (357, 364, 371, 378): place(sfx, whoosh(0.35), F(fr), 0.5)                                                  # serbu dash
for fr in (390, 395, 400, 404): place(sfx, chomp(), F(fr), 0.9)                                                       # first bites
place(sfx, ting(), F(406), 0.25); place(sfx, pop(), F(419), 0.7); place(sfx, ting(), F(421), 0.4)                    # AYAM MATANG POLOS
for fr in range(413, 457, 9): place(sfx, chomp(), F(fr), 0.55)
for fr in range(462, 504, 10): place(sfx, chomp(), F(fr), 0.5)
place(sfx, pop(), F(508), 0.7)
for fr in (522, 548, 556): place(sfx, lick(0.35), F(fr), 0.6)
place(sfx, scratch(0.5), F(560), 1.0); place(sfx, sting(), F(562), 0.9); place(sfx, gasp(0.35), F(566), 0.6)         # "Tapi ini sate."
for fr, g in ((604, 0.8), (639, 0.8), (661, 0.8), (676, 0.8)): place(sfx, pop(), F(fr), g); place(sfx, boing(0.45, 350 + (fr % 5) * 40), F(fr + 2), 0.35)
for fr in (715, 726, 737): place(sfx, woodblock(700), F(fr), 0.5)                                                      # wagging finger
place(sfx, pop(), F(768), 0.7)
for fr in (772, 788, 804): place(sfx, groan(0.7, 150 + (fr % 3) * 20), F(fr), 0.8)                                      # sick fish
for fr in range(830, 880, 6): place(sfx, glug(0.3), F(fr), 0.35)
place(sfx, pop(), F(836), 0.7); place(sfx, groan(0.9, 130), F(850), 0.7)
place(sfx, fanfare(), F(925), 0.9); place(sfx, pop(), F(926), 0.7)
for fr in (931, 940, 949, 960): place(sfx, ting(), F(fr), 0.25)
place(sfx, trombone(), F(975), 0.95); place(sfx, pop(), F(980), 0.7); place(sfx, boing(0.6, 220), F(995), 0.5)       # kalah di kolam
place(sfx, scratch(0.3), F(1027), 0.5); place(sfx, ting(), F(1032), 0.7); place(sfx, ting(), F(1038), 0.5); place(sfx, boing(0.5, 400), F(1033), 0.5)
place(sfx, pop(), F(1073), 0.7); place(sfx, ting(), F(1075), 0.3)
for fr in (1119, 1130): place(sfx, crunch(), F(fr), 1.0); place(sfx, chomp(), F(fr + 3), 0.6)
place(sfx, boing(0.6, 300), F(1124), 0.4); place(sfx, ting(), F(1139), 0.5)

for name, sig in (("music.wav", music), ("sfx.wav", sfx)):
    pcm = (np.clip(sig / max(1e-6, np.abs(sig).max()), -1, 1) * 32767).astype(np.int16)
    with wave.open(name, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("stems ok", DUR)
