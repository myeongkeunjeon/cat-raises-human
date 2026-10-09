// 집: 방 단면, 그릇 속 고양이, 바닥에 선 집사들
import { CONFIG } from "../config.js";
import { BUTLER_BY_ID } from "../data/butlers.js";
import { state, affectionStep, catLevelInfo, housedCount } from "../state.js";
import { catSVG, butlerSVG } from "../art.js";
import { openSheet, toast, esc } from "../ui.js";

export function fatigueColor(f) {
  if (f >= CONFIG.fatigue.tiredAt) return "var(--bad)";
  if (f >= 40) return "var(--warn)";
  return "var(--good)";
}

export function render(el) {
  const ids = Object.keys(state.butlers).filter((id) => state.butlers[id].housed && state.butlers[id].status !== "working");
  const butlers = ids.map((id) => {
    const b = state.butlers[id];
    const f = Math.round(b.fatigue);
    return `<button class="butler" data-id="${id}">
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

  el.innerHTML = `
    <div class="room">
      <div class="cat-name">${esc(state.cat.name)}</div>
      <div class="house-info">${house}</div>
      <div class="cat">${catSVG(state.cat.type)}</div>
      <div class="floor-row">${butlers || `<p class="empty">집에 집사가 없어요</p>`}</div>
      <div class="floor"></div>
    </div>`;

  el.querySelectorAll(".butler").forEach((btn) => btn.addEventListener("click", () => openButler(btn.dataset.id)));
}

function openButler(id) {
  const def = BUTLER_BY_ID[id];
  const b = state.butlers[id];
  openSheet(`
    <h3>${def.name}</h3>
    <p>피로 ${Math.round(b.fatigue)} / ${CONFIG.fatigue.max} · 호감도 ${b.affection} (${affectionStep(b.affection)}단계)</p>
    <div class="row">
      <button class="btn" data-act="knead">꾹꾹이</button>
      <button class="btn" data-act="pet">쓰다듬기</button>
    </div>`,
    () => toast("꾹꾹이·쓰다듬기는 다음 단계에서 열려요"));
}
