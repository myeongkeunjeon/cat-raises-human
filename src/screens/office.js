// 인력사무소(뽑기): 2.5D 사무소 건물, 문이 흔들리고 → 문틈으로 빛(일반 흰빛, 레어 파란빛, 전설 금빛) → 문이 열리며 집사 등장
import { CONFIG } from "../config.js";
import { BUTLERS, BUTLER_BY_ID, GRADES } from "../data/butlers.js";
import { state, catLevelInfo } from "../state.js";
import { canPull, pull, pullsToLegend } from "../gacha.js";
import { butlerSVG } from "../art.js";
import { play } from "../sound.js";
import { openSheet, closeSheet, toast, esc } from "../ui.js";

const pct = (x) => `${(Math.round(x * 10000) / 100).toFixed(2)}%`;
let app, busy = false, skip = null, coolUntil = 0;

export function render(el, a) {
  app = a;
  const g = CONFIG.gacha;
  const owned = Object.keys(state.butlers).length;
  el.innerHTML = `
    <div class="office-head">
      <h2 class="screen-title">인력사무소 <small>${owned} / ${BUTLERS.length}명 만남</small></h2>
      <button class="rates-btn" data-act="rates">확률 보기</button>
    </div>
    <div class="street">
      <div class="bldg">
        <div class="bldg-roof"></div>
        <div class="bldg-side"></div>
        <div class="bldg-front">
          <div class="bldg-sign">인력사무소 <span>🐾</span></div>
          <div class="bldg-windows"><i></i><i></i><i></i></div>
          <div class="awning"></div>
          <div class="doorway">
            <div class="door-light"></div>
            <div class="door-butler"></div>
            <div class="door door-l"><i></i></div>
            <div class="door door-r"><i></i></div>
          </div>
        </div>
        <div class="bldg-step"></div>
        <div class="poster">구인<br>집사<br>모집</div>
      </div>
    </div>
    <p class="pity">전설까지 최대 <b>${pullsToLegend()}</b>회</p>
    <div class="row col pull-btns">
      <button class="btn primary" data-act="pull" ${canPull(false) ? "" : "disabled"}>🐟 ${g.cost} 뽑기</button>
      <button class="btn" data-act="free" ${canPull(true) ? "" : "disabled"}>🎫 무료 이용권 사용 (${state.freeTickets}장)</button>
    </div>
    ${!canPull(false) && !canPull(true) ? `<p class="note center">츄르는 집사들이 일해서 벌어 와요. 무료 이용권은 매일 새벽 5시에 1장</p>` : ""}`;
  el.onclick = (e) => {
    if (busy) { skip?.(); return; } // 연출 중에 누르면 바로 결과
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "rates") showRates();
    if (act === "pull" || act === "free") start(el, act === "free");
  };
}

function start(el, free) {
  if (busy || performance.now() < coolUntil) return; // 광클 방지: 연출 중이거나 방금 끝났으면 무시
  const res = pull(free);
  if (!res) return toast(free ? "무료 이용권이 없어요" : "츄르가 모자라요");
  app.changed(); // 저장 (이 화면은 다시 그려짐)
  busy = true;
  const bldg = el.querySelector(".bldg");
  const def = BUTLER_BY_ID[res.id];
  el.querySelector(".door-butler").innerHTML = butlerSVG(def);
  el.querySelectorAll(".pull-btns .btn").forEach((b) => (b.disabled = true));
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const reveal = () => {
    timers.forEach(clearTimeout);
    busy = false;
    skip = null;
    coolUntil = performance.now() + 500;
    bldg.classList.remove("shake");
    bldg.classList.add(`glow-${res.grade}`, "open");
    showResult(res);
  };
  skip = reveal;
  // 1) 문이 덜컹덜컹
  bldg.classList.add("shake");
  play("knock");
  // 2) 문틈으로 빛
  at(1000, () => { bldg.classList.remove("shake"); bldg.classList.add(`glow-${res.grade}`); play("rise"); });
  // 3) 문이 열리며 등장
  at(2100, () => { bldg.classList.add("open"); play("door"); });
  at(2700, reveal);
}

function showResult(res) {
  const def = BUTLER_BY_ID[res.id];
  play(res.grade === "legend" ? "legend" : res.grade === "rare" ? "rare" : "pop");
  if (res.result !== "duplicate") setTimeout(() => play("newbie"), 300);
  const lv = catLevelInfo();
  const msg = {
    "new": `<p class="res-tag new">새 집사!</p><p class="note">집으로 들어왔어요</p>`,
    "new-no-room": `<p class="res-tag new">새 집사!</p><p class="note">집이 좁아요 😿 도감에는 등록됐어요.<br>꾹꾹이로 호감도를 올려 묘생 Lv.${lv.next?.level ?? lv.level}이 되면 자동으로 들어와요</p>`,
    "duplicate": `<p class="res-tag dup">이미 있는 집사 · 호감도 +${CONFIG.affection.duplicate}</p><p class="note">호감도 ${res.affection} / ${CONFIG.affection.max}</p>`,
  }[res.result];
  openSheet(`
    <div class="gacha-result g-${res.grade}">
      <div class="res-rays"></div>
      <div class="res-art">${butlerSVG(def)}</div>
      <span class="grade g-${res.grade}">${GRADES[res.grade].name}</span>
      <h3>${esc(def.name)}</h3>
      ${msg}
      <p class="res-ability">${esc(def.ability)}</p>
      <div class="row">
        <button class="btn" data-act="ok">확인</button>
        <button class="btn primary" data-act="again" ${canPull(false) || canPull(true) ? "" : "disabled"}>한 번 더</button>
      </div>
    </div>`,
    (act) => {
      closeSheet();
      app.changed();
      if (act === "again") {
        const el = document.getElementById("screen");
        setTimeout(() => start(el, canPull(true)), 50); // 무료 이용권이 있으면 먼저 쓴다
      }
    });
}

function showRates() {
  const rows = Object.entries(CONFIG.gacha.rates).map(([grade, rate]) => {
    const list = BUTLERS.filter((b) => b.grade === grade);
    const each = list.map((b) => `<tr class="sub"><td>${b.name}</td><td>${pct(rate / list.length)}</td></tr>`).join("");
    return `<tr><th>${GRADES[grade].name}</th><th>${pct(rate)}</th></tr>${each}`;
  }).join("");
  openSheet(`
    <h3>확률 보기</h3>
    <table class="rates">${rows}</table>
    <p class="note">같은 등급 안에서는 확률이 같아요. ${CONFIG.gacha.legendPity}회째까지 전설이 안 나오면 ${CONFIG.gacha.legendPity}회째에 반드시 전설이 나와요. 이미 있는 집사가 나오면 그 집사의 호감도가 ${CONFIG.affection.duplicate} 올라요.</p>`);
}
