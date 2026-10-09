// 집 화면 2.5D 디오라마: 비스듬히 내려다본 방 단면 (아이소메트릭)
// 바닥은 6×6칸. 화면 좌표 x = OX + (gx - gy)·A, y = OY + (gx + gy)·B − z
// 묘생 레벨이 오를수록 가구가 늘어난다.

export const VIEW = { w: 400, h: 340 };
const A = 30, B = 15, OX = 200, OY = 128, N = 6, WALL = 112;

export function iso(gx, gy, z = 0) {
  return [OX + (gx - gy) * A, OY + (gx + gy) * B - z];
}
const pt = (gx, gy, z) => iso(gx, gy, z).map((v) => v.toFixed(1)).join(",");
const poly = (pts, fill, extra = "") => `<polygon points="${pts.map((p) => pt(...p)).join(" ")}" fill="${fill}" ${extra}/>`;

// 화면 % 위치 (HTML 캐릭터 배치용)
export function isoPct(gx, gy) {
  const [x, y] = iso(gx, gy);
  return { left: (x / VIEW.w) * 100, top: (y / VIEW.h) * 100 };
}

// 상자 하나 (윗면, 왼쪽 앞면, 오른쪽 앞면)
function box(gx, gy, w, d, h, [top, left, right], z0 = 0) {
  return poly([[gx, gy, z0 + h], [gx + w, gy, z0 + h], [gx + w, gy + d, z0 + h], [gx, gy + d, z0 + h]], top) +
    poly([[gx, gy + d, z0], [gx + w, gy + d, z0], [gx + w, gy + d, z0 + h], [gx, gy + d, z0 + h]], left) +
    poly([[gx + w, gy, z0], [gx + w, gy + d, z0], [gx + w, gy + d, z0 + h], [gx + w, gy, z0 + h]], right);
}

// 한국 시간 기준 시간대
export function timeOfDay() {
  const h = (new Date().getUTCHours() + 9) % 24;
  return h < 6 ? "night" : h < 9 ? "dawn" : h < 17 ? "day" : h < 20 ? "dusk" : "night";
}
const SKY = {
  day: ["#7ec4f0", "#cdeafb"], dawn: ["#f6b89a", "#fde9c9"], dusk: ["#ee8a6a", "#f7cfa0"], night: ["#1c2442", "#35406a"],
};

// 캐릭터가 걸어 다닐 수 있는 바닥 범위 (가구는 벽 쪽에 붙어 있어서 항상 캐릭터 뒤)
export const WALK = { min: 1.7, max: 5.4 };
export const CAT_SPOT = { gx: 4.7, gy: 4.7 }; // 고양이는 앞쪽 주인공 자리

// 층 정보: 레벨이 오르면 층이 열린다 (config.catLevels의 floor와 같은 순서)
export const FLOORS = [
  { name: "1층 거실", icon: "🛋️", unlock: 1 },
  { name: "2층 침실", icon: "🛏️", unlock: 6 },
  { name: "옥상 정원", icon: "🌿", unlock: 7 },
];
const PALETTES = [
  { l: ["#f3d9c4", "#efd0b8"], r: ["#f8e4d2", "#f4dcc6"], wood: ["#d9a877", "#c4915f"], base: ["#d9b493", "#e4c2a2"] },
  { l: ["#d6e4f2", "#cbdcee"], r: ["#e2ecf7", "#d8e5f3"], wood: ["#c9a07a", "#b38a64"], base: ["#a9bfd6", "#b7cbe0"] },
];

