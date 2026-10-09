// 디버그 메뉴: URL에 ?debug=1 을 붙이면 톱니바퀴 버튼이 나온다
import { BUTLERS } from "./data/butlers.js";
import { ITEMS } from "./data/items.js";
import { state, tick, addButler, resetSave, statsText, now } from "./state.js";
import { openSheet, toast, esc } from "./ui.js";

const MIN = 60e3;
let lastPick = "overtime"; // 메뉴를 다시 그려도 고른 집사 유지

export function initDebug(root, app) {
  if (new URLSearchParams(location.search).get("debug") !== "1") return;
  const gear = document.createElement("button");
  gear.className = "debug-gear";
  gear.textContent = "⚙️";
  gear.setAttribute("aria-label", "디버그 메뉴");
  gear.addEventListener("click", () => openMenu(app));
  root.append(gear);
}

function menuHTML() {
  const opts = BUTLERS.map((b) => `<option value="${b.id}" ${b.id === lastPick ? "selected" : ""}>${b.name}</option>`).join("");
  return `
    <h3>디버그 메뉴</h3>
    <p class="note">게임 시각: ${new Date(now()).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
      (빨리 감기 +${Math.round(state.debugOffsetMs / MIN)}분)</p>
    <h4>시간 빨리 감기</h4>
    <div class="row wrap">
      <button class="btn sm" data-act="ff" data-min="30">+30분</button>
      <button class="btn sm" data-act="ff" data-min="120">+2시간</button>
      <button class="btn sm" data-act="ff" data-min="480">+8시간</button>
      <button class="btn sm" data-act="ff" data-min="1440">+1일</button>
    </div>
    <h4>재화</h4>
    <div class="row wrap">
      <button class="btn sm" data-act="churu">츄르 +1000</button>
      <button class="btn sm" data-act="coins">코인 +1000</button>
      <button class="btn sm" data-act="ticket">무료 이용권 +1</button>
    </div>
    <h4>집사</h4>
    <div class="row wrap">
      <button class="btn sm" data-act="f0">모든 집사 피로 0</button>
      <button class="btn sm" data-act="f100">모든 집사 피로 100</button>
      <button class="btn sm" data-act="aff">모든 집사 호감도 +20</button>
      <button class="btn sm" data-act="item">주운 물건 아무거나 +1</button>
    </div>
    <div class="row">
      <select id="dbg-butler">${opts}</select>
      <button class="btn sm" data-act="give">바로 얻기</button>
    </div>
    <h4>통계</h4>
    <div class="row wrap">
      <button class="btn sm" data-act="stats">통계 보기</button>
      <button class="btn sm" data-act="copy">통계 복사하기</button>
    </div>
    <h4>위험</h4>
    <button class="btn sm danger" data-act="reset">저장 초기화</button>`;
}

function openMenu(app) {
  openSheet(menuHTML(), (act, el) => {
    const all = Object.values(state.butlers);
    switch (act) {
      case "ff":
        state.debugOffsetMs += Number(el.dataset.min) * MIN;
        tick().forEach(toast);
        toast(`${el.textContent} 빨리 감음`);
        break;
      case "churu": state.churu += 1000; break;
      case "coins": state.coins += 1000; break;
      case "ticket": state.freeTickets += 1; break;
      case "f0": all.forEach((b) => (b.fatigue = 0)); break;
      case "f100": all.forEach((b) => (b.fatigue = 100)); break;
      case "item": {
        const names = Object.keys(ITEMS);
        const n = names[Math.floor(Math.random() * names.length)];
        state.pickups[n] = (state.pickups[n] || 0) + 1;
        toast(`${n} +1`);
        break;
      }
      case "aff": all.forEach((b) => (b.affection = Math.min(100, b.affection + 20))); tick().forEach(toast); break;
      case "give": {
        const id = (lastPick = document.getElementById("dbg-butler").value);
        const r = addButler(id);
        toast(r === "duplicate" ? "이미 있는 집사 → 호감도 +20" : r === "new-no-room" ? "집이 좁아요 (도감에만 등록)" : "새 집사!");
        break;
      }
      case "stats":
        openSheet(`<h3>통계</h3><pre class="stats">${esc(statsText())}</pre>
          <button class="btn" data-act="copy">복사하기</button>`, (a) => a === "copy" && copyStats());
        return;
      case "copy": copyStats(); return;
      case "reset":
        if (confirm("저장을 지우고 처음부터 시작할까요?")) {
          app.disableSave();
          resetSave();
          location.reload();
        }
        return;
    }
    app.changed();
    openMenu(app); // 숫자 갱신
  });
}

async function copyStats() {
  const text = statsText();
  try {
    await navigator.clipboard.writeText(text);
    toast("통계를 복사했어요");
  } catch (e) {
    // 클립보드 API가 막힌 환경: 임시 textarea로 복사
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand && document.execCommand("copy");
    ta.remove();
    toast(ok ? "통계를 복사했어요" : "복사 실패 — 통계 보기에서 길게 눌러 복사해 주세요");
  }
}
