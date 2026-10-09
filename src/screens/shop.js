// 상점: 코인으로 집 꾸미기 아이템을 산다. 아이템은 묘생 레벨마다 열린다.
// 누르면 내 방에 놓아 본 미리보기 → 구매 / 장착 / 빼기
import { DECO, DECO_BY_ID, THEMES, SLOTS, STARTER } from "../data/deco.js";
import { state, catLevelInfo, buyDeco, equipDeco } from "../state.js";
import { roomSVG, setLayout, timeOfDay } from "../room.js";
import { play } from "../sound.js";
import { openSheet, closeSheet, toast, esc } from "../ui.js";

const SLOT_ICON = { wall: "🧱", floor: "🟫", curtain: "🪟", rug: "🧶", sofa: "🛋️", bed: "📦", tower: "🗼", plant: "🪴", lamp: "💡",
  shelf: "📚", art: "🖼️", tank: "🐠", lights: "✨", ceiling: "🕯️", cabinet: "🏆" };
let app, filter = "all"; // all | 테마 id

export function render(el, a) {
  app = a;
  const lv = catLevelInfo().level;
  const owned = state.deco.owned;
  const list = DECO.filter((d) => filter === "all" || d.theme === filter);
  const nextUnlock = DECO.filter((d) => d.lv > lv).sort((x, y) => x.lv - y.lv)[0];
  el.innerHTML = `
    <div class="shop-head">
      <h2 class="screen-title">꾸미기 상점</h2>
      <span class="coin-pill">🪙 ${Math.floor(state.coins).toLocaleString()}</span>
    </div>
    <p class="note">코인은 정산·꾹꾹이·응원 가기로 모여요. ${nextUnlock ? `다음 새 아이템: 묘생 Lv.${nextUnlock.lv}` : "모든 아이템이 열렸어요!"}</p>
    <div class="theme-chips">
      <button class="tchip ${filter === "all" ? "on" : ""}" data-theme="all">전체</button>
      ${Object.entries(THEMES).map(([id, t]) => `<button class="tchip ${filter === id ? "on" : ""}" data-theme="${id}">${t.icon} ${t.name}</button>`).join("")}
    </div>
    <div class="shop-grid">
      ${list.map((d) => {
        const have = owned.includes(d.id), on = state.deco.equipped[d.slot] === d.id, locked = lv < d.lv;
        const tag = on ? `<span class="stag on">사용 중</span>` : have ? `<span class="stag">보유</span>` : locked ? `<span class="stag lock">🔒 Lv.${d.lv}</span>` : `<span class="stag price">🪙 ${d.price}</span>`;
        return `<button class="shop-card ${locked ? "locked" : ""} ${on ? "equipped" : ""}" data-id="${d.id}">
          <span class="swatch" style="${swatchStyle(d)}">${SLOT_ICON[d.slot]}</span>
          <b>${esc(d.name)}</b>
          <small>${THEMES[d.theme].icon} ${SLOTS[d.slot]}</small>
          ${tag}
        </button>`;
      }).join("")}
    </div>`;
  el.onclick = (e) => {
    const t = e.target.closest("[data-theme]");
    if (t) { filter = t.dataset.theme; play("tap"); return render(el, app); }
    const c = e.target.closest("[data-id]");
    if (c) openItem(c.dataset.id);
  };
}

function swatchStyle(d) {
  const c = d.c?.length ? d.c : ["#f3ece0", "#e6d8c4"];
  return `background: linear-gradient(135deg, ${c[0]} 50%, ${c[1] || c[0]} 50%)`;
}

// 미리보기: 내 방에 이 아이템을 놓아 본 모습
function openItem(id) {
  const d = DECO_BY_ID[id];
  const lvInfo = catLevelInfo();
  const have = state.deco.owned.includes(id), on = state.deco.equipped[d.slot] === id, locked = lvInfo.level < d.lv;
  setLayout(lvInfo.size);
  const preview = roomSVG(lvInfo.level, timeOfDay(), 0, { ...state.deco.equipped, [d.slot]: id });
  const canRemove = on && !STARTER[d.slot];
  let action;
  if (locked) action = `<button class="btn" disabled>🔒 묘생 Lv.${d.lv}에 열려요</button>`;
  else if (!have) action = `<button class="btn primary" data-act="buy" ${state.coins >= d.price ? "" : "disabled"}>🪙 ${d.price} 사고 놓기</button>`;
  else if (on) action = canRemove ? `<button class="btn" data-act="off">빼기</button>` : `<button class="btn" disabled>사용 중</button>`;
  else action = `<button class="btn primary" data-act="on">놓기</button>`;
  openSheet(`
    <div class="shop-preview">${preview}</div>
    <h3>${esc(d.name)}</h3>
    <p class="note">${THEMES[d.theme].icon} ${THEMES[d.theme].name} 테마 · ${SLOTS[d.slot]} 자리 ${!have && !locked && state.coins < d.price ? ` · 코인이 ${d.price - Math.floor(state.coins)} 모자라요` : ""}</p>
    <div class="row">${action}</div>`,
    (act) => {
      if (act === "buy") {
        if (!buyDeco(id)) return toast("살 수 없어요");
        play("coin"); play("newbie");
        toast(`${d.name}을(를) 놓았어요!`);
      } else if (act === "on") { equipDeco(id, true); play("pop"); }
      else if (act === "off") { equipDeco(id, false); play("pop"); }
      else return;
      closeSheet();
      app.changed();
    });
}
