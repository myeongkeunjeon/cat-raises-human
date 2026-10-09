// 꾹꾹이 미니게임 (SPEC 4장)
// 박자 원이 줄어들어 가운데 원과 겹칠 때 왼발/오른발을 번갈아 누른다. 실패 없음.
import { CONFIG } from "./config.js";
import { BUTLER_BY_ID } from "./data/butlers.js";
import { state, gainAffection } from "./state.js";
import { butlerSVG, catSVG } from "./art.js";
import { play } from "./sound.js";
import { esc } from "./ui.js";

const RESULT_NAME = { perfect: "완벽", good: "잘함", okay: "적당히" };
const KNOT_SPOTS = { // 엎드린 집사 등 위 매듭 위치 (가로 %, 세로 %). 머리는 왼쪽, 발은 오른쪽
  shoulder: [[45, 36], [49, 43], [53, 35], [57, 42], [61, 37]],
  back:     [[54, 36], [57, 42], [60, 35], [63, 41], [66, 37]],
  waist:    [[62, 36], [64, 42], [66, 35], [68, 41], [70, 37]],
  legs:     [[69, 36], [71, 42], [73, 35], [75, 41], [77, 37]],
};

export function startKneading(id, onDone) {
  const K = CONFIG.kneading;
  const def = BUTLER_BY_ID[id];
  const iv = K.beatInterval * 1000;
  const total = Math.floor(K.seconds / K.beatInterval);
  const scored = new Array(total).fill(null);
  const spots = KNOT_SPOTS[def.knots] || KNOT_SPOTS.back;
  const willSleep = Math.random() < K.sleepChance;
  const sleepAt = Math.floor(total * (0.4 + Math.random() * 0.3));
  let combo = 0, best = 0, lastBeat = -1, raf = 0, ended = false;

  const el = document.createElement("div");
  el.className = "knead";
  el.innerHTML = `
    <div class="knead-top">
      <span class="knead-name">${def.name}</span>
      <span class="knead-time">${K.seconds}</span>
    </div>
    <div class="knead-combo"></div>
    <div class="knead-stage">
      <div class="knead-body">
        <div class="knead-butler">${butlerSVG(def)}</div>
        ${spots.map(([x, y]) => `<i class="knot" style="left:${x}%;top:${y}%"></i>`).join("")}
        <div class="knead-cat">${catSVG(state.cat.type)}</div>
      </div>
      <div class="purr">그르릉…</div>
    </div>
    <div class="beat"><i class="beat-ring"></i><i class="beat-target"></i><span class="beat-text">준비</span></div>
    <div class="feet">
      <button class="foot" data-foot="0">왼발</button>
      <button class="foot" data-foot="1">오른발</button>
    </div>`;
  document.getElementById("app").append(el);

  const $ = (s) => el.querySelector(s);
  const ring = $(".beat-ring"), text = $(".beat-text"), cat = $(".knead-cat");
  const feet = el.querySelectorAll(".foot");
  const t0 = performance.now() + 1800; // 첫 박자 (준비 시간 1.8초)

  function score() { return scored.reduce((s, v) => s + (v || 0), 0); }

  function judge(foot) {
    if (ended) return;
    const t = performance.now();
    const k = Math.round((t - t0) / iv);
    play(foot ? "kneadR" : "kneadL");
    navigator.vibrate?.(15);
    cat.classList.toggle("lean", !!foot);
    if (k < 0 || k >= total || scored[k] !== null) return;
    const dt = Math.abs(t - (t0 + k * iv)) / 1000;
    let s = dt <= K.perfectWindow ? 1 : dt <= K.goodWindow ? 0.5 : 0;
    if (!s) { show("음…", "miss"); combo = 0; return; }
    if (foot !== k % 2 && s === 1) s = 0.5; // 틀린 발은 '좋음'
    scored[k] = s;
    combo = s === 1 ? combo + 1 : 0;
    best = Math.max(best, combo);
    show(s === 1 ? "정확!" : "좋음", s === 1 ? "perfect" : "good");
    $(".knead-combo").textContent = combo >= 2 ? `${combo} 콤보` : "";
    if (combo && combo % 10 === 0) purr();
    updateKnots();
  }

  function show(msg, cls) {
    text.textContent = msg;
    text.className = `beat-text ${cls}`;
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

  function frame() {
    const t = performance.now();
    const k = Math.floor((t - t0) / iv);
    if (t < t0) {
      text.textContent = t < t0 - 900 ? "준비" : "꾹!";
    } else if (k > lastBeat && k < total) {
      lastBeat = k;
      play("tick");
      feet.forEach((f) => f.classList.toggle("next", Number(f.dataset.foot) === (k + 1) % 2));
      if (willSleep && k >= sleepAt) return finish(true);
    }
    // 다음 박자까지 남은 비율만큼 바깥 원이 크다
    const next = Math.max(0, Math.ceil((t - t0) / iv));
    const left = (t0 + next * iv - t) / iv; // 1 → 0
    ring.style.transform = `scale(${1 + left * 1.6})`;
    ring.style.opacity = t < t0 - 600 ? 0 : 1;
    $(".knead-time").textContent = Math.max(0, Math.ceil((t0 + total * iv - t) / 1000));
    if (t > t0 + (total - 1) * iv + K.goodWindow * 1000) return finish(false);
    raf = requestAnimationFrame(frame);
  }

  function finish(slept) {
    ended = true;
    cancelAnimationFrame(raf);
    const accuracy = slept ? 1 : score() / total;
    const r = slept ? K.results[0] : K.results.find((x) => accuracy >= x.minAccuracy);
    const res = apply(id, r, accuracy);
    showResult(r, accuracy, res, slept);
  }

  function showResult(r, accuracy, res, slept) {
    const perfect = r.id === "perfect";
    el.querySelector(".feet").remove();
    el.querySelector(".beat").remove();
    $(".knead-combo").textContent = "";
    if (perfect) {
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
      <ul>
        <li>피로 ${Math.round(res.fatigueBefore)} → <b>${Math.round(res.fatigueAfter)}</b></li>
        <li>호감도 <b>+${res.affection}</b></li>
        ${res.churu ? `<li>츄르 <b>+${res.churu}</b>${def.id === "landlord" ? " (건물주 보너스 2배)" : ""}</li>` : ""}
        ${res.vet ? `<li>다른 집사들 피로 −${res.vet}</li>` : ""}
      </ul>
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
    play("churu");
  }

  feet.forEach((f) => f.addEventListener("pointerdown", (e) => { e.preventDefault(); judge(Number(f.dataset.foot)); }));
  raf = requestAnimationFrame(frame);
}

// 결과 반영 (SPEC 4장 + 7장 수치)
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
