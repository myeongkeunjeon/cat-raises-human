// 꾹꾹이 미니게임: 펌프·러브비트풍 4방향 리듬게임 (SPEC 4장을 v0.1 테스트 피드백으로 바꿈)
// 비트에 맞춰 화살표가 내려온다. 판정선에 닿을 때 같은 방향 버튼을 누른다.
// 뒤로 갈수록 8분음표와 동시누르기가 늘어난다. 결과는 실패 없이 3단계.
import { CONFIG } from "./config.js";
import { BUTLER_BY_ID, KNEAD_THEMES } from "./data/butlers.js";
import { state, gainAffection, itemBonus } from "./state.js";
import { butlerSVG, catSVG } from "./art.js";
import { play, audioClock, beatTrack } from "./sound.js";
import { esc } from "./ui.js";

const RESULT_NAME = { perfect: "완벽", good: "잘함", okay: "적당히" };
const DIRS = ["왼쪽", "아래", "위", "오른쪽"];
// 고양이 발바닥 (발가락이 위). 레인마다 방향으로 돌린다
const PAW = `<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="27" rx="10" ry="8.5"/><ellipse cx="8.5" cy="17" rx="4" ry="5.2" transform="rotate(-25 8.5 17)"/><ellipse cx="15.5" cy="10" rx="4" ry="5.4" transform="rotate(-8 15.5 10)"/><ellipse cx="24.5" cy="10" rx="4" ry="5.4" transform="rotate(8 24.5 10)"/><ellipse cx="31.5" cy="17" rx="4" ry="5.2" transform="rotate(25 31.5 17)"/></svg>`;
const JUDGE_TEXT = { perfect: "PERFECT", great: "GREAT", good: "GOOD", miss: "MISS" };
const KNOT_SPOTS = { // 엎드린 집사 등 위 매듭 위치 (가로 %, 세로 %). 머리는 왼쪽, 발은 오른쪽
  shoulder: [[45, 36], [49, 43], [53, 35], [57, 42], [61, 37]],
  back:     [[54, 36], [57, 42], [60, 35], [63, 41], [66, 37]],
  waist:    [[62, 36], [64, 42], [66, 35], [68, 41], [70, 37]],
  legs:     [[69, 36], [71, 42], [73, 35], [75, 41], [77, 37]],
};
const LEAD_BEATS = 4; // 시작 전 준비 박자 (비트만 나옴)

// 악보: 앞부분은 4분음표, 중간부터 8분음표, 끝으로 갈수록 연타와 동시누르기. dense: 테마별 밀도
function makeChart(K, dense = 1) {
  const sp = 60 / K.bpm;
  const beats = Math.floor(K.seconds / sp);
  const notes = [];
  let last = -1;
  const lane = () => { let l; do l = Math.floor(Math.random() * 4); while (l === last); return (last = l); };
  for (let b = 0; b < beats; b++) {
    const p = b / beats;
    const t = b * sp;
    const eighth = (p < 0.2 ? 0 : p < 0.5 ? 0.3 : p < 0.75 ? 0.55 : 0.8) * dense;
    const jump = (p < 0.4 ? 0 : p < 0.75 ? 0.15 : 0.25) * dense;
    const l = lane();
    notes.push({ t, lane: l });
    if (b % 2 === 0 && Math.random() < jump) { // 동시누르기
      let l2; do l2 = Math.floor(Math.random() * 4); while (l2 === l);
      notes.push({ t, lane: l2 });
    }
    if (Math.random() < eighth) notes.push({ t: t + sp / 2, lane: lane() });
  }
  return notes.sort((a, b) => a.t - b.t);
}

