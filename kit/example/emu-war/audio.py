"""Emu War: synthesized music + SFX stems (music.wav, sfx.wav). Levels are set by mix.py."""
import os, numpy as np, subprocess, wave

SR = 48000
FRAMES = int(os.environ.get("FRAMES", 1153)); DUR = FRAMES / 30
N = int(DUR * SR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def load_voice():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    v = np.frombuffer(raw, np.float32).copy()
    out = np.zeros(N, np.float32); out[:min(N, len(v))] = v[:N]; return out

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
BPM = 112; beat = 60 / BPM
prog = [(57, [57, 60, 64]), (53, [53, 57, 60]), (55, [55, 59, 62]), (52, [52, 56, 59])]
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
MUSIC_END = 1074 / 30 - 0.05   # bed stops on "Tentara pulang."
bar = 0; tt = 0.0
while tt < MUSIC_END:
    root, ch = prog[bar % 4]
    place(music, brass([midi(m) for m in ch], beat * 4 * 0.98), tt, 0.10)
    for b in range(4):
        tb = tt + b * beat
        if tb >= MUSIC_END: break
        place(music, drum("kick" if b % 2 == 0 else "snare"), tb, 0.55 if b % 2 == 0 else 0.32)
        place(music, pluck(midi(root - 12), 0.4, 0.4), tb, 0.35)
        place(music, pluck(midi(ch[(b + bar) % 3] + 12), 0.22, 0.6), tb + beat / 2, 0.13)
    if bar % 2 == 1:
        for k, m in enumerate([ch[0] + 12, ch[1] + 12, ch[2] + 12]):
            place(music, brass([midi(m)], beat * 0.45), tt + 2 * beat + k * beat * 0.5, 0.07)
    bar += 1; tt += beat * 4
i0 = int((MUSIC_END - 0.08) * SR); music[i0:] *= np.linspace(1, 0, N - i0) ** 8
dn = int((DUR - MUSIC_END) * SR); td = np.arange(dn) / SR
drone = (np.sin(2 * np.pi * 55 * td) + 0.5 * np.sin(2 * np.pi * 82.4 * td) + 0.3 * np.sin(2 * np.pi * 110.3 * td)) * np.minimum(1, td / 1.2)
place(music, lp_fast(drone.astype(np.float32), 600), MUSIC_END, 0.07)

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
def engine(d, f0=48):
    n = int(d * SR); t = np.arange(n) / SR
    s = (np.mod(np.cumsum(f0 + 4 * np.sin(2 * np.pi * 3 * t)) / SR, 1) < 0.35).astype(np.float32) * 0.6 + lp_fast(noise(d), 300) * 1.5
    return (lp_fast(s, 420) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.5).clip(0)).astype(np.float32)
def shot(d=0.12):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 500) * np.exp(-t * 45) * 1.3 + np.sin(2 * np.pi * 110 * t) * np.exp(-t * 35)).astype(np.float32)
def burst(t0, t1, rate=11, g=0.8):
    for tk in np.arange(t0, t1, 1 / rate): place(sfx, shot(), tk + rng.uniform(-0.01, 0.01), g * rng.uniform(0.7, 1.0))
def pop(f=520):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t * (1 + 1.5 * np.exp(-t * 40))) * np.exp(-t * 28)).astype(np.float32)
def boing(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(220 + 160 * np.sin(2 * np.pi * 6 * t) * np.exp(-t * 4)) / SR) * np.exp(-t * 5)).astype(np.float32)
def pencil(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 6000), 2000) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) * np.sin(np.pi * t / d) * 0.6).astype(np.float32)
def coin():
    n = int(0.6 * SR); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * 1760 * t) + np.sin(2 * np.pi * 2349 * t) * (t > 0.08)) * np.exp(-t * 7) * 0.4).astype(np.float32)
def hammer():
    return np.concatenate([thunk(160, 0.2), np.zeros(int(0.15 * SR), np.float32), thunk(150, 0.2)])

place(sfx, whoosh(0.6), F(4), 0.5)               # hook push-in
place(sfx, thunk(70, 0.35), F(123), 1.0)         # "Burungnya yang menang"
place(sfx, ting(), F(128), 0.4)
place(sfx, whoosh(0.4), F(168), 0.5)             # flash to 1932
place(sfx, hammer(), F(176), 0.9)                # sign
place(sfx, whoosh(0.5), F(240), 0.45)
place(sfx, leaves(3.0), F(250), 0.3)             # wheat in the wind
place(sfx, engine(1.7), F(354), 0.8)             # truck arrives
place(sfx, creak(0.7, 300), F(396), 0.5)         # brakes
place(sfx, thunk(60, 0.3), F(408), 0.9); place(sfx, thunk(70, 0.3), F(416), 0.7)   # guns set down
place(sfx, thunk(80, 0.25), F(446), 0.7); place(sfx, thunk(90, 0.25), F(456), 0.6) # crates
place(sfx, ting(), F(465), 0.35)
place(sfx, boing(0.5), F(486), 0.7)              # "nggak mau berbaris"
place(sfx, whoosh(0.5), F(540), 0.6)
burst(F(548), F(600), 11, 0.85); burst(F(604), F(628), 12, 0.8)
place(sfx, whoosh(0.8), F(560), 0.35); place(sfx, whoosh(0.7), F(590), 0.35)
place(sfx, pencil(0.9), F(643), 0.6)             # tally
place(sfx, whoosh(0.4), F(695), 0.4)
for k in range(10): place(sfx, pop(480 + 25 * k), F(712) + k * (39 / 30) / 10 * 0.95, 0.7)   # bullets one by one
place(sfx, ting(), F(752), 0.5)
place(sfx, whoosh(0.4), F(770), 0.55)            # flash "seminggu kemudian"
place(sfx, engine(1.9), F(828), 0.8)             # truck leaves
place(sfx, whoosh(0.4), F(869), 0.55)            # flash "belakangan"
place(sfx, thunk(90, 0.3), F(905), 0.6)          # bounty sign
place(sfx, coin(), F(930), 0.7); place(sfx, coin(), F(955), 0.5)
place(sfx, ting(), F(1000), 0.4)
place(sfx, engine(1.4), F(1076), 0.7)            # soldiers drive home
place(sfx, sting(), F(1112), 0.85)               # "Emu-nya tetap tinggal."

for name, sig in (("music.wav", music), ("sfx.wav", sfx)):
    pcm = (np.clip(sig / max(1e-6, np.abs(sig).max()), -1, 1) * 32767).astype(np.int16)
    with wave.open(name, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("stems ok", DUR)
