// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { MAN, TABLE_MIN, TABLE_MAX } from "./constants";
import { won } from "./utils";

export const PERSONAS = [
  { id: "park", name: "박 상무", emoji: "🧐", tag: "VIP · 뱅커 단골",
    desc: "50대 VIP 사업가. 뱅커에만 크게 베팅하며 커미션 계산에 매우 민감하다.",
    betSide: () => (Math.random() < 0.85 ? "banker" : "player"),
    betAmt: () => [300, 500, 1000][Math.floor(Math.random() * 3)] * MAN,
    openers: { win: ["커미션 떼고 정확히 계산한 거 맞소? 내가 직접 검산해 보겠소.", "흠, 지급이 좀 늦은 것 같은데. 다음엔 더 빠릿하게 합시다."], lose: ["허... 오늘 패가 영 별로군. 이 슈, 언제 바꾸는 거요?"], push: ["타이라... 내 원금은 그대로 있는 거 맞지요? 확인해 보시오."] } },
  { id: "wang", name: "왕웨이", emoji: "😄", tag: "중국 단골 · 타이 애호",
    desc: "중국에서 온 단골. 한국어가 서툴러 중국어를 섞어 쓴다. 타이 베팅을 좋아하고 미신을 중시한다.",
    betSide: () => (Math.random() < 0.4 ? "tie" : Math.random() < 0.5 ? "banker" : "player"),
    betAmt: () => [50, 100, 200][Math.floor(Math.random() * 3)] * MAN,
    openers: { win: ["哈哈, 太好了! 딜러 좋아요! 다음에도 이 자리 부탁해요~"], lose: ["哎呀... 运气不好... 딜러님, 카드 바꿔주세요, 네?"], push: ["타이? 我的钱... 내 돈 어떻게 돼요? 설명해 주세요."] } },
  { id: "mina", name: "미나", emoji: "🌸", tag: "첫 방문 · 신혼여행",
    desc: "신혼여행으로 제주에 온 20대 후반. 카지노가 처음이라 룰을 모르고 질문이 많다.",
    betSide: () => (Math.random() < 0.7 ? "player" : "banker"),
    betAmt: () => [20, 30, 50][Math.floor(Math.random() * 3)] * MAN,
    openers: { win: ["어머, 저 이긴 거예요?? 근데 왜 이만큼 주시는 거예요? 계산이 어떻게 되는 거예요?"], lose: ["아... 졌네요. 근데 뱅커가 이기면 수수료를 뗀다는 게 무슨 말이에요?"], push: ["비겼다는 건가요? 그럼 제 돈은 어떻게 되는 거예요?"] } },
  { id: "jung", name: "정 사장", emoji: "🍷", tag: "유쾌한 단골 · 한잔 걸침",
    desc: "와인을 몇 잔 걸친 유쾌한 60대 단골. 농담을 즐기고 따면 딜러에게 팁을 주려 한다.",
    betSide: () => (Math.random() < 0.5 ? "player" : "banker"),
    betAmt: () => [100, 300, 500][Math.floor(Math.random() * 3)] * MAN,
    openers: { win: ["하하! 역시 내 감이야! 자, 이건 딜러 양반 팁이야, 받아 둬!"], lose: ["에이~ 한 판 더 하면 되지! 그나저나 이 카드 좀 만져 봐도 되나? 기운 좀 받게! (카드에 손을 뻗는다)"], push: ["비겼구만! 딜러님이 다음 판 찍어 줘 봐요~"] } },
  { id: "tanaka", name: "다나카", emoji: "🤓", tag: "일본 · 출목표 분석가",
    desc: "정중한 60대 일본인. 한국어에 일본어가 섞인다. 출목표에 매 판을 기록하며 진행이 빠르면 곤란해한다.",
    betSide: () => (Math.random() < 0.5 ? "banker" : "player"),
    betAmt: () => [50, 100, 150][Math.floor(Math.random() * 3)] * MAN,
    openers: { win: ["오오, 얏타! 스미마셍, 방금 카드 순서를 한 번만 더 말씀해 주시겠습니까? 기록을 해야 해서…"], lose: ["소데스카… 제 출목표대로라면 반대였는데… 방금 세 번째 카드가 왜 나온 것인지 설명해 주실 수 있습니까?"], push: ["타이… 기록상 매우 중요한 순간입니다. 스미마셍, 잠시만…"] } },
  { id: "mike", name: "Mike", emoji: "🤠", tag: "미국 관광객 · 팁 후함",
    desc: "하와이안 셔츠의 30대 미국인. 영어 반 한국어 반, 목소리가 크다.",
    betSide: () => (Math.random() < 0.7 ? "player" : "banker"),
    betAmt: () => [50, 100, 300][Math.floor(Math.random() * 3)] * MAN,
    openers: { win: ["Yes!! That's what I'm talking about! 딜러, you're my lucky charm! This one's for you! (딜러 몫으로 칩을 밀어 준다)"], lose: ["Ah man... no way! One more time, OK? Next time big win, 맞죠?"], push: ["Tie?? What happens to my money? 설명 please!"] } },
  { id: "okja", name: "옥자 이모", emoji: "💄", tag: "단골 · 딜러 바라기",
    desc: "50대 단골 아주머니. 딜러가 마음에 들어 '복덩이'라 부르고 사적인 질문을 한다.",
    betSide: () => (Math.random() < 0.6 ? "player" : "banker"),
    betAmt: () => [50, 100, 200][Math.floor(Math.random() * 3)] * MAN,
    openers: { win: ["어머~ 우리 딜러님이 진짜 복덩이네! 이따 쉬는 시간에 이모가 커피 한잔 살게, 응? 몇 시에 끝나?"], lose: ["아유 속상해~ 그래도 딜러님 얼굴 보니까 잃어도 기분이 좋네~ 그나저나 애인은 있어?"], push: ["비겼네? 우리 인연인가 봐~ 호호."] } },
  { id: "kang", name: "강 실장", emoji: "😏", tag: "⚠ 선 넘는 손님",
    desc: "술기운 오른 40대 임원. 부적절한 사적 질문을 하고 지면 딜러 탓에 반말을 한다.",
    betSide: () => (Math.random() < 0.6 ? "banker" : "player"),
    betAmt: () => [100, 300, 500][Math.floor(Math.random() * 3)] * MAN,
    openers: { win: ["역시 운이 좀 따라 주네. 근데 딜러님 말이야~ 이런 데서 일하기 아까운 얼굴인데? 퇴근 몇 시야?"], lose: ["아 짜증나네 진짜. ...야, 너 카드 그렇게밖에 못 줘? 웃지 말고 똑바로 해 봐."], push: ["비긴 거야? 거 참... 딜러님이 한 잔 사야겠네, 어때?"] } },
  { id: "lyudmila", name: "류드밀라", emoji: "🧊", tag: "러시아 · 하이롤러",
    desc: "말이 거의 없는 40대 러시아인 하이롤러. 무표정하게 큰 금액을 베팅한다.",
    betSide: () => (Math.random() < 0.7 ? "banker" : "player"),
    betAmt: () => [1000, 2000, 3000][Math.floor(Math.random() * 3)] * MAN,
    openers: { win: ["(말없이 고개만 끄덕인다) …Хорошо. 계속하시죠."], lose: ["(칩을 응시하다가 천천히) …셔플. 제대로 한 것 맞습니까."], push: ["(무표정) 내 돈은. 그대로입니까."] } },
  { id: "choi", name: "최 영감", emoji: "👴", tag: "30년 단골 · 이야기꾼",
    desc: "30년 단골 70대 할아버지. 느긋하고 정이 많지만 한번 입을 열면 옛날이야기가 길어진다.",
    betSide: () => (Math.random() < 0.5 ? "player" : "banker"),
    betAmt: () => [20, 30, 50][Math.floor(Math.random() * 3)] * MAN,
    openers: { win: ["허허, 그렇지. 내가 88년도부터 이 짝에 앉았는데 말이야, 그때 딜러들은… (이야기가 길어질 조짐이다)"], lose: ["쯧, 옛날엔 안 이랬는데… 어이 딜러 양반, 바쁜가? 내 얘기 좀 들어볼라나?"], push: ["비겼구먼. 인생이 다 그래… 자네 몇 년 차인가?"] } },
];

