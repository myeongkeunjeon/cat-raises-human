// 인력사무소(뽑기) — 뼈대: 화면, 버튼, 확률 보기, 천장 카운터
import { CONFIG } from "../config.js";
import { BUTLERS, GRADES } from "../data/butlers.js";
import { state } from "../state.js";
import { openSheet, toast } from "../ui.js";

const pct = (x) => `${(Math.round(x * 10000) / 100).toFixed(2)}%`;

export function render(el) {
  const g = CONFIG.gacha;
  el.innerHTML = `
    <h2 class="screen-title">인력사무소</h2>
    <button class="rates-btn" data-act="rates">확률 보기</button>
    <div class="office">
      <div class="office-sign">인 력 사 무 소</div>
      <div class="door"><div class="door-left"></div><div class="door-right"></div></div>
    </div>
    <p class="pity">전설까지 최대 ${g.legendPity - state.gacha.sinceLegend}회</p>
    <div class="row col">
      <button class="btn primary" data-act="pull">뽑기 (츄르 ${g.cost})</button>
      <button class="btn" data-act="free" ${state.freeTickets > 0 ? "" : "disabled"}>무료 이용권 사용 (${state.freeTickets}장)</button>
    </div>`;
  el.onclick = (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "rates") showRates();
    else if (act) toast("뽑기는 4단계에서 열려요");
  };
}

function showRates() {
  const rows = Object.entries(CONFIG.gacha.rates).map(([grade, rate]) => {
    const list = BUTLERS.filter((b) => b.grade === grade);
    const each = list.map((b) => `<tr class="sub"><td>${b.name}</td><td>${pct(rate / list.length)}</td></tr>`).join("");
    return `<tr><th>${GRADES[grade].name}</th><th>${pct(rate)}</th></tr>${each}`;
  }).join("");
  openSheet(`
    <h3>확률 보기</h3>
    <table class="rates">${rows}</table>
    <p class="note">같은 등급 안에서는 확률이 같아요. ${CONFIG.gacha.legendPity}회째까지 전설이 안 나오면 ${CONFIG.gacha.legendPity}회째에 반드시 전설이 나와요.</p>`);
}
