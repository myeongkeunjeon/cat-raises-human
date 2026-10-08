// 집사 8종 정의 (SPEC.md 7장 표)
// aptitude: 적성 일터 id (config.workplaces 키), null이면 어느 일터에서나 보너스 없음
// knots: 꾹꾹이 매듭 위치 (shoulder / waist / legs / back)
export const GRADES = {
  common: { name: "일반" },
  rare:   { name: "레어" },
  legend: { name: "전설" },
};

export const BUTLERS = [
  { id: "overtime",   name: "야근 회사원",   grade: "common", aptitude: "office",       color: "#2f3e74", knots: "shoulder",
    ability: "없음", smells: ["식은 아메리카노", "복사기 토너"] },
  { id: "clerk",      name: "편의점 알바생", grade: "common", aptitude: "store",        color: "#3aa35b", knots: "legs",
    ability: "없음", smells: ["삼각김밥", "전자레인지"] },
  { id: "rookie",     name: "현장 막내",     grade: "common", aptitude: "construction", color: "#f08a24", knots: "waist",
    ability: "피로 증가 ×0.7, 완벽 꾹꾹이 시 호감 +5 추가", smells: ["시멘트", "땀", "믹스커피"],
    fatigueMult: 0.7, perfectBonusAffection: 5 },
  { id: "student",    name: "휴학생",       grade: "common", aptitude: "store",        color: "#8a5cc7", knots: "legs",
    ability: "호감도 획득 ×1.5", smells: ["컵라면", "밤샘"], affectionMult: 1.5 },
  { id: "freelancer", name: "재택 프리랜서", grade: "common", aptitude: "office",       color: "#f4b183", knots: "shoulder",
    ability: "쓰다듬기 호감 ×2", smells: ["노트북 열기", "배달음식"], petMult: 2 },
  { id: "churuboss",  name: "츄르 공장장",   grade: "rare",   aptitude: null,           color: "#ffffff", knots: "back",
    ability: "전체 수입 +10%, 퇴근 시 20% 확률 츄르 +30, 호감 30에서 시작", smells: ["츄르"],
    startAffection: 30, incomeBonusAll: 0.1, bonusChuruChance: 0.2, bonusChuru: 30 },
  { id: "vet",        name: "수의사",       grade: "rare",   aptitude: null,           color: "#7fd8c0", knots: "back",
    ability: "꾹꾹이 받으면 다른 집사 피로 −10, 호감 획득 ×0.7", smells: ["소독약"],
    affectionMult: 0.7, shareFatigue: 10 },
  { id: "landlord",   name: "건물주",       grade: "legend", aptitude: null,           color: "#7b2342", knots: "back",
    ability: "출근 안 함, 시간당 츄르 40 적립(최대 320)", smells: ["새 가죽 소파"],
    noWork: true, rentPerHour: 40, rentMax: 320 },
];

export const BUTLER_BY_ID = Object.fromEntries(BUTLERS.map((b) => [b.id, b]));
