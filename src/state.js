// 저장/불러오기, 시간 계산(오프라인 포함), 하루 경계
import { CONFIG } from "./config.js";
import { BUTLER_BY_ID } from "./data/butlers.js";
import { advanceWork } from "./work.js";
import { ITEMS, itemValue } from "./data/items.js";
import { DECO_BY_ID, STARTER } from "./data/deco.js";

const SAVE_KEY = "catRaisesHuman.save.v1";
const HOUR = 3600e3;
const DAY = 24 * HOUR;

export let state = null;

// 게임 시간. 디버그 빨리 감기는 debugOffsetMs로 더한다.
export function now() {
  return Date.now() + (state ? state.debugOffsetMs : 0);
}

// 한국 시간 새벽 N시 기준 '게임 날짜' 번호
export function dayKey(t) {
  return Math.floor((t + (9 - CONFIG.dayResetHourKST) * HOUR) / DAY);
}

// 통계용 한국 날짜 문자열 (YYYY-MM-DD, 새벽 5시 기준)
export function dayLabel(t) {
  return new Date(dayKey(t) * DAY).toISOString().slice(0, 10);
}

function freshState() {
  const t = Date.now();
  return {
    version: 1,
    createdAt: t,
    cat: { type: null, name: "냥이" }, // type이 비어 있으면 첫 실행 → 고양이 고르기
    churu: CONFIG.startChuru,
    coins: CONFIG.coins.start,                                    // 꾸미기 전용 재화
    deco: { owned: Object.values(STARTER), equipped: [{ ...STARTER }, {}, {}] }, // 꾸미기: 가진 것, 층별·자리별 장착
    freeTickets: CONFIG.gacha.freeTicketsPerDay,
    slots: Object.fromEntries(Object.keys(CONFIG.workplaces).map((k) => [k, CONFIG.slots.start])), // 일터별 자리 수
    rent: 0,         // 건물주 월세 적립
    gacha: { pulls: 0, freePulls: 0, sinceLegend: 0 },
    butlers: {},     // id → { affection, fatigue, status, housed, petsToday, work }
    pickups: {},     // 주운 물건 이름 → 개수 (효과는 data/items.js)
    recentJournals: {},
    dayKey: dayKey(t),
    lastTick: t,
    catLevel: 1,
    debugOffsetMs: 0,
    settings: { sound: true },
    stats: {
      firstRun: t,
      lastSeen: t,
      visitsByDay: {},
      playMinutesByDay: {},
      kneading: { count: 0, results: {}, accuracySum: 0 },
      gacha: { free: 0, paid: 0 },
      workByPlace: {},
      shareCount: 0,
    },
  };
}

// 저장본에 새 필드가 없어도 돌아가도록 기본값 위에 덮어쓴다
function merge(base, saved) {
  for (const k of Object.keys(saved)) {
    const v = saved[k];
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) {
      merge(base[k], v);
    } else {
      base[k] = v;
    }
  }
  return base;
}

export function load() {
  let saved = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (e) {
    console.warn("불러오기 실패, 새로 시작합니다", e);
  }
  state = saved && saved.version === 1 ? merge(freshState(), saved) : freshState();
  if (!Array.isArray(state.deco.equipped)) state.deco.equipped = [state.deco.equipped || { ...STARTER }, {}, {}]; // 옛 저장본: 1층만
  if (Array.isArray(state.pickups)) { // 옛 저장본: 이름 목록 → 개수
    const counts = {};
    for (const n of state.pickups) counts[n] = (counts[n] || 0) + 1;
    state.pickups = counts;
  }
  if (typeof state.slots === "number") { // v1 초기 저장본: 일터 공통 숫자 → 일터별
    const n = state.slots;
    state.slots = Object.fromEntries(Object.keys(CONFIG.workplaces).map((k) => [k, n]));
  }
  if (!saved) {
    // 튜토리얼(5단계)이 생기기 전까지 임시로 첫 집사를 준다
    addButler("overtime");
    state.butlers.overtime.fatigue = 60;
  }
  return state;
}

export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn("저장 실패 (게임은 계속됩니다)", e);
    return false;
  }
}

export function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ }
}

// ---------- 집사 ----------

export function ownedIds() {
  return Object.keys(state.butlers);
}

export function affectionStep(affection) {
  return Math.min(5, Math.floor(affection / CONFIG.affection.stepSize));
}

