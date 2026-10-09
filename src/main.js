// 시작점: 불러오기 → 오프라인 시간 반영 → 화면 그리기 → 1초마다 시간 진행
import { load, save, tick, state, catLevelInfo, recordVisit, addPlaySeconds } from "./state.js";
import { initUI, toast } from "./ui.js";
import { initDebug } from "./debug.js";
import { showCatSelect } from "./screens/catselect.js";
import * as home from "./screens/home.js";
import * as map from "./screens/map.js";
import * as office from "./screens/office.js";
import * as book from "./screens/book.js";

const SCREENS = { home, map, office, book };
let current = "home";
let saveEnabled = true;

const app = {
  // 상태가 바뀌었을 때: 저장 + 다시 그리기
  changed() {
    if (saveEnabled) save();
    renderAll();
  },
  disableSave() { saveEnabled = false; },
};

function renderTopbar() {
  const lv = catLevelInfo();
  document.getElementById("churu").textContent = Math.floor(state.churu).toLocaleString();
  document.getElementById("tickets").textContent = state.freeTickets;
  document.getElementById("level").textContent = lv.level;
}

function renderAll() {
  renderTopbar();
  SCREENS[current].render(document.getElementById("screen"), app);
  document.querySelectorAll(".tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.tab === current));
}

function start() {
  const root = document.getElementById("app");
  initUI(root);
  load();
  tick().forEach(toast); // 꺼둔 동안 흐른 시간 한꺼번에 계산
  recordVisit();
  save();

  document.querySelector(".tabbar").addEventListener("click", (e) => {
    const tab = e.target.closest("button")?.dataset.tab;
    if (tab && tab !== current) { current = tab; renderAll(); }
  });

  initDebug(document.querySelector(".topbar"), app);
  renderAll();
  if (!state.cat.type) {
    showCatSelect(root, (type, name) => {
      state.cat = { type, name };
      app.changed();
    });
  }

  // 1초마다 시간 진행 + 상단 표시 갱신, 10초마다 저장
  let secs = 0;
  setInterval(() => {
    if (document.hidden) return;
    const events = tick();
    events.forEach(toast);
    addPlaySeconds(1);
    if (events.length) app.changed();
    else {
      renderTopbar();
      if (current === "map") map.refreshLive(document.getElementById("screen"));
    }
    if (++secs % 10 === 0 && saveEnabled) save();
  }, 1000);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (saveEnabled) save(); }
    else {
      tick().forEach(toast);
      recordVisit();
      app.changed();
    }
  });
}

window.addEventListener("pagehide", () => saveEnabled && save());

start();
