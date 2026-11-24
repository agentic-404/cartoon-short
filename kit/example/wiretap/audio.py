"""Synthesized music bed + SFX stems for the soldier short. Writes music.wav + sfx.wav only; mix.py sets levels."""
import os, numpy as np, subprocess, wave

SR = 48000
FRAMES = int(os.environ.get('FRAMES', 592))   # total frames of the short (from timing.py)
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

# ---------------- music ----------------
music = np.zeros(N, np.float32)
BPM = 104; beat = 60 / BPM
prog = [(57, [57, 60, 64]), (53, [53, 57, 60]), (55, [55, 59, 62]), (52, [52, 56, 59])]  # Am F G E
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def brass(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        ph = 2 * np.pi * f * t + 0.003 * np.sin(2 * np.pi * 5 * t)
        s += sum(np.sin((k + 1) * ph) / (k + 1) ** 1.3 for k in range(8))
    a = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15).clip(0)
    return lp_fast((s * a).astype(np.float32), 1800) / len(fs)
def drum(kind):
    if kind == "kick":
        n = int(0.35 * SR); t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t * 30)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)).astype(np.float32)
    n = int(0.18 * SR); t = np.arange(n) / SR
    s = rng.standard_normal(n) * np.exp(-t * 28) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 20) * 0.5
    return hp_fast(s.astype(np.float32), 300)

def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
# --- calm "explainer" bed (night) + tense layer (dark), cross-faded by section ---
DARK = [(14.7, 23.3), (26.2, 28.9), (35.7, 38.4), (46.1, 99)]
def dark_mask():
    m = np.zeros(N, np.float32)
    for a_, b_ in DARK:
        i, j = int(a_ * SR), min(N, int(b_ * SR))
        if j > i: m[i:j] = 1
    k = int(0.35 * SR); w = np.ones(k) / k
    return np.convolve(m, w, mode="same").astype(np.float32)
dm = dark_mask()
calm = np.zeros(N, np.float32); tense = np.zeros(N, np.float32)
prog = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [48, 52, 55]), (55, [55, 59, 62])]
bar = 0; tt = 0.0; beat = 60 / 100
while tt < DUR:
    root, ch = prog[bar % 4]
    place(calm, brass([midi(m) for m in ch], beat * 4 * 0.98), tt, 0.07)
    for b2 in range(8):
        tb = tt + b2 * beat / 2
        place(calm, pluck(midi(ch[(b2 + bar) % 3] + 12), 0.28, 0.5), tb, 0.16)
    for b2 in range(4):
        place(calm, drum("kick"), tt + b2 * beat, 0.30 if b2 % 2 == 0 else 0.0)
    place(calm, pluck(midi(root - 12), 0.5, 0.4), tt, 0.30)
    # tense: low drone + tritone + hat ticks
    td_ = np.arange(int(beat * 4 * SR)) / SR
    dr = (np.sin(2 * np.pi * midi(root - 24) * td_) + 0.6 * np.sin(2 * np.pi * midi(root - 24 + 6) * td_)) * 0.5
    place(tense, lp_fast(dr.astype(np.float32), 500), tt, 0.35)
    for b2 in range(8):
        place(tense, hp_fast(noise(0.04), 6000) * np.exp(-np.arange(int(0.04 * SR)) / SR * 90), tt + b2 * beat / 2, 0.20 if b2 % 2 else 0.1)
    place(tense, drum("kick"), tt, 0.4)
    bar += 1; tt += beat * 4
music = calm * (1 - 0.8 * dm) + tense * dm
i0 = int(47.1 * SR); music[i0:] *= np.linspace(1, 0, max(1, N - i0)) ** 4

# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def thunk(f0=90, d=0.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 14) + lp_fast(noise(d), 1200) * np.exp(-t * 30) * 0.5).astype(np.float32)
def rumble(d):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 160) * 3 * np.minimum(1, t / 0.15) * np.exp(-t / (d * 0.45))
    return s.astype(np.float32)
def crash(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n, np.float32)
    for k in range(14):
        tk = rng.uniform(0, d * 0.6); i = int(tk * SR); g = thunk(rng.uniform(60, 160), 0.35) * rng.uniform(0.3, 0.9)
        s[i:i + len(g)] += g[: n - i]
    s += lp_fast(noise(d), 2500) * np.exp(-t * 3) * 0.25
    return s
