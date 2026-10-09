// 모든 밸런스 숫자. SPEC.md 7장 / 엑셀 '설정값' 시트와 같은 값.
// 바꿀 때는 엑셀에서 먼저 확인하고 이 파일을 고친다.
// v0.1 이후 변경: 근무 시간 단축(접속 중에도 정산을 여러 번 보도록), 응원 가기 추가. 엑셀은 아직 옛 값.
export const CONFIG = {
  workplaces: {
    store:        { name: "편의점", minutes: 3,   churu: 12,  fatigue: 10 }, // 옛 값: 30분 / 30 / 15
    office:       { name: "회사",   minutes: 20,  churu: 50,  fatigue: 25 }, // 옛 값: 120분 / 100 / 30
    construction: { name: "공사장", minutes: 120, churu: 200, fatigue: 50 }, // 옛 값: 480분 / 300 / 60
  },
  slots: { start: 1, expand: [ { to: 2, cost: 800 }, { to: 3, cost: 2000 } ] },

  aptitudeBonus: 0.5,
  fatigue: { max: 100, tiredAt: 70, tiredPenalty: 0.3, refuseAt: 90, recoverPerHour: 10 },
  affection: { max: 100, stepSize: 20, incomeBonusPerStep: 0.05,
               petAmount: 2, petPerDay: 3, duplicate: 20 },

  // v0.1 이후 변경: 40초 왼발/오른발 → 20초 펌프·러브비트풍 리듬게임
  // 4방향 화살표가 비트에 맞춰 내려오고, 뒤로 갈수록 8분음표·동시누르기가 늘어난다
  kneading: {
    seconds: 20, bpm: 128,
    fallTime: 1.0,                                  // 화살표가 판정선까지 내려오는 시간(초)
    windows: { perfect: 0.05, great: 0.09, good: 0.14 }, // 판정 범위(±초)
    points:  { perfect: 1, great: 0.8, good: 0.5 },     // 정확도 계산용 점수 (놓침 0)
    results: [ // 정확도 높은 순으로 검사
      { id: "perfect", minAccuracy: 0.9, fatigue: -100, affection: 10, churu: 20 },
      { id: "good",    minAccuracy: 0.6, fatigue: -50,  affection: 5,  churu: 0 },
      { id: "okay",    minAccuracy: 0,   fatigue: -30,  affection: 2,  churu: 0 },
    ],
    sleepChance: 0.05,
  },

  gacha: {
    cost: 300,
    rates: { common: 0.85, rare: 0.13, legend: 0.02 }, // 등급 안에서는 균등
    legendPity: 50,
    freeTicketsPerDay: 1,
  },

  // 응원 가기: 근무 중인 집사에게 간식 배달 미니게임 → 근무 시간 단축 + 호감도
  // 응원 가기(집사 지키기): 일터의 스트레스 말풍선이 집사에게 날아온다. 고양이가 톡 쳐서 막고, 좋은 말은 통과시킨다.
  // 점점 빨리, 많이 날아온다. 막고 받은 비율만큼 근무 시간 단축 + 호감도. 근무 한 번에 perShift번.
  cheer: { perShift: 3, seconds: 10, spawnStart: 0.8, spawnEnd: 0.35, flightStart: 2.4, flightEnd: 1.2,
           goodChance: 0.25, maxTimeCut: 0.15, affection: 2 },

  startChuru: 100,
  dayResetHourKST: 5,
  pickupChance: 0.15,

  catLevels: [ // 호감도 합계 → 수용 인원
    { level: 1, need: 0,   capacity: 3 },
    { level: 2, need: 100, capacity: 4 },
    { level: 3, need: 250, capacity: 5 },
    { level: 4, need: 450, capacity: 6 },
    { level: 5, need: 700, capacity: 8 },
  ],
};
