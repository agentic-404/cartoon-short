"""Level-locked mix.   python3 mix.py voice.mp3 music.wav sfx.wav  ->  mix_raw.wav (mono, 48 kHz)
Music = 50% of the voice's gated RMS (-6 dB). SFX = 50%, peaks capped at 0.7x the voice peak.
Length follows voice.mp3 (stems are padded/trimmed to it); finish.sh adds the loudness gain."""
import sys, subprocess, wave, numpy as np
SR = 48000
def load(p, n=None):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    v = np.frombuffer(raw, np.float32).copy()
    if n is None: return v
    o = np.zeros(n, np.float32); o[:min(n, len(v))] = v[:n]; return o
def grms(x, gate_db=-45):
    w = SR // 10; n = len(x) // w; r = np.sqrt((x[: n * w].reshape(n, w) ** 2).mean(1))
    sel = r > r.max() * 10 ** (gate_db / 20)
    return float(np.sqrt((r[sel] ** 2).mean())) if sel.any() else 1e-9
v = load(sys.argv[1]); N = len(v)
m, s = load(sys.argv[2], N), load(sys.argv[3], N)
rv = grms(v); m *= 0.5 * rv / grms(m); s *= 0.5 * rv / grms(s)
cap = 0.7 * np.abs(v).max()
if np.abs(s).max() > cap: s *= cap / np.abs(s).max()
mix = v + m + s
if np.abs(mix).max() > 0.95: mix *= 0.95 / np.abs(mix).max()
db = lambda a, b: 20 * np.log10(a / b)
print("music vs voice: %.1f dB (target -6.0)" % db(grms(m), rv))
print("sfx vs voice: %.1f dB (<= -6.0), peak %.2fx voice peak (<= 0.70)" % (db(grms(s), rv), np.abs(s).max() / np.abs(v).max()))
with wave.open("mix_raw.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
