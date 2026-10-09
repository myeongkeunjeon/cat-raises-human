// 집 화면 2.5D 디오라마: 비스듬히 내려다본 방 단면 (아이소메트릭)
// 바닥은 N×N칸 (묘생 레벨이 오르면 넓어짐: config.catLevels.size). 6칸이 넘으면 화면에 맞게 축소.
// 화면 좌표 x = OX + (gx - gy)·A, y = OY + (gx + gy)·B − z·K
// 가구는 상점에서 산 꾸미기 아이템(src/data/deco.js)을 자리마다 그린다.
import { DECO_BY_ID } from "./data/deco.js";

export const VIEW = { w: 400, h: 340 };
const WALL = 112; // 벽 높이 (z 단위, K배로 그려짐)
let A = 30, B = 15, OX = 200, OY = 128, N = 6, K = 1;

// 바닥 크기 n칸에 맞춰 화면 배치를 정한다
export function setLayout(n) {
  N = n;
  K = Math.min(1, 6 / n);
  A = 30 * K;
  B = A / 2;
  const total = (WALL + 16) * K + N * 2 * B;
  OY = (VIEW.h - total) / 2 + WALL * K;
  return { N, K };
}

export function iso(gx, gy, z = 0) {
  return [OX + (gx - gy) * A, OY + (gx + gy) * B - z * K];
}
const pt = (gx, gy, z) => iso(gx, gy, z).map((v) => v.toFixed(1)).join(",");
const poly = (pts, fill, extra = "") => `<polygon points="${pts.map((p) => pt(...p)).join(" ")}" fill="${fill}" ${extra}/>`;
const circ = (gx, gy, z, r, fill, extra = "") => { const [x, y] = iso(gx, gy, z); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * K).toFixed(1)}" fill="${fill}" ${extra}/>`; };
const ell = (gx, gy, z, rx, ry, fill, extra = "") => { const [x, y] = iso(gx, gy, z); return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(rx * K).toFixed(1)}" ry="${(ry * K).toFixed(1)}" fill="${fill}" ${extra}/>`; };

// 화면 % 위치 (HTML 캐릭터 배치용)
export function isoPct(gx, gy) {
  const [x, y] = iso(gx, gy);
  return { left: (x / VIEW.w) * 100, top: (y / VIEW.h) * 100 };
}
export const scale = () => K;

// 캐릭터가 걸어 다닐 수 있는 범위와 고양이 자리 (가구는 벽 쪽이라 캐릭터 뒤)
export function walkZone() { return { min: 1.6, max: N - 0.5 }; }
export function catSpot() { return { gx: N - 1.2, gy: N - 1.2 }; }

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

// 층: 1층 거실은 처음부터, 2층·옥상은 레벨로 열림 (config.catLevels의 floor)
export const FLOORS = [
  { name: "1층 거실", icon: "🛋️", unlock: 1 },
  { name: "2층 침실", icon: "🛏️", unlock: 13 },
  { name: "옥상 정원", icon: "🌿", unlock: 15 },
];

// 벽지 무늬 (kind별). 왼쪽 벽·오른쪽 벽은 기울기만 다르다
function wallPattern(id, d, skew, side) {
  const [bg, fg] = side === "L" ? [d.c[0], d.c[1]] : [d.c[2], d.c[3]];
  const inner = {
    stripe: `<rect width="14" height="14" fill="${bg}"/><rect width="7" height="14" fill="${fg}"/>`,
    dots:   `<rect width="14" height="14" fill="${bg}"/><circle cx="4" cy="4" r="2" fill="${fg}"/><circle cx="11" cy="11" r="2" fill="${fg}"/>`,
    waves:  `<rect width="14" height="14" fill="${bg}"/><path d="M0 7 Q3.5 3 7 7 T14 7" stroke="${fg}" stroke-width="1.6" fill="none"/>`,
    check:  `<rect width="14" height="14" fill="${bg}"/><rect width="7" height="7" fill="${fg}"/><rect x="7" y="7" width="7" height="7" fill="${fg}"/>`,
    stars:  `<rect width="14" height="14" fill="${bg}"/><circle cx="3" cy="4" r=".9" fill="${fg}"/><path d="M10 8 l1 2 l2 .3 l-1.5 1.4 l.4 2 l-1.9 -1 l-1.9 1 l.4 -2 l-1.5 -1.4 l2 -.3 z" fill="${fg}"/>`,
    hearts: `<rect width="14" height="14" fill="${bg}"/><path d="M7 11 C2 7.5 3.5 4 7 6 C10.5 4 12 7.5 7 11 Z" fill="${fg}" opacity=".7"/>`,
  }[d.kind];
  return `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="skewY(${skew}) scale(${K})">${inner}</pattern>`;
}

