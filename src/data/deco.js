// 집 꾸미기 아이템 (상점에서 코인으로 산다). 자리(slot)마다 하나씩 놓을 수 있다.
// lv: 열리는 묘생 레벨, price: 코인, theme: 테마 (같은 테마로 모으면 방 분위기가 맞춰짐)
// 그리는 방법은 src/room.js의 각 자리 함수가 kind와 색(c)으로 정한다.

export const THEMES = {
  basic:   { name: "기본",     icon: "🏠" },
  sakura:  { name: "벚꽃",     icon: "🌸" },
  sea:     { name: "바다",     icon: "🐟" },
  forest:  { name: "숲 캠핑",  icon: "🌲" },
  night:   { name: "별밤",     icon: "🌙" },
  dessert: { name: "디저트",   icon: "🍰" },
};

export const SLOTS = {
  wall:    "벽지",
  floor:   "바닥",
  curtain: "커튼",
  rug:     "러그",
  sofa:    "소파",
  bed:     "냥이 침대",
  tower:   "캣타워",
  plant:   "식물",
  lamp:    "조명",
  shelf:   "선반",
  art:     "벽 장식",
  tank:    "어항",
  lights:  "꼬마전구",
  ceiling: "천장",
  cabinet: "장식장",
};

// 처음부터 가지고 있는 기본 아이템 (자리마다 하나)
export const STARTER = { wall: "wall_basic", floor: "floor_wood", curtain: "curt_pink", bed: "bed_box" };

