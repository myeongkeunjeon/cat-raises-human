// 집: 방 단면, 그릇 속 고양이, 바닥에 선 집사들
import { CONFIG } from "../config.js";
import { BUTLER_BY_ID } from "../data/butlers.js";
import { state, affectionStep, catLevelInfo, housedCount, pet } from "../state.js";
import { startKneading } from "../kneading.js";
import { catStage, butlerSVG, CAT_LOOKS } from "../art.js";
import { play } from "../sound.js";
import { openSheet, closeSheet, toast, esc } from "../ui.js";
import { settle, collectRent } from "../work.js";

let app;

export function fatigueColor(f) {
  if (f >= CONFIG.fatigue.tiredAt) return "var(--bad)";
  if (f >= 40) return "var(--warn)";
  return "var(--good)";
}

export function render(el, a) {
  app = a;
  const ids = Object.keys(state.butlers).filter((id) => state.butlers[id].housed && state.butlers[id].status !== "working");
  const butlers = ids.map((id) => {
    const b = state.butlers[id];
    const f = Math.round(b.fatigue);
    const done = b.status === "done";
    return `<button class="butler ${done ? "done" : ""}" data-id="${id}">
      ${done ? `<span class="envelope" aria-label="정산 대기">✉️</span>` : ""}
      <div class="fbar"><i style="width:${f}%;background:${fatigueColor(f)}"></i></div>
      ${butlerSVG(BUTLER_BY_ID[id])}
      <span class="label">${BUTLER_BY_ID[id].name}</span>
    </button>`;
  }).join("");

  // 수용 인원과 입주 대기 (집이 좁으면 도감에만 등록된 집사)
  const lv = catLevelInfo();
  const waiting = Object.keys(state.butlers).length - housedCount();
  const house = `집사 ${housedCount()} / ${lv.capacity}명` + (waiting
    ? ` · 입주 대기 ${waiting}명<br><small>${lv.next ? `호감도 합계 ${lv.sum} / ${lv.next.need} → 묘생 Lv.${lv.next.level}이 되면 ${lv.next.capacity}명까지 살 수 있어요` : "집이 가장 넓어요"}</small>`
    : "");

  const working = Object.values(state.butlers).filter((b) => b.status === "working").length;
  const doneIds = ids.filter((id) => state.butlers[id].status === "done");
  const rent = Math.floor(state.rent || 0);

  el.innerHTML = `
    <div class="room">
      <div class="cat-name">${esc(state.cat.name)}</div>
      <div class="house-info">${house}</div>
      ${working ? `<div class="house-info">출근 중 ${working}명 · 동네 탭에서 볼 수 있어요</div>` : ""}
      <div class="window ${skyClass()}"><i></i></div>
      <button class="cat" data-act="cat" aria-label="${esc(state.cat.name)} 쓰다듬기">${catStage(state.cat.type, lv.level)}</button>
      <div class="cat-look">묘생 Lv.${lv.level} · ${CAT_LOOKS[lv.level] || ""}</div>
      <div class="home-actions">
        ${doneIds.length > 1 ? `<button class="btn primary" data-act="all">✉️ 모두 정산 (${doneIds.length})</button>` : ""}
        ${rent > 0 ? `<button class="btn rent" data-act="rent">💰 월세 봉투 🐟 ${rent}</button>` : ""}
      </div>
      <div class="floor-row">${butlers || `<p class="empty">집에 집사가 없어요</p>`}</div>
      <div class="floor"></div>
    </div>`;

  el.onclick = (e) => {
    const btn = e.target.closest(".butler");
    if (btn) {
      if (state.butlers[btn.dataset.id].status === "done") return openSettle([btn.dataset.id]);
      play("pop");
      bounce(btn);
      return setTimeout(() => openButler(btn.dataset.id), 250);
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "cat") return poke(e.target.closest(".cat"));
    if (act === "all") openSettle(doneIds);
    if (act === "rent") { play("churu"); toast(`월세 🐟 ${collectRent()} 받았어요`); app.changed(); }
  };
}

// 한국 시간에 맞춘 창밖 하늘
function skyClass() {
  const h = (new Date().getUTCHours() + 9) % 24;
  return h < 6 ? "night" : h < 9 ? "dawn" : h < 17 ? "day" : h < 20 ? "dusk" : "night";
}

function bounce(el) {
  el.classList.remove("hop");
  void el.offsetWidth; // 애니메이션 다시 시작
  el.classList.add("hop");
}

// 고양이를 누르면: 냐옹 + 폴짝 + 하트
function poke(el) {
  play("meow");
  bounce(el);
  heart(el);
}

function heart(el) {
  const h = document.createElement("span");
  h.className = "float-heart";
  h.textContent = "♥";
  h.style.left = `${40 + Math.random() * 20}%`;
  el.append(h);
  setTimeout(() => h.remove(), 1000);
}

// 정산 카드: 여러 명이면 차례대로 넘어간다
function openSettle(queue) {
  const [id, ...rest] = queue;
  const r = settle(id);
  if (!r) return;
  play("churu");
  app.changed();
  const def = BUTLER_BY_ID[id];
  openSheet(`
    <div class="settle">
      <p class="note">${CONFIG.workplaces[r.place].name} 근무를 마치고 돌아왔어요</p>
      <div class="settle-art">${butlerSVG(def)}</div>
      <h3>${def.name}</h3>
      <div class="settle-churu">🐟 +${r.churu}${r.bonus ? ` <small>(공장장 덤 +${r.bonus})</small>` : ""}</div>
      <blockquote class="journal">“${esc(r.journal)}”</blockquote>
      ${r.pickup ? `<p class="pickup">주운 물건: <b>${esc(r.pickup)}</b></p>` : ""}
      <button class="btn primary" data-act="next">${rest.length ? `다음 (${rest.length}명 남음)` : "확인"}</button>
    </div>`,
    (act) => {
      if (act !== "next") return;
      if (rest.length) openSettle(rest);
      else closeSheet();
    });
}

function openButler(id) {
  const def = BUTLER_BY_ID[id];
  const b = state.butlers[id];
  const petsLeft = CONFIG.affection.petPerDay - b.petsToday;
  const f = Math.round(b.fatigue);
  openSheet(`
    <div class="detail">
      <div class="detail-art">${butlerSVG(def)}</div>
      <div>
        <h3>${def.name}</h3>
        <p>피로 ${f} / ${CONFIG.fatigue.max}</p>
        <div class="fbar wide"><i style="width:${f}%;background:${fatigueColor(f)}"></i></div>
        <p>호감도 ${b.affection} (${affectionStep(b.affection)}단계)</p>
      </div>
    </div>
    <div class="row">
      <button class="btn primary" data-act="knead">🐾 꾹꾹이</button>
      <button class="btn" data-act="pet" ${petsLeft > 0 ? "" : "disabled"}>쓰다듬기 (${petsLeft}/${CONFIG.affection.petPerDay})</button>
    </div>
    <p class="note">${f >= CONFIG.fatigue.tiredAt ? "많이 지쳐 보여요. 꾹꾹이로 풀어 주세요" : "꾹꾹이를 받으면 피로가 풀리고 호감도가 올라요"}</p>`,
    (act) => {
      if (act === "knead") {
        closeSheet();
        startKneading(id, () => app.changed());
      }
      if (act === "pet") {
        const n = pet(id);
        if (n === null) return;
        play("meow");
        closeSheet();
        app.changed();
        toast(`${def.name} 호감도 +${n}`);
        const btn = document.querySelector(`.butler[data-id="${id}"]`);
        if (btn) { bounce(btn); heart(btn); }
      }
    });
}
