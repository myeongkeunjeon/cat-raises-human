// 집사 도감: 8칸 격자 + 상세(냄새 노트) + 주운 물건
import { CONFIG } from "../config.js";
import { BUTLERS, BUTLER_BY_ID, GRADES } from "../data/butlers.js";
import { state, affectionStep } from "../state.js";
import { butlerSVG } from "../art.js";
import { openSheet, esc } from "../ui.js";
import { ITEMS, ITEM_MAX_LEVEL, itemDesc } from "../data/items.js";
import { play } from "../sound.js";

const UNKNOWN_SMELL = "킁킁… 아직 모르겠다";

export function render(el) {
  const cells = BUTLERS.map((def) => {
    const met = !!state.butlers[def.id];
    return `<button class="book-cell ${met ? "" : "unmet"} g-${def.grade}" data-id="${def.id}" ${met ? "" : "disabled"}>
      ${butlerSVG(def, { silhouette: !met })}
      <span>${met ? def.name : "???"}</span>
    </button>`;
  }).join("");
  const count = Object.keys(state.butlers).length;
  el.innerHTML = `
    <h2 class="screen-title">집사 도감 <small>${count} / ${BUTLERS.length}</small></h2>
    <div class="book-grid">${cells}</div>
    <h3 class="sub-title">주운 물건 <small>${Object.keys(state.pickups).length} / ${Object.keys(ITEMS).length}</small></h3>
    <p class="note">집사들이 일터에서 주워 와요. 같은 물건을 더 주우면 효과가 세져요 (최대 ${ITEM_MAX_LEVEL}단계)</p>
    <div class="items">${Object.keys(ITEMS).map(itemCard).join("")}</div>`;
  el.querySelectorAll(".book-cell:not(.unmet)").forEach((c) => c.addEventListener("click", () => openDetail(c.dataset.id)));
}

const PLACE_ICON = { store: "🏪", office: "🏢", construction: "🏗️" };

function itemCard(name) {
  const n = state.pickups[name] || 0;
  if (!n) return `<div class="item unknown"><span class="item-icon">?</span><div><b>???</b><small>${CONFIG.workplaces[ITEMS[name].place].name}에서 주울 수 있어요</small></div></div>`;
  const lv = Math.min(n, ITEM_MAX_LEVEL);
  return `<div class="item"><span class="item-icon">${PLACE_ICON[ITEMS[name].place]}</span>
    <div><b>${esc(name)}</b> <span class="item-lv">${"★".repeat(lv)}${"☆".repeat(ITEM_MAX_LEVEL - lv)}</span>
    <small>${itemDesc(name, n)}${n > 1 ? ` · ${n}개` : ""}</small></div></div>`;
}

function openDetail(id) {
  const def = BUTLER_BY_ID[id];
  const b = state.butlers[id];
  const step = affectionStep(b.affection);
  play(def.grade === "legend" ? "legend" : def.grade === "rare" ? "rare" : "pop");
  const notes = [0, 1, 2, 3, 4].map((i) => {
    const open = i < step && def.smells[i];
    return `<li class="${open ? "" : "locked"}">${open ? def.smells[i] : UNKNOWN_SMELL}</li>`;
  }).join("");
  const apt = def.aptitude ? CONFIG.workplaces[def.aptitude].name : "없음";
  openSheet(`
    <div class="detail">
      <div class="detail-art">${butlerSVG(def)}</div>
      <div>
        <h3>${def.name} <span class="grade g-${def.grade}">${GRADES[def.grade].name}</span></h3>
        <p>적성: ${apt}</p>
        <p>특수 능력: ${def.ability}</p>
        ${b.housed ? "" : `<p class="note">집이 좁아 입주 대기 중</p>`}
      </div>
    </div>
    <p>호감도 ${b.affection} / ${CONFIG.affection.max} (${step}단계)</p>
    <div class="abar"><i style="width:${b.affection}%"></i></div>
    <h4>냄새 노트</h4>
    <ol class="smells">${notes}</ol>`);
}