export function roomSVG(level, tod = timeOfDay(), floor = 0) {
  if (floor === 2) return rooftopSVG(level, tod);
  const P = PALETTES[floor] || PALETTES[0];
  const [s1, s2] = SKY[tod];
  const night = tod === "night";
  let s = `<svg viewBox="0 0 ${VIEW.w} ${VIEW.h}" class="room-svg" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8d8" stop-opacity=".55"/><stop offset="1" stop-color="#fff8d8" stop-opacity="0"/></linearGradient>
    <radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
    <pattern id="paperL" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="skewY(26.6)"><rect width="14" height="14" fill="${P.l[0]}"/><rect width="7" height="14" fill="${P.l[1]}"/></pattern>
    <pattern id="paperR" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="skewY(-26.6)"><rect width="14" height="14" fill="${P.r[0]}"/><rect width="7" height="14" fill="${P.r[1]}"/></pattern>
    <pattern id="wood" width="30" height="15" patternUnits="userSpaceOnUse" patternTransform="skewX(-63.4) scale(1 1)"><rect width="30" height="15" fill="${P.wood[0]}"/><rect y="7" width="30" height="1.2" fill="${P.wood[1]}"/><rect y="14" width="30" height="1.2" fill="${P.wood[1]}"/></pattern>
  </defs>`;

  // 바닥판 두께 (디오라마 느낌)
  s += poly([[0, N, 0], [N, N, 0], [N, N, -16], [0, N, -16]], "#a8754a");
  s += poly([[N, 0, 0], [N, N, 0], [N, N, -16], [N, 0, -16]], "#8f6038");
  // 벽 두께 윗면
  s += poly([[-0.25, -0.25, WALL], [N, -0.25, WALL], [N, 0, WALL], [0, 0, WALL], [0, N, WALL], [-0.25, N, WALL]], "#fff3e6");
  s += poly([[-0.25, N, 0], [0, N, 0], [0, N, WALL], [-0.25, N, WALL]], "#e2c3a6");
  s += poly([[N, -0.25, 0], [N, 0, 0], [N, 0, WALL], [N, -0.25, WALL]], "#d8b597");
  // 벽 (왼쪽·오른쪽) + 아래 판자
  s += poly([[0, N, 0], [0, 0, 0], [0, 0, WALL], [0, N, WALL]], "url(#paperL)");
  s += poly([[0, 0, 0], [N, 0, 0], [N, 0, WALL], [0, 0, WALL]], "url(#paperR)");
  s += poly([[0, N, 0], [0, 0, 0], [0, 0, 26], [0, N, 26]], P.base[0]);
  s += poly([[0, 0, 0], [N, 0, 0], [N, 0, 26], [0, 0, 26]], P.base[1]);
  s += poly([[0, N, 26], [0, 0, 26], [0, 0, 29], [0, N, 29]], "#c49a74");
  s += poly([[0, 0, 26], [N, 0, 26], [N, 0, 29], [0, 0, 29]], "#cfa680");
  // 바닥
  s += poly([[0, 0, 0], [N, 0, 0], [N, N, 0], [0, N, 0]], "url(#wood)");

  // 오른쪽 벽 창문 + 커튼
  s += poly([[1.6, 0, 46], [3.9, 0, 46], [3.9, 0, 98], [1.6, 0, 98]], "#fff", 'stroke="#c49a74" stroke-width="3"');
  s += poly([[1.75, 0, 50], [3.75, 0, 50], [3.75, 0, 94], [1.75, 0, 94]], "url(#sky)");
  if (night) s += `<circle cx="${iso(3.2, 0, 84)[0]}" cy="${iso(3.2, 0, 84)[1]}" r="6" fill="#f4efe0"/>` +
    [[2.1, 88], [2.6, 70], [3.4, 62]].map(([g, z]) => `<circle cx="${iso(g, 0, z)[0]}" cy="${iso(g, 0, z)[1]}" r="1.2" fill="#fff"/>`).join("");
  else s += `<circle cx="${iso(3.2, 0, 82)[0]}" cy="${iso(3.2, 0, 82)[1]}" r="7" fill="${tod === "day" ? "#ffe27a" : "#ffb36b"}"/>` +
    `<ellipse cx="${iso(2.2, 0, 70)[0]}" cy="${iso(2.2, 0, 70)[1]}" rx="12" ry="5" fill="#fff" opacity=".85"/>`;
  s += poly([[2.75, 0, 50], [2.85, 0, 50], [2.85, 0, 94], [2.75, 0, 94]], "#c49a74");
  s += poly([[1.3, 0, 40], [1.75, 0, 46], [1.75, 0, 102], [1.3, 0, 104]], "#e88a8a");
  s += poly([[3.75, 0, 46], [4.2, 0, 40], [4.2, 0, 104], [3.75, 0, 102]], "#e88a8a");
  s += poly([[1.2, 0, 104], [4.3, 0, 104], [4.3, 0, 108], [1.2, 0, 108]], "#b06a5a");
  // 창으로 들어오는 빛
  if (!night) s += poly([[1.75, 0, 50], [3.75, 0, 50], [4.6, 2.6, 0], [2.6, 2.6, 0]], "url(#beam)", 'class="beam"');

  if (floor === 1) return s + bedroom(level, night) + (night ? NIGHT : "") + "</svg>";

  // 레벨 1: 박스, 쿠션
  s += box(4.3, 0.2, 1.3, 1.1, 22, ["#e3b77d", "#c99a5c", "#b5864a"]);
  s += poly([[4.3, 0.2, 22], [4.95, 0.2, 30], [4.95, 1.3, 30], [4.3, 1.3, 22]], "#efc78f");
  // 레벨 2: 러그, 화분, 선반
  if (level >= 2) {
    s += poly([[2.0, 2.0, 0.5], [5.0, 2.0, 0.5], [5.0, 5.0, 0.5], [2.0, 5.0, 0.5]], "#e7a7b4", 'opacity=".85"');
    s += poly([[2.3, 2.3, 0.6], [4.7, 2.3, 0.6], [4.7, 4.7, 0.6], [2.3, 4.7, 0.6]], "none", 'stroke="#fff" stroke-width="2" stroke-dasharray="4 4" opacity=".8"');
    s += box(0.2, 0.2, 0.7, 0.7, 18, ["#d0784e", "#b8643c", "#a2552f"]);
    const [px, py] = iso(0.55, 0.55, 30);
    s += `<circle cx="${px}" cy="${py}" r="13" fill="#5cb87a"/><circle cx="${px - 9}" cy="${py - 9}" r="9" fill="#6fcc8c"/><circle cx="${px + 8}" cy="${py - 12}" r="9" fill="#4fa86c"/>`;
    s += poly([[0, 1.8, 70], [0, 3.6, 70], [0.35, 3.6, 70], [0.35, 1.8, 70]], "#c99a6a");
    s += poly([[0, 1.8, 66], [0, 3.6, 66], [0, 3.6, 70], [0, 1.8, 70]], "#a87a4c");
    ["#e05a4f", "#4a90e2", "#f5c63c", "#5cc48a"].forEach((c, i) => {
      s += poly([[0.05, 1.95 + i * 0.22, 70], [0.05, 2.12 + i * 0.22, 70], [0.05, 2.12 + i * 0.22, 84 + (i % 2) * 4], [0.05, 1.95 + i * 0.22, 84 + (i % 2) * 4]], c);
    });
  }
  // 레벨 3: 소파, 스탠드
  if (level >= 3) {
    s += box(0.15, 3.7, 1.0, 2.1, 16, ["#7fa6d6", "#6890c2", "#5a80b0"]);
    s += box(0.15, 3.7, 0.35, 2.1, 34, ["#8db3e0", "#6890c2", "#5a80b0"]);
    s += box(0.15, 3.55, 1.0, 0.3, 24, ["#8db3e0", "#6890c2", "#5a80b0"]);
    s += box(0.15, 5.65, 1.0, 0.3, 24, ["#8db3e0", "#6890c2", "#5a80b0"]);
    s += box(0.5, 4.2, 0.45, 0.45, 22, ["#f5c63c", "#e0ab22", "#c99515"]);
    const [lx, ly] = iso(0.4, 3.1, 0);
    s += `<rect x="${lx - 1.5}" y="${ly - 70}" width="3" height="70" fill="#5b4636"/><ellipse cx="${lx}" cy="${ly}" rx="8" ry="3" fill="#5b4636"/>
      <path d="M${lx - 12} ${ly - 70} L${lx + 12} ${ly - 70} L${lx + 8} ${ly - 88} L${lx - 8} ${ly - 88} Z" fill="#fff3c4" stroke="#e0c070"/>`;
    if (night || tod === "dusk") s += `<circle cx="${lx}" cy="${ly - 60}" r="70" fill="url(#lampGlow)"/>`;
  }
  // 레벨 4: 캣타워, 액자
  if (level >= 4) {
    s += box(5.0, 1.6, 0.9, 0.9, 12, ["#c9b79c", "#b09c80", "#9c886c"]);
    const [tx, ty] = iso(5.45, 2.05, 12);
    s += `<rect x="${tx - 3}" y="${ty - 70}" width="6" height="70" fill="#d9c7a8" stroke="#b09c80"/>`;
    s += box(5.0, 1.6, 0.9, 0.9, 6, ["#e7a7b4", "#d48e9c", "#c27d8b"], 52);
    s += box(5.15, 1.75, 0.6, 0.6, 6, ["#e7a7b4", "#d48e9c", "#c27d8b"], 82);
    s += poly([[0, 4.0, 74], [0, 5.2, 74], [0, 5.2, 98], [0, 4.0, 98]], "#fff", 'stroke="#d4a017" stroke-width="3"');
    s += poly([[0, 4.2, 78], [0, 5.0, 78], [0, 5.0, 94], [0, 4.2, 94]], "#9fd3f2");
    const [fx, fy] = iso(0, 4.6, 84);
    s += `<path d="M${fx - 6} ${fy + 4} l4 -8 l3 3 l5 -6 l5 9 z" fill="#5cc48a"/>`;
  }
  // 레벨 5: 상들리에, 꼬마전구
  if (level >= 5) {
    const [cx, cy] = iso(3, 3, 150);
    s += `<line x1="${cx}" y1="0" x2="${cx}" y2="${cy}" stroke="#b8860b" stroke-width="2"/>
      <path d="M${cx - 22} ${cy} Q${cx} ${cy + 18} ${cx + 22} ${cy} Z" fill="#f2c335" stroke="#b8860b"/>
      ${[-16, -6, 6, 16].map((d) => `<circle cx="${cx + d}" cy="${cy + 6}" r="3" fill="#fff8d8" class="twinkle"/>`).join("")}`;
    for (let i = 0; i <= 10; i++) {
      const g = 0.3 + i * 0.55;
      const [bx, by] = iso(g, 0, WALL - 8 - Math.sin((i / 10) * Math.PI) * 8);
      s += `<circle cx="${bx}" cy="${by}" r="2.6" fill="${["#ffd34d", "#f0647d", "#7fd8c0"][i % 3]}" class="twinkle" style="animation-delay:${(i % 4) * 0.3}s"/>`;
    }
  }
  // 밥그릇
  s += box(5.2, 3.3, 0.55, 0.4, 5, ["#4a90e2", "#3a78c2", "#2f68aa"]);
  const [bx, by] = iso(5.47, 3.5, 5);
  s += `<ellipse cx="${bx}" cy="${by}" rx="7" ry="3" fill="#c8643c"/>`;
  // 밤에는 방 전체를 조금 어둡게
  if (night) s += NIGHT;
  return s + "</svg>";
}