def cuckoo():
    out = []
    for f, d in [(740, 0.16), (587, 0.24)]:
        n = int(d * SR); t = np.arange(n) / SR
        out.append(np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.01) * np.exp(-t * 6)); out.append(np.zeros(int(0.06 * SR)))
    return np.concatenate(out).astype(np.float32)
def scrape(d=0.8):
    n = int(d * SR); t = np.arange(n) / SR
    s = noise(d) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t)) * np.sin(np.pi * t / d)
    s = hp_fast(lp_fast(s, 5000), 1500)
    ring = np.sin(2 * np.pi * 1870 * t) * np.exp(-t * 3) * 0.2
    return (s * 0.6 + ring).astype(np.float32)
def ting():
    n = int(1.2 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2093, 4), (3136, 6), (4186, 8)]) * 0.3).astype(np.float32)
def sting():
    n = int(2.0 * SR); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * 41 * t) * np.exp(-t * 1.5) * 1.2
    hit = lp_fast(noise(2.0), 900) * np.exp(-t * 6) * 0.8
    stab = brass([midi(45), midi(48), midi(51)], 1.4); s = low + hit; s[: len(stab)] += stab * 2.2 * np.exp(-np.arange(len(stab)) / SR * 2)
    return s.astype(np.float32)
def creak(d=0.6, f0=140):
    n = int(d * SR); t = np.arange(n) / SR
    rate = f0 * (1 + 0.35 * np.sin(2 * np.pi * 1.3 * t / d))
    ph = np.cumsum(rate) / SR; pulses = (np.mod(ph, 1) < 0.08).astype(np.float32)
    s = lp_fast(pulses * (0.6 + 0.4 * rng.random(n).astype(np.float32)), 2200) * np.sin(np.pi * t / d)
    return hp_fast(s, 200) * 2.5
def snap():
    d = 0.5; n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 800) * np.exp(-t * 18) * 1.4 + np.pad(thunk(120, 0.4), (0, n - int(0.4 * SR))) * 0.6).astype(np.float32)
def splash(d=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 4000) * (np.exp(-t * 4) * np.minimum(1, t / 0.01)) + lp_fast(noise(d), 400) * np.exp(-t * 7) * 1.5
    return s.astype(np.float32)
def whoosh(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 1500) * np.sin(np.pi * t / d) ** 2 * 0.6).astype(np.float32)
def snore(d=1.1):
    n = int(d * SR); t = np.arange(n) / SR
    buzz = (np.mod(np.cumsum(60 + 25 * np.sin(np.pi * t / d)) / SR, 1) < 0.3).astype(np.float32)
    return (lp_fast(buzz * 0.5 + noise(d) * 0.15, 700) * np.sin(np.pi * t / d) ** 2).astype(np.float32)
def leaves(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 6000), 2500) * (0.3 + 0.3 * np.sin(2 * np.pi * 0.7 * t) ** 2) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)).astype(np.float32)
def water(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 900) * 0.5 + hp_fast(lp_fast(noise(d), 3000), 1200) * 0.15 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t))).astype(np.float32)

F = lambda f: f / 30
def pop(): 
    n = int(0.22 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (500 + 900 * np.exp(-t * 30)) * t) * np.exp(-t * 18)).astype(np.float32)
def zip_(d=0.9, up=True):
    n = int(d * SR); t = np.arange(n) / SR; f = (400 + 2200 * (t / d) ** 2) if up else (2600 - 2200 * (t / d))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * 0.5).astype(np.float32)
