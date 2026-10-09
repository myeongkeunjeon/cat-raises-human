// 응원 가기 배경: 일터마다 옆에서 본 2D 장면 (360×560 기준, 아래 정렬로 화면에 꽉 차게)
const svg = (body) => `<svg class="backdrop" viewBox="0 0 360 560" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${body}</svg>`;

// 진열대 한 칸의 상품들
function goods(x, y, w, colors) {
  let s = "";
  for (let i = 0; i < Math.floor(w / 16); i++) {
    const h = 14 + ((i * 7) % 3) * 4;
    s += `<rect x="${x + 2 + i * 16}" y="${y - h}" width="12" height="${h}" rx="2" fill="${colors[i % colors.length]}"/>`;
  }
  return s;
}

const STORE = svg(`
  <rect width="360" height="560" fill="#eaf5ee"/>
  <rect y="0" width="360" height="40" fill="#3f9a6b"/><rect y="40" width="360" height="8" fill="#f28a3c"/>
  <text x="180" y="28" text-anchor="middle" font-size="18" font-weight="bold" fill="#fff">24시 편의점</text>
  <!-- 음료 냉장고 -->
  <rect x="120" y="70" width="120" height="200" rx="6" fill="#cfe6f3" stroke="#9fb7c4" stroke-width="4"/>
  <line x1="180" y1="70" x2="180" y2="270" stroke="#9fb7c4" stroke-width="3"/>
  ${[110, 160, 210].map((y) => `<line x1="124" y1="${y}" x2="236" y2="${y}" stroke="#9fb7c4" stroke-width="2"/>` + goods(126, y - 2, 50, ["#f0647d", "#4aa3f0", "#f5b83d"]) + goods(184, y - 2, 50, ["#5cc48a", "#f08a6c", "#8a5cc7"])).join("")}
  <!-- 양옆 진열대 -->
  ${[[8, "#c99b6d"], [262, "#c99b6d"]].map(([x, c]) => `<rect x="${x}" y="90" width="90" height="300" fill="${c}"/>` +
    [150, 210, 270, 330].map((y) => `<rect x="${x}" y="${y}" width="90" height="6" fill="#8a6c4c"/>` + goods(x + 2, y, 86, ["#f5c63c", "#f0647d", "#fff", "#5cc48a", "#4aa3f0"])).join("")).join("")}
  <!-- 계산대 -->
  <rect x="0" y="430" width="360" height="130" fill="#d9cdb8"/>
  <rect x="20" y="400" width="200" height="60" rx="6" fill="#4fb07f"/><rect x="20" y="394" width="200" height="12" rx="4" fill="#3f9a6b"/>
  <rect x="40" y="366" width="44" height="30" rx="4" fill="#8d9399"/><rect x="46" y="372" width="32" height="12" fill="#c9f0d8"/>
  <rect x="150" y="380" width="40" height="16" rx="3" fill="#f4f1ec" stroke="#c9c2b6"/>
`);

