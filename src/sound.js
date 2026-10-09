// 효과음: 파일 없이 Web Audio로 합성. 첫 터치 이후에만 소리가 난다(모바일 정책).
import { state } from "./state.js";

let ctx = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state !== "running") ctx.resume().catch(() => {});
  return ctx;
}

// 모바일: 첫 터치 전에는 소리가 막혀 있고, 화면을 껐다 켜면 다시 멈춘다(iOS 'interrupted').
// 터치할 때마다, 화면으로 돌아올 때마다 다시 깨운다.
export function unlockAudio() {
  const wake = () => { if (!ctx || ctx.state !== "running") ac(); };
  window.addEventListener("pointerdown", wake, { passive: true });
  window.addEventListener("touchend", wake, { passive: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && ctx) ctx.resume().catch(() => {}); });
}

export function soundOn() {
  return state.settings?.sound !== false;
}

// 음 하나: 주파수(또는 [시작, 끝]), 길이, 파형, 음량, 시작 지연
function tone(freq, dur, { type = "sine", vol = 0.15, delay = 0, vibrato = 0 } = {}) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  const [f0, f1] = Array.isArray(freq) ? freq : [freq, freq];
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  if (vibrato) {
    const lfo = a.createOscillator(), lg = a.createGain();
    lfo.frequency.value = 7; lg.gain.value = vibrato;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t); lfo.stop(t + dur);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const SOUNDS = {
  tap:     () => tone(620, 0.05, { type: "triangle", vol: 0.08 }),
  meow:    () => { tone([520, 780], 0.12, { vol: 0.12, vibrato: 12 }); tone([780, 430], 0.28, { vol: 0.12, delay: 0.12, vibrato: 18 }); },
  churu:   () => [988, 1319, 1568].forEach((f, i) => tone(f, 0.18, { type: "triangle", vol: 0.1, delay: i * 0.07 })),
  send:    () => tone([300, 700], 0.18, { type: "triangle", vol: 0.08 }),
  pop:     () => tone([400, 900], 0.08, { vol: 0.1 }),
  rare:    () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.25, { type: "triangle", vol: 0.14, delay: i * 0.06 })),
  legend:  () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.4, { type: "triangle", vol: 0.16, delay: i * 0.07 }));
                   [2093, 2637].forEach((f, i) => tone(f, 0.5, { vol: 0.08, delay: 0.45 + i * 0.1 })); },
  coin:    () => [1568, 2093].forEach((f, i) => tone(f, 0.12, { type: "square", vol: 0.05, delay: i * 0.08 })),
  bad:     () => tone([220, 110], 0.3, { type: "sawtooth", vol: 0.08 }),
  tick:    () => tone(1400, 0.03, { type: "square", vol: 0.025 }),
  kneadL:  () => tone([260, 180], 0.07, { vol: 0.16 }),
  kneadR:  () => tone([300, 210], 0.07, { vol: 0.16 }),
  combo:   () => [1319, 1760].forEach((f, i) => tone(f, 0.1, { type: "square", vol: 0.04, delay: i * 0.06 })),
  miss:    () => tone([200, 140], 0.12, { type: "triangle", vol: 0.06 }),
  purr:    () => { for (let i = 0; i < 6; i++) tone(70, 0.08, { type: "sawtooth", vol: 0.05, delay: i * 0.1 }); },
  melt:    () => tone([600, 150], 0.7, { vol: 0.12, vibrato: 25 }),
  levelup: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.15, { type: "square", vol: 0.05, delay: i * 0.12 })),
};

// ---------- 꾹꾹이 배경 비트 ----------
// 오디오 시계 (소리가 켜져 있고 돌아가는 중일 때만). 리듬게임은 이 시계에 맞춘다.
export function audioClock() {
  if (!soundOn()) return null;
  const a = ac();
  return a && a.state === "running" ? a : null;
}

let noiseBuf = null;
function noise(a) {
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 0.3, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = a.createBufferSource();
  s.buffer = noiseBuf;
  return s;
}

function hit(a, t, { freq, to, dur, type = "sine", vol }, out = a.destination) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + dur + 0.02);
}

function hiss(a, t, { dur, vol, hp }, out = a.destination) {
  const s = noise(a), f = a.createBiquadFilter(), g = a.createGain();
  f.type = "highpass"; f.frequency.value = hp;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(out);
  s.start(t); s.stop(t + dur);
}

// start(오디오 시각)부터 bpm으로 beats박 동안: 킥, 스네어, 하이햇, 귀여운 아르페지오. 반환값: 멈추는 함수
const ARP = [523, 659, 784, 659, 587, 740, 880, 740, 523, 659, 784, 1047, 880, 784, 659, 587];
export function beatTrack(a, start, bpm, beats) {
  const sp = 60 / bpm;
  const out = a.createGain();
  out.connect(a.destination);
  for (let b = 0; b < beats; b++) {
    const t = start + b * sp;
    hit(a, t, { freq: 150, to: 45, dur: 0.18, vol: 0.5 }, out);                          // 킥
    if (b % 2 === 1) hiss(a, t, { dur: 0.12, vol: 0.18, hp: 1800 }, out);               // 스네어
    hiss(a, t + sp / 2, { dur: 0.04, vol: 0.06, hp: 7000 }, out);                       // 하이햇
    if (b >= 4) hit(a, t + sp / 2, { freq: ARP[b % 16], dur: 0.16, type: "triangle", vol: 0.07 }, out); // 멜로디
    if (b % 4 === 0) hit(a, t, { freq: ARP[b % 16] / 4, dur: sp * 1.8, type: "triangle", vol: 0.12 }, out); // 베이스
  }
  return () => out.gain.setTargetAtTime(0, a.currentTime, 0.05);
}

export function play(name) {
  if (!soundOn()) return;
  try { SOUNDS[name]?.(); } catch (e) { /* 소리는 실패해도 무시 */ }
}
