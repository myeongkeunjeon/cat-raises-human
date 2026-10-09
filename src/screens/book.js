// 집사 도감: 8칸 격자 + 상세(냄새 노트) + 주운 물건
import { CONFIG } from "../config.js";
import { BUTLERS, BUTLER_BY_ID, GRADES } from "../data/butlers.js";
import { state, affectionStep } from "../state.js";
import { butlerSVG } from "../art.js";
import { openSheet, esc } from "../ui.js";
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
    <h3 class="sub-title">주운 물건</h3>
    <p class="pickups">${state.pickups.length ? state.pickups.map(esc).join(", ") : "아직 없어요"}</p>`;
  el.querySelectorAll(".book-cell:not(.unmet)").forEach((c) => c.addEventListener("click", () => openDetail(c.dataset.id)));
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