const NIGHT = `<rect width="${VIEW.w}" height="${VIEW.h}" fill="#1b2440" opacity=".22"/>`;

// 2층 침실 (Lv6~): 침대, 옷장, 책상, 빈백. Lv8에 별 조명
function bedroom(level, night) {
  let s = "";
  s += poly([[2.2, 2.2, 0.5], [4.8, 2.2, 0.5], [4.8, 4.8, 0.5], [2.2, 4.8, 0.5]], "#b8d8c8", 'opacity=".85"');
  // 침대 (왼쪽 벽)
  s += box(0.15, 1.2, 1.8, 2.4, 14, ["#c9a07a", "#b38a64", "#9c7552"]);
  s += box(0.2, 1.25, 1.7, 2.3, 10, ["#fdfaf4", "#e8e0d2", "#ddd3c2"], 14);
  s += box(0.25, 1.3, 1.6, 0.7, 6, ["#ffffff", "#ece6dc", "#e0d8cc"], 24);
  s += box(0.2, 2.1, 1.7, 1.45, 4, ["#f59ab5", "#e07f9c", "#cc6f8b"], 24);
  s += box(0.1, 1.15, 0.15, 2.5, 46, ["#b38a64", "#9c7552", "#8a6644"]);
  // 옷장 (오른쪽 벽)
  s += box(4.4, 0.15, 1.4, 0.8, 78, ["#e2c9a6", "#cbb08b", "#b89c78"]);
  const [kx, ky] = iso(5.1, 0.95, 40);
  s += `<circle cx="${kx - 4}" cy="${ky}" r="2" fill="#8a6644"/><circle cx="${kx + 4}" cy="${ky - 2}" r="2" fill="#8a6644"/>`;
  // 책상 + 노트북
  s += box(0.15, 4.2, 0.9, 1.4, 30, ["#c9a07a", "#b38a64", "#9c7552"]);
  s += box(0.35, 4.6, 0.5, 0.6, 3, ["#5a5f6a", "#3a3f4a", "#2b2f3a"], 30);
  s += poly([[0.35, 4.6, 33], [0.35, 5.2, 33], [0.35, 5.2, 50], [0.35, 4.6, 50]], "#3a3f4a");
  s += poly([[0.38, 4.65, 35], [0.38, 5.15, 35], [0.38, 5.15, 48], [0.38, 4.65, 48]], "#9fd3f2");
  // 빈백
  const [vx, vy] = iso(4.9, 3.6, 0);
  s += `<ellipse cx="${vx}" cy="${vy - 8}" rx="24" ry="16" fill="#f5b83d"/><ellipse cx="${vx - 4}" cy="${vy - 14}" rx="14" ry="7" fill="#f8cb66"/>`;
  if (level >= 7) { // 벽 포스터
    s += poly([[0, 3.8, 60], [0, 4.9, 60], [0, 4.9, 96], [0, 3.8, 96]], "#7a4cc2");
    const [qx, qy] = iso(0, 4.35, 78);
    s += `<path d="M${qx} ${qy - 8} l3 6 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z" fill="#ffd34d"/>`;
  }
  if (level >= 8) { // 천장 별 조명
    for (let i = 0; i < 9; i++) {
      const [x, y] = iso(0.6 + (i % 3) * 1.8, 0.6 + Math.floor(i / 3) * 1.8, 120);
      s += `<circle cx="${x}" cy="${y}" r="2.5" fill="#fff6b0" class="twinkle" style="animation-delay:${i * 0.2}s"/>`;
    }
  }
  if (night) {
    const [lx, ly] = iso(0.6, 4.9, 40);
    s += `<circle cx="${lx}" cy="${ly}" r="60" fill="url(#lampGlow)"/>`;
  }
  return s;
}

