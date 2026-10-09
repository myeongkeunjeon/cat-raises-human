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

export function roomSVG(level, tod = timeOfDay()) {
  const [s1, s2] = SKY[tod];
  const night = tod === "night";
  let s = `<svg viewBox="0 0 ${VIEW.w} ${VIEW.h}" class="room-svg" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8d8" stop-opacity=".55"/><stop offset="1" stop-color="#fff8d8" stop-opacity="0"/></linearGradient>
    <radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
    <pattern id="paperL" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="skewY(26.6)"><rect width="14" height="14" fill="#f3d9c4"/><rect width="7" height="14" fill="#efd0b8"/></pattern>
    <pattern id="paperR" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="skewY(-26.6)"><rect width="14" height="14" fill="#f8e4d2"/><rect width="7" height="14" fill="#f4dcc6"/></pattern>
    <pattern id="wood" width="30" height="15" patternUnits="userSpaceOnUse" patternTransform="skewX(-63.4) scale(1 1)"><rect width="30" height="15" fill="#d9a877"/><rect y="7" width="30" height="1.2" fill="#c4915f"/><rect y="14" width="30" height="1.2" fill="#c4915f"/></pattern>
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
  s += poly([[0, N, 0], [0, 0, 0], [0, 0, 26], [0, N, 26]], "#d9b493");
  s += poly([[0, 0, 0], [N, 0, 0], [N, 0, 26], [0, 0, 26]], "#e4c2a2");
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
  if (night) s += `<rect width="${VIEW.w}" height="${VIEW.h}" fill="#1b2440" opacity=".22"/>`;
  return s + "</svg>";
}
