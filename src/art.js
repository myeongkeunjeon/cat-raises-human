// 임시 도형 그림 (SPEC 9장). 캐릭터 시안 SVG가 들어오면 /assets로 교체한다.

export const CAT_TYPES = {
  black:   { name: "까망",   body: "#2b2b2b", dark: true },
  cheese:  { name: "치즈",   body: "#f2a541", dark: false, stripe: "#d9822b" },
  tuxedo:  { name: "턱시도", body: "#2b2b2b", dark: true, chest: "#ffffff" },
  calico:  { name: "삼색이", body: "#fbf7f0", dark: false, patches: ["#f2a541", "#2b2b2b"] },
};

function catEyes(dark) {
  // 어두운 고양이: 흰 링 눈 / 밝은 고양이: 속이 찬 갈색 눈 + 반짝임 + 볼터치
  if (dark) {
    return `<ellipse cx="44" cy="40" rx="5" ry="6.5" transform="rotate(-10 44 40)" fill="none" stroke="#fff" stroke-width="2.2"/>
            <ellipse cx="76" cy="41" rx="4.6" ry="6.2" transform="rotate(10 76 41)" fill="none" stroke="#fff" stroke-width="2"/>`;
  }
  return `<ellipse cx="44" cy="40" rx="4.6" ry="6" transform="rotate(-10 44 40)" fill="#5a3a22"/>
          <ellipse cx="76" cy="41" rx="4.3" ry="5.7" transform="rotate(10 76 41)" fill="#5a3a22"/>
          <circle cx="45.5" cy="37.5" r="1.4" fill="#fff"/><circle cx="77.3" cy="38.6" r="1.3" fill="#fff"/>
          <ellipse cx="36" cy="50" rx="5" ry="2.5" fill="#f6a5b0" opacity=".6"/>
          <ellipse cx="84" cy="51" rx="5" ry="2.5" fill="#f6a5b0" opacity=".6"/>`;
}

// 그릇에 담긴 액체 고양이: 둥근 사각형 + 귀 + 눈 두 개
export function catSVG(type = "cheese") {
  const c = CAT_TYPES[type] || CAT_TYPES.cheese;
  const stroke = c.dark ? "none" : "#00000022";
  let extra = "";
  if (c.stripe) extra += `<path d="M52 18 q8 6 16 0 M48 26 q12 6 24 0" stroke="${c.stripe}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (c.chest) extra += `<path d="M48 54 L60 72 L72 54 Z" fill="${c.chest}"/>`;
  if (c.patches) extra += `<circle cx="34" cy="26" r="10" fill="${c.patches[0]}"/><circle cx="86" cy="58" r="9" fill="${c.patches[1]}"/>`;
  return `<svg viewBox="0 0 120 110" class="cat-svg" aria-label="고양이">
    <path d="M28 22 L34 4 L46 16 Z M92 22 L86 4 L74 16 Z" fill="${c.body}" stroke="${stroke}"/>
    <rect x="18" y="12" width="84" height="74" rx="34" fill="${c.body}" stroke="${stroke}"/>
    ${extra}
    ${catEyes(c.dark)}
    <path d="M8 66 H112 Q108 106 60 106 Q12 106 8 66 Z" fill="#c9d6df" stroke="#9fb0bd" stroke-width="2"/>
  </svg>`;
}

// 집사: 원(머리) + 캡슐(몸). 얼굴은 그리지 않는다.
export function butlerSVG(def, { silhouette = false } = {}) {
  const body = silhouette ? "#b9b4ab" : def.color;
  const head = silhouette ? "#b9b4ab" : "#f1d2b6";
  const stroke = def.color === "#ffffff" && !silhouette ? "#8a8a8a" : "none";
  return `<svg viewBox="0 0 60 100" class="butler-svg" aria-hidden="true">
    <circle cx="30" cy="20" r="15" fill="${head}"/>
    <rect x="12" y="38" width="36" height="58" rx="18" fill="${body}" stroke="${stroke}" stroke-width="2"/>
  </svg>`;
}
