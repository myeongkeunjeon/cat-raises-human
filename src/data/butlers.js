// 집사 14종 정의 (SPEC.md 7장 표 8종 + v0.1 테스트 후 추가 6종: 일반 3, 레어 2, 전설 1)
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
  { id: "newbie",     name: "신입사원",     grade: "common", aptitude: "office",       color: "#7d8aa8", knots: "shoulder",
    ability: "근무 시간 −10% (의욕 충만)", smells: ["새 정장", "긴장한 땀", "편의점 김밥"], timeMult: 0.9 },
  { id: "trainer",    name: "헬스 트레이너", grade: "common", aptitude: "construction", color: "#e05a4f", knots: "waist",
    ability: "집에서 피로 회복 ×2", smells: ["프로틴", "고무 매트", "파스"], recoverMult: 2 },
  { id: "barista",    name: "카페 바리스타", grade: "common", aptitude: "store",        color: "#7a5238", knots: "legs",
    ability: "주운 물건 확률 ×2", smells: ["에스프레소", "우유 거품", "시나몬"], pickupMult: 2 },
  { id: "churuboss",  name: "츄르 공장장",   grade: "rare",   aptitude: null,           color: "#ffffff", knots: "back",
    ability: "전체 수입 +10%, 퇴근 시 20% 확률 츄르 +30, 호감 30에서 시작", smells: ["츄르"],
    startAffection: 30, incomeBonusAll: 0.1, bonusChuruChance: 0.2, bonusChuru: 30 },
  { id: "vet",        name: "수의사",       grade: "rare",   aptitude: null,           color: "#7fd8c0", knots: "back",
    ability: "꾹꾹이 받으면 다른 집사 피로 −10, 호감 획득 ×0.7", smells: ["소독약"],
    affectionMult: 0.7, shareFatigue: 10 },
  { id: "catcafe",    name: "고양이 카페 사장", grade: "rare", aptitude: null,         color: "#f5c63c", knots: "back",
    ability: "꾹꾹이 받으면 집에 있는 다른 집사 호감도 +1", smells: ["고양이 털", "라테", "간식 봉지"], shareAffection: 1 },
  { id: "webtoonist", name: "웹툰 작가",     grade: "rare",   aptitude: null,           color: "#8a87a8", knots: "shoulder",
    ability: "응원 가기 효과 ×2 (응원받으면 마감이 빨라짐)", smells: ["잉크", "에너지 드링크"], cheerMult: 2 },
  { id: "landlord",   name: "건물주",       grade: "legend", aptitude: null,           color: "#7b2342", knots: "back",
    ability: "출근 안 함, 시간당 츄르 40 적립(최대 320)", smells: ["새 가죽 소파"],
    noWork: true, rentPerHour: 40, rentMax: 320 },
  { id: "worldstar",  name: "월드스타",     grade: "legend", aptitude: null,           color: "#7a4cc2", knots: "back",
    ability: "어느 일터든 적성 +50%, 퇴근 시 20% 확률 팬레터(츄르 +50)", smells: ["향수", "무대 조명 열기"],
    allAptitude: true, bonusChuruChance: 0.2, bonusChuru: 50 },
];

export const BUTLER_BY_ID = Object.fromEntries(BUTLERS.map((b) => [b.id, b]));

// 꾹꾹이 테마: 집사마다 곡 제목·빠르기·멜로디·색이 다르다
// arp: 8분음표 멜로디(Hz), wave: 멜로디 음색, kick: 킥 세기, bg: 레인 배경, dense: 악보 밀도(전설일수록 빽빽)
const C4 = 261.6, D4 = 293.7, Eb4 = 311.1, E4 = 329.6, F4 = 349.2, G4 = 392, A4 = 440, Bb4 = 466.2, B4 = 493.9,
  C5 = 523.3, D5 = 587.3, Eb5 = 622.3, E5 = 659.3, F5 = 698.5, G5 = 784, A5 = 880, B5 = 987.8, C6 = 1046.5;
