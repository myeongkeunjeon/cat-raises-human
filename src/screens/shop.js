// 상점: 코인으로 집 꾸미기 아이템을 산다. 아이템은 묘생 레벨마다 열린다.
// 누르면 내 방에 놓아 본 미리보기 → 구매 / 장착 / 빼기
import { DECO, DECO_BY_ID, THEMES, SLOTS, STARTER } from "../data/deco.js";
import { state, catLevelInfo, buyDeco, equipDeco, decoFloorOf, floorOpen } from "../state.js";
import { roomSVG, setLayout, timeOfDay, FLOORS, slotAllowed } from "../room.js";
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
        const have = owned.includes(d.id), at = decoFloorOf(d.id), on = at >= 0, locked = lv < d.lv;
        const tag = on ? `<span class="stag on">${FLOORS[at].name.split(" ")[0]}에 있음</span>` : have ? `<span class="stag">보유</span>` : locked ? `<span class="stag lock">🔒 Lv.${d.lv}</span>` : `<span class="stag price">🪙 ${d.price}</span>`;
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

// 미리보기: 고른 층에 이 아이템을 놓아 본 모습. 놓을 층을 고를 수 있다
function openItem(id, pickFloor = null) {
  const d = DECO_BY_ID[id];
  const lvInfo = catLevelInfo();
  const have = state.deco.owned.includes(id), locked = lvInfo.level < d.lv;
  const at = decoFloorOf(id);
  const floors = FLOORS.map((_, f) => f).filter((f) => floorOpen(f) && slotAllowed(d.slot, f));
  const f = pickFloor ?? (at >= 0 ? at : floors[0] ?? 0);
  setLayout(lvInfo.size);
  const preview = roomSVG(lvInfo.level, timeOfDay(), f, { ...state.deco.equipped[f], [d.slot]: id });
  const fname = FLOORS[f].name;
  let action;
  if (locked) action = `<button class="btn" disabled>🔒 묘생 Lv.${d.lv}에 열려요</button>`;
  else if (!have) action = `<button class="btn primary" data-act="buy" ${state.coins >= d.price ? "" : "disabled"}>🪙 ${d.price} 사서 ${fname}에 놓기</button>`;
  else if (at === f) action = at === 0 && STARTER[d.slot] ? `<button class="btn" disabled>${fname}에 있어요</button>` : `<button class="btn" data-act="off">${fname}에서 빼기</button>`;
  else action = `<button class="btn primary" data-act="on">${fname}에 놓기${at >= 0 ? ` (${FLOORS[at].name}에서 옮김)` : ""}</button>`;
  openSheet(`
    <div class="shop-preview">${preview}</div>
    <h3>${esc(d.name)}</h3>
    <p class="note">${THEMES[d.theme].icon} ${THEMES[d.theme].name} 테마 · ${SLOTS[d.slot]} ${!have && !locked && state.coins < d.price ? ` · 코인이 ${d.price - Math.floor(state.coins)} 모자라요` : ""}</p>
    ${floors.length > 1 ? `<p class="note">놓을 곳</p><div class="floors">${floors.map((x) => `<button class="floor-btn ${x === f ? "on" : ""}" data-act="floor" data-f="${x}">${FLOORS[x].icon} ${FLOORS[x].name}</button>`).join("")}</div>` : ""}
    <div class="row">${action}</div>`,
    (act, el) => {
      if (act === "floor") return openItem(id, Number(el.dataset.f));
      if (act === "buy") {
        if (!buyDeco(id, f)) return toast("살 수 없어요");
        play("coin"); play("newbie");
        toast(`${d.name}을(를) ${fname}에 놓았어요!`);
      } else if (act === "on") { equipDeco(id, f); play("pop"); toast(`${fname}에 놓았어요`); }
      else if (act === "off") { equipDeco(id, -1); play("pop"); }
      else return;
      closeSheet();
      app.changed();
    });
}
