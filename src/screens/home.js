// 집: 방 단면, 그릇 속 고양이, 바닥에 선 집사들
import { CONFIG } from "../config.js";
import { BUTLER_BY_ID } from "../data/butlers.js";
import { state, affectionStep, catLevelInfo, housedCount, pet } from "../state.js";
import { startKneading } from "../kneading.js";
import { catStage, butlerSVG, CAT_LOOKS } from "../art.js";
import { roomSVG, isoPct, timeOfDay, WALK, CAT_SPOT, FLOORS } from "../room.js";
import { fmtLeft } from "./map.js";
import { now } from "../state.js";
import { play } from "../sound.js";
import { openSheet, closeSheet, toast, esc } from "../ui.js";
import { settle, collectRent } from "../work.js";
import { itemDesc, ITEM_MAX_LEVEL } from "../data/items.js";

let app;

export function fatigueColor(f) {
  if (f >= CONFIG.fatigue.tiredAt) return "var(--bad)";
  if (f >= 40) return "var(--warn)";
  return "var(--good)";
}

// 집사들이 서 있는 바닥 칸 위치 (다시 그려도 유지)
const pos = {};
let wanderTimer = 0;
let floor = 0; // 지금 보고 있는 층
let floorChanged = false;

// 열린 층에 집사들을 고르게 나눈다
function floorOf(ids, id, open) {
  return ids.indexOf(id) % open;
}

function randomSpot() {
  const r = () => WALK.min + Math.random() * (WALK.max - WALK.min);
  let p;
  do p = { gx: r(), gy: r() }; while (Math.hypot(p.gx - CAT_SPOT.gx, p.gy - CAT_SPOT.gy) < 1.3); // 고양이 자리는 비워 둔다
  return p;
}

function placeStyle({ gx, gy }) {
  const p = isoPct(gx, gy);
  return `left:${p.left}%;top:${p.top}%;z-index:${Math.round(p.top * 10)}`;
}

const EMOTES = ["♪", "…", "💭", "✨", "♡"];

export function render(el, a) {
  app = a;
  const lv = catLevelInfo();
  const open = FLOORS.filter((f) => lv.level >= f.unlock).length;
  if (floor >= open) floor = 0;
  const homeIds = Object.keys(state.butlers).filter((id) => state.butlers[id].housed && state.butlers[id].status !== "working");
  const ids = homeIds.filter((id) => floorOf(homeIds, id, open) === floor);
  for (const id of Object.keys(pos)) if (!ids.includes(id)) delete pos[id];
  const butlers = ids.map((id) => {
    const b = state.butlers[id];
    pos[id] ||= randomSpot();
    const f = Math.round(b.fatigue);
    const done = b.status === "done";
    return `<button class="butler actor ${done ? "done" : ""}" data-id="${id}" style="${placeStyle(pos[id])}" aria-label="${BUTLER_BY_ID[id].name}">
      <span class="actor-body">
        ${done ? `<span class="envelope" aria-label="정산 대기">✉️</span>` : f >= CONFIG.fatigue.tiredAt ? `<span class="tired" aria-label="지침">💦</span>` : ""}
        <span class="emote"></span>
        ${butlerSVG(BUTLER_BY_ID[id])}
      </span>
      <span class="shadow"></span>
    </button>`;
  }).join("");

  // 수용 인원과 입주 대기 (집이 좁으면 도감에만 등록된 집사)
  const waiting = Object.keys(state.butlers).length - housedCount();
  const working = Object.values(state.butlers).filter((b) => b.status === "working").length;
  const doneIds = homeIds.filter((id) => state.butlers[id].status === "done");
  const rent = Math.floor(state.rent || 0);

  el.innerHTML = `
    <div class="home">
      <div class="home-head">
        <div class="cat-title"><b>${esc(state.cat.name)}</b><span>묘생 Lv.${lv.level} · ${CAT_LOOKS[lv.level] || ""}</span></div>
        <div class="chips">
          <span class="chip">🏠 ${housedCount()}/${lv.capacity}</span>
          ${waiting ? `<span class="chip warn">대기 ${waiting}</span>` : ""}
          ${working ? `<span class="chip">💼 출근 ${working}</span>` : ""}
        </div>
      </div>
      <div class="floors">
        ${FLOORS.map((f, i) => i < open
          ? `<button class="floor-btn ${i === floor ? "on" : ""}" data-floor="${i}">${f.icon} ${f.name}</button>`
          : `<span class="floor-btn locked">🔒 ${f.name} <small>Lv.${f.unlock}</small></span>`).join("")}
      </div>
      <div class="diorama ${timeOfDay()} f${floor} ${floorChanged ? "floor-in" : ""}">
        ${roomSVG(lv.level, timeOfDay(), floor)}
        <div class="actors">
          <button class="cat actor" data-act="cat" style="${placeStyle(CAT_SPOT)}" aria-label="${esc(state.cat.name)} 쓰다듬기">
            <span class="actor-body">${catStage(state.cat.type, lv.level)}</span><span class="shadow"></span>
          </button>
          ${butlers}
        </div>
        <i class="mote" style="left:48%;top:40%"></i><i class="mote" style="left:56%;top:52%;animation-delay:1.3s"></i><i class="mote" style="left:63%;top:44%;animation-delay:2.6s"></i>
      </div>
      <div class="roster">${rosterHTML()}</div>
      ${waiting && lv.next ? `<p class="hint">호감도 합계 ${lv.sum}/${lv.next.need} → 묘생 Lv.${lv.next.level}이 되면 ${lv.next.capacity}명까지 살 수 있어요</p>` : ""}
      ${!homeIds.length ? `<p class="hint">집에 있는 집사가 없어요. 동네에서 퇴근을 기다려 주세요</p>` : ""}
      <div class="home-actions">
        ${doneIds.length > 1 ? `<button class="btn primary" data-act="all">✉️ 모두 정산 (${doneIds.length})</button>` : ""}
        ${rent > 0 ? `<button class="btn rent" data-act="rent">💰 월세 봉투 🐟 ${rent}</button>` : ""}
      </div>
    </div>`;

  // 집사들이 방 안을 돌아다닌다
  clearInterval(wanderTimer);
  wanderTimer = setInterval(() => {
    if (!el.isConnected || !el.querySelector(".diorama")) return clearInterval(wanderTimer);
    const actors = [...el.querySelectorAll(".butler.actor:not(.walking)")];
    if (!actors.length) return;
    const btn = actors[Math.floor(Math.random() * actors.length)];
    if (Math.random() < 0.3) return emote(btn);
    walk(btn);
  }, 1400);

  el.onclick = (e) => {
    const btn = e.target.closest(".butler");
    if (btn) {
      if (state.butlers[btn.dataset.id].status === "done") return openSettle([btn.dataset.id]);
      const g = BUTLER_BY_ID[btn.dataset.id].grade;
      play(g === "legend" ? "legend" : g === "rare" ? "rare" : "pop");
      bounce(btn.querySelector(".actor-body"));
      return setTimeout(() => openButler(btn.dataset.id), 250);
    }
    const fb = e.target.closest("[data-floor]");
    if (fb) { floor = Number(fb.dataset.floor); floorChanged = true; play("tap"); render(el, app); floorChanged = false; return; }
    const ros = e.target.closest("[data-ros]");
    if (ros) {
      const st = state.butlers[ros.dataset.ros].status;
      if (st === "done") return openSettle([ros.dataset.ros]);
      if (st === "working") return toast("근무 중이에요. 동네에서 응원 갈 수 있어요");
      return openButler(ros.dataset.ros);
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "cat") return poke(e.target.closest(".cat").querySelector(".actor-body"));
    if (act === "all") openSettle(doneIds);
    if (act === "rent") { play("coin"); play("churu"); toast(`월세 🐟 ${collectRent()} 받았어요`); app.changed(); }
  };
}