const OFFICE = svg(`
  <rect width="360" height="560" fill="#e7ecf4"/>
  <!-- 창밖 빌딩 (야근 하늘) -->
  <rect x="96" y="40" width="168" height="150" rx="6" fill="#2b3556" stroke="#a9b3c6" stroke-width="6"/>
  ${[[104, 110, 30], [138, 80, 34], [176, 120, 26], [206, 70, 30], [240, 100, 20]].map(([x, y, w]) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${190 - y}" fill="#3d4a70"/>` +
    [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${x + 5 + (i % 2) * 12}" y="${y + 8 + Math.floor(i / 2) * 18}" width="6" height="8" fill="${(x + i) % 3 ? "#ffe27a" : "#56648a"}"/>`).join("")).join("")}
  <line x1="180" y1="40" x2="180" y2="190" stroke="#a9b3c6" stroke-width="5"/>
  <!-- 벽시계 -->
  <circle cx="310" cy="70" r="24" fill="#fff" stroke="#3a3f4a" stroke-width="4"/>
  <line x1="310" y1="70" x2="310" y2="54" stroke="#3a3f4a" stroke-width="3"/><line x1="310" y1="70" x2="322" y2="74" stroke="#3a3f4a" stroke-width="3"/>
  <!-- 화이트보드 -->
  <rect x="14" y="60" width="66" height="80" rx="4" fill="#fff" stroke="#a9b3c6" stroke-width="4"/>
  <text x="47" y="96" text-anchor="middle" font-size="15" font-weight="bold" fill="#e05a4f">마감!!</text>
  <path d="M24 112 L70 112 M24 124 L60 124" stroke="#4a90e2" stroke-width="3"/>
  <!-- 바닥과 책상 -->
  <rect x="0" y="430" width="360" height="130" fill="#b9bfcb"/>
  ${[[0, 300], [230, 300]].map(([x, y]) => `<rect x="${x}" y="${y + 70}" width="130" height="12" rx="3" fill="#a88763"/>
    <rect x="${x + 10}" y="${y + 82}" width="8" height="60" fill="#8a6c4c"/><rect x="${x + 112}" y="${y + 82}" width="8" height="60" fill="#8a6c4c"/>
    <rect x="${x + 30}" y="${y + 18}" width="64" height="44" rx="4" fill="#3a3f4a"/><rect x="${x + 34}" y="${y + 22}" width="56" height="34" fill="#9fd3f2"/>
    <rect x="${x + 56}" y="${y + 62}" width="12" height="8" fill="#3a3f4a"/>
    <rect x="${x + 100}" y="${y + 52}" width="14" height="18" rx="2" fill="#f4f1ec" stroke="#c9c2b6"/>`).join("")}
  <!-- 화분 -->
  <rect x="160" y="400" width="40" height="34" rx="4" fill="#c8643c"/><ellipse cx="180" cy="390" rx="26" ry="20" fill="#5cc48a"/>
`);

const SITE = svg(`
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ecdf2"/><stop offset="1" stop-color="#f6ecd9"/></linearGradient></defs>
  <rect width="360" height="560" fill="url(#sky)"/>
  <!-- 크레인 -->
  <rect x="270" y="40" width="12" height="360" fill="#e0ab22"/>
  ${[60, 100, 140, 180, 220, 260, 300, 340].map((y) => `<path d="M270 ${y} L282 ${y + 40} M282 ${y} L270 ${y + 40}" stroke="#b8860b" stroke-width="2"/>`).join("")}
  <rect x="120" y="40" width="210" height="12" fill="#e0ab22"/><rect x="300" y="28" width="30" height="24" fill="#3a3f4a"/>
  <line x1="150" y1="52" x2="150" y2="130" stroke="#3a3f4a" stroke-width="2"/>
  <rect x="132" y="130" width="36" height="20" fill="#c8643c" stroke="#a24f2c"/>
  <!-- 비계 -->
  <g stroke="#7d8590" stroke-width="5">
    <line x1="20" y1="150" x2="20" y2="440"/><line x1="100" y1="150" x2="100" y2="440"/>
    <line x1="20" y1="220" x2="100" y2="220"/><line x1="20" y1="300" x2="100" y2="300"/><line x1="20" y1="380" x2="100" y2="380"/>
    <line x1="20" y1="220" x2="100" y2="300" stroke-width="3"/><line x1="100" y1="300" x2="20" y2="380" stroke-width="3"/>
  </g>
  <rect x="14" y="214" width="92" height="8" fill="#a88763"/><rect x="14" y="294" width="92" height="8" fill="#a88763"/>
  <!-- 땅, 벽돌, 콘 -->
  <rect x="0" y="430" width="360" height="130" fill="#d9b98a"/>
  <g fill="#c8643c" stroke="#a24f2c">
    <rect x="200" y="410" width="30" height="16"/><rect x="232" y="410" width="30" height="16"/><rect x="216" y="394" width="30" height="16"/>
  </g>
  ${[300, 336].map((x) => `<path d="M${x} 440 L${x + 10} 400 L${x + 20} 440 Z" fill="#f28a3c"/><rect x="${x + 4}" y="418" width="12" height="5" fill="#fff"/>`).join("")}
  <rect x="120" y="436" width="60" height="10" rx="4" fill="#f5c63c"/>
`);

export const BACKDROPS = { store: STORE, office: OFFICE, construction: SITE };