// 층마다 놓을 수 있는 자리 (2층은 침대·책상이 붙박이, 옥상은 벽이 없음)
export const FLOOR_SLOTS = [
  null, // 1층: 모든 자리
  ["wall", "floor", "curtain", "rug", "tower", "plant", "lamp", "shelf", "art", "tank", "lights", "ceiling"],
  ["rug", "bed", "tower", "plant", "lamp", "tank"],
];
export const slotAllowed = (slot, floor) => !FLOOR_SLOTS[floor] || FLOOR_SLOTS[floor].includes(slot);

// 장착된 아이템 꺼내기
const pick = (deco, slot) => DECO_BY_ID[deco?.[slot]] || null;

export function roomSVG(level, tod = timeOfDay(), floor = 0, deco = {}) {
  if (floor === 2) { setLayout(6); return rooftopSVG(level, tod, deco); }
  if (floor === 1) setLayout(6);
  const [s1, s2] = SKY[tod];
  const night = tod === "night";
  const wall = pick(deco, "wall") || DECO_BY_ID.wall_basic;
  const fl = pick(deco, "floor") || (floor === 1 ? DECO_BY_ID.floor_white : DECO_BY_ID.floor_wood);
  const wallD = pick(deco, "wall") || (floor === 1 ? { ...DECO_BY_ID.wall_sea, kind: "stripe", c: ["#d6e4f2", "#cbdcee", "#e2ecf7", "#d8e5f3"] } : wall);
  let s = `<svg viewBox="0 0 ${VIEW.w} ${VIEW.h}" class="room-svg" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8d8" stop-opacity=".55"/><stop offset="1" stop-color="#fff8d8" stop-opacity="0"/></linearGradient>
    <radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
    ${wallPattern("paperL", wallD, 26.6, "L")}${wallPattern("paperR", wallD, -26.6, "R")}
    <pattern id="wood" width="30" height="15" patternUnits="userSpaceOnUse" patternTransform="skewX(-63.4) scale(${K})"><rect width="30" height="15" fill="${fl.c[0]}"/><rect y="7" width="30" height="1.2" fill="${fl.c[1]}"/><rect y="14" width="30" height="1.2" fill="${fl.c[1]}"/></pattern>
  </defs>`;

  // 바닥판 두께 (디오라마 느낌)
  s += poly([[0, N, 0], [N, N, 0], [N, N, -16], [0, N, -16]], fl.c[2]);
  s += poly([[N, 0, 0], [N, N, 0], [N, N, -16], [N, 0, -16]], fl.c[3]);
  // 벽 두께 윗면
  s += poly([[-0.25, -0.25, WALL], [N, -0.25, WALL], [N, 0, WALL], [0, 0, WALL], [0, N, WALL], [-0.25, N, WALL]], "#fff3e6");
  s += poly([[-0.25, N, 0], [0, N, 0], [0, N, WALL], [-0.25, N, WALL]], "#e2c3a6");
  s += poly([[N, -0.25, 0], [N, 0, 0], [N, 0, WALL], [N, -0.25, WALL]], "#d8b597");
  // 벽 + 아래 판자
  s += poly([[0, N, 0], [0, 0, 0], [0, 0, WALL], [0, N, WALL]], "url(#paperL)");
  s += poly([[0, 0, 0], [N, 0, 0], [N, 0, WALL], [0, 0, WALL]], "url(#paperR)");
  s += poly([[0, N, 0], [0, 0, 0], [0, 0, 26], [0, N, 26]], "#e2cdb4");
  s += poly([[0, 0, 0], [N, 0, 0], [N, 0, 26], [0, 0, 26]], "#ecd9c2");
  s += poly([[0, N, 26], [0, 0, 26], [0, 0, 29], [0, N, 29]], "#c9ab88");
  s += poly([[0, 0, 26], [N, 0, 26], [N, 0, 29], [0, 0, 29]], "#d3b694");
  // 바닥
  s += floorSVG(fl);

  // 오른쪽 벽 창문 (가운데)
  const w0 = N / 2 - 1.15, w1 = N / 2 + 1.15;
  s += poly([[w0, 0, 46], [w1, 0, 46], [w1, 0, 98], [w0, 0, 98]], "#fff", 'stroke="#c49a74" stroke-width="3"');
  s += poly([[w0 + 0.15, 0, 50], [w1 - 0.15, 0, 50], [w1 - 0.15, 0, 94], [w0 + 0.15, 0, 94]], "url(#sky)");
  const sunG = w0 + 1.6;
  if (night) s += circ(sunG, 0, 84, 6, "#f4efe0") + [[w0 + 0.5, 88], [w0 + 1, 70], [w0 + 1.8, 62]].map(([g, z]) => circ(g, 0, z, 1.2, "#fff")).join("");
  else s += circ(sunG, 0, 82, 7, tod === "day" ? "#ffe27a" : "#ffb36b") + ell(w0 + 0.6, 0, 70, 12, 5, "#fff", 'opacity=".85"');
  s += poly([[N / 2 - 0.05, 0, 50], [N / 2 + 0.05, 0, 50], [N / 2 + 0.05, 0, 94], [N / 2 - 0.05, 0, 94]], "#c49a74");
  s += curtainSVG(pick(deco, "curtain") || (floor === 1 ? DECO_BY_ID.curt_sky : DECO_BY_ID.curt_pink), w0, w1);
  if (!night) s += poly([[w0 + 0.15, 0, 50], [w1 - 0.15, 0, 50], [w1 + 0.7, 2.6, 0], [w0 + 0.85, 2.6, 0]], "url(#beam)", 'class="beam"');

  if (floor === 1) return s + rugLayer(deco, 1) + bedroom(level, night, !!pick(deco, "art"), !!pick(deco, "rug")) + itemsSVG(deco, 1, night, tod, true) + (night ? NIGHT : "") + "</svg>";
  s += itemsSVG(deco, 0, night, tod);
  // 밥그릇
  s += box(N - 0.8, N / 2 - 0.3, 0.55, 0.4, 5, ["#4a90e2", "#3a78c2", "#2f68aa"]);
  s += ell(N - 0.53, N / 2 - 0.1, 5, 7, 3, "#c8643c");
  if (night) s += NIGHT;
  return s + "</svg>";
}

