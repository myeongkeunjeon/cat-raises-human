// 주운 물건: 일터에서 15% 확률로 주워 온다. 가지고 있으면 효과가 생기고, 같은 물건을 더 주우면 최대 3단계까지 세진다.
// effect.type
//   income      해당 일터 정산 츄르 +value%
//   fatigue     해당 일터 출근 피로 −value
//   time        해당 일터 근무 시간 −value%
//   lucky       정산 때 value% 확률로 츄르 +10
//   recover     집에서 쉬는 피로 회복 +value/시간
//   kneadWindow 꾹꾹이 판정 범위 +value초 (조금 더 너그러워짐)
//   cheerCut    응원 가기 최대 근무 단축 +value%p
//   cheerExtra  근무 한 번당 응원 가기 +value번 (단계와 상관없이 1번만)
export const ITEM_MAX_LEVEL = 3;

export const ITEMS = {
  "1+1 스티커":         { place: "store",        effect: { type: "income",  place: "store", value: 5 },        desc: "편의점 수입 +{v}%" },
  "도시락 뚜껑":        { place: "store",        effect: { type: "fatigue", place: "store", value: 2 },        desc: "편의점 출근 피로 −{v}" },
  "영수증 뭉치":        { place: "store",        effect: { type: "lucky", value: 5 },                          desc: "정산 때 {v}% 확률로 츄르 +10" },
  "유통기한 지난 쿠폰": { place: "store",        effect: { type: "kneadWindow", value: 0.01 },                 desc: "꾹꾹이 판정이 {v}초 너그러워짐" },
  "사원증 줄":          { place: "office",       effect: { type: "income",  place: "office", value: 5 },       desc: "회사 수입 +{v}%" },
  "회의실 리모컨 건전지": { place: "office",     effect: { type: "time",    place: "office", value: 5 },       desc: "회사 근무 시간 −{v}%" },
  "포스트잇 한 장":     { place: "office",       effect: { type: "cheerCut", value: 2 },                       desc: "응원 가기 근무 단축 +{v}%p" },
  "볼펜 뚜껑":          { place: "office",       effect: { type: "cheerExtra", value: 1, noStack: true },      desc: "근무 한 번당 응원 가기 +1번" },
  "작은 나사":          { place: "construction", effect: { type: "income",  place: "construction", value: 5 }, desc: "공사장 수입 +{v}%" },
  "안전모 스티커":      { place: "construction", effect: { type: "fatigue", place: "construction", value: 3 }, desc: "공사장 출근 피로 −{v}" },
  "믹스커피 봉지":      { place: "construction", effect: { type: "recover", value: 1 },                        desc: "집에서 피로 회복 +{v}/시간" },
  "줄자":               { place: "construction", effect: { type: "time",    place: "construction", value: 5 }, desc: "공사장 근무 시간 −{v}%" },
};

export function itemsAt(place) {
  return Object.keys(ITEMS).filter((name) => ITEMS[name].place === place);
}

// 지금 단계(1~3)에서의 효과 수치
export function itemValue(name, level) {
  const e = ITEMS[name].effect;
  const v = e.noStack ? e.value : e.value * Math.min(level, ITEM_MAX_LEVEL);
  return Math.round(v * 1000) / 1000;
}

export function itemDesc(name, level = 1) {
  return ITEMS[name].desc.replace("{v}", itemValue(name, level));
}
