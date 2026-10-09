// 응원 가기 (집사 지키기): 고양이가 일터에 가서 집사 옆을 지킨다.
// 잔소리·진상 말풍선이 사방에서 집사에게 날아온다 → 톡 쳐서 터뜨린다.
// "수고했어요!" 같은 좋은 말은 건드리지 말고 집사에게 닿게 둔다.
// 막은 것 + 받은 것의 비율만큼 근무 시간이 줄고 호감도가 오른다. 근무 한 번에 cheer.perShift번.
import { CONFIG } from "./config.js";
import { BUTLER_BY_ID } from "./data/butlers.js";
import { CHEER_LINES } from "./data/journals.js";
import { state, now, gainAffection } from "./state.js";
import { butlerSVG, catSVG } from "./art.js";
import { play } from "./sound.js";
import { esc } from "./ui.js";

export function cheersLeft(id) {
  const w = state.butlers[id].work;
  return w ? CONFIG.cheer.perShift - (w.cheers || 0) : 0;
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function startCheer(id, onDone) {
  const C = CONFIG.cheer;
  const def = BUTLER_BY_ID[id];
  const place = state.butlers[id].work.place;
  const lines = CHEER_LINES[place];
  const bubbles = [];
  const tally = { blocked: 0, hurt: 0, received: 0, wasted: 0 };
  let mood = 50, raf = 0, ended = false, nextSpawn = 0.6;

  const el = document.createElement("div");
  el.className = "cheer";
  el.innerHTML = `
    <div class="cheer-head">
      <h3>${CONFIG.workplaces[place].name}에서 ${esc(def.name)} 지키기</h3>
      <p class="note">잔소리는 <b>톡!</b> 막고, 좋은 말은 그냥 두세요</p>
    </div>
    <div class="cheer-field scene-${place}">
      <div class="mood"><i></i></div>
      <div class="cheer-butler">${butlerSVG(def)}</div>
      <div class="cheer-cat">${catSVG(state.cat.type)}</div>
      <div class="ready">준비</div>
    </div>
    <div class="cheer-score">막음 <b class="s-block">0</b> · 받음 <b class="s-recv">0</b></div>`;
  document.getElementById("app").append(el);
  const $ = (s) => el.querySelector(s);
  const field = $(".cheer-field"), butler = $(".cheer-butler"), cat = $(".cheer-cat");
  const t0 = performance.now() + 900;
  const nowSec = () => (performance.now() - t0) / 1000;

  function setMood(d) {
    mood = Math.max(0, Math.min(100, mood + d));
    $(".mood i").style.width = `${mood}%`;
    $(".mood i").style.background = mood < 30 ? "var(--bad)" : mood < 60 ? "var(--warn)" : "var(--good)";
  }
  setMood(0);

  function spawn(t) {
    const good = Math.random() < C.goodChance;
    const p = Math.min(1, t / C.seconds);
    // 위쪽 또는 양옆에서 출발
    const side = Math.random();
    const from = side < 0.5 ? { x: 10 + Math.random() * 80, y: -4 }
      : side < 0.75 ? { x: 14, y: 8 + Math.random() * 40 } : { x: 86, y: 8 + Math.random() * 40 };
    const b = document.createElement("button");
    b.className = `bubble ${good ? "good" : "bad"}`;
    b.textContent = pick(good ? lines.good : lines.bad);
    field.append(b);
    const bub = { el: b, good, t, from, flight: C.flightStart + (C.flightEnd - C.flightStart) * p, done: false };
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); tap(bub); });
    bubbles.push(bub);
  }

  function tap(bub) {
    if (bub.done || ended) return;
    bub.done = true;
    cat.classList.remove("swipe"); void cat.offsetWidth; cat.classList.add("swipe");
    navigator.vibrate?.(12);
    if (bub.good) { // 좋은 말을 쳐 버림
      tally.wasted++;
      play("bad");
      bub.el.classList.add("oops");
    } else {
      tally.blocked++;
      play("pop");
      bub.el.classList.add("burst");
    }
    setTimeout(() => bub.el.remove(), 300);
    updateScore();
  }

  function arrive(bub) {
    bub.done = true;
    if (bub.good) {
      tally.received++;
      play("coin");
      setMood(+12);
      react("happy");
    } else {
      tally.hurt++;
      play("miss");
      setMood(-14);
      react("hurt");
    }
    bub.el.remove();
    updateScore();
  }

  function react(kind) {
    butler.classList.remove("happy", "hurt"); void butler.offsetWidth; butler.classList.add(kind);
  }

  function updateScore() {
    $(".s-block").textContent = tally.blocked;
    $(".s-recv").textContent = tally.received;
  }

  // 집사 쪽 목표 지점 (필드 기준 %)
  const target = { x: 50, y: 70 };
  function frame() {
    const t = nowSec();
    $(".ready").classList.toggle("hidden", t > 0);
    if (t >= nextSpawn && t < C.seconds) {
      spawn(t);
      const p = t / C.seconds;
      nextSpawn = t + C.spawnStart + (C.spawnEnd - C.spawnStart) * p;
    }
    for (const b of bubbles) {
      if (b.done) continue;
      const k = (t - b.t) / b.flight;
      if (k >= 1) { arrive(b); continue; }
      const e = k * k * (3 - 2 * k) * 0.6 + k * 0.4; // 처음엔 느리게, 갈수록 빠르게
      b.el.style.left = `${b.from.x + (target.x - b.from.x) * e}%`;
      b.el.style.top = `${b.from.y + (target.y - b.from.y) * e}%`;
    }
    if (t > C.seconds && bubbles.every((b) => b.done)) return finish();
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    ended = true;
    cancelAnimationFrame(raf);
    const bad = tally.blocked + tally.hurt, good = tally.received + tally.wasted;
    const ratio = (tally.blocked + tally.received) / Math.max(1, bad + good);
    const b = state.butlers[id];
    let cut = 0, aff = 0;
    if (b.status === "working") {
      const w = b.work;
      cut = (w.end - w.start) * C.maxTimeCut * ratio;
      w.end = Math.max(now(), w.end - cut);
      w.cheers = (w.cheers || 0) + 1;
      aff = ratio >= 0.5 ? gainAffection(id, Math.round(C.affection * ratio) || 1) : 0;
    }
    play(ratio >= 0.9 ? "churu" : ratio >= 0.5 ? "pop" : "miss");
    react(ratio >= 0.5 ? "happy" : "hurt");
    const mins = Math.round(cut / 60e3), secs = Math.round(cut / 1000);
    const panel = document.createElement("div");
    panel.className = "knead-result";
    panel.innerHTML = `
      <h2>${ratio >= 0.9 ? "완벽하게 지켰다!" : ratio >= 0.5 ? "힘이 난다!" : "오늘은 좀 힘들었다…"}</h2>
      <p class="note">잔소리 ${tally.blocked}/${bad} 막음 · 좋은 말 ${tally.received}/${good} 전달</p>
      <ul>
        <li>근무 시간 <b>−${mins ? `${mins}분` : `${secs}초`}</b></li>
        ${aff ? `<li>호감도 <b>+${aff}</b></li>` : ""}
        ${tally.wasted ? `<li class="note">좋은 말을 ${tally.wasted}번 쳐 버렸어요</li>` : ""}
        <li class="note">남은 응원 ${cheersLeft(id)}번</li>
      </ul>
      <button class="btn primary" data-act="done">확인</button>`;
    el.append(panel);
    panel.querySelector("[data-act=done]").addEventListener("click", () => { el.remove(); onDone(); });
  }

  raf = requestAnimationFrame(frame);
}