// 층마다 아이템 자리 (붙박이 가구를 피해서). x, y는 바닥 칸 좌표
let P = {};
function positions(floor) {
  if (floor === 1) return { // 2층 침실: 침대(왼쪽 벽), 옷장(오른쪽 뒤), 책상(왼쪽 앞), 빈백(오른쪽)
    plant: { x: 0.2, y: 0.2 }, tank: { x: 3.4, y: 0.2 }, lamp: { x: 2.2, y: 0.45 }, tower: { x: 5.0, y: 1.5 },
    rug: { a: 2.2, b: 4.8 }, bed: { x: 4.4, y: 4.4 }, cabinet: { x: 2.4, y: 0.15 },
  };
  if (floor === 2) return { // 옥상: 화단(왼쪽 뒤), 화분대(오른쪽 뒤), 파라솔(가운데)
    plant: { x: 0.3, y: 4.9 }, tank: { x: 2.4, y: 0.2 }, lamp: { x: 1.7, y: 0.4 }, tower: { x: 4.9, y: 2.6 },
    rug: { a: 1.6, b: 4.6 }, bed: { x: 0.2, y: 3.4 }, cabinet: { x: 2.4, y: 0.15 },
  };
  return { // 1층 거실 (방 크기 N에 맞춤)
    plant: { x: 0.2, y: 0.2 }, tank: { x: 0.2, y: 0.95 }, lamp: { x: 0.45, y: N - 3.0 }, tower: { x: N - 1.0, y: 1.5 },
    rug: { a: 1.4, b: N - 0.7 }, bed: { x: N - 1.55, y: 0.2 }, cabinet: { x: 0.3, y: 0.15 },
  };
}

// 러그만 먼저 (붙박이 가구 아래에 깔리게)
function rugLayer(deco, floor) {
  P = positions(floor);
  const d = slotAllowed("rug", floor) ? pick(deco, "rug") : null;
  return d ? rugSVG(d) : "";
}

// 꾸미기 아이템 (뒤쪽부터). floor에 놓을 수 있는 자리만
function itemsSVG(deco, floor, night, tod, skipRug = false) {
  let s = "";
  P = positions(floor);
  const it = (slot) => (slotAllowed(slot, floor) ? pick(deco, slot) : null);
  if (it("lights")) s += lightsSVG();
  if (it("shelf")) s += shelfSVG(it("shelf"));
  if (it("art")) s += artSVG(it("art"));
  if (it("cabinet")) s += cabinetSVG();
  if (it("rug") && !skipRug) s += rugSVG(it("rug"));
  if (floor === 0) s += bedSVG(it("bed") || DECO_BY_ID.bed_box);
  else if (it("bed")) s += bedSVG(it("bed"));
  if (it("plant")) s += plantSVG(it("plant"));
  if (it("tank")) s += tankSVG();
  if (it("sofa")) s += sofaSVG(it("sofa"));
  if (it("lamp")) s += lampSVG(it("lamp"), night || tod === "dusk");
  if (it("tower")) s += towerSVG(it("tower"));
  if (it("ceiling")) s += chandelierSVG();
  return s;
}

function floorSVG(fl, woodId = "wood") {
  if (fl.kind === "tile") {
    let s = "";
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) s += poly([[x, y, 0], [x + 1, y, 0], [x + 1, y + 1, 0], [x, y + 1, 0]], (x + y) % 2 ? fl.c[1] : fl.c[0]);
    return s;
  }
  let s = poly([[0, 0, 0], [N, 0, 0], [N, N, 0], [0, N, 0]], fl.kind === "plank" ? `url(#${woodId})` : fl.c[0]);
  if (fl.kind === "grass") for (let i = 0; i < N * 6; i++) s += circ(((i * 37) % (N * 10)) / 10 + 0.1, ((i * 53) % (N * 10)) / 10 + 0.1, 0, 1.6, i % 2 ? fl.c[1] : "#a6dc8f");
  if (fl.kind === "marble") for (let i = 0; i < N; i++) {
    const [x1, y1] = iso(i + 0.2, 0.3 + (i % 3), 0), [x2, y2] = iso(i + 0.9, 1.5 + (i % 3), 0);
    s += `<path d="M${x1} ${y1} Q${(x1 + x2) / 2 + 8} ${(y1 + y2) / 2} ${x2} ${y2}" stroke="${fl.c[1]}" stroke-width="1.2" fill="none"/>`;
  }
  return s;
}

