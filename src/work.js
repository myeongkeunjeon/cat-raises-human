// 근무: 출근 → 시간 경과 → 퇴근(정산 대기) → 집에서 정산 (SPEC 3-1)
import { CONFIG } from "./config.js";
import { BUTLER_BY_ID } from "./data/butlers.js";
import { JOURNALS, DEFAULT_JOURNAL } from "./data/journals.js";
import { itemsAt } from "./data/items.js";
import { state, now, affectionStep, itemBonus } from "./state.js";

const HOUR = 3600e3;

export function slotsOf(place) {
  return state.slots[place] ?? CONFIG.slots.start;
}

export function workingAt(place) {
  return Object.keys(state.butlers).filter((id) => {
    const b = state.butlers[id];
    return b.status === "working" && b.work?.place === place;
  });
}

export function nextExpand(place) {
  return CONFIG.slots.expand.find((e) => e.to === slotsOf(place) + 1) || null;
}

export function expand(place) {
  const e = nextExpand(place);
  if (!e || state.churu < e.cost) return false;
  state.churu -= e.cost;
  state.slots[place] = e.to;
  return true;
}

// 출근 가능 여부: "ok" | "refuse"(피로 90+) | "busy" | "nowork"
export function canWork(id) {
  const b = state.butlers[id];
  if (BUTLER_BY_ID[id].noWork) return "nowork";
  if (!b.housed || b.status !== "home") return "busy";
  if (b.fatigue >= CONFIG.fatigue.refuseAt) return "refuse";
  return "ok";
}

// 정산 츄르 계산 (무작위 보너스 제외)
export function expectedChuru(id, place, tired) {
  const def = BUTLER_BY_ID[id];
  const b = state.butlers[id];
  let c = CONFIG.workplaces[place].churu;
  if (def.aptitude === place || def.allAptitude) c *= 1 + CONFIG.aptitudeBonus;
  c *= 1 + affectionStep(b.affection) * CONFIG.affection.incomeBonusPerStep;
  if (tired) c *= 1 - CONFIG.fatigue.tiredPenalty;
  if (state.butlers.churuboss?.housed) c *= 1 + BUTLER_BY_ID.churuboss.incomeBonusAll; // 집에 살 때만
  c *= 1 + itemBonus("income", place) / 100;
  return Math.floor(c);
}

// 출근 피로 (집사 배율, 주운 물건 반영)
export function workFatigue(id, place) {
  const f = CONFIG.workplaces[place].fatigue * (BUTLER_BY_ID[id].fatigueMult || 1) - itemBonus("fatigue", place);
  return Math.max(0, f);
}

// 근무 시간(분) (주운 물건 반영)
export function workMinutes(place) {
  return CONFIG.workplaces[place].minutes * (1 - itemBonus("time", place) / 100);
}

export function sendToWork(id, place, minutesOverride) {
  if (canWork(id) !== "ok" || workingAt(place).length >= slotsOf(place)) return false;
  const b = state.butlers[id];
  const w = CONFIG.workplaces[place];
  const t = now();
  const tired = b.fatigue >= CONFIG.fatigue.tiredAt; // 출근 시점 피로
  b.fatigue = Math.min(CONFIG.fatigue.max, b.fatigue + workFatigue(id, place));
  b.status = "working";
  b.work = { place, start: t, end: t + (minutesOverride ?? workMinutes(place) * (BUTLER_BY_ID[id].timeMult || 1)) * 60e3, tired };
  state.stats.workByPlace[place] = (state.stats.workByPlace[place] || 0) + 1;
  return true;
}

function pickJournal(id) {
  const list = JOURNALS[id] || [];
  if (!list.length) return DEFAULT_JOURNAL;
  const recent = state.recentJournals[id] || [];
  const pool = list.filter((j) => !recent.includes(j));
  const j = (pool.length ? pool : list)[Math.floor(Math.random() * (pool.length || list.length))];
  state.recentJournals[id] = [...recent, j].slice(-3);
  return j;
}

// 근무 끝 → 정산 대기. 결과는 이때 정해 둔다.
function finish(id) {
  const b = state.butlers[id];
  const def = BUTLER_BY_ID[id];
  const { place, tired } = b.work;
  let churu = expectedChuru(id, place, tired);
  let bonus = 0;
  if (def.bonusChuruChance && Math.random() < def.bonusChuruChance) bonus = def.bonusChuru;
  if (Math.random() * 100 < itemBonus("lucky")) bonus += 10;
  let pickup = null;
  if (Math.random() < CONFIG.pickupChance * (def.pickupMult || 1)) {
    const list = itemsAt(place);
    pickup = list[Math.floor(Math.random() * list.length)];
  }
  b.status = "done";
  b.result = { place, churu: churu + bonus, bonus, coins: Math.max(1, Math.floor((churu + bonus) * CONFIG.coins.settleRate)), journal: pickJournal(id), pickup };
}

// state.tick()에서 호출. 끝난 근무를 처리하고, 집에 있던 시간만큼 피로를 회복시킨다.
export function advanceWork(t, lastTick, events) {
  for (const id of Object.keys(state.butlers)) {
    const b = state.butlers[id];
    let homeMs = t - lastTick;
    if (b.status === "working") {
      if (t < b.work.end) continue;
      finish(id);
      events.push(`${BUTLER_BY_ID[id].name} 퇴근!`);
      homeMs = t - Math.max(b.work.end, lastTick);
    }
    if (b.housed && homeMs > 0) {
      const rate = (CONFIG.fatigue.recoverPerHour + itemBonus("recover")) * (BUTLER_BY_ID[id].recoverMult || 1);
      b.fatigue = Math.max(0, b.fatigue - rate * (homeMs / HOUR));
    }
  }
  // 건물주 월세 적립
  const lord = state.butlers.landlord;
  if (lord?.housed) {
    const d = BUTLER_BY_ID.landlord;
    state.rent = Math.min(d.rentMax, (state.rent || 0) + d.rentPerHour * ((t - lastTick) / HOUR));
  }
}

export function settle(id) {
  const b = state.butlers[id];
  if (b.status !== "done") return null;
  const r = b.result;
  state.churu += r.churu;
  state.coins += r.coins || 0;
  if (r.pickup) state.pickups[r.pickup] = (state.pickups[r.pickup] || 0) + 1;
  b.status = "home";
  b.work = null;
  b.result = null;
  return r;
}

export function collectRent() {
  const n = Math.floor(state.rent || 0);
  state.churu += n;
  state.rent -= n;
  return n;
}