export function catLevelInfo() {
  const sum = ownedIds().reduce((s, id) => s + state.butlers[id].affection, 0);
  let info = CONFIG.catLevels[0];
  for (const lv of CONFIG.catLevels) if (sum >= lv.need) info = lv;
  const next = CONFIG.catLevels.find((lv) => lv.level === info.level + 1) || null;
  return { ...info, sum, next };
}

// ---------- 층과 수용 인원 ----------
export const floorOf = (id) => state.butlers[id].floor || 0;
export function floorOpen(f) {
  return catLevelInfo().level >= CONFIG.floors[f].unlock;
}
export function floorCap(f) {
  if (!floorOpen(f)) return 0;
  return f === 0 ? catLevelInfo().capacity : CONFIG.floors[f].capacity;
}
export function housedOn(f) {
  return ownedIds().filter((id) => state.butlers[id].housed && floorOf(id) === f).length;
}
export function housedCount() {
  return ownedIds().filter((id) => state.butlers[id].housed).length;
}
export function totalCapacity() {
  return CONFIG.floors.reduce((s, _, f) => s + floorCap(f), 0);
}
// 빈자리가 있는 첫 층 (없으면 -1)
function freeFloor() {
  return CONFIG.floors.findIndex((_, f) => housedOn(f) < floorCap(f));
}

// 새 집사 등록. 집이 꽉 찼으면 도감에만 등록(housed=false)
// 반환: "new" | "new-no-room" | "duplicate"
export function addButler(id) {
  const def = BUTLER_BY_ID[id];
  if (!def) return null;
  const b = state.butlers[id];
  if (b) {
    b.affection = Math.min(CONFIG.affection.max, b.affection + CONFIG.affection.duplicate);
    return "duplicate";
  }
  const f = freeFloor();
  const room = f >= 0;
  state.butlers[id] = {
    affection: def.startAffection || 0,
    fatigue: 0,
    status: "home", // home | working | done
    housed: room,
    floor: room ? f : 0, // 사는 층
    petsToday: 0,
    work: null,
  };
  return room ? "new" : "new-no-room";
}

// 주운 물건 효과 합계. place를 주면 그 일터에 걸린 효과만
export function itemBonus(type, place = null) {
  let sum = 0;
  for (const [name, n] of Object.entries(state.pickups || {})) {
    const item = ITEMS[name];
    if (!item || !n || item.effect.type !== type) continue;
    if (item.effect.place && item.effect.place !== place) continue;
    sum += itemValue(name, n);
  }
  return sum;
}

// 호감도 획득 (집사별 배율 적용). pet: 쓰다듬기
export function gainAffection(id, amount, { pet = false } = {}) {
  const def = BUTLER_BY_ID[id];
  const b = state.butlers[id];
  let n = amount * (def.affectionMult || 1) * (pet ? def.petMult || 1 : 1);
  n = Math.max(amount > 0 ? 1 : 0, Math.round(n));
  const before = b.affection;
  b.affection = Math.min(CONFIG.affection.max, b.affection + n);
  return b.affection - before;
}

// 쓰다듬기: 하루 3회
export function pet(id) {
  const b = state.butlers[id];
  if (b.petsToday >= CONFIG.affection.petPerDay) return null;
  b.petsToday++;
  return gainAffection(id, CONFIG.affection.petAmount, { pet: true });
}

// ---------- 입주 관리 (누가 집에 살지 고르기) ----------
// 근무 중이거나 정산 대기인 집사는 내보낼 수 없다
export function canMoveOut(id) {
  const b = state.butlers[id];
  return b.housed && b.status === "home";
}
export function moveOut(id) {
  if (!canMoveOut(id)) return false;
  state.butlers[id].housed = false;
  return true;
}
// f층에 들이기 (대기 중이거나 다른 층에 살던 집사)
export function moveIn(id, f) {
  const b = state.butlers[id];
  if (!b || housedOn(f) >= floorCap(f)) return false;
  if (b.housed && b.status !== "home") return false; // 근무 중·정산 대기는 옮길 수 없음
  b.housed = true;
  b.floor = f;
  return true;
}