function curtainSVG(d, w0, w1) {
  const [c1, c2] = d.c;
  let s = poly([[w0 - 0.3, 0, 40], [w0 + 0.15, 0, 46], [w0 + 0.15, 0, 102], [w0 - 0.3, 0, 104]], c1) +
    poly([[w1 - 0.15, 0, 46], [w1 + 0.3, 0, 40], [w1 + 0.3, 0, 104], [w1 - 0.15, 0, 102]], c1) +
    poly([[w0 - 0.4, 0, 104], [w1 + 0.4, 0, 104], [w1 + 0.4, 0, 108], [w0 - 0.4, 0, 108]], c2);
  if (d.kind === "lace") for (let i = 0; i < 6; i++) s += circ(w0 - 0.2 + (i % 2) * 0.2, 0, 50 + i * 9, 2, c2) + circ(w1 + (i % 2) * 0.2 - 0.1, 0, 50 + i * 9, 2, c2);
  if (d.kind === "star") for (let i = 0; i < 6; i++) s += circ(w0 - 0.1, 0, 52 + i * 9, 1.6, c2) + circ(w1 + 0.1, 0, 56 + i * 9, 1.6, c2);
  return s;
}

function rugSVG(d) {
  const { a, b } = P.rug, m = (a + b) / 2;
  if (d.kind === "rainbow") {
    return ["#ff6b6b", "#ffb34d", "#ffe27a", "#5cc48a", "#4aa3f0", "#b072e8"].map((c, i) => {
      const o = i * 0.18;
      return poly([[a + o, a + o, 0.5], [b - o, a + o, 0.5], [b - o, b - o, 0.5], [a + o, b - o, 0.5]], c);
    }).join("");
  }
  if (d.kind === "cloud") {
    let s = "";
    for (let i = 0; i < 7; i++) s += ell(a + 0.6 + (i % 4) * ((b - a - 1.2) / 3), a + 0.8 + Math.floor(i / 4) * ((b - a) / 2.2), 0.5, 26, 13, i % 2 ? d.c[0] : d.c[1]);
    return s;
  }
  if (d.kind === "cat") {
    const [cx, cy] = iso(m, m, 0.5);
    const r = (b - a) * 9 * K;
    return `<path d="M${cx - r * 0.9} ${cy - r * 0.15} L${cx - r * 0.75} ${cy - r * 0.75} L${cx - r * 0.35} ${cy - r * 0.42} Z M${cx + r * 0.9} ${cy - r * 0.15} L${cx + r * 0.75} ${cy - r * 0.75} L${cx + r * 0.35} ${cy - r * 0.42} Z" fill="${d.c[0]}"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.55}" fill="${d.c[0]}"/>
      <ellipse cx="${cx - r * 0.3}" cy="${cy - r * 0.05}" rx="${r * 0.07}" ry="${r * 0.05}" fill="${d.c[1]}"/><ellipse cx="${cx + r * 0.3}" cy="${cy - r * 0.05}" rx="${r * 0.07}" ry="${r * 0.05}" fill="${d.c[1]}"/>`;
  }
  return poly([[a, a, 0.5], [b, a, 0.5], [b, b, 0.5], [a, b, 0.5]], d.c[0], 'opacity=".9"') +
    poly([[a + 0.3, a + 0.3, 0.6], [b - 0.3, a + 0.3, 0.6], [b - 0.3, b - 0.3, 0.6], [a + 0.3, b - 0.3, 0.6]], "none", `stroke="${d.c[1]}" stroke-width="2" stroke-dasharray="4 4" opacity=".8"`);
}

