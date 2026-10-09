// 캐릭터 그림: Claude 디자인 캔버스 「고양이가 인간을 키움 — 캐릭터 시안」에서 내보낸 SVG (/assets)

export const CAT_TYPES = {
  black:  { name: "까망" },
  cheese: { name: "치즈" },
  tuxedo: { name: "턱시도" },
  calico: { name: "삼색이" },
};

// 그릇에 담긴 액체 고양이
export function catSVG(type = "cheese") {
  const t = CAT_TYPES[type] ? type : "cheese";
  return `<img class="cat-svg" src="assets/cats/${t}.svg" alt="${CAT_TYPES[t].name}">`;
}

// 집사 (얼굴 없음, 레어·전설은 반짝이 포함). silhouette: 도감에서 못 만난 집사
export function butlerSVG(def, { silhouette = false } = {}) {
  return `<img class="butler-svg ${silhouette ? "silhouette" : ""}" src="assets/butlers/${def.id}.svg" alt="" draggable="false">`;
}