// ---------- 꾸미기 ----------
// 아이템은 하나씩만 가진다. 놓는 층을 고르면 다른 층에서는 빠진다.
// state.deco.equipped = [1층 {자리: id}, 2층 {...}, 옥상 {...}]
export function decoFloorOf(id) {
  return state.deco.equipped.findIndex((m) => Object.values(m).includes(id));
}
export function buyDeco(id, f = 0) {
  const d = DECO_BY_ID[id];
  if (!d || state.deco.owned.includes(id) || state.coins < d.price || catLevelInfo().level < d.lv) return false;
  state.coins -= d.price;
  state.deco.owned.push(id);
  equipDeco(id, f);
  return true;
}
// f층에 놓기. f가 -1이면 빼기 (1층의 벽지·바닥·커튼·침대는 비울 수 없음)
export function equipDeco(id, f) {
  const d = DECO_BY_ID[id];
  if (!d || !state.deco.owned.includes(id)) return false;
  const cur = decoFloorOf(id);
  if (f < 0) {
    if (cur < 0 || (cur === 0 && STARTER[d.slot])) return false;
    delete state.deco.equipped[cur][d.slot];
    return true;
  }
  if (cur === 0 && STARTER[d.slot] && f !== 0) {
    state.deco.equipped[0][d.slot] = STARTER[d.slot]; // 1층 기본으로 되돌림
  } else if (cur >= 0) delete state.deco.equipped[cur][d.slot];
  state.deco.equipped[f][d.slot] = id;
  return true;
}

// 수용 인원이 늘었으면 대기 중인 집사 자동 입주
function moveInWaiting() {
  for (const id of ownedIds()) {
    const b = state.butlers[id];
    if (b.housed) continue;
    const f = freeFloor();
    if (f < 0) break;
    b.housed = true;
    b.floor = f;
  }
}

// ---------- 시간 진행 ----------

// 마지막 계산 이후 흐른 시간을 한꺼번에 반영. 알림 문구 목록을 돌려준다.
export function tick() {
  const events = [];
  const t = now();
  const dt = Math.max(0, t - state.lastTick); // 시계를 뒤로 돌리면 0으로 처리

  // 근무 종료 처리 + 집에 있는 집사 피로 자연 회복 + 월세
  advanceWork(state.lastTick + dt, state.lastTick, events);

  // 하루 경계 (한국 시간 새벽 5시)
  const dk = dayKey(t);
  if (dk > state.dayKey) {
    state.dayKey = dk;
    state.coins += CONFIG.coins.daily;
    events.push(`오늘의 코인 +${CONFIG.coins.daily}`);
    if (state.freeTickets < CONFIG.gacha.freeTicketsPerDay) {
      state.freeTickets = CONFIG.gacha.freeTicketsPerDay;
      events.push("새 하루! 무료 이용권이 생겼어요");
    }
    for (const id of ownedIds()) state.butlers[id].petsToday = 0;
  }

  // 묘생 레벨
  const lv = catLevelInfo().level;
  if (lv > state.catLevel) {
    state.catLevel = lv;
    moveInWaiting();
    const info = CONFIG.catLevels.find((l) => l.level === lv);
    events.push(info?.floor ? `${info.floor}이 열렸다!` : "집이 넓어졌다!");
  }

  state.lastTick = t;
  return events;
}

// ---------- 통계 ----------

export function recordVisit() {
  const s = state.stats;
  const d = dayLabel(Date.now());
  s.visitsByDay[d] = (s.visitsByDay[d] || 0) + 1;
  s.lastSeen = Date.now();
}

export function addPlaySeconds(sec) {
  const s = state.stats;
  const d = dayLabel(Date.now());
  s.playMinutesByDay[d] = Math.round(((s.playMinutesByDay[d] || 0) + sec / 60) * 100) / 100;
  s.lastSeen = Date.now();
}

export function statsText() {
  const s = state.stats;
  const k = s.kneading;
  const fmt = (t) => new Date(t).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const days = [...new Set([...Object.keys(s.visitsByDay), ...Object.keys(s.playMinutesByDay)])].sort();
  const lines = [
    `[고양이가 인간을 키움 테스트 통계]`,
    `첫 실행: ${fmt(s.firstRun)}`,
    `마지막 접속: ${fmt(s.lastSeen)}`,
    `날짜별 접속/플레이(분):`,
    ...days.map((d) => `  ${d}: ${s.visitsByDay[d] || 0}회 / ${Math.round(s.playMinutesByDay[d] || 0)}분`),
    `꾹꾹이: ${k.count}회 (${Object.entries(k.results).map(([r, n]) => `${r} ${n}`).join(", ") || "-"}), 평균 정확도 ${k.count ? Math.round((k.accuracySum / k.count) * 100) : 0}%`,
    `뽑기: 무료 ${s.gacha.free} / 유료 ${s.gacha.paid}, 보유 집사 ${ownedIds().length}명`,
    `출근: ${Object.entries(s.workByPlace).map(([p, n]) => `${CONFIG.workplaces[p]?.name || p} ${n}`).join(", ") || "-"}`,
    `자랑하기: ${s.shareCount}회`,
  ];
  return lines.join("\n");
}
