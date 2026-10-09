// 캐릭터 그림: Claude 디자인 캔버스 「고양이가 인간을 키움 — 캐릭터 시안」에서 내보낸 SVG (/assets)
// + 묘생 레벨 장식, 레어·전설 반짝이 (코드로 겹쳐 그림)

export const CAT_TYPES = {
  black:  { name: "까망",   tail: "#1f1d1d" },
  cheese: { name: "치즈",   tail: "#e8a15a" },
  tuxedo: { name: "턱시도", tail: "#2a2727" },
  calico: { name: "삼색이", tail: "#e39a52" },
};

// 묘생 레벨별 모습 (도감처럼 다음 단계가 기대되게)
export const CAT_LOOKS = {
  1: "평범한 그릇",
  2: "리본을 단 냥이",
  3: "도자기 그릇 + 리본",
  4: "방석 위의 왕관 냥이",
  5: "황금 그릇의 냥이 대왕",
  6: "망토 두른 냥이 대왕",
  7: "보석 왕관의 냥이 황제",
  8: "무지개 빛 전설의 냥이",
};

// 그릇에 담긴 액체 고양이 (고르기 화면 등 장식 없는 기본형)
export function catSVG(type = "cheese") {
  const t = CAT_TYPES[type] ? type : "cheese";
  return `<img class="cat-svg" src="assets/cats/${t}.svg" alt="${CAT_TYPES[t].name}" draggable="false">`;
}

const BOWLS = {
  // 도자기: 흰 바탕 + 파란 띠
  3: `<path d="M36 136 L184 136 Q184 196 110 196 Q36 196 36 136 Z" fill="#f4efe6"/>
      <path d="M44 156 L176 156 M50 172 L170 172" stroke="#7fa6d6" stroke-width="5" stroke-linecap="round"/>
      <circle cx="80" cy="164" r="3" fill="#7fa6d6"/><circle cx="110" cy="164" r="3" fill="#7fa6d6"/><circle cx="140" cy="164" r="3" fill="#7fa6d6"/>
      <rect x="30" y="130" width="160" height="12" rx="6" fill="#d9d1c3"/>`,
  // 황금
  5: `<path d="M36 136 L184 136 Q184 196 110 196 Q36 196 36 136 Z" fill="#e6b22a"/>
      <path d="M58 150 Q60 178 92 186" stroke="#fff3b0" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>
      <rect x="30" y="130" width="160" height="12" rx="6" fill="#c9951a"/>
      <circle cx="110" cy="166" r="9" fill="#d9534f" stroke="#fff3b0" stroke-width="2"/>`,
};
const RIBBON = `<path d="M62 70 L76 78 L64 88 Z M90 70 L76 78 L88 88 Z" fill="#f59ab5" stroke="#e0789a" stroke-width="2" stroke-linejoin="round"/><circle cx="76" cy="79" r="4.5" fill="#e0789a"/>`;
const CROWN = `<path d="M93 86 L95 66 L103 76 L110 60 L117 76 L125 66 L127 86 Z" fill="#f2c335" stroke="#b8860b" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="110" cy="78" r="3" fill="#d9534f"/><circle cx="99" cy="80" r="2" fill="#4a90e2"/><circle cx="121" cy="80" r="2" fill="#4a90e2"/>`;
const CAPE = `<path d="M40 96 Q20 150 34 196 L186 196 Q200 150 180 96 Q110 70 40 96 Z" fill="#c0392b"/><path d="M40 96 Q110 78 180 96 L176 106 Q110 88 44 106 Z" fill="#f4efe6"/>
  ${[60, 90, 120, 150].map((x) => `<circle cx="${x}" cy="${100 + (x % 3)}" r="2.5" fill="#2b2420"/>`).join("")}`;
const GEMS = `<circle cx="104" cy="70" r="3" fill="#7fd8c0"/><circle cx="116" cy="70" r="3" fill="#f59ab5"/><path d="M110 52 L113 58 L110 64 L107 58 Z" fill="#4a90e2"/>`;
const CUSHION = `<svg viewBox="0 0 220 220" class="cat-layer"><ellipse cx="110" cy="200" rx="100" ry="17" fill="#b85c6e"/><ellipse cx="110" cy="196" rx="92" ry="12" fill="#d47a8b"/>
  <circle cx="12" cy="204" r="5" fill="#f2c335"/><circle cx="208" cy="204" r="5" fill="#f2c335"/></svg>`;

// 집 화면의 고양이: 묘생 레벨에 따라 그릇·장식이 바뀐다
export function catStage(type, level) {
  const t = CAT_TYPES[type] ? type : "cheese";
  const bowl = level >= 5 ? BOWLS[5] : level >= 3 ? BOWLS[3] : "";
  const tail = bowl ? `<path d="M170 138 Q192 140 190 170" fill="none" stroke="${CAT_TYPES[t].tail}" stroke-width="12" stroke-linecap="round"/>` : "";
  const head = level >= 7 ? CROWN + GEMS : level >= 4 ? CROWN : level >= 2 ? RIBBON : "";
  return `<div class="cat-stage lv${level}">
    ${level >= 6 ? `<svg viewBox="0 0 220 220" class="cat-layer">${CAPE}</svg>` : ""}
    ${level >= 4 ? CUSHION : ""}
    <img class="cat-layer cat-body" src="assets/cats/${t}.svg" alt="${CAT_TYPES[t].name}" draggable="false">
    <svg viewBox="0 0 220 220" class="cat-layer">${bowl}${tail}${head}</svg>
    ${level >= 8 ? sparkles(10, "rainbow") : level >= 5 ? sparkles(6 + (level - 5) * 2, "gold") : ""}
  </div>`;
}

// 움직이는 반짝이 n개
function sparkles(n, color) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = (i * 37 + 11) % 90 + 3, y = (i * 53 + 7) % 80 + 2;
    s += `<i class="spark ${color}" style="left:${x}%;top:${y}%;animation-delay:${(i * 0.37) % 1.6}s"></i>`;
  }
  return s;
}

// 집사 (얼굴 없음). 레어는 파란, 전설은 금색 반짝이가 움직인다. silhouette: 도감에서 못 만난 집사
export function butlerSVG(def, { silhouette = false } = {}) {
  const fx = silhouette ? "" : def.grade === "legend" ? sparkles(7, "gold") : def.grade === "rare" ? sparkles(4, "blue") : "";
  return `<span class="bwrap ${silhouette ? "" : `g-${def.grade}`}"><img class="butler-svg ${silhouette ? "silhouette" : ""}" src="assets/butlers/${def.id}.svg" alt="" draggable="false">${fx}</span>`;
}
