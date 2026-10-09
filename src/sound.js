// 효과음: 파일 없이 Web Audio로 합성. 첫 터치 이후에만 소리가 난다(모바일 정책).
import { state } from "./state.js";

let ctx = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function unlockAudio() {
  window.addEventListener("pointerdown", () => ac(), { once: true });
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
  rare:    () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.25, { vol: 0.06, delay: i * 0.06 })),
  legend:  () => [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => tone(f, 0.35, { type: "triangle", vol: 0.07, delay: i * 0.07 })),
  tick:    () => tone(1400, 0.03, { type: "square", vol: 0.025 }),
  kneadL:  () => tone([260, 180], 0.09, { vol: 0.22 }),
  kneadR:  () => tone([300, 210], 0.09, { vol: 0.22 }),
  miss:    () => tone([200, 140], 0.12, { type: "triangle", vol: 0.06 }),
  purr:    () => { for (let i = 0; i < 6; i++) tone(70, 0.08, { type: "sawtooth", vol: 0.05, delay: i * 0.1 }); },
  melt:    () => tone([600, 150], 0.7, { vol: 0.12, vibrato: 25 }),
  levelup: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.15, { type: "square", vol: 0.05, delay: i * 0.12 })),
};

export function play(name) {
  if (!soundOn()) return;
  try { SOUNDS[name]?.(); } catch (e) { /* 소리는 실패해도 무시 */ }
}
