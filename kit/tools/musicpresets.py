"""v5 music presets: pick a style per section instead of rewriting a bed for every video.
    from musicpresets import Music
    mu = Music(frames=1144)                       # fps 30
    mu.add('ceria', 0, 18.7); mu.add('tegang', 18.7, 30.0, amp=0.9); mu.add('ceria', 30.0, mu.dur)
    mu.fade_out(0.8); mu.save('music.wav')        # mix.py still sets the level (music = 50 % of the voice)
Styles: ceria (bouncy marimba, 116 bpm, major), tegang (drone + woodblock pulse, rising pluck), misterius (slow minor pad + echoing pluck, sub hits),
dokumenter (warm pad + soft arpeggio, 84 bpm), sedih (slow minor piano-like line, sparse), epik (low drums + brass-like stabs). amp scales a section.
Synth only, no samples. Sections can overlap; t in seconds."""
import numpy as np, wave
SR = 48000
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
class Music:
    def __init__(self, frames=900, fps=30, seed=7):
        self.dur = frames / fps; self.N = int(self.dur * SR); self.buf = np.zeros(self.N, np.float32); self.rng = np.random.default_rng(seed)
    # ---- synth bits
    def _noise(self, d): return self.rng.standard_normal(int(d * SR)).astype(np.float32)
    def _lp(self, x, c):
        X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
    def _hp(self, x, c):
        X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 - 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
    def _place(self, sig, t0, g=1.0):
        i = int(t0 * SR); j = min(self.N, i + len(sig))
        if 0 <= i < self.N and j > i: self.buf[i:j] += sig[: j - i] * g
    def _pluck(self, f, d=0.35, br=0.5):
        n = int(d * SR); t = np.arange(n) / SR; s = sum((br ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(5))
        return (s * np.minimum(1, t / 0.003) * np.exp(-t / (d * 0.35))).astype(np.float32)
    def _marimba(self, f, d=0.4):
        n = int(d * SR); t = np.arange(n) / SR
        return ((np.sin(2 * np.pi * f * t) * np.exp(-t * 9) + 0.4 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)) * np.minimum(1, t / 0.003)).astype(np.float32)
    def _piano(self, f, d=0.9):
        n = int(d * SR); t = np.arange(n) / SR
        s = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 5) + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 8)
        return (s * np.minimum(1, t / 0.004)).astype(np.float32)
    def _pad(self, notes, d, vib=0.003):
        n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n)
        for m in notes:
            for det in (-0.004, 0.004): s += np.sin(2 * np.pi * midi(m) * (1 + det) * t + vib * np.sin(2 * np.pi * 0.3 * t))
        a = np.minimum(1, t / 0.6) * np.minimum(1, np.maximum(0, (d - t) / 0.8)); return (s * a / (2 * len(notes))).astype(np.float32)
    def _kick(self, g=1.0):
        n = int(0.3 * SR); t = np.arange(n) / SR; f = 55 + 80 * np.exp(-t * 30); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * g).astype(np.float32)
    def _hat(self):
        n = int(0.06 * SR); t = np.arange(n) / SR; return (self._hp(self._noise(0.06), 6000) * np.exp(-t * 70) * 0.6).astype(np.float32)
    def _wood(self, f=900):
        n = int(0.12 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) * np.exp(-t * 45)).astype(np.float32)
    def _echo(self, sig, delay=0.33, fb=0.4, taps=3):
        out = np.zeros(len(sig) + int(delay * taps * SR), np.float32); out[: len(sig)] += sig
        for k in range(1, taps + 1): i = int(delay * k * SR); out[i:i + len(sig)] += sig * fb ** k
        return out
    # ---- styles
    def ceria(self, t0, t1, amp=1.0):
        bpm = 116; beat = 60 / bpm; prog = [(48, [60, 64, 67]), (45, [57, 60, 64]), (53, [57, 60, 65]), (43, [55, 59, 62])]
        mel = [72, 76, 79, 76, 74, 72, 69, 72, 77, 76, 72, 69, 71, 74, 67, 71]; t = t0; k = 0
        while t < t1 - 0.01:
            root, ch = prog[int((t - t0) / (beat * 4)) % 4]; b = int(((t - t0) / beat) % 4)
            if b in (0, 2): self._place(self._pluck(midi(root), 0.3, 0.6), t, 0.55 * amp); self._place(self._kick(), t, 0.35 * amp)
            if b in (1, 3):
                for m in ch: self._place(self._pluck(midi(m), 0.16, 0.4), t, 0.16 * amp)
            self._place(self._hat(), t, 0.22 * amp); self._place(self._hat(), t + beat / 2, 0.14 * amp)
            for h in (0, 1): self._place(self._marimba(midi(mel[(k * 2 + h) % len(mel)]), 0.36), t + h * beat / 2, 0.30 * amp)
            t += beat; k += 1
    def tegang(self, t0, t1, amp=1.0):
        beat = 60 / 116; n = int((t1 - t0) * SR); tt = np.arange(n) / SR
        dr = (np.sin(2 * np.pi * 55 * tt) + 0.6 * np.sin(2 * np.pi * 82.4 * tt * (1 + 0.002 * np.sin(tt * 2)))) * 0.35 * np.minimum(1, tt / 0.4) * np.minimum(1, (t1 - t0 - tt) / 0.4)
        self._place(dr.astype(np.float32), t0, amp); t = t0; k = 0
        while t < t1 - 0.05: self._place(self._wood(620), t, 0.35 * amp); t += beat
        t = t0 + beat * 0.5
        while t < t1 - 0.05: self._place(self._pluck(midi(45 + (k % 3)), 0.5, 0.3), t, 0.25 * amp); t += beat * 2; k += 1
    def misterius(self, t0, t1, amp=1.0):
        chords = [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]]; bar = 60 / 70 * 4; t = t0; k = 0
        while t < t1 - 0.05:
            d = min(bar, t1 - t); self._place(self._pad(chords[k % 4], d + 0.4), t, 0.5 * amp); k += 1; t += bar
        t = t0 + 0.3; arp = [69, 72, 76, 72, 71, 74, 77, 74]; k = 0
        while t < t1 - 0.4: self._place(self._echo(self._pluck(midi(arp[k % 8]), 0.5, 0.3), 0.42, 0.45), t, 0.22 * amp); t += 60 / 70; k += 1
        t = t0
        while t < t1 - 0.2: self._place(self._lp(self._kick(), 120), t, 0.25 * amp); t += bar
    def dokumenter(self, t0, t1, amp=1.0):
        bpm = 84; beat = 60 / bpm; chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]; t = t0; k = 0
        while t < t1 - 0.05:
            d = min(beat * 4, t1 - t); self._place(self._pad(chords[k % 4], d + 0.3, 0.002), t, 0.35 * amp); ch = chords[k % 4]
            for j in range(8):
                tt = t + j * beat / 2
                if tt < t1 - 0.1: self._place(self._piano(midi(ch[j % 3] + 12 * (j // 3 % 2)), 0.9), tt, 0.20 * amp)
            k += 1; t += beat * 4
    def sedih(self, t0, t1, amp=1.0):
        line = [69, 67, 64, 62, 64, 60, 57, 59]; beat = 60 / 62; t = t0; k = 0
        while t < t1 - 0.2: self._place(self._piano(midi(line[k % 8]), 1.4), t, 0.3 * amp); k += 1; t += beat * (1 if k % 4 else 2)
        t = t0
        while t < t1 - 0.2: self._place(self._pad([45, 52, 57], 4.0), t, 0.25 * amp); t += beat * 4
    def epik(self, t0, t1, amp=1.0):
        beat = 60 / 100; t = t0; k = 0
        while t < t1 - 0.05:
            if k % 4 in (0, 2): self._place(self._kick(1.2), t, 0.5 * amp)
            if k % 4 == 3: self._place(self._lp(self._noise(0.25), 3000) * np.exp(-np.arange(int(0.25 * SR)) / SR * 14), t, 0.3 * amp)
            if k % 8 == 0: self._place(self._pad([38, 45, 50, 53], min(beat * 4, t1 - t) + 0.2), t, 0.5 * amp)
            self._place(self._pluck(midi(38 + (0, 0, 3, 5)[k % 4]), 0.4, 0.7), t, 0.25 * amp); k += 1; t += beat
    STYLES = ("ceria", "tegang", "misterius", "dokumenter", "sedih", "epik")
    def add(self, style, t0, t1, amp=1.0):
        if style not in self.STYLES: raise SystemExit(f"unknown style {style}; choose from {self.STYLES}")
        getattr(self, style)(float(t0), float(min(t1, self.dur)), amp); return self
    def fade_out(self, sec=0.8):
        i = int(max(0, self.N - sec * SR)); self.buf[i:] *= np.linspace(1, 0, self.N - i) ** 2; return self
    def save(self, path="music.wav"):
        pk = float(np.abs(self.buf).max()) or 1.0; pcm = (np.clip(self.buf / max(pk, 1.0), -1, 1) * 30000).astype(np.int16)
        with wave.open(path, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
        return path
if __name__ == "__main__":      # demo: python3 musicpresets.py  -> demo_<style>.wav (6 s each)
    for s in Music.STYLES: m = Music(frames=180); m.add(s, 0, 6).fade_out(0.4); m.save(f"demo_{s}.wav"); print("wrote", f"demo_{s}.wav")
