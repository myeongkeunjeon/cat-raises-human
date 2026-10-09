// 동네 지도: 일터 3곳 카드, 보낼 집사 고르기, 근무 중인 집사의 '일하는 모습'
import { CONFIG } from "../config.js";
import { BUTLER_BY_ID } from "../data/butlers.js";
import { WORK_LINES } from "../data/journals.js";
import { state, now } from "../state.js";
import { slotsOf, workingAt, nextExpand, expand, canWork, expectedChuru, sendToWork } from "../work.js";
import { butlerSVG } from "../art.js";
import { openSheet, closeSheet, toast } from "../ui.js";
import { fatigueColor } from "./home.js";
import { play } from "../sound.js";

let app;

function fmtMinutes(m) {
  return m >= 60 ? `${m / 60}시간` : `${m}분`;
}

export function fmtLeft(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const two = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
}

// 일터별 작은 소품 그림 (2D 옆모습)
const PROPS = {
  store: `<svg viewBox="0 0 120 70" class="prop"><rect x="4" y="38" width="112" height="30" rx="4" fill="#4fb07f"/><rect x="4" y="34" width="112" height="8" rx="3" fill="#3f9a6b"/><rect x="82" y="18" width="22" height="16" rx="3" fill="#8d9399"/><rect x="86" y="22" width="14" height="6" fill="#c9f0d8"/><rect x="10" y="6" width="40" height="28" rx="2" fill="#e8dcc8"/><rect x="14" y="10" width="8" height="10" fill="#f28a3c"/><rect x="26" y="10" width="8" height="10" fill="#f5c63c"/><rect x="38" y="10" width="8" height="10" fill="#7fb2e6"/></svg>`,
  office: `<svg viewBox="0 0 120 70" class="prop"><rect x="8" y="40" width="104" height="8" rx="3" fill="#a88763"/><rect x="16" y="48" width="6" height="20" fill="#8a6c4c"/><rect x="98" y="48" width="6" height="20" fill="#8a6c4c"/><rect x="62" y="12" width="40" height="26" rx="3" fill="#3a3f4a"/><rect x="65" y="15" width="34" height="18" fill="#9fd3f2"/><rect x="78" y="36" width="8" height="4" fill="#3a3f4a"/><rect x="24" y="30" width="12" height="10" rx="2" fill="#f4f1ec" stroke="#c9c2b6"/></svg>`,
  construction: `<svg viewBox="0 0 120 70" class="prop"><g fill="#c8643c" stroke="#a24f2c"><rect x="60" y="54" width="18" height="10"/><rect x="80" y="54" width="18" height="10"/><rect x="100" y="54" width="16" height="10"/><rect x="70" y="42" width="18" height="10"/><rect x="90" y="42" width="18" height="10"/><rect x="80" y="30" width="18" height="10"/></g><rect x="4" y="60" width="40" height="6" rx="3" fill="#f5c63c"/><rect x="10" y="10" width="4" height="50" fill="#e0ab22"/><rect x="10" y="10" width="40" height="4" fill="#e0ab22"/></svg>`,
};

