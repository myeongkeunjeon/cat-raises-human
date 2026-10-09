// 인력사무소 뽑기 (SPEC 2-3, 7장 gacha)
// 등급: common 85% / rare 13% / legend 2%, 등급 안에서는 균등. legendPity번째까지 전설이 없으면 그 번째에 전설 확정.
import { CONFIG } from "./config.js";
import { BUTLERS } from "./data/butlers.js";
import { state, addButler } from "./state.js";

export function canPull(free) {
  return free ? state.freeTickets > 0 : state.churu >= CONFIG.gacha.cost;
}

export function pullsToLegend() {
  return CONFIG.gacha.legendPity - state.gacha.sinceLegend;
}

function rollGrade() {
  const g = state.gacha;
  if (g.sinceLegend + 1 >= CONFIG.gacha.legendPity) return "legend"; // 천장
  const r = Math.random(), rates = CONFIG.gacha.rates;
  if (r < rates.legend) return "legend";
  if (r < rates.legend + rates.rare) return "rare";
  return "common";
}

// 뽑기 한 번. 반환: { id, grade, result: "new" | "new-no-room" | "duplicate", affection }
export function pull(free) {
  if (!canPull(free)) return null;
  if (free) state.freeTickets--;
  else state.churu -= CONFIG.gacha.cost;
  const grade = rollGrade();
  const list = BUTLERS.filter((b) => b.grade === grade);
  const id = list[Math.floor(Math.random() * list.length)].id;
  const g = state.gacha;
  g.pulls++;
  if (free) g.freePulls++;
  g.sinceLegend = grade === "legend" ? 0 : g.sinceLegend + 1;
  state.stats.gacha[free ? "free" : "paid"]++;
  const result = addButler(id);
  return { id, grade, result, affection: state.butlers[id].affection };
}