export function startKneading(id, onDone) {
  const base = CONFIG.kneading;
  const extra = itemBonus("kneadWindow"); // 주운 물건: 판정이 조금 너그러워짐
  const theme = KNEAD_THEMES[id] || {};
  const K = { ...base, bpm: theme.bpm || base.bpm, windows: Object.fromEntries(Object.entries(base.windows).map(([k, v]) => [k, v + extra])) };
  const def = BUTLER_BY_ID[id];
  const sp = 60 / K.bpm;
  const notes = makeChart(K, theme.dense).map((n) => ({ ...n, s: null, el: null }));
  const total = notes.length;
  const spots = KNOT_SPOTS[def.knots] || KNOT_SPOTS.back;
  const willSleep = Math.random() < K.sleepChance;
  const sleepAt = K.seconds * (0.45 + Math.random() * 0.3);
  let combo = 0, best = 0, raf = 0, ended = false;
  const count = { perfect: 0, great: 0, good: 0, miss: 0 };

  const el = document.createElement("div");
  el.className = "knead";
  el.innerHTML = `
    <div class="knead-top">
      <button class="knead-quit">✕ 그만하기</button>
      <span class="knead-name">${def.name}<small>♪ ${theme.title || "꾹꾹이"}</small></span>
      <span class="knead-time">${K.seconds}</span>
    </div>
    <div class="knead-stage">
      <div class="knead-body">
        <div class="knead-butler">${butlerSVG(def)}</div>
        ${spots.map(([x, y]) => `<i class="knot" style="left:${x}%;top:${y}%"></i>`).join("")}
        <div class="knead-cat">${catSVG(state.cat.type)}</div>
      </div>
      <div class="purr">그르릉…</div>
    </div>
    <div class="lanes" style="background:${theme.bg || "#2b2420"}">
      ${DIRS.map((d, i) => `<div class="lane" data-lane="${i}"><span class="receptor r${i}">${PAW}</span></div>`).join("")}
      <div class="judge"></div>
      <div class="knead-combo"></div>
      <div class="ready">준비</div>
    </div>
    <div class="pads">
      ${DIRS.map((d, i) => `<button class="pad" data-lane="${i}" aria-label="${d}"><span class="r${i}">${PAW}</span></button>`).join("")}
    </div>`;
  document.getElementById("app").append(el);

  const $ = (s) => el.querySelector(s);
  const lanes = el.querySelectorAll(".lane");
  const pads = el.querySelectorAll(".pad");
  const cat = $(".knead-cat"), judgeEl = $(".judge"), comboEl = $(".knead-combo");
  for (const n of notes) {
    n.el = document.createElement("i");
    n.el.className = `arrow a${n.lane}`;
    n.el.innerHTML = `<span class="r${n.lane}">${PAW}</span>`;
    lanes[n.lane].append(n.el);
  }

  // 시계: 소리가 켜져 있으면 오디오 시계(비트와 정확히 맞음), 아니면 화면 시계
  const a = audioClock();
  let nowSec, stopMusic = () => {};
  if (a) {
    const start = a.currentTime + LEAD_BEATS * sp + 0.1;
    stopMusic = beatTrack(a, start - LEAD_BEATS * sp, K.bpm, LEAD_BEATS + Math.ceil(K.seconds / sp) + 1, theme);
    nowSec = () => a.currentTime - start;
  } else {
    const start = performance.now() + (LEAD_BEATS * sp + 0.1) * 1000;
    nowSec = () => (performance.now() - start) / 1000;
  }

  const score = () => notes.reduce((s, n) => s + (K.points[n.s] || 0), 0); // 놓침(miss)은 0점

  function judge(kind) {
    count[kind]++;
    judgeEl.textContent = JUDGE_TEXT[kind];
    judgeEl.className = `judge ${kind}`;
    void judgeEl.offsetWidth;
    judgeEl.classList.add("pop");
    if (kind === "miss" || kind === "good") combo = 0;
    else combo++;
    best = Math.max(best, combo);
    comboEl.innerHTML = combo >= 4 ? `<b>${combo}</b>COMBO` : "";
    if (combo >= 4) { comboEl.classList.remove("pop"); void comboEl.offsetWidth; comboEl.classList.add("pop"); }
    if (combo && combo % 20 === 0) purr();
    updateKnots();
  }

  function press(l) {
    if (ended) return;
    play(l % 2 ? "kneadR" : "kneadL");
    navigator.vibrate?.(12);
    cat.classList.toggle("lean", l >= 2);
    pads[l].classList.add("hit");
    lanes[l].classList.add("flash");
    setTimeout(() => { pads[l].classList.remove("hit"); lanes[l].classList.remove("flash"); }, 90);
    const t = nowSec();
    let hitNote = null;
    for (const n of notes) {
      if (n.s !== null || n.lane !== l) continue;
      if (n.t - t > K.windows.good) break;
      if (Math.abs(n.t - t) <= K.windows.good) { hitNote = n; break; }
    }
    if (!hitNote) return; // 허공 누르기는 무시
    const d = Math.abs(hitNote.t - t);
    hitNote.s = d <= K.windows.perfect ? "perfect" : d <= K.windows.great ? "great" : "good";
    hitNote.el.classList.add("done");
    judge(hitNote.s);
  }

  function purr() {
    play("purr");
    const p = $(".purr");
    p.classList.remove("on"); void p.offsetWidth; p.classList.add("on");
    cat.classList.remove("shake"); void cat.offsetWidth; cat.classList.add("shake");
  }

  // 정확도가 오를수록 매듭이 하나씩 풀린다 (90% 정확도면 모두)
  function updateKnots() {
    const knots = el.querySelectorAll(".knot");
    const cleared = Math.min(knots.length, Math.floor((score() / (total * 0.9)) * knots.length));
    knots.forEach((k, i) => k.classList.toggle("gone", i < cleared));
  }

  let lastBeat = -99;
  function frame() {
    const t = nowSec();
    const ready = $(".ready");
    if (t < 0) ready.textContent = t < -sp * 2 ? "준비" : "꾹!";
    else ready.classList.add("hidden");
    const beat = Math.floor(t / sp);
    if (beat !== lastBeat) { lastBeat = beat; el.classList.toggle("beat-on", beat % 2 === 0); }
    for (const n of notes) {
      if (n.s && n.s !== "miss") continue;
      const left = n.t - t;
      if (left > K.fallTime) { n.el.style.transform = "translateY(-200%)"; continue; }
      if (n.s === null && left < -K.windows.good) {
        n.s = "miss";
        n.el.classList.add("missed");
        judge("miss");
      }
      // 레인 맨 위(0%)에서 판정선(85%)까지
      n.el.style.top = `${(1 - left / K.fallTime) * 85}%`;
      n.el.style.transform = "";
    }
    $(".knead-time").textContent = Math.max(0, Math.ceil(K.seconds - Math.max(0, t)));
    if (willSleep && t >= sleepAt) return finish(true);
    if (t > K.seconds + 0.3) return finish(false);
    raf = requestAnimationFrame(frame);
  }

  function finish(slept) {
    ended = true;
    cancelAnimationFrame(raf);
    stopMusic();
    const accuracy = slept ? 1 : score() / total;
    const r = slept ? K.results[0] : K.results.find((x) => accuracy >= x.minAccuracy) || K.results[K.results.length - 1];
    const res = apply(id, r, accuracy);
    showResult(r, accuracy, res, slept);
  }

  function showResult(r, accuracy, res, slept) {
    el.querySelector(".pads").remove();
    el.querySelector(".lanes").remove();
    el.querySelector(".knead-quit").remove();
    if (r.id === "perfect") {
      play("melt");
      $(".knead-body").classList.add(def.id === "rookie" ? "melt-big" : "melt");
      if (def.id === "landlord") rainChuru();
    }
    if (slept) cat.classList.add("sleep");
    const panel = document.createElement("div");
    panel.className = "knead-result";
    panel.innerHTML = `
      <h2>${slept ? "쿨쿨…" : RESULT_NAME[r.id]}</h2>
      <p class="note">${slept ? `${esc(state.cat.name)}이(가) 등 위에서 잠들어 버렸다` : `정확도 ${Math.round(accuracy * 100)}% · 최고 ${best} 콤보`}</p>
      ${slept ? "" : `<p class="judges"><span class="perfect">PERFECT ${count.perfect}</span><span class="great">GREAT ${count.great}</span><span class="good">GOOD ${count.good}</span><span class="miss">MISS ${count.miss}</span></p>`}
      <ul>
        <li>피로 ${Math.round(res.fatigueBefore)} → <b>${Math.round(res.fatigueAfter)}</b></li>
        <li>호감도 <b>+${res.affection}</b></li>
        ${res.churu ? `<li>츄르 <b>+${res.churu}</b>${def.id === "landlord" ? " (건물주 보너스 2배)" : ""}</li>` : ""}
        ${res.vet ? `<li>다른 집사들 피로 −${res.vet}</li>` : ""}
      </ul>
      ${r.id !== "perfect" && !slept ? `<p class="note">완벽은 정확도 ${Math.round(K.results[0].minAccuracy * 100)}% 이상</p>` : ""}
      <button class="btn primary" data-act="done">확인</button>`;
    el.append(panel);
    panel.querySelector("[data-act=done]").addEventListener("click", () => { el.remove(); onDone(); });
  }

  function rainChuru() {
    for (let i = 0; i < 24; i++) {
      const c = document.createElement("i");
      c.className = "churu-drop";
      c.style.left = `${Math.random() * 100}%`;
      c.style.animationDelay = `${Math.random() * 0.9}s`;
      el.append(c);
    }
    play("coin");
    play("churu");
  }

  // 그만하기: 보상도 손해도 없이 나간다
  $(".knead-quit").addEventListener("click", () => {
    ended = true;
    cancelAnimationFrame(raf);
    stopMusic();
    el.remove();
    onDone("quit");
  });
  pads.forEach((p) => p.addEventListener("pointerdown", (e) => { e.preventDefault(); press(Number(p.dataset.lane)); }));
  raf = requestAnimationFrame(frame);
}

// 결과 반영 (7장 수치)
function apply(id, r, accuracy) {
  const def = BUTLER_BY_ID[id];
  const b = state.butlers[id];
  const fatigueBefore = b.fatigue;
  b.fatigue = Math.max(0, Math.min(CONFIG.fatigue.max, b.fatigue + r.fatigue));
  const extra = r.id === "perfect" ? def.perfectBonusAffection || 0 : 0;
  const affection = gainAffection(id, r.affection + extra);
  const churu = r.churu * (r.id === "perfect" && id === "landlord" ? 2 : 1);
  state.churu += churu;
  let vet = 0;
  if (def.shareFatigue) {
    vet = def.shareFatigue;
    for (const [oid, o] of Object.entries(state.butlers)) {
      if (oid !== id && o.housed && o.status !== "working") o.fatigue = Math.max(0, o.fatigue - vet);
    }
  }
  const k = state.stats.kneading;
  k.count++;
  k.results[r.id] = (k.results[r.id] || 0) + 1;
  k.accuracySum += accuracy;
  return { fatigueBefore, fatigueAfter: b.fatigue, affection, churu, vet };
}