export const DECO = [
  // 벽지: kind = stripe | dots | waves | check | stars | hearts
  { id: "wall_basic",   slot: "wall", name: "살구 줄무늬 벽지", theme: "basic",   lv: 1,  price: 0,   kind: "stripe", c: ["#f3d9c4", "#efd0b8", "#f8e4d2", "#f4dcc6"] },
  { id: "wall_sakura",  slot: "wall", name: "벚꽃 땡땡이 벽지", theme: "sakura",  lv: 2,  price: 120, kind: "dots",   c: ["#fde3ea", "#f7b6c8", "#fff0f4", "#f9c4d3"] },
  { id: "wall_sea",     slot: "wall", name: "바다 물결 벽지",   theme: "sea",     lv: 4,  price: 200, kind: "waves",  c: ["#d7eef8", "#9fd3ee", "#e6f5fb", "#b5ddf2"] },
  { id: "wall_forest",  slot: "wall", name: "숲속 체크 벽지",   theme: "forest",  lv: 6,  price: 320, kind: "check",  c: ["#e3efd9", "#c6dfb3", "#edf5e6", "#d3e7c4"] },
  { id: "wall_night",   slot: "wall", name: "별밤 벽지",       theme: "night",   lv: 8,  price: 480, kind: "stars",  c: ["#2f3a66", "#ffe27a", "#384678", "#fff3b0"] },
  { id: "wall_dessert", slot: "wall", name: "딸기우유 벽지",    theme: "dessert", lv: 10, price: 650, kind: "hearts", c: ["#fff1f1", "#f59ab5", "#fff7f7", "#f7aec2"] },
  // 바닥: kind = plank | tile | grass | marble
  { id: "floor_wood",   slot: "floor", name: "원목 마루",   theme: "basic",   lv: 1,  price: 0,   kind: "plank",  c: ["#d9a877", "#c4915f", "#a8754a", "#8f6038"] },
  { id: "floor_white",  slot: "floor", name: "하얀 마루",   theme: "sakura",  lv: 3,  price: 150, kind: "plank",  c: ["#f1e6d8", "#ddcdb8", "#c9b79c", "#b09c80"] },
  { id: "floor_tile",   slot: "floor", name: "체크 타일",   theme: "dessert", lv: 5,  price: 260, kind: "tile",   c: ["#fff7ee", "#f7c5cf", "#d9a8b2", "#c48f9a"] },
  { id: "floor_grass",  slot: "floor", name: "푹신 잔디",   theme: "forest",  lv: 7,  price: 400, kind: "grass",  c: ["#8fcf7a", "#7bbd66", "#6b8f4a", "#587a3a"] },
  { id: "floor_marble", slot: "floor", name: "대리석 바닥", theme: "night",   lv: 11, price: 800, kind: "marble", c: ["#f4f2f0", "#d6d2ce", "#a9a39a", "#8f897f"] },
  // 커튼
  { id: "curt_pink",    slot: "curtain", name: "분홍 커튼", theme: "basic",  lv: 1, price: 0,   kind: "plain", c: ["#e88a8a", "#b06a5a"] },
  { id: "curt_sky",     slot: "curtain", name: "하늘 커튼", theme: "sea",    lv: 3, price: 120, kind: "plain", c: ["#8cc4ee", "#5a92c2"] },
  { id: "curt_lace",    slot: "curtain", name: "레이스 커튼", theme: "sakura", lv: 6, price: 260, kind: "lace", c: ["#ffffff", "#e8d8c8"] },
  { id: "curt_star",    slot: "curtain", name: "별 커튼",   theme: "night",  lv: 8, price: 420, kind: "star",  c: ["#3d4a80", "#ffe27a"] },
  // 러그: kind = round | cat | cloud | rainbow
  { id: "rug_pink",     slot: "rug", name: "분홍 러그",       theme: "sakura", lv: 2,  price: 80,  kind: "round",   c: ["#e7a7b4", "#fff"] },
  { id: "rug_cat",      slot: "rug", name: "고양이 얼굴 러그", theme: "basic",  lv: 4,  price: 180, kind: "cat",     c: ["#f2a541", "#3b2a1e"] },
  { id: "rug_cloud",    slot: "rug", name: "구름 러그",       theme: "night",  lv: 8,  price: 420, kind: "cloud",   c: ["#ffffff", "#dde8f5"] },
  { id: "rug_rainbow",  slot: "rug", name: "무지개 러그",     theme: "dessert", lv: 12, price: 900, kind: "rainbow", c: [] },
  // 소파
  { id: "sofa_blue",    slot: "sofa", name: "파란 소파",     theme: "sea",     lv: 3,  price: 200, kind: "sofa", c: ["#8db3e0", "#6890c2", "#5a80b0", "#f5c63c"] },
  { id: "sofa_pink",    slot: "sofa", name: "벚꽃 소파",     theme: "sakura",  lv: 5,  price: 300, kind: "sofa", c: ["#f7b6c8", "#e08fa6", "#cc7d93", "#fff"] },
  { id: "sofa_green",   slot: "sofa", name: "초록 벨벳 소파", theme: "forest",  lv: 7,  price: 450, kind: "sofa", c: ["#7fb87a", "#649e60", "#558a52", "#f2c335"] },
  { id: "sofa_cream",   slot: "sofa", name: "생크림 소파",   theme: "dessert", lv: 10, price: 700, kind: "sofa", c: ["#fff7ea", "#efe0c8", "#e2cfb2", "#f0647d"] },
  // 냥이 침대: kind = box | cushion | tent | cake
  { id: "bed_box",      slot: "bed", name: "종이 상자",   theme: "basic",   lv: 1,  price: 0,   kind: "box" },
  { id: "bed_cushion",  slot: "bed", name: "방석 침대",   theme: "sakura",  lv: 2,  price: 100, kind: "cushion" },
  { id: "bed_tent",     slot: "bed", name: "캠핑 텐트",   theme: "forest",  lv: 6,  price: 350, kind: "tent" },
  { id: "bed_cake",     slot: "bed", name: "케이크 침대", theme: "dessert", lv: 10, price: 700, kind: "cake" },
  // 캣타워: kind = basic | tree | rocket
  { id: "tower_basic",  slot: "tower", name: "캣타워",       theme: "basic",  lv: 4,  price: 250,  kind: "basic" },
  { id: "tower_tree",   slot: "tower", name: "나무 캣타워",  theme: "forest", lv: 8,  price: 500,  kind: "tree" },
  { id: "tower_rocket", slot: "tower", name: "로켓 캣타워",  theme: "night",  lv: 12, price: 1000, kind: "rocket" },
  // 식물: kind = pot | cactus | sakura | monstera
  { id: "plant_pot",      slot: "plant", name: "동글 화분",  theme: "basic",  lv: 2, price: 90,  kind: "pot" },
  { id: "plant_cactus",   slot: "plant", name: "선인장",     theme: "basic",  lv: 3, price: 120, kind: "cactus" },
  { id: "plant_sakura",   slot: "plant", name: "벚꽃 나무",  theme: "sakura", lv: 5, price: 300, kind: "sakura" },
  { id: "plant_monstera", slot: "plant", name: "몬스테라",   theme: "forest", lv: 7, price: 380, kind: "monstera" },
  // 조명: kind = stand | mushroom | moon
  { id: "lamp_stand",    slot: "lamp", name: "스탠드",    theme: "basic",  lv: 3, price: 150, kind: "stand" },
  { id: "lamp_mushroom", slot: "lamp", name: "버섯 램프", theme: "forest", lv: 6, price: 300, kind: "mushroom" },
  { id: "lamp_moon",     slot: "lamp", name: "달 램프",   theme: "night",  lv: 9, price: 520, kind: "moon" },
  // 선반: kind = books | toys
  { id: "shelf_books",  slot: "shelf", name: "책 선반",      theme: "basic",   lv: 2, price: 100, kind: "books" },
  { id: "shelf_toys",   slot: "shelf", name: "장난감 선반",  theme: "dessert", lv: 6, price: 280, kind: "toys" },
  // 벽 장식: kind = landscape | cat | fish
  { id: "art_landscape", slot: "art", name: "풍경 액자",     theme: "basic", lv: 4, price: 160, kind: "landscape" },
  { id: "art_cat",       slot: "art", name: "냥이 초상화",   theme: "night", lv: 7, price: 400, kind: "cat" },
  { id: "art_fish",      slot: "art", name: "생선 깃발",     theme: "sea",   lv: 9, price: 500, kind: "fish" },
  // 특별
  { id: "tank_fish",       slot: "tank",    name: "금붕어 어항",   theme: "sea",     lv: 5,  price: 350,  kind: "tank" },
  { id: "lights_fairy",    slot: "lights",  name: "꼬마전구",      theme: "night",   lv: 8,  price: 450,  kind: "fairy" },
  { id: "ceil_chandelier", slot: "ceiling", name: "황금 샹들리에", theme: "dessert", lv: 12, price: 1100, kind: "chandelier" },
  { id: "cab_trophy",      slot: "cabinet", name: "트로피 장식장", theme: "basic",   lv: 14, price: 1500, kind: "trophy" },
];

export const DECO_BY_ID = Object.fromEntries(DECO.map((d) => [d.id, d]));