function bedSVG(d) {
  const { x, y } = P.bed;
  if (d.kind === "cushion") return ell(x + 0.65, y + 0.55, 6, 26, 13, "#e7a7b4") + ell(x + 0.65, y + 0.55, 10, 18, 8, "#f6c6d0");
  if (d.kind === "tent") {
    return poly([[x, y + 1.1, 0], [x + 1.3, y + 1.1, 0], [x + 0.65, y + 1.1, 44]], "#f08a5b") +
      poly([[x + 1.3, y, 0], [x + 1.3, y + 1.1, 0], [x + 0.65, y + 1.1, 44], [x + 0.65, y, 44]], "#d9703f") +
      poly([[x + 0.45, y + 1.1, 0], [x + 0.85, y + 1.1, 0], [x + 0.65, y + 1.1, 24]], "#3b2a1e") +
      circ(x + 0.65, y + 0.55, 50, 3, "#ffd34d");
  }
  if (d.kind === "cake") {
    return box(x + 0.1, y + 0.1, 1.1, 0.9, 14, ["#fff7ea", "#f7c5cf", "#eab0bb"]) + box(x + 0.25, y + 0.25, 0.8, 0.6, 10, ["#fff", "#f59ab5", "#e07f9c"], 14) +
      circ(x + 0.65, y + 0.55, 30, 4, "#e05a4f") + [0.3, 0.6, 0.9].map((o) => circ(x + 0.1 + o, y + 1.0, 12, 2, "#f59ab5")).join("");
  }
  return box(x, y, 1.3, 1.1, 22, ["#e3b77d", "#c99a5c", "#b5864a"]) + poly([[x, y, 22], [x + 0.65, y, 30], [x + 0.65, y + 1.1, 30], [x, y + 1.1, 22]], "#efc78f");
}

function plantSVG(d) {
  const { x, y } = P.plant;
  let s = box(x, y, 0.7, 0.7, 18, ["#d0784e", "#b8643c", "#a2552f"]);
  const [px, py] = iso(x + 0.35, y + 0.35, 30);
  const k = K;
  if (d.kind === "cactus") return s + `<rect x="${px - 6 * k}" y="${py - 30 * k}" width="${12 * k}" height="${34 * k}" rx="${6 * k}" fill="#5cb87a"/><rect x="${px + 4 * k}" y="${py - 20 * k}" width="${8 * k}" height="${14 * k}" rx="${4 * k}" fill="#4fa86c"/><circle cx="${px}" cy="${py - 31 * k}" r="${3 * k}" fill="#f59ab5"/>`;
  if (d.kind === "sakura") return s + `<rect x="${px - 2 * k}" y="${py - 30 * k}" width="${4 * k}" height="${30 * k}" fill="#8a5a3a"/>` +
    [[-12, -40], [0, -48], [12, -40], [-6, -34], [8, -32]].map(([dx, dy]) => `<circle cx="${px + dx * k}" cy="${py + dy * k}" r="${11 * k}" fill="#f7b6c8"/>`).join("") + `<circle cx="${px + 4 * k}" cy="${py - 44 * k}" r="${5 * k}" fill="#fde3ea"/>`;
  if (d.kind === "monstera") return s + [[-14, -18, -30], [0, -30, 0], [14, -18, 30]].map(([dx, dy, r]) => `<ellipse cx="${px + dx * k}" cy="${py + dy * k}" rx="${12 * k}" ry="${8 * k}" transform="rotate(${r} ${px + dx * k} ${py + dy * k})" fill="#3f9a6b"/>`).join("");
  return s + `<circle cx="${px}" cy="${py}" r="${13 * k}" fill="#5cb87a"/><circle cx="${px - 9 * k}" cy="${py - 9 * k}" r="${9 * k}" fill="#6fcc8c"/><circle cx="${px + 8 * k}" cy="${py - 12 * k}" r="${9 * k}" fill="#4fa86c"/>`;
}

function shelfSVG(d) {
  const g0 = 0.9, g1 = 2.0;
  let s = poly([[0, g0, 70], [0, g1, 70], [0.35, g1, 70], [0.35, g0, 70]], "#c99a6a") + poly([[0, g0, 66], [0, g1, 66], [0, g1, 70], [0, g0, 70]], "#a87a4c");
  if (d.kind === "toys") return s + circ(0.15, g0 + 0.2, 76, 5, "#f0647d") + circ(0.15, g0 + 0.55, 75, 4, "#4aa3f0") + circ(0.15, g0 + 0.85, 76, 5, "#ffd34d") + `<path d="M${iso(0.15, g1 - 0.1, 70)[0]} ${iso(0.15, g1 - 0.1, 70)[1]} q4 -8 8 0" stroke="#f08a6c" stroke-width="2" fill="none"/>`;
  ["#e05a4f", "#4a90e2", "#f5c63c", "#5cc48a"].forEach((c, i) => {
    s += poly([[0.05, g0 + 0.12 + i * 0.22, 70], [0.05, g0 + 0.29 + i * 0.22, 70], [0.05, g0 + 0.29 + i * 0.22, 84 + (i % 2) * 4], [0.05, g0 + 0.12 + i * 0.22, 84 + (i % 2) * 4]], c);
  });
  return s;
}