export const KNEAD_THEMES = {
  overtime:   { title: "야근 블루스",       bpm: 120, wave: "triangle", kick: 0.45, bg: "#1f2740", dense: 1,
                arp: [C5, Eb5, F5, G5, Bb4, C5, Eb5, F5, G4, Bb4, C5, Eb5, F5, Eb5, C5, Bb4] },
  clerk:      { title: "편의점 삑삑 송",    bpm: 132, wave: "square",   kick: 0.4,  bg: "#1d3a2b", dense: 1,
                arp: [E5, G5, C6, G5, D5, G5, B5, G5, C5, E5, A5, E5, D5, F5, A5, F5] },
  rookie:     { title: "현장 망치 비트",    bpm: 128, wave: "sawtooth", kick: 0.7,  bg: "#3a2a1a", dense: 1,
                arp: [G4, G4, D5, G4, A4, A4, E5, A4, C5, C5, G5, C5, D5, C5, A4, G4] },
  student:    { title: "새벽 세 시 로파이", bpm: 120, wave: "sine",     kick: 0.35, bg: "#2d2440", dense: 1,
                arp: [A4, C5, E5, G5, F4, A4, C5, E5, C4, E4, G4, B4, G4, B4, D5, F5] },
  freelancer: { title: "마감 직전 펑크",    bpm: 136, wave: "square",   kick: 0.5,  bg: "#3d2b26", dense: 1,
                arp: [D5, D5, F5, D5, G5, F5, D5, C5, D5, D5, A5, G5, F5, D5, C5, A4] },
  churuboss:  { title: "츄르 공장 행진곡",  bpm: 128, wave: "triangle", kick: 0.55, bg: "#24324a", dense: 1.15,
                arp: [C5, E5, G5, C6, G5, E5, C5, G4, F4, A4, C5, F5, G4, B4, D5, G5] },
  vet:        { title: "진료실 산책",       bpm: 124, wave: "sine",     kick: 0.4,  bg: "#1f3a36", dense: 1.15,
                arp: [E5, D5, C5, D5, E5, E5, E5, G4, D5, D5, D5, G4, E5, G5, G5, C5] },
  newbie:     { title: "출근 첫날 행진",    bpm: 124, wave: "triangle", kick: 0.45, bg: "#28344f", dense: 1,
                arp: [C5, D5, E5, G5, E5, D5, C5, G4, A4, C5, E5, A5, G5, E5, D5, C5] },
  trainer:    { title: "하나 둘 셋 넷 비트", bpm: 132, wave: "sawtooth", kick: 0.7,  bg: "#3d1f22", dense: 1,
                arp: [A4, A4, C5, A4, D5, A4, E5, A4, G4, G4, B4, G4, C5, G4, D5, G4] },
  barista:    { title: "라테 아트 보사노바", bpm: 120, wave: "sine",     kick: 0.35, bg: "#2e2119", dense: 1,
                arp: [E5, G5, B5, A5, G5, E5, D5, B4, C5, E5, G5, F5, E5, C5, B4, G4] },
  catcafe:    { title: "골골송 카페",       bpm: 126, wave: "triangle", kick: 0.45, bg: "#3d3416", dense: 1.15,
                arp: [G5, E5, C5, E5, G5, A5, G5, E5, F5, D5, B4, D5, F5, G5, F5, D5] },
  webtoonist: { title: "마감 세 시간 전",   bpm: 134, wave: "square",   kick: 0.5,  bg: "#26243a", dense: 1.15,
                arp: [D5, F5, A5, F5, E5, G5, B5, G5, C5, E5, G5, E5, D5, F5, A5, C6] },
  landlord:   { title: "건물주 스윙",       bpm: 132, wave: "triangle", kick: 0.6,  bg: "#3a1622", dense: 1.3,
                arp: [G4, B4, D5, F5, E5, D5, B4, G4, A4, C5, E5, G5, F5, E5, C5, A4] },
  worldstar:  { title: "앙코르 스테이지",   bpm: 136, wave: "square",   kick: 0.65, bg: "#2a1640", dense: 1.3,
                arp: [C5, E5, G5, C6, B5, G5, E5, D5, A4, C5, E5, A5, G5, F5, E5, D5] },
};
