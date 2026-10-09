// 저장/불러오기, 시간 계산(오프라인 포함), 하루 경계
import { CONFIG } from "./config.js";
import { BUTLER_BY_ID } from "./data/butlers.js";
import { advanceWork } from "./work.js";

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
    freeTickets: CONFIG.gacha.freeTicketsPerDay,
    slots: Object.fromEntries(Object.keys(CONFIG.workplaces).map((k) => [k, CONFIG.slots.start])), // 일터별 자리 수
    rent: 0,         // 건물주 월세 적립
    gacha: { pulls: 0, freePulls: 0, sinceLegend: 0 },
    butlers: {},     // id → { affection, fatigue, status, housed, petsToday, work }
    pickups: [],     // 주운 물건 이름 목록
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

export function housedCount() {
  return ownedIds().filter((id) => state.butlers[id].housed).length;
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
  const room = housedCount() < catLevelInfo().capacity;
  state.butlers[id] = {
    affection: def.startAffection || 0,
    fatigue: 0,
    status: "home", // home | working | done
    housed: room,
    petsToday: 0,
    work: null,
  };
  return room ? "new" : "new-no-room";
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

// 수용 인원이 늘었으면 대기 중인 집사 자동 입주
function moveInWaiting() {
  const cap = catLevelInfo().capacity;
  for (const id of ownedIds()) {
    if (housedCount() >= cap) break;
    if (!state.butlers[id].housed) state.butlers[id].housed = true;
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
    events.push("집이 넓어졌다!");
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