function artSVG(d) {
  const g0 = N - 2.1, g1 = N - 0.9;
  if (d.kind === "fish") {
    const [fx, fy] = iso(0, (g0 + g1) / 2, 84);
    return `<path d="M${fx - 22 * K} ${fy} Q${fx} ${fy - 14 * K} ${fx + 16 * K} ${fy} Q${fx} ${fy + 14 * K} ${fx - 22 * K} ${fy} Z" fill="#7fb2e6"/><path d="M${fx + 14 * K} ${fy} l${10 * K} ${-8 * K} l0 ${16 * K} z" fill="#5a92c2"/><circle cx="${fx - 12 * K}" cy="${fy - 2 * K}" r="${2 * K}" fill="#2b2420"/>`;
  }
  let s = poly([[0, g0, 74], [0, g1, 74], [0, g1, 100], [0, g0, 100]], "#fff", `stroke="${d.kind === "cat" ? "#d4a017" : "#c49a74"}" stroke-width="3"`);
  s += poly([[0, g0 + 0.15, 78], [0, g1 - 0.15, 78], [0, g1 - 0.15, 96], [0, g0 + 0.15, 96]], d.kind === "cat" ? "#3d4a80" : "#9fd3f2");
  const [fx, fy] = iso(0, (g0 + g1) / 2, 86);
  if (d.kind === "cat") s += `<path d="M${fx - 7 * K} ${fy + 6 * K} L${fx - 7 * K} ${fy - 6 * K} L${fx - 3 * K} ${fy - 2 * K} L${fx + 3 * K} ${fy - 2 * K} L${fx + 7 * K} ${fy - 6 * K} L${fx + 7 * K} ${fy + 6 * K} Z" fill="#f2a541"/>`;
  else s += `<path d="M${fx - 8 * K} ${fy + 6 * K} l${5 * K} ${-10 * K} l${4 * K} ${4 * K} l${6 * K} ${-8 * K} l${6 * K} ${14 * K} z" fill="#5cc48a"/>`;
  return s;
}

function sofaSVG(d) {
  const [t, l, r, pillow] = d.c, y0 = N - 2.6;
  return box(0.15, y0, 1.0, 2.1, 16, [t, l, r]) + box(0.15, y0, 0.35, 2.1, 34, [t, l, r]) +
    box(0.15, y0 - 0.15, 1.0, 0.3, 24, [t, l, r]) + box(0.15, y0 + 1.95, 1.0, 0.3, 24, [t, l, r]) +
    box(0.5, y0 + 0.5, 0.45, 0.45, 22, [pillow, pillow, pillow]);
}

function lampSVG(d, glow) {
  const [lx, ly] = iso(P.lamp.x, P.lamp.y, 0);
  let s = "";
  if (d.kind === "mushroom") s += `<rect x="${lx - 3 * K}" y="${ly - 26 * K}" width="${6 * K}" height="${26 * K}" fill="#fff3e0"/><path d="M${lx - 18 * K} ${ly - 24 * K} Q${lx} ${ly - 52 * K} ${lx + 18 * K} ${ly - 24 * K} Z" fill="#e05a4f"/><circle cx="${lx - 7 * K}" cy="${ly - 32 * K}" r="${3 * K}" fill="#fff"/><circle cx="${lx + 6 * K}" cy="${ly - 36 * K}" r="${2.5 * K}" fill="#fff"/>`;
  else if (d.kind === "moon") s += `<rect x="${lx - 1.5 * K}" y="${ly - 60 * K}" width="${3 * K}" height="${60 * K}" fill="#8d9399"/><circle cx="${lx}" cy="${ly - 70 * K}" r="${13 * K}" fill="#fff3b0"/><circle cx="${lx + 6 * K}" cy="${ly - 74 * K}" r="${11 * K}" fill="#3d4a80" opacity=".9"/>`;
  else s += `<rect x="${lx - 1.5 * K}" y="${ly - 70 * K}" width="${3 * K}" height="${70 * K}" fill="#5b4636"/><ellipse cx="${lx}" cy="${ly}" rx="${8 * K}" ry="${3 * K}" fill="#5b4636"/><path d="M${lx - 12 * K} ${ly - 70 * K} L${lx + 12 * K} ${ly - 70 * K} L${lx + 8 * K} ${ly - 88 * K} L${lx - 8 * K} ${ly - 88 * K} Z" fill="#fff3c4" stroke="#e0c070"/>`;
  if (glow) s += `<circle cx="${lx}" cy="${ly - 50 * K}" r="${70 * K}" fill="url(#lampGlow)"/>`;
  return s;
}