// 아래 집사 상태 줄: 피로, 정산 대기, 근무 중 남은 시간
function rosterHTML() {
  const ids = Object.keys(state.butlers).filter((id) => state.butlers[id].housed);
  return ids.map((id) => {
    const b = state.butlers[id];
    const def = BUTLER_BY_ID[id];
    const f = Math.round(b.fatigue);
    const status = b.status === "done" ? `<em class="st done">✉️ 정산</em>`
      : b.status === "working" ? `<em class="st work">${CONFIG.workplaces[b.work.place].name} <span data-end="${b.work.end}">${fmtLeft(b.work.end - now())}</span></em>`
      : f >= CONFIG.fatigue.tiredAt ? `<em class="st tired">지침</em>` : `<em class="st">쉬는 중</em>`;
    return `<button class="ros is-${b.status}" data-ros="${id}">
      <span class="ros-face"><img src="assets/butlers/${id}.svg" alt=""></span>
      <span class="ros-body"><b>${def.name}</b>${status}<span class="fbar"><i style="width:${f}%;background:${fatigueColor(f)}"></i></span></span>
    </button>`;
  }).join("");
}

// 1초마다: 근무 남은 시간 갱신
export function refreshLive(el) {
  const t = now();
  el.querySelectorAll(".roster [data-end]").forEach((s) => (s.textContent = fmtLeft(Number(s.dataset.end) - t)));
}

// 한 집사를 새 자리로 걸어가게
function walk(btn) {
  const id = btn.dataset.id;
  const from = pos[id], to = randomSpot();
  const a = isoPct(from.gx, from.gy), b = isoPct(to.gx, to.gy);
  const dist = Math.hypot(b.left - a.left, b.top - a.top);
  const ms = Math.max(900, dist * 90);
  btn.classList.add("walking");
  btn.querySelector(".actor-body").classList.toggle("flip", b.left < a.left);
  btn.style.transition = `left ${ms}ms linear, top ${ms}ms linear`;
  pos[id] = to;
  btn.style.left = `${b.left}%`;
  btn.style.top = `${b.top}%`;
  btn.style.zIndex = Math.round(Math.max(a.top, b.top) * 10);
  setTimeout(() => { btn.classList.remove("walking"); btn.style.zIndex = Math.round(b.top * 10); }, ms);
}

// 머리 위에 작은 감정 표현
function emote(btn) {
  const b = state.butlers[btn.dataset.id];
  const e = btn.querySelector(".emote");
  if (!b || !e) return;
  e.textContent = b.fatigue >= CONFIG.fatigue.tiredAt ? "💤" : EMOTES[Math.floor(Math.random() * EMOTES.length)];
  e.classList.remove("show"); void e.offsetWidth; e.classList.add("show");
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
      <div class="settle-churu">🐟 +${r.churu}${r.bonus ? ` <small>(덤 +${r.bonus})</small>` : ""}</div>
      <blockquote class="journal">“${esc(r.journal)}”</blockquote>
      ${r.pickup ? `<div class="pickup"><b>🎁 ${esc(r.pickup)}</b>을(를) 주워 왔어요<br><small>${itemDesc(r.pickup, state.pickups[r.pickup] || 1)}${(state.pickups[r.pickup] || 1) > 1 ? ` (${Math.min(state.pickups[r.pickup], ITEM_MAX_LEVEL)}단계)` : ""}</small></div>` : ""}
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
        if (btn) { bounce(btn.querySelector(".actor-body")); heart(btn.querySelector(".actor-body")); }
      }
    });
}