export function render(el, a) {
  app = a;
  const cards = Object.entries(CONFIG.workplaces).map(([key, w]) => {
    const ids = workingAt(key);
    const full = ids.length >= slotsOf(key);
    const ex = nextExpand(key);
    const scenes = ids.map((id) => {
      const b = state.butlers[id];
      return `<div class="scene scene-${key}">
        ${PROPS[key]}
        <div class="scene-butler">${butlerSVG(BUTLER_BY_ID[id])}</div>
        <div class="scene-text">
          <b>${BUTLER_BY_ID[id].name}</b>
          <span class="scene-line" data-lines="${key}"></span>
          <span class="countdown">⏱ <span data-end="${b.work.end}"></span></span>
        </div>
      </div>`;
    }).join("");
    return `<div class="card place" data-place="${key}">
      <div class="place-head">
        <div class="place-name">${w.name}</div>
        <div class="place-slots">자리 ${ids.length} / ${slotsOf(key)}</div>
      </div>
      <div class="place-info">
        <span>⏱ ${fmtMinutes(w.minutes)}</span>
        <span>🐟 ${w.churu}</span>
        <span>피로 +${w.fatigue}</span>
      </div>
      ${scenes}
      <div class="row">
        ${full ? "" : `<button class="btn primary" data-act="send">집사 보내기</button>`}
        ${full && ex ? `<button class="btn" data-act="expand" ${state.churu >= ex.cost ? "" : "disabled"}>확장하기 (츄르 ${ex.cost})</button>` : ""}
        ${full && !ex ? `<span class="note">자리가 꽉 찼어요</span>` : ""}
      </div>
    </div>`;
  }).join("");
  el.innerHTML = `<h2 class="screen-title">동네</h2><div class="places">${cards}</div>`;
  el.onclick = (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const place = btn.closest("[data-place]").dataset.place;
    if (btn.dataset.act === "send") openPicker(place);
    if (btn.dataset.act === "expand" && expand(place)) { toast("자리가 늘었어요!"); app.changed(); }
  };
  refreshLive(el);
}

// 1초마다: 남은 시간, '지금 하는 일' 한 줄 갱신
export function refreshLive(el) {
  const t = now();
  el.querySelectorAll("[data-end]").forEach((s) => (s.textContent = fmtLeft(Number(s.dataset.end) - t)));
  el.querySelectorAll("[data-lines]").forEach((s, i) => {
    const lines = WORK_LINES[s.dataset.lines];
    s.textContent = lines[(Math.floor(t / 4000) + i) % lines.length];
  });
}

function openPicker(place) {
  const w = CONFIG.workplaces[place];
  const ids = Object.keys(state.butlers).filter((id) => ["ok", "refuse"].includes(canWork(id)));
  const rows = ids.map((id) => {
    const def = BUTLER_BY_ID[id];
    const b = state.butlers[id];
    const f = Math.round(b.fatigue);
    const refuse = canWork(id) === "refuse";
    const tired = b.fatigue >= CONFIG.fatigue.tiredAt;
    const tags = [
      def.aptitude === place ? `<span class="tag good">적성 +${CONFIG.aptitudeBonus * 100}%</span>` : "",
      refuse ? `<span class="tag bad">출근 거부</span>` : tired ? `<span class="tag warn">지침 −${CONFIG.fatigue.tiredPenalty * 100}%</span>` : "",
    ].join("");
    return `<button class="pick-row" data-act="${refuse ? "refuse" : "go"}" data-id="${id}" ${refuse ? "aria-disabled=true" : ""}>
      <span class="pick-art">${butlerSVG(def)}</span>
      <span class="pick-body">
        <span class="pick-name"><b>${def.name}</b>${tags}</span>
        <span class="fbar wide"><i style="width:${f}%;background:${fatigueColor(f)}"></i></span>
        <small>피로 ${f} → ${Math.min(100, Math.round(b.fatigue + w.fatigue * (def.fatigueMult || 1)))}</small>
      </span>
      <span class="pick-churu">🐟 ${refuse ? "-" : expectedChuru(id, place, tired)}</span>
    </button>`;
  }).join("");
  openSheet(`
    <h3>${w.name}에 보낼 집사</h3>
    <p class="note">${fmtMinutes(w.minutes)} 근무 · 피로 +${w.fatigue}</p>
    <div class="pick-list">${rows || `<p class="note">보낼 수 있는 집사가 없어요. 퇴근한 집사는 집에서 먼저 정산해 주세요.</p>`}</div>`,
    (act, el) => {
      if (act === "refuse") return toast("너무 지쳐서 출근을 거부했어요. 꾹꾹이로 쉬게 해주세요");
      if (act === "go" && sendToWork(el.dataset.id, place)) {
        closeSheet();
        play("send");
        toast(`${BUTLER_BY_ID[el.dataset.id].name} 출근!`);
        app.changed();
      }
    });
}