function towerSVG(d) {
  const { x, y } = P.tower;
  const [tx, ty] = iso(x + 0.45, y + 0.45, 12);
  if (d.kind === "tree") {
    return box(x, y, 0.9, 0.9, 10, ["#8a6c4c", "#7a5c3c", "#6a4c2c"]) + `<rect x="${tx - 5 * K}" y="${ty - 80 * K}" width="${10 * K}" height="${80 * K}" fill="#a87a4c"/>` +
      ell(x + 0.45, y + 0.45, 60, 30, 14, "#5cb87a") + ell(x + 0.45, y + 0.45, 92, 24, 11, "#6fcc8c");
  }
  if (d.kind === "rocket") {
    return `<path d="M${tx - 14 * K} ${ty} L${tx - 14 * K} ${ty - 70 * K} Q${tx} ${ty - 110 * K} ${tx + 14 * K} ${ty - 70 * K} L${tx + 14 * K} ${ty} Z" fill="#f4f1ec" stroke="#c9c2b6"/>
      <circle cx="${tx}" cy="${ty - 60 * K}" r="${7 * K}" fill="#4aa3f0" stroke="#3a78c2" stroke-width="2"/>
      <path d="M${tx - 14 * K} ${ty - 20 * K} l${-10 * K} ${20 * K} l${10 * K} 0 Z M${tx + 14 * K} ${ty - 20 * K} l${10 * K} ${20 * K} l${-10 * K} 0 Z" fill="#e05a4f"/>
      <path d="M${tx - 6 * K} ${ty} l${6 * K} ${12 * K} l${6 * K} ${-12 * K} z" fill="#ffb34d"/>`;
  }
  return box(x, y, 0.9, 0.9, 12, ["#c9b79c", "#b09c80", "#9c886c"]) + `<rect x="${tx - 3 * K}" y="${ty - 70 * K}" width="${6 * K}" height="${70 * K}" fill="#d9c7a8" stroke="#b09c80"/>` +
    box(x, y, 0.9, 0.9, 6, ["#e7a7b4", "#d48e9c", "#c27d8b"], 52) + box(x + 0.15, y + 0.15, 0.6, 0.6, 6, ["#e7a7b4", "#d48e9c", "#c27d8b"], 82);
}

function tankSVG() {
  const { x, y } = P.tank;
  let s = box(x, y, 0.6, 0.5, 20, ["#c99a6a", "#a87a4c", "#8f6038"]);
  s += box(x + 0.02, y + 0.02, 0.56, 0.46, 22, ["#bfe3f7cc", "#8cc4ee99", "#6fb0e699"], 20);
  return s + circ(x + 0.3, y + 0.35, 30, 3, "#f08a3c") + circ(x + 0.4, y + 0.2, 34, 2.4, "#f5c63c");
}

function lightsSVG() {
  let s = "";
  for (let i = 0; i <= N * 2; i++) {
    const g = i * 0.5;
    s += circ(g, 0, WALL - 8 - Math.sin((i / (N * 2)) * Math.PI) * 8, 2.6, ["#ffd34d", "#f0647d", "#7fd8c0"][i % 3], `class="twinkle" style="animation-delay:${(i % 4) * 0.3}s"`);
  }
  return s;
}

function chandelierSVG() {
  const [cx, cy] = iso(N / 2, N / 2, 150);
  return `<line x1="${cx}" y1="0" x2="${cx}" y2="${cy}" stroke="#b8860b" stroke-width="2"/>
    <path d="M${cx - 22 * K} ${cy} Q${cx} ${cy + 18 * K} ${cx + 22 * K} ${cy} Z" fill="#f2c335" stroke="#b8860b"/>
    ${[-16, -6, 6, 16].map((d) => `<circle cx="${cx + d * K}" cy="${cy + 6 * K}" r="${3 * K}" fill="#fff8d8" class="twinkle"/>`).join("")}`;
}

function cabinetSVG() {
  const { x, y } = P.cabinet;
  return box(x, y, 1.0, 0.6, 70, ["#a87a4c", "#8a5a3a", "#7a4c2c"]) + poly([[x + 0.1, y + 0.6, 10], [x + 0.9, y + 0.6, 10], [x + 0.9, y + 0.6, 64], [x + 0.1, y + 0.6, 64]], "#e6f3fbcc") +
    [[0.3, 20], [0.7, 20], [0.5, 44]].map(([o, z]) => circ(x + o, y + 0.6, z + 6, 5, "#f2c335") + circ(x + o, y + 0.6, z, 2.4, "#b8860b")).join("");
}

const NIGHT = `<rect width="${VIEW.w}" height="${VIEW.h}" fill="#1b2440" opacity=".22"/>`;

