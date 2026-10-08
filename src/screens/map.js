// 동네 지도: 일터 3곳 카드
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { toast } from "../ui.js";

function fmtMinutes(m) {
  return m >= 60 ? `${m / 60}시간` : `${m}분`;
}

export function render(el) {
  const working = Object.values(state.butlers).filter((b) => b.status === "working");
  const cards = Object.entries(CONFIG.workplaces).map(([key, w]) => {
    const used = working.filter((b) => b.work?.place === key).length;
    return `<button class="card place" data-place="${key}">
      <div class="place-name">${w.name}</div>
      <div class="place-info">
        <span>⏱ ${fmtMinutes(w.minutes)}</span>
        <span>🐟 약 ${w.churu}</span>
        <span>😩 피로 +${w.fatigue}</span>
      </div>
      <div class="place-slots">자리 ${used} / ${state.slots}</div>
    </button>`;
  }).join("");
  el.innerHTML = `<h2 class="screen-title">동네</h2><div class="places">${cards}</div>`;
  el.querySelectorAll(".place").forEach((c) => c.addEventListener("click", () => toast("출근 보내기는 2단계에서 열려요")));
}