// 옥상 정원 (Lv7~): 벽 대신 하늘과 난간, 화단, 파라솔, 꼬마전구. Lv8에 트로피와 무지개 깃발
function rooftopSVG(level, tod) {
  const [s1, s2] = SKY[tod];
  const night = tod === "night";
  let s = `<svg viewBox="0 0 ${VIEW.w} ${VIEW.h}" class="room-svg" aria-hidden="true">
  <defs>
    <linearGradient id="skyTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>
    <pattern id="deck" width="20" height="10" patternUnits="userSpaceOnUse" patternTransform="skewX(-63.4)"><rect width="20" height="10" fill="#c99b6d"/><rect y="9" width="20" height="1" fill="#a87a4c"/></pattern>
  </defs>
  <rect width="${VIEW.w}" height="${VIEW.h}" rx="24" fill="url(#skyTop)" opacity=".9"/>`;
  if (night) s += [[60, 40], [120, 70], [300, 50], [340, 90], [210, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#fff" class="twinkle"/>`).join("") + `<circle cx="330" cy="40" r="12" fill="#f4efe0"/>`;
  else s += `<circle cx="330" cy="44" r="14" fill="${tod === "day" ? "#ffe27a" : "#ffb36b"}"/><ellipse cx="90" cy="60" rx="30" ry="10" fill="#fff" opacity=".8"/><ellipse cx="260" cy="90" rx="22" ry="7" fill="#fff" opacity=".7"/>`;
  s += poly([[0, N, 0], [N, N, 0], [N, N, -16], [0, N, -16]], "#a9a39a");
  s += poly([[N, 0, 0], [N, N, 0], [N, N, -16], [N, 0, -16]], "#8f897f");
  s += poly([[0, 0, 0], [N, 0, 0], [N, N, 0], [0, N, 0]], "url(#deck)");
  // 난간 (뒤쪽 두 변)
  for (let i = 0; i <= 12; i++) {
    const g = i * 0.5;
    const [ax, ay] = iso(0, g, 0), [bx, by] = iso(g, 0, 0);
    s += `<line x1="${ax}" y1="${ay}" x2="${ax}" y2="${ay - 26}" stroke="#fff" stroke-width="2"/><line x1="${bx}" y1="${by}" x2="${bx}" y2="${by - 26}" stroke="#fff" stroke-width="2"/>`;
  }
  s += poly([[0, N, 26], [0, 0, 26], [0, 0, 29], [0, N, 29]], "#fff");
  s += poly([[0, 0, 26], [N, 0, 26], [N, 0, 29], [0, 0, 29]], "#fff");
  // 화단
  s += box(0.15, 0.4, 0.8, 2.6, 16, ["#7a5238", "#6b4a33", "#5f3e29"]);
  for (let i = 0; i < 5; i++) {
    const [fx, fy] = iso(0.55, 0.7 + i * 0.5, 22);
    s += `<circle cx="${fx}" cy="${fy}" r="6" fill="#5cb87a"/><circle cx="${fx}" cy="${fy - 4}" r="3.5" fill="${["#f0647d", "#ffd34d", "#b072e8", "#4aa3f0", "#f08a6c"][i]}"/>`;
  }
  s += box(3.2, 0.15, 2.6, 0.7, 14, ["#7a5238", "#6b4a33", "#5f3e29"]);
  for (let i = 0; i < 5; i++) {
    const [fx, fy] = iso(3.5 + i * 0.5, 0.5, 20);
    s += `<path d="M${fx} ${fy} l-4 -14 l4 4 l4 -4 z" fill="#4fa86c"/>`;
  }
  // 파라솔 + 테이블
  const [tx, ty] = iso(2.4, 3.0, 0);
  s += `<ellipse cx="${tx}" cy="${ty}" rx="22" ry="10" fill="#0002"/><rect x="${tx - 2}" y="${ty - 78}" width="4" height="78" fill="#fff"/>
    <path d="M${tx - 46} ${ty - 70} Q${tx} ${ty - 104} ${tx + 46} ${ty - 70} Z" fill="#f0647d"/><path d="M${tx - 15} ${ty - 77} Q${tx} ${ty - 104} ${tx + 15} ${ty - 77} Z" fill="#fff"/>
    <ellipse cx="${tx}" cy="${ty - 26}" rx="20" ry="9" fill="#fff"/><rect x="${tx - 2}" y="${ty - 26}" width="4" height="26" fill="#ddd"/>`;
  // 꼬마전구
  for (let i = 0; i <= 12; i++) {
    const [lx, ly] = iso(i * 0.5, 0, 46 - Math.sin((i / 12) * Math.PI) * 10);
    s += `<circle cx="${lx}" cy="${ly}" r="2.6" fill="${["#ffd34d", "#f0647d", "#7fd8c0"][i % 3]}" class="twinkle" style="animation-delay:${(i % 4) * 0.3}s"/>`;
  }
  if (level >= 8) {
    const [rx, ry] = iso(5.2, 1.6, 0);
    s += `<rect x="${rx - 1.5}" y="${ry - 90}" width="3" height="90" fill="#8d9399"/>` +
      ["#ff6b6b", "#ffb34d", "#ffe27a", "#5cc48a", "#4aa3f0", "#b072e8"].map((c, i) => `<rect x="${rx + 1.5}" y="${ry - 90 + i * 5}" width="34" height="5" fill="${c}"/>`).join("");
    const [cx, cy] = iso(4.9, 4.9, 0);
    s += `<rect x="${cx - 10}" y="${cy - 12}" width="20" height="12" fill="#b8860b"/><path d="M${cx - 12} ${cy - 34} L${cx + 12} ${cy - 34} Q${cx + 10} ${cy - 14} ${cx} ${cy - 14} Q${cx - 10} ${cy - 14} ${cx - 12} ${cy - 34} Z" fill="#f2c335"/>`;
  }
  if (night) s += `<rect width="${VIEW.w}" height="${VIEW.h}" fill="#1b2440" opacity=".18"/>`;
  return s + "</svg>";
}