// 2층 침실 (Lv6~): 침대, 옷장, 책상, 빈백. Lv8에 별 조명
function bedroom(level, night, hasArt, hasRug) {
  let s = "";
  if (!hasRug) s += poly([[2.2, 2.2, 0.5], [4.8, 2.2, 0.5], [4.8, 4.8, 0.5], [2.2, 4.8, 0.5]], "#b8d8c8", 'opacity=".85"');
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
  if (level >= 14 && !hasArt) { // 벽 포스터 (벽 장식을 놓으면 대신 그것)
    s += poly([[0, 3.8, 60], [0, 4.9, 60], [0, 4.9, 96], [0, 3.8, 96]], "#7a4cc2");
    const [qx, qy] = iso(0, 4.35, 78);
    s += `<path d="M${qx} ${qy - 8} l3 6 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z" fill="#ffd34d"/>`;
  }
  if (level >= 15) { // 천장 별 조명
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
function rooftopSVG(level, tod, deco = {}) {
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
  s += rugLayer(deco, 2); // 러그는 화단·파라솔 아래
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
  if (level >= 15) {
    const [rx, ry] = iso(5.2, 1.6, 0);
    s += `<rect x="${rx - 1.5}" y="${ry - 90}" width="3" height="90" fill="#8d9399"/>` +
      ["#ff6b6b", "#ffb34d", "#ffe27a", "#5cc48a", "#4aa3f0", "#b072e8"].map((c, i) => `<rect x="${rx + 1.5}" y="${ry - 90 + i * 5}" width="34" height="5" fill="${c}"/>`).join("");
    const [cx, cy] = iso(4.9, 4.9, 0);
    s += `<rect x="${cx - 10}" y="${cy - 12}" width="20" height="12" fill="#b8860b"/><path d="M${cx - 12} ${cy - 34} L${cx + 12} ${cy - 34} Q${cx + 10} ${cy - 14} ${cx} ${cy - 14} Q${cx - 10} ${cy - 14} ${cx - 12} ${cy - 34} Z" fill="#f2c335"/>`;
  }
  s += itemsSVG(deco, 2, night, tod, true);
  if (night) s += `<rect width="${VIEW.w}" height="${VIEW.h}" fill="#1b2440" opacity=".18"/>`;
  return s + "</svg>";
}


// ---------- 상점 썸네일: 작은 방(3칸) 안에 그 아이템만 그린다 ----------
// 페이지에 썸네일이 여러 개라 무늬 id가 겹치지 않게 아이템 id를 붙인다
const THUMB_POS = {
  plant: { x: 1.15, y: 1.15 }, tank: { x: 1.2, y: 1.25 }, lamp: { x: 1.5, y: 1.5 }, tower: { x: 1.05, y: 1.05 },
  rug: { a: 0.35, b: 2.65 }, bed: { x: 0.85, y: 0.95 }, cabinet: { x: 1.0, y: 0.15 },
};
export function itemThumb(d) {
  setLayout(3);
  P = THUMB_POS;
  const u = d.id;
  const neutralWall = { kind: "stripe", c: ["#f6ebdd", "#f1e2cf", "#faf1e6", "#f5e8d8"] };
  const neutralFloor = { kind: "plank", c: ["#e8d2b6", "#d9bf9e", "#c9a983", "#b8956d"] };
  const wallD = d.slot === "wall" ? d : neutralWall;
  const fl = d.slot === "floor" ? d : neutralFloor;
  // 벽에 붙는 것은 방 전체, 바닥 가구는 가까이 확대
  const wide = ["wall", "floor", "curtain", "shelf", "art", "lights", "ceiling", "cabinet", "sofa"].includes(d.slot);
  const vb = wide ? "96 26 208 262" : d.slot === "rug" ? "106 120 188 150" : "128 96 144 176";
  let s = `<svg viewBox="${vb}" class="thumb-svg" aria-hidden="true"><defs>
    ${wallPattern(`pl_${u}`, wallD, 26.6, "L")}${wallPattern(`pr_${u}`, wallD, -26.6, "R")}
    <pattern id="wd_${u}" width="30" height="15" patternUnits="userSpaceOnUse" patternTransform="skewX(-63.4)"><rect width="30" height="15" fill="${fl.c[0]}"/><rect y="7" width="30" height="1.2" fill="${fl.c[1]}"/><rect y="14" width="30" height="1.2" fill="${fl.c[1]}"/></pattern>
    <linearGradient id="sky_${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ec4f0"/><stop offset="1" stop-color="#cdeafb"/></linearGradient>
  </defs>`;
  s += poly([[0, N, 0], [N, N, 0], [N, N, -16], [0, N, -16]], fl.c[2]);
  s += poly([[N, 0, 0], [N, N, 0], [N, N, -16], [N, 0, -16]], fl.c[3]);
  s += poly([[0, N, 0], [0, 0, 0], [0, 0, WALL], [0, N, WALL]], `url(#pl_${u})`);
  s += poly([[0, 0, 0], [N, 0, 0], [N, 0, WALL], [0, 0, WALL]], `url(#pr_${u})`);
  s += floorSVG(fl, `wd_${u}`);
  if (d.slot === "curtain") {
    const w0 = N / 2 - 1.0, w1 = N / 2 + 1.0;
    s += poly([[w0, 0, 46], [w1, 0, 46], [w1, 0, 98], [w0, 0, 98]], `url(#sky_${u})`, 'stroke="#c49a74" stroke-width="3"');
    s += curtainSVG(d, w0, w1);
  }
  const draw = {
    rug: () => rugSVG(d), bed: () => bedSVG(d), plant: () => plantSVG(d), shelf: () => shelfSVG(d), art: () => artSVG(d),
    sofa: () => sofaSVG(d), lamp: () => lampSVG(d, false), tower: () => towerSVG(d), tank: () => tankSVG(), lights: () => lightsSVG(),
    ceiling: () => chandelierSVG(), cabinet: () => cabinetSVG(),
  }[d.slot];
  if (draw) s += draw();
  return s + "</svg>";
}