export function makeViolation(cust) {
  const pool = [
    { type: "overmax", text: `테이블 맥시멈(3,000만) 초과 베팅`, applyBet: 35000000, fixBet: TABLE_MAX,
      correct: `"고객님, 테이블 한도가 ${won(TABLE_MAX)}입니다" — 초과분 반환`,
      fixNote: "한도 초과 베팅은 접수 전 즉시 안내하고 초과분을 반환합니다." },
    { type: "undermin", text: `테이블 미니멈(20만) 미달 베팅`, applyBet: 100000, fixBet: TABLE_MIN,
      correct: `"이 테이블 미니멈은 ${won(TABLE_MIN)}입니다" — 안내 후 교정`,
      fixNote: "미니멈 미달 베팅도 반드시 접수 전에 안내합니다." },
    { type: "invalidChip", text: `베팅 불가 칩(청·백)을 스팟에 올림`, applyBet: null, fixBet: null, invalidChip: true,
      correct: `"청·백·회 칩은 베팅하실 수 없습니다" — 칩 교환 안내`,
      fixNote: "5천·1천·5백 칩은 커미션 거스름 전용으로, 베팅 스팟에 올릴 수 없습니다." },
    { type: "cash", text: `칩이 아닌 현금을 레이아웃 위에 올림`, applyBet: null, fixBet: null, cash: true,
      correct: `"현금은 칩으로 교환해 드리겠습니다" — 체인지 콜`,
      fixNote: "레이아웃 위 현금은 체인지 콜 후 칩으로 교환하는 것이 원칙입니다." },
  ];
  return { cust, ...pool[Math.floor(Math.random() * pool.length)], resolved: false };
}

export const NEUTRAL_LINES = ["이번 판 느낌이 좋은데…", "(칩을 만지작거린다)", "자, 가 봅시다.", "흠… 이쯤이면 됐나.", "(테이블을 톡톡 두드린다)"];