def glitch(d=0.7):
    n = int(d * SR); t = np.arange(n) / SR; g = (rng.random(int(d * 40)) > 0.45).astype(np.float32); env_ = np.repeat(g, SR // 40)[:n]; env_ = np.pad(env_, (0, n - len(env_)))
    return (hp_fast(noise(d), 1500) * env_ * np.exp(-t * 2.5) * 1.2).astype(np.float32)
def buzz():
    n = int(0.9 * SR); t = np.arange(n) / SR; g = ((t % 0.3) < 0.12).astype(np.float32)
    return (np.sin(2 * np.pi * 160 * t) * g * 0.6).astype(np.float32)
def tick(f=1800):
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 50)).astype(np.float32)
place(sfx, buzz(), F(8), 0.5); place(sfx, buzz(), F(30), 0.4)           # phone buzz
place(sfx, ting(), F(54), 0.5); place(sfx, whoosh(0.7), F(62), 0.4)    # "?" then pull-back
place(sfx, pop(), F(99), 0.7); place(sfx, pop(), F(119), 0.8); place(sfx, whoosh(0.5), F(100), 0.3)
place(sfx, pop(), F(165), 0.8); place(sfx, ting(), F(167), 0.45)       # LIMS
place(sfx, thunk(110, 0.3), F(205), 0.9)                                # izin stamp
place(sfx, pop(), F(243), 0.8); place(sfx, whoosh(0.5), F(288), 0.5)   # meminta, paper flies
place(sfx, whoosh(0.9), F(305), 0.35)
place(sfx, thunk(120, 0.3), F(340), 0.9)                                # operator receives
place(sfx, zip_(0.9), F(345), 0.7); place(sfx, ting(), F(372), 0.5)     # packets to phone
for i, fr in enumerate((385, 400, 415)): place(sfx, ting(), F(fr), 0.35 + 0.1 * i); place(sfx, tick(1400 + 300 * i), F(fr), 0.8)
for i in range(10): place(sfx, tick(1000 + 90 * i), F(376 + i * 4), 0.35)
place(sfx, whoosh(0.5), F(438), 0.6); place(sfx, sting(), F(441), 0.5)  # cut to the dark
place(sfx, pop(), F(466), 0.7); place(sfx, creak(0.9, 90), F(463), 0.6)
place(sfx, whoosh(0.8), F(485), 0.4)
place(sfx, pop(), F(523), 0.6); place(sfx, whoosh(0.7), F(536), 0.7)    # flies over the tower
place(sfx, zip_(1.5, False), F(575), 0.7)                               # dive
place(sfx, thunk(70, 0.4), F(622), 1.0); place(sfx, glitch(0.8), F(622), 0.9)  # infection
place(sfx, glitch(0.5), F(645), 0.4); place(sfx, pop(), F(640), 0.8)    # tanpa klik
place(sfx, whoosh(0.5), F(697), 0.6); place(sfx, pop(), F(703), 0.8)    # polri
place(sfx, pop(), F(792), 0.8); place(sfx, cuckoo(), F(850), 0.25)      # pengamat
place(sfx, thunk(80, 0.35), F(874), 0.9); place(sfx, pop(), F(893), 0.8); place(sfx, thunk(120, 0.3), F(895), 0.8)
place(sfx, pop(), F(930), 0.5); place(sfx, pop(), F(934), 0.5)
place(sfx, whoosh(0.5), F(959), 0.6); place(sfx, pop(), F(962), 0.7)    # bedanya penting
for i in range(10): place(sfx, tick(1000 + 90 * i), F(1002 + i * 5), 0.4)
place(sfx, pop(), F(1002), 0.6)
place(sfx, pop(), F(1072), 0.7); place(sfx, whoosh(2.6), F(1072), 0.35) # spy passes in silence
place(sfx, thunk(60, 0.5), F(1108), 0.8); place(sfx, pop(), F(1108), 0.5)
place(sfx, pop(), F(1195), 0.7); place(sfx, pop(), F(1247), 0.7)
place(sfx, pop(), F(1295), 0.8); place(sfx, pop(), F(1338), 0.8); place(sfx, thunk(120, 0.3), F(1342), 0.8)
place(sfx, whoosh(0.5), F(1382), 0.6); place(sfx, pop(), F(1384), 0.8)
place(sfx, crash(0.9), F(1390), 0.4); place(sfx, hp_fast(noise(1.0), 2000) * np.exp(-np.arange(SR) / SR * 3), F(1390), 0.3)
place(sfx, sting(), F(1416), 0.9)

for name, sig in (("music.wav", music), ("sfx.wav", sfx)):
    pcm = (np.clip(sig / max(1e-6, np.abs(sig).max()), -1, 1) * 32767).astype(np.int16)
    with wave.open(name, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("stems ok", DUR)
