// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  GOLD, IVORY, RED, BLUE, MUT, ROOM,
  TABLE_MIN, TABLE_MAX, MAN,
  CHIPS, BETTABLE, SMALL,
  SW, SH, ARM_ORIGIN, POS_SHOE, POS_BZONE, POS_PZONE, POS_REST, POS_TRAY,
  SUITS, RANKS, NUM_WORDS,
} from "@/lib/constants";
import {
  won, clamp, drawCard, cardValue, handTotal, bankerShouldDraw,
  shuffle, chipBreakdown, minimalChipCount, groupsTotal, chipMeta,
  mergeAdd, mergeRemove, spreadPattern, seatX, seatY, spotPos,
} from "@/lib/utils";
import { setSfxOn, SFX, ac } from "@/lib/sound";
import { PERSONAS, makeViolation, NEUTRAL_LINES } from "@/lib/personas";
import {
  Chip, ChipStackVisual, SpreadGroups, MiniStack, CardView,
  ActionBtn, PanelTitle, StepBar, GlossaryModal, GlossaryToggle,
  thtd, sideLabel, sideColor, dealBtnStyle, useTween, GuideBubble,
} from "@/components/GameUI";
import StoryFlow from "@/components/StoryFlow";
import TrainingMode from "@/components/TrainingMode";

// ═══════════ 메인 ═══════════
export default function BaccaratDealerTrainerV3() {
  const [mode, setMode] = useState("practice"); // practice | real
  const [custCount, setCustCount] = useState(5);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState("intro");
  const [lock, setLock] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [pCards, setPCards] = useState([]);
  const [bCards, setBCards] = useState([]);
  const [dealtCount, setDealtCount] = useState(0);
  const [pendingDeal, setPendingDeal] = useState([]);
  const [banner, setBanner] = useState(null);
  const [callOptions, setCallOptions] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [decisions, setDecisions] = useState({ total: 0, correct: 0 });
  const [mistakes, setMistakes] = useState([]);
  const [roundMistakes, setRoundMistakes] = useState([]);
  const [flash, setFlash] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showChipChart, setShowChipChart] = useState(false);
  const [selCust, setSelCust] = useState(null);
  // 베팅
  const [bettingDone, setBettingDone] = useState(false);
  const [violation, setViolation] = useState(null);
  const [lateBet, setLateBet] = useState(null);
  // 말풍선
  const [bubble, setBubble] = useState(null);
  const bubbleQ = useRef([]);
  const bubbleBusy = useRef(false);
  // 팔
  const [armTarget, setArmTarget] = useState(POS_REST);
  const [armLabel, setArmLabel] = useState("");
  const [armOn, setArmOn] = useState(false);
  const armPos = useTween(armTarget);
  // 연습 모드 페이 MC
  const [payQueue, setPayQueue] = useState([]);
  const [payIdx, setPayIdx] = useState(0);
  // 실전 테이크
  const [takeState, setTakeState] = useState(null);
  // 실전 페이
  const [payWB, setPayWB] = useState(null);
  // 어림 집기 (길게 누르기 — 개수는 펼쳐 봐야 안다)
  const [grab, setGrab] = useState(null);
  const grabRef = useRef(null);
  // 사운드 · 기록 · 나가기
  const [soundOn, setSoundOnState] = useState(true);
  const [records, setRecords] = useState({});
  const [exitConfirm, setExitConfirm] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [guideMsg, setGuideMsg] = useState(null);
  const guideModeRef = useRef(false);
  const guideDoneRef = useRef(new Set());
  const prevPhaseRef = useRef("intro");
  useEffect(() => { setSfxOn(soundOn); }, [soundOn]);
  useEffect(() => {
    if (phase !== "settleOrder" || !result) return;
    setSettleOrderOpts(shuffle(result.winner === "tie"
      ? [{label:"TIE 적중자에게 지급, P/B 베팅은 푸시 — 원금 그대로",ok:true},{label:"P/B 베팅을 모두 수거한다",ok:false},{label:"P/B 베팅에도 절반을 지급한다",ok:false}]
      : [{label:"지는 베팅을 먼저 수거한다 (테이크)",ok:true},{label:"이긴 베팅부터 지급한다 (페이)",ok:false},{label:"사용한 카드를 먼저 수거한다",ok:false}]));
  }, [phase, result?.winner]);
  useEffect(() => {
    (async () => {
      try {
        const local = localStorage.getItem("baccarat-best");
        if (local) setRecords(JSON.parse(local));
      } catch (e) { /* 기록 없음 */ }
    })();
    if (!localStorage.getItem("baccarat-story-seen")) setShowStory(true);
  }, []);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (phase === "intro" || phase === prev) return;
    SFX.phase();
  }, [phase]);

  // ── 가이드 메시지 (phase 변화 시) ──
  useEffect(() => {
    if (phase === "betting") {
      showGuide("betting", "베팅 감시", mode === "practice"
        ? "손님들이 베팅을 시작합니다.\n\n• 각 손님의 베팅 금액과 위치를 확인하세요.\n• 테이블 한도(20만~3,000만)를 초과하거나, 현금을 그대로 올리거나, 규정에 없는 칩을 사용하면 규정 위반입니다.\n• 손님 이름을 누르면 정보와 '규정 위반 지적' 버튼이 나타납니다.\n• 베팅이 완료되면 「No More Bets」 버튼을 눌러 마감하세요."
        : "손님들이 베팅을 시작합니다.\n\n• 실전 모드에서는 금액이 표시되지 않습니다. 칩의 색과 개수로 금액을 읽어야 합니다.\n• 손님 이름을 눌러 규정 위반을 지적할 수 있습니다.\n• 베팅이 완료되면 「No More Bets」 버튼으로 마감하세요.");
    } else if (phase === "lateBet") {
      showGuide("lateBet", "늦은 베팅 — No More Bets 이후", "\"No More Bets\"를 선언한 뒤 손님이 칩을 밀어 넣으려 합니다.\n\n• 반드시 거절해야 합니다. 마감 이후 칩 한 개도 받을 수 없습니다.\n• 「거절 (No more bets, sir.)」 버튼을 누르세요.\n• 규칙을 어기고 받아주면 감점입니다.");
    } else if (phase === "dealing") {
      showGuide("dealing", "딜링 순서", "카드를 슈에서 꺼내 딜링합니다.\n\n• 순서는 반드시 P → B → P → B (플레이어 먼저)\n• 아래에 「Player에게」 「Banker에게」 버튼이 나타납니다.\n• 잘못된 순서로 딜링하면 감점이지만 카드는 올바른 위치로 교정됩니다.");
    } else if (phase === "openPlayerCards" || phase === "callInitial") {
      showGuide("callInitial", "초기 핸드 콜 & 내추럴", "카드 4장이 모두 배분되었습니다.\n\n• 「카드 오픈」 후 플레이어와 뱅커의 합을 확인하세요.\n• 어느 쪽이든 합이 8 또는 9면 내추럴(Natural)입니다. 내추럴이 나오면 추가 딜링 없이 바로 결과를 선언합니다.\n• 콜 옵션에서 합계를 정확히 선택하세요.");
    } else if (phase === "playerThird" || phase === "openPlayerThird") {
      showGuide("playerThird", "플레이어 3rd 카드 룰", "플레이어 합이 0~5이면 한 장을 더 받습니다.\n합이 6~7이면 스탠드(추가 없음).\n\n• 내추럴(8·9)은 이미 처리되었습니다.\n• 「Player에게 3rd」 또는 「Player 스탠드」를 선택하세요.");
    } else if (phase === "bankerThird" || phase === "openBankerThird") {
      showGuide("bankerThird", "뱅커 3rd 카드 룰", "뱅커의 추가 드로우는 플레이어의 3rd 카드 값에 따라 결정됩니다.\n\n• 플레이어가 스탠드했으면: 뱅커 합 0~5 → 드로우, 6~7 → 스탠드\n• 플레이어가 3rd를 받았으면: 상세 룰표가 적용됩니다 (힌트 버튼 참고)\n• 아래 버튼으로 드로우/스탠드를 선택하세요.");
    } else if (phase === "callWinner") {
      showGuide("callWinner", "승자 선언", "모든 카드가 공개되었습니다.\n\n• PLAYER, BANKER, TIE 중 승자를 선언하세요.\n• 합이 같으면 TIE(타이)입니다.\n• 올바른 승자를 선택하면 정산 단계로 넘어갑니다.");
    } else if (phase === "settleOrder") {
      showGuide("settleOrder", mode === "practice" ? "정산 순서 (연습)" : "정산 순서 (실전)", mode === "practice"
        ? "승패가 결정되면 정산 순서에 따라 버튼을 누릅니다.\n\n• 먼저 진 쪽 칩을 테이크(수거)합니다.\n• 그다음 이긴 쪽에 페이(지불)합니다.\n• BANKER가 이긴 경우 커미션 5%를 공제한 금액을 지급합니다."
        : "실전 모드 정산입니다.\n\n• 진 쪽 칩을 테이크(수거)한 뒤, 이긴 쪽에 페이합니다.\n• BANKER 승리 시 커미션 5% 공제 후 지급.\n• 칩을 직접 컷팅해 올바른 금액을 구성해야 합니다.");
    } else if (phase === "payout" || phase === "payWB") {
      showGuide("payout", "페이 — 칩 지급", mode === "practice"
        ? "이긴 손님에게 배당금을 지급합니다.\n\n• 각 손님 배당 항목을 탭해서 지급을 완료하세요.\n• PLAYER·TIE 배당은 1:1, TIE는 보통 8:1 (이 테이블은 1:1 환급).\n• BANKER 배당은 커미션 5% 공제 후 0.95:1입니다."
        : "실전 모드 페이입니다.\n\n• 각 손님에게 칩을 올바르게 구성해 지급하세요.\n• 금액이 맞으면 자동으로 다음 단계로 넘어갑니다.");
    }
  }, [phase]);

  useEffect(() => {
    if (!bettingDone) return;
    showGuide("bettingDone", "베팅 마감 준비", "모든 손님의 베팅이 완료되었습니다.\n\n• 지금이 마지막 점검 타이밍입니다. 규정 위반이 보이면 지금 지적하세요.\n• 이상이 없으면 「No More Bets」를 눌러 마감하세요.\n• 마감 후에는 베팅 변경이 불가합니다.");
  }, [bettingDone]);

  // 응대
  const [chatCust, setChatCust] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatDone, setChatDone] = useState(false);
  const [quickReplies, setQuickReplies] = useState(null);
  const [pressure, setPressure] = useState(0);
  const chatBusyRef = useRef(false);
  useEffect(() => { chatBusyRef.current = chatBusy; }, [chatBusy]);
  const pressurePenalized = useRef(false);
  const chatBoxRef = useRef(null);
  const chatPinnedRef = useRef(true);
  useEffect(() => {
    const el = chatBoxRef.current;
    if (el && chatPinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [chatLog, chatBusy]);
  // 라운드 종료
  const [coaching, setCoaching] = useState({ state: "none", text: "" });
  const [bonusQuiz, setBonusQuiz] = useState(null);
  const [changeMessy, setChangeMessy] = useState(false);
  const pThirdRef = useRef(null);
  const pThirdPendingRef = useRef(null);
  const bThirdPendingRef = useRef(null);
  const [lateBetBtnOrder, setLateBetBtnOrder] = useState(true);
  const [takeConfirm, setTakeConfirm] = useState(null);
  const [settleOrderOpts, setSettleOrderOpts] = useState([]);
  const timersRef = useRef([]);
  const customersRef = useRef([]);
  useEffect(() => { customersRef.current = customers; }, [customers]);
  useEffect(() => () => clearTimers(), []);

  function clearTimers() { timersRef.current.forEach(clearTimeout); timersRef.current = []; }
  function later(fn, ms) { timersRef.current.push(setTimeout(fn, ms)); }
  function lockFor(ms) { setLock(true); later(() => setLock(false), ms); }
  const acc = decisions.total > 0 ? Math.round((decisions.correct / decisions.total) * 100) : 100;

  function grade(ok, text, fixText) {
    setDecisions((d) => ({ total: d.total + 1, correct: d.correct + (ok ? 1 : 0) }));
    const id = Date.now() + Math.random();
    if (ok) { setScore((s) => s + 10); setFlash({ ok: true, text: text || "정확합니다. +10점", id }); SFX.good(); }
    else {
      setFlash({ ok: false, text: text || "절차 오류", id });
      setMistakes((m) => [{ round, text, fix: fixText }, ...m]);
      setRoundMistakes((m) => [...m, text]);
      SFX.bad();
    }
    later(() => setFlash((f) => (f && f.id === id ? null : f)), 2800);
  }

  // ── 말풍선 큐 ──
  function showBubble(seat, text, type, dur) {
    if (bubbleQ.current.length > 4) return;
    bubbleQ.current.push({ seat, text, type: type || "normal", dur: dur || 1700 });
    pumpBubbles();
  }
  function pumpBubbles() {
    if (bubbleBusy.current) return;
    const next = bubbleQ.current.shift();
    if (!next) return;
    bubbleBusy.current = true;
    setBubble(next);
    later(() => { setBubble(null); bubbleBusy.current = false; pumpBubbles(); }, next.dur);
  }
  function moveArm(pos, label) { setArmOn(true); setArmTarget(pos); setArmLabel(label || ""); }

  function showGuide(key, title, body) {
    if (!guideModeRef.current) return;
    if (guideDoneRef.current.has(key)) return;
    guideDoneRef.current.add(key);
    setGuideMsg({ title, body });
  }

  // ── 라운드 시작 ──
  function startRound(withGuide = false) {
    const storageKey = `guide-${mode}-seen`;
    const forceGuide = withGuide || !localStorage.getItem(storageKey);
    guideModeRef.current = forceGuide;
    guideDoneRef.current = new Set();
    if (forceGuide) localStorage.setItem(storageKey, "1");
    ac(); // 모바일 오디오 잠금 해제 (사용자 제스처 내)
    clearTimers();
    const picked = shuffle(PERSONAS).slice(0, custCount);
    const custs = picked.map((p, i) => ({ ...p, seat: i, side: null, bet: 0, invalidChip: false }));
    setCustomers(custs); customersRef.current = custs;
    setPCards([]); setBCards([]); setDealtCount(0);
    setPendingDeal([drawCard(), drawCard(), drawCard(), drawCard()]);
    setResult(null); setBanner(null); setFlash(null); setLock(false);
    setBettingDone(false); setViolation(null); setLateBet(null);
    setBubble(null); bubbleQ.current = []; bubbleBusy.current = false;
    setPayQueue([]); setPayIdx(0); setTakeState(null); setPayWB(null); setGrab(null);
    if (grabRef.current) { clearInterval(grabRef.current.timer); grabRef.current = null; }
    setChatCust(null); setChatLog([]); setChatDone(false); setChatInput(""); setQuickReplies(null);
    setPressure(0); pressurePenalized.current = false;
    setCoaching({ state: "none", text: "" }); setBonusQuiz(null); setChangeMessy(false);
    setRoundMistakes([]); setSelCust(null);
    setArmOn(true); setArmTarget(POS_REST); setArmLabel("");
    setPhase("betting");

    custs.forEach((c, i) => {
      later(() => {
        const side = c.betSide(); const bet = c.betAmt();
        setBet(c.id, { side, bet });
        showBubble(c.seat, mode === "practice" ? `${sideLabel[side]} ${won(bet)}` : `${sideLabel[side]}에 베팅`, "normal", 1500);
        SFX.murmur();
      }, 500 + i * 750);
    });
    const baseEnd = 500 + custCount * 750;
    const changes = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < changes; k++) {
      later(() => {
        const cs = customersRef.current.filter((c) => c.side);
        if (!cs.length) return;
        const c = cs[Math.floor(Math.random() * cs.length)];
        const r = Math.random();
        if (r < 0.45) {
          const add = [10, 50, 100][Math.floor(Math.random() * 3)] * MAN;
          const nb = Math.min(c.bet + add, TABLE_MAX);
          setBet(c.id, { bet: nb });
          showBubble(c.seat, mode === "practice" ? `${won(add)} 추가` : "칩 추가", "normal", 1400);
        } else if (r < 0.75) {
          const ns = c.side === "player" ? "banker" : "player";
          setBet(c.id, { side: ns });
          showBubble(c.seat, `${sideLabel[ns]}로 옮김`, "normal", 1400);
        } else if (c.bet > TABLE_MIN) {
          const cut = Math.min(c.bet - TABLE_MIN, 50 * MAN);
          setBet(c.id, { bet: c.bet - cut });
          showBubble(c.seat, "칩 일부 회수", "normal", 1400);
        }
      }, baseEnd + 900 * (k + 1));
    }
    const streamEnd = baseEnd + 900 * (changes + 1);
    // 돌발은 라운드당 최대 1개 (위반 50% / 늦은 베팅은 마감 시 35%, 상호 배타)
    const hasViolation = Math.random() < 0.5;
    if (hasViolation) {
      later(() => {
        const cs = customersRef.current.filter((c) => c.side);
        if (!cs.length) return;
        const c = cs[Math.floor(Math.random() * cs.length)];
        const v = makeViolation(c);
        if (v.applyBet) setBet(c.id, { bet: v.applyBet });
        if (v.invalidChip) setBet(c.id, { invalidChip: true });
        if (v.cash) setBet(c.id, { cashOnLayout: true });
        // 위반을 누설하지 않음 — 중립 잡담만. 적발은 딜러의 눈에 달려 있다
        showBubble(c.seat, NEUTRAL_LINES[Math.floor(Math.random() * NEUTRAL_LINES.length)], "normal", 1700);
        setViolation(v);
      }, streamEnd - 300);
    }
    later(() => { setBettingDone(true); }, streamEnd + 700);
    laterBetAllowedRef.current = !hasViolation;
  }
  const laterBetAllowedRef = useRef(true);

  function setBet(id, patch) {
    setCustomers((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  // 좌석 점검에서 "규정 위반 지적" — 적중이면 교정, 오지적이면 감점
  function accuseCust(c) {
    setSelCust(null);
    if (violation && !violation.resolved && violation.cust.id === c.id) {
      grade(true, `위반 적발 — ${violation.text}. ${violation.correct}`);
      if (violation.fixBet) setBet(c.id, { bet: violation.fixBet });
      if (violation.invalidChip) setBet(c.id, { invalidChip: false });
      if (violation.cash) setBet(c.id, { cashOnLayout: false });
      setViolation((v) => ({ ...v, resolved: true }));
      showBubble(c.seat, "아, 그래요? 알겠소. 교정하지.", "normal", 1600);
    } else {
      grade(false, `정상 베팅을 위반으로 지적했습니다 (${c.name})`, "오지적은 손님 불쾌와 게임 지연을 부릅니다. 스택을 정확히 읽고, 확신이 설 때만 지적하세요.");
      showBubble(c.seat, "내 베팅이 뭐가 문제요? (불쾌한 표정)", "warn", 2000);
    }
  }

  function noMoreBets() {
    if (lock) return;
    if (violation && !violation.resolved) {
      grade(false, `규정 위반을 놓친 채 마감했습니다 — ${violation.cust.name}: ${violation.text}`, violation.fixNote);
      if (violation.fixBet) setBet(violation.cust.id, { bet: violation.fixBet });
      if (violation.invalidChip) setBet(violation.cust.id, { invalidChip: false });
      if (violation.cash) setBet(violation.cust.id, { cashOnLayout: false });
      setViolation((v) => ({ ...v, resolved: true }));
    }
    setBanner({ en: "No More Bets", ko: "베팅 마감" });
    if (laterBetAllowedRef.current && Math.random() < 0.35) {
      lockFor(800);
      const cs = customersRef.current;
      const c = cs[Math.floor(Math.random() * cs.length)];
      later(() => {
        showBubble(c.seat, "⚠ 잠깐! 이것도 받아 줘요! (칩을 밀어 넣는다)", "warn", 2400);
        setLateBetBtnOrder(Math.random() < 0.5);
        setLateBet(c); setPhase("lateBet");
      }, 750);
    } else {
      setPhase("dealing");
    }
  }

  function resolveLateBet(ok) {
    if (ok) grade(true, "“No more bets, sir.” — 늦은 베팅을 정확히 차단했습니다");
    else grade(false, "마감 후 베팅을 받아주었습니다", "'No more bets' 이후엔 칩 한 개도 받을 수 없습니다. 예외 한 번이면 그 테이블의 마감 콜은 무력화됩니다.");
    setLateBet(null); setPhase("dealing");
  }

  // ── 딜링 ──
  function dealTo(target) {
    if (lock || dealtCount >= 4) return;
    const correctTarget = dealtCount % 2 === 0 ? "P" : "B";
    const ok = target === correctTarget;
    const card = pendingDeal[dealtCount];
    moveArm(POS_SHOE, "슈"); SFX.deal();
    later(() => moveArm(correctTarget === "P" ? POS_PZONE : POS_BZONE, "딜링"), 300);
    if (correctTarget === "P") setPCards((c) => [...c, { ...card, faceDown: true }]); else setBCards((c) => [...c, { ...card, faceDown: true }]);
    if (ok) grade(true, `정확한 딜링 순서 (${correctTarget === "P" ? "Player" : "Banker"})`);
    else grade(false, `딜링 순서 오류! ${dealtCount + 1}번째 카드는 ${correctTarget === "P" ? "PLAYER" : "BANKER"} 차례`, "딜링 순서는 항상 P→B→P→B. 카드는 올바른 위치로 교정되었습니다.");
    const n = dealtCount + 1;
    setDealtCount(n);
    if (n === 4) { lockFor(500); later(() => setPhase("openPlayerCards"), 480); }
  }

  function prepareInitialCall() {
    const pc = pendingDeal.filter((_, i) => i % 2 === 0);
    const bc = pendingDeal.filter((_, i) => i % 2 === 1);
    const pT = handTotal(pc), bT = handTotal(bc);
    const correct = `Player ${NUM_WORDS[pT]}, Banker ${NUM_WORDS[bT]}`;
    const opts = [{ label: correct, ok: true }];
    const seen = new Set([correct]);
    const tryAdd = (p, b) => { const l = `Player ${NUM_WORDS[p]}, Banker ${NUM_WORDS[b]}`; if (!seen.has(l) && opts.length < 3) { seen.add(l); opts.push({ label: l, ok: false }); } };
    tryAdd(bT, pT); tryAdd((pT + 5) % 10, bT); tryAdd(pT, (bT + 4) % 10);
    setCallOptions(shuffle(opts));
    moveArm(POS_REST, "");
    setPhase("callInitial");
  }

  function openPlayerCards() {
    setPCards((cards) => cards.map((c) => ({ ...c, faceDown: false })));
    moveArm(POS_PZONE, "오픈"); SFX.deal();
    lockFor(600);
    later(() => setPhase("openBankerCards"), 550);
  }
  function openBankerCards() {
    setBCards((cards) => cards.map((c) => ({ ...c, faceDown: false })));
    moveArm(POS_BZONE, "오픈"); SFX.deal();
    lockFor(600);
    later(() => prepareInitialCall(), 550);
  }
  function openPlayerThird() {
    const { card, value } = pThirdPendingRef.current;
    pThirdRef.current = value;
    setPCards((cards) => cards.map((c, i) => i === cards.length - 1 ? { ...c, faceDown: false } : c));
    moveArm(POS_PZONE, "오픈"); SFX.deal();
    setBanner({ en: "Player 3rd", ko: `${card.rank}${card.suit}` });
    lockFor(600);
    later(() => setPhase("bankerThird"), 550);
  }
  function openBankerThird() {
    const { card, bFinalTotal } = bThirdPendingRef.current;
    setBCards((cards) => cards.map((c, i) => i === cards.length - 1 ? { ...c, faceDown: false } : c));
    moveArm(POS_BZONE, "오픈"); SFX.deal();
    setBanner({ en: "Banker 3rd", ko: `${card.rank}${card.suit}` });
    lockFor(800);
    later(() => prepareWinnerCall(handTotal(pCards), bFinalTotal, false), 750);
  }

  function pickInitialCall(opt) {
    if (lock) return;
    const pT = handTotal(pCards), bT = handTotal(bCards);
    if (opt.ok) grade(true, "합계 콜링 정확!");
    else grade(false, "합계 콜링 오류", `합은 10으로 나눈 나머지만 (10·J·Q·K=0, A=1). 정답: "Player ${NUM_WORDS[pT]}, Banker ${NUM_WORDS[bT]}"`);
    setBanner({ en: `Player ${NUM_WORDS[pT]}, Banker ${NUM_WORDS[bT]}`, ko: "초기 합계" });
    if (pT >= 8 || bT >= 8) {
      lockFor(1000);
      later(() => { setBanner({ en: "Natural — No More Cards", ko: "내추럴! 즉시 승부" }); prepareWinnerCall(pT, bT, true); }, 900);
    } else setPhase("playerThird");
  }

  function playerThirdDecision(draw) {
    if (lock) return;
    const pT = handTotal(pCards);
    const shouldDraw = pT <= 5;
    if (draw === shouldDraw) grade(true, shouldDraw ? "정확 — Player 0~5는 추가 카드" : "정확 — Player 6~7은 스탠드");
    else grade(false, "Player 3rd 룰 오류", `Player 0~5면 무조건 카드, 6~7이면 스탠드 (현재 ${pT})`);
    if (shouldDraw) {
      const c = drawCard();
      pThirdPendingRef.current = { card: c, value: cardValue(c) };
      setPCards((cards) => [...cards, { ...c, faceDown: true }]);
      moveArm(POS_SHOE, "슈"); SFX.deal(); later(() => moveArm(POS_PZONE, "딜링"), 300);
      setBanner({ en: "Card for Player (face down)", ko: "뒷면 드로우" });
      lockFor(950);
      later(() => setPhase("openPlayerThird"), 900);
    } else {
      pThirdRef.current = null;
      setBanner({ en: "Player stands", ko: "스탠드" });
      lockFor(550);
      later(() => setPhase("bankerThird"), 500);
    }
  }

  function bankerThirdDecision(draw) {
    if (lock) return;
    const bT = handTotal(bCards);
    const pThird = pThirdRef.current;
    const shouldDraw = bankerShouldDraw(bT, pThird);
    const ruleText = pThird === null
      ? `Player 스탠드 시 Banker는 0~5 카드, 6~7 스탠드 (현재 ${bT})`
      : `Player 3rd 값 ${pThird}일 때 Banker ${bT}는 ${shouldDraw ? "카드" : "스탠드"} (룰 차트 참조)`;
    if (draw === shouldDraw) grade(true, shouldDraw ? "정확 — Card for Banker" : "정확 — Banker 스탠드");
    else grade(false, "Banker 3rd 룰 오류", ruleText);
    if (shouldDraw) {
      const c = drawCard();
      const newBCards = [...bCards, { ...c, faceDown: true }];
      bThirdPendingRef.current = { card: c, bFinalTotal: handTotal(newBCards) };
      setBCards(newBCards);
      moveArm(POS_SHOE, "슈"); SFX.deal(); later(() => moveArm(POS_BZONE, "딜링"), 300);
      setBanner({ en: "Card for Banker (face down)", ko: "뒷면 드로우" });
      lockFor(1000);
      later(() => setPhase("openBankerThird"), 900);
    } else {
      setBanner({ en: "Banker stands", ko: "스탠드" });
      lockFor(1000);
      later(() => prepareWinnerCall(handTotal(pCards), handTotal(bCards), false), 900);
    }
  }

  function prepareWinnerCall(pT, bT, natural) {
    let winner, correct;
    if (pT === bT) { winner = "tie"; correct = `Tie, ${NUM_WORDS[pT]} ${NUM_WORDS[bT]}`; }
    else if (pT > bT) { winner = "player"; correct = natural ? `Player wins, natural ${NUM_WORDS[pT]}` : `Player wins, ${NUM_WORDS[pT]} over ${NUM_WORDS[bT]}`; }
    else { winner = "banker"; correct = natural ? `Banker wins, natural ${NUM_WORDS[bT]}` : `Banker wins, ${NUM_WORDS[bT]} over ${NUM_WORDS[pT]}`; }
    const wrongs = winner === "tie"
      ? [`Player wins, ${NUM_WORDS[pT]} over ${NUM_WORDS[bT]}`, `Banker wins, ${NUM_WORDS[bT]} over ${NUM_WORDS[pT]}`]
      : winner === "player"
        ? [`Banker wins, ${NUM_WORDS[bT]} over ${NUM_WORDS[pT]}`, `Player wins, ${NUM_WORDS[bT]} over ${NUM_WORDS[pT]}`]
        : [`Player wins, ${NUM_WORDS[pT]} over ${NUM_WORDS[bT]}`, `Banker wins, ${NUM_WORDS[pT]} over ${NUM_WORDS[bT]}`];
    setResult({ winner, pT, bT, natural });
    setCallOptions(shuffle([{ label: correct, ok: true }, ...wrongs.map((w) => ({ label: w, ok: false }))]));
    moveArm(POS_REST, "");
    setPhase("callWinner");
  }

  function pickWinnerCall(opt) {
    if (lock) return;
    const correctLabel = callOptions.find((o) => o.ok).label;
    if (opt.ok) grade(true, "승자 콜링 정확!");
    else grade(false, "승자 콜링 오류", `정답: "${correctLabel}" — 이긴 쪽 숫자를 먼저 콜합니다.`);
    setBanner({ en: correctLabel, ko: result.winner === "tie" ? "타이 — 진 사람이 없습니다" : result.winner === "player" ? "플레이어 승" : "뱅커 승" });
    setPhase("settleOrder");
  }

  // ── 정산 판단 ──
  function pickSettleOrder(ok) {
    if (lock) return;
    const isTie = result.winner === "tie";
    if (isTie) {
      if (ok) grade(true, "정확 — 타이는 진 사람이 없습니다");
      else grade(false, "타이 정산 오류", "타이 시 P/B 베팅은 푸시(원금 유지). TIE 적중에만 8:1 지급. 수거할 베팅이 없습니다.");
      enterPayStage();
    } else {
      if (ok) grade(true, "정확 — 테이크 먼저");
      else grade(false, "정산 순서 오류", "정산은 항상 ① 테이크(지는 베팅 수거) → ② 페이. 분쟁 방지의 기본입니다.");
      if (mode === "real") enterTakeWB();
      else startAutoCollect();
    }
  }

  // ── 테이크: 연습 자동 ──
  function startAutoCollect() {
    const losers = customers.filter((c) => c.side && c.side !== result.winner);
    if (!losers.length) { enterPayStage(); return; }
    setPhase("collecting");
    losers.forEach((c, k) => {
      later(() => {
        const sp = spotPos(c.seat, customers.length);
        moveArm(sp, "테이크");
        later(() => moveArm(POS_TRAY, ""), 480);
        showBubble(c.seat, "수거", "normal", 900);
        setBet(c.id, { bet: 0 });
      }, k * 1000);
    });
    later(() => { moveArm(POS_REST, ""); enterPayStage(); }, losers.length * 1000 + 500);
  }

  // ── 테이크: 실전 워크벤치 ──
  function enterTakeWB() {
    setTakeConfirm(null);
    setTakeState({ taken: {}, wrongTried: {} });
    setPhase("takeWB");
  }
  function handleTakeDrop(cust) {
    setTakeState((ts) => {
      if (!ts || ts.taken[cust.id]) return ts;
      const isLoser = cust.side !== result.winner;
      if (isLoser) {
        setBet(cust.id, { bet: 0 });
        return { ...ts, taken: { ...ts.taken, [cust.id]: true } };
      }
      if (!ts.wrongTried[cust.id]) {
        grade(false, `${cust.name}의 스택을 잘못 수거하려 했습니다`, cust.side === result.winner ? "이긴 베팅입니다 — 수거가 아니라 지급 대상입니다." : "푸시 스택은 손대지 않습니다.");
        return { ...ts, wrongTried: { ...ts.wrongTried, [cust.id]: true } };
      }
      return ts;
    });
  }
  function confirmTake() {
    const losers = customers.filter((c) => c.side && c.side !== result.winner);
    const allTaken = losers.every((c) => takeState.taken[c.id]);
    if (!allTaken) { const fid = Date.now() + Math.random(); setFlash({ ok: false, text: "아직 수거하지 않은 지는 베팅이 있습니다", id: fid }); later(() => setFlash((f) => (f && f.id === fid ? null : f)), 2000); return; }
    grade(true, "테이크 완료 — 정확한 수거");
    enterPayStage();
  }

  // ── 페이 스테이지 진입 ──
  function enterPayStage() {
    const r = result;
    const winners = customers.filter((c) => c.side && (r.winner === "tie" ? c.side === "tie" : c.side === r.winner));
    if (r.winner === "tie") {
      const pushes = customers.filter((c) => c.side && c.side !== "tie");
      if (pushes.length) showBubble(pushes[0].seat, "푸시 — 원금 유지", "normal", 1500);
    }
    if (!winners.length) {
      setBanner({ en: "All bets settled", ko: "지급 대상 없음 — 정산 완료" });
      later(startChat, 900);
      setPhase("payout"); setPayQueue([]);
      return;
    }
    if (mode === "real") {
      setPayWB({ queue: winners, idx: 0, step: "pay", zone: [], collected: [], refundZone: [], commInput: "", erred: {} });
      setPhase("payWB");
    } else {
      buildPayQueueMC(winners);
    }
  }

  // ── 페이: 연습 MC ──
  function buildPayQueueMC(winners) {
    const r = result;
    const queue = [];
    winners.forEach((c) => {
      if (r.winner === "tie") {
        const correct = c.bet * 8;
        queue.push({ cust: c, question: `${c.name} — TIE 적중 (8:1). 베팅 ${won(c.bet)}, 지급할 당첨금은?`,
          options: shuffle([{ label: won(correct), ok: true }, { label: won(c.bet * 9), ok: false }, { label: won(c.bet * 4), ok: false }]),
          fix: `타이 배당 8:1 — ${won(c.bet)} × 8 = ${won(correct)}` });
      } else if (r.winner === "banker") {
        queue.push({ cust: c, question: `${c.name} — BANKER 적중. 1단계: 1:1로 페이할 금액은? (베팅 ${won(c.bet)})`,
          options: shuffle([{ label: won(c.bet), ok: true }, { label: won(Math.round(c.bet * 0.95)), ok: false }, { label: won(c.bet * 2), ok: false }]),
          fix: `페이는 일단 1:1 전액 — ${won(c.bet)}. 커미션은 페이 후 별도 수거합니다.` });
        const comm = c.bet * 5 / 100;
        queue.push({ cust: c, question: `${c.name} — 2단계: 페이한 ${won(c.bet)}에서 확인할 커미션(5%)은?`,
          options: shuffle([{ label: won(comm), ok: true }, { label: won(c.bet / 10), ok: false }, { label: won(comm / 2), ok: false }]),
          fix: `커미션 = ${won(c.bet)} × 5% = ${won(comm)}. 실전 모드에선 직접 수거·환급까지 합니다.` });
      } else {
        queue.push({ cust: c, question: `${c.name} — PLAYER 적중 (1:1). 베팅 ${won(c.bet)}, 지급할 당첨금은?`,
          options: shuffle([{ label: won(c.bet), ok: true }, { label: won(Math.round(c.bet * 0.95)), ok: false }, { label: won(c.bet * 2), ok: false }]),
          fix: `플레이어 1:1, 커미션 없음 — ${won(c.bet)}` });
      }
    });
    setPayQueue(queue); setPayIdx(0); setPhase("payout");
  }
  function pickPayoutMC(opt) {
    if (lock) return;
    const q = payQueue[payIdx];
    if (opt.ok) grade(true, "정확!");
    else grade(false, `계산 오류 (${q.cust.name})`, q.fix);
    const sp = spotPos(q.cust.seat, customers.length);
    moveArm(sp, "페이"); later(() => moveArm(POS_REST, ""), 600);
    if (payIdx + 1 < payQueue.length) setPayIdx(payIdx + 1);
    else { setBanner({ en: "Payouts complete", ko: "정산 완료" }); lockFor(900); later(startChat, 850); }
  }

  // ── 페이: 실전 워크벤치 ──
  const curWinner = payWB ? payWB.queue[payWB.idx] : null;
  const payRequired = curWinner ? (result.winner === "tie" ? curWinner.bet * 8 : curWinner.bet) : 0;
  const commission = curWinner ? curWinner.bet * 5 / 100 : 0;

  // ── 어림 집기: 꾹 누르는 동안 칩이 모임 (개수 비표시), 놓으면 현재 스텝의 존으로 ──
  function grabStart(denom) {
    if (grabRef.current) return;
    SFX.chipGrab();
    const st = { denom, count: 1, timer: setInterval(() => { st.count = Math.min(st.count + 1, 60); }, 150) };
    grabRef.current = st;
    setGrab({ denom });
  }
  function grabEnd() {
    const st = grabRef.current;
    if (!st) return;
    clearInterval(st.timer);
    grabRef.current = null;
    setGrab(null);
    setPayWB((wb) => {
      if (!wb) return wb;
      if (wb.step === "pay") return { ...wb, zone: mergeAdd(wb.zone, st.denom, st.count) };
      if (wb.step === "refund") return { ...wb, refundZone: mergeAdd(wb.refundZone, st.denom, st.count) };
      return wb;
    });
  }
  // ── 그룹 탭: 컷(스택) 탭 = 묶음째, 스프레드 탭 = 1개 ──
  function tapPayGroup(denom, g) {
    const nSub = g.kind === "spread" ? 1 : g.n;
    if (g.kind === "spread") SFX.chipClick(); else SFX.chipGrab();
    setPayWB((wb) => {
      if (!wb) return wb;
      if (wb.step === "pay") return { ...wb, zone: mergeRemove(wb.zone, denom, nSub) };
      if (wb.step === "collect") return { ...wb, zone: mergeRemove(wb.zone, denom, nSub), collected: mergeAdd(wb.collected, denom, nSub) };
      return wb;
    });
  }
  function tapCollectedGroup(denom, g) {
    const nSub = g.kind === "spread" ? 1 : g.n;
    setPayWB((wb) => (wb && wb.step === "collect" ? { ...wb, collected: mergeRemove(wb.collected, denom, nSub), zone: mergeAdd(wb.zone, denom, nSub) } : wb));
  }
  function tapRefundGroup(denom, g) {
    const nSub = g.kind === "spread" ? 1 : g.n;
    setPayWB((wb) => (wb && wb.step === "refund" ? { ...wb, refundZone: mergeRemove(wb.refundZone, denom, nSub) } : wb));
  }
  function regatherZone() {
    setPayWB((wb) => {
      if (!wb) return wb;
      if (wb.step === "pay") return { ...wb, zone: [] };
      if (wb.step === "refund") return { ...wb, refundZone: [] };
      return wb;
    });
  }
  function wbErr(key, text, fix) {
    setPayWB((wb) => {
      if (!wb.erred[key]) grade(false, text, fix);
      else { const fid = Date.now() + Math.random(); setFlash({ ok: false, text: "아직 맞지 않습니다 — 다시 시도", id: fid }); later(() => setFlash((f) => (f && f.id === fid ? null : f)), 1800); }
      return { ...wb, erred: { ...wb.erred, [key]: true } };
    });
  }
  function confirmPay() {
    const total = groupsTotal(payWB.zone);
    const key = `pay${payWB.idx}`;
    if (total !== payRequired) {
      wbErr(key, `페이 금액 불일치 (${curWinner.name})`, `${result.winner === "tie" ? "타이 8:1" : "1:1 사이징"} — 정확히 ${won(payRequired)}을 컷팅해야 합니다. (현재 ${won(total)})`);
      return;
    }
    grade(true, "페이 사이징 정확!");
    if (result.winner === "banker") setPayWB((wb) => ({ ...wb, step: "comm" }));
    else nextWinnerOrChat();
  }
  function confirmComm() {
    const val = parseInt(String(payWB.commInput).replace(/[^0-9]/g, ""), 10);
    const key = `comm${payWB.idx}`;
    if (val !== commission) {
      wbErr(key, `커미션 계산 오류 (${curWinner.name})`, `커미션 = ${won(curWinner.bet)} × 5% = ${won(commission)}`);
      return;
    }
    grade(true, `커미션 ${won(commission)} 확인!`);
    setPayWB((wb) => ({ ...wb, step: "collect" }));
  }
  function confirmCollect() {
    const col = groupsTotal(payWB.collected);
    const key = `col${payWB.idx}`;
    if (col < commission) {
      wbErr(key, "수거액이 커미션보다 적습니다", `최소 ${won(commission)} 이상을 페이 스택에서 회수해야 합니다. (현재 ${won(col)})`);
      return;
    }
    grade(true, `${won(col)} 수거 — 페이 스택에서 회수 완료`);
    const change = col - commission;
    if (change === 0) {
      setBanner({ en: "Commission collected", ko: "거스름 없음 — 커미션 정산 완료" });
      nextWinnerOrChat();
    } else {
      setPayWB((wb) => ({ ...wb, step: "refund" }));
    }
  }
  function confirmRefund() {
    const change = groupsTotal(payWB.collected) - commission;
    const total = groupsTotal(payWB.refundZone);
    const key = `ref${payWB.idx}`;
    if (total !== change) {
      wbErr(key, "거스름 금액 불일치", `회수 ${won(groupsTotal(payWB.collected))} − 커미션 ${won(commission)} = ${won(change)}을 정확히 거슬러 줘야 합니다. (현재 ${won(total)})`);
      return;
    }
    const usedCnt = payWB.refundZone.reduce((s, g) => s + g.count, 0);
    if (usedCnt > minimalChipCount(change) + 2) setChangeMessy(true);
    grade(true, `거스름 ${won(change)} 환급 정확!`);
    nextWinnerOrChat();
  }
  function nextWinnerOrChat() {
    setPayWB((wb) => {
      if (wb.idx + 1 < wb.queue.length) {
        return { ...wb, idx: wb.idx + 1, step: "pay", zone: [], collected: [], refundZone: [], commInput: "" };
      }
      setBanner({ en: "Payouts complete", ko: "정산 완료" });
      later(startChat, 850);
      return wb;
    });
  }

  // ── 응대 ──
  function custOutcome(c) {
    if (result.winner === "tie") return c.side === "tie" ? "win" : "push";
    return c.side === result.winner ? "win" : "lose";
  }
  function startChat() {
    const betters = customersRef.current.filter((c) => c.side || c.bet === 0);
    const pool = betters.length ? betters : customersRef.current;
    const cust = pool[Math.floor(Math.random() * pool.length)];
    const outcome = custOutcome(cust);
    const openers = cust.openers[outcome] || cust.openers.lose;
    const line = openers[Math.floor(Math.random() * openers.length)];
    setChatCust({ ...cust, outcome });
    setChatLog([{ role: "customer", text: line }]);
    setChatDone(false); setPressure(0); pressurePenalized.current = false;
    chatPinnedRef.current = true;
    setQuickReplies(null);
    setArmOn(false);
    showBubble(cust.seat, line.length > 24 ? line.slice(0, 24) + "…" : line, "normal", 2400);
    setPhase("chat");
    fetchQuickReplies(cust, outcome, line);
  }

async function callClaude(prompt) {
    const base = typeof window !== "undefined" && window.location.protocol === "capacitor:" 
      ? "https://baccarat-dealer-trainer.vercel.app" 
      : "";
    const res = await fetch(`${base}/api/claude`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return JSON.parse(data.text.replace(/```json|```/g, "").trim());
  }

  function situationText(cust, outcome) {
    const r = result;
    return `라운드 결과: ${r.winner === "tie" ? "타이" : r.winner === "player" ? `플레이어 승 (${r.pT} over ${r.bT})` : `뱅커 승 (${r.bT} over ${r.pT})`}. 손님의 베팅: ${sideLabel[cust.side]} ${won(cust.bet || 0)} → ${outcome === "win" ? "적중" : outcome === "push" ? "푸시" : "실패"}.`;
  }

  async function fetchQuickReplies(cust, outcome, opener) {
    try {
      const parsed = await callClaude(`카지노 바카라 테이블. 손님 ${cust.name}(${cust.desc})이(가) 방금 딜러에게 말했습니다: "${opener}"
상황: ${situationText(cust, outcome)}
신입 딜러가 할 수 있는 결이 다른 빠른 응대 3가지를 만드세요: ① 따뜻한 응대형 ② 룰·절차 안내형 ③ 정중하지만 단호한 진행형. 각 30자 이내, 실제 입말로.
다른 텍스트 없이 JSON만: {"quickReplies":["...","...","..."]}`);
      if (Array.isArray(parsed.quickReplies)) setQuickReplies(parsed.quickReplies.slice(0, 3));
    } catch (e) { setQuickReplies([]); }
  }

  async function sendChat(textArg) {
    const text = (textArg || chatInput).trim();
    if (!text || chatBusy || !chatCust || chatDone) return;
    const newLog = [...chatLog, { role: "dealer", text }];
    setChatLog(newLog); setChatInput(""); setQuickReplies([]); setChatBusy(true);
    const dialogue = newLog.map((m) => `${m.role === "customer" ? "손님" : "딜러"}: ${m.text}`).join("\n");
    try {
      const parsed = await callClaude(`당신은 카지노 바카라 테이블의 손님을 연기합니다.
[페르소나] ${chatCust.name}: ${chatCust.desc}
[상황] ${situationText(chatCust, chatCust.outcome)}
[대화]
${dialogue}
딜러의 마지막 응대에 페르소나의 말투와 성격으로 1~2문장 반응하세요. 딜러가 적절히 응대했으면 대부분 한 번에 수긍하고 done:true (선 넘는 손님이라도 단호한 응대를 받으면 보통 물러섭니다. 최대 2턴).
다른 텍스트 없이 JSON만: {"reply":"손님 대사","mood":"😊 또는 😐 또는 😠","done":true}`);
      setChatLog((l) => [...l, { role: "customer", text: parsed.reply, mood: parsed.mood }]);
      showBubble(chatCust.seat, String(parsed.reply).slice(0, 24) + (String(parsed.reply).length > 24 ? "…" : ""), "normal", 2200);
      if (parsed.done) setChatDone(true);
    } catch (e) {
      setChatLog((l) => [...l, { role: "customer", text: "(고개를 끄덕인다) 알겠소. 계속합시다.", mood: "😐" }]);
      setChatDone(true);
    } finally { setChatBusy(false); }
  }

  // 압박 게이지 (API 대기 중 정지)
  useEffect(() => {
    if (phase !== "chat" || chatDone) return;
    const id = setInterval(() => {
      if (chatBusyRef.current) return;
      setPressure((p) => {
        const np = Math.min(3, p + 1);
        const others = customersRef.current.filter((c) => !chatCust || c.id !== chatCust.id);
        if (others.length && np > p) {
          const o = others[Math.floor(Math.random() * others.length)];
          const texts = ["…", "딜러님, 슬슬 가시죠~", "아 뭐 해요, 빨리 갑시다!"];
          showBubble(o.seat, texts[np - 1], np >= 2 ? "warn" : "normal", 1800);
        }
        if (np === 3 && !pressurePenalized.current) {
          pressurePenalized.current = true;
          grade(false, "테이블이 술렁입니다 — 응대가 너무 길어졌습니다", "손님 한 명에게 30초 이상 잡히면 안 됩니다. 정중히 정리하고 게임을 진행시키는 것도 응대 기술입니다.");
        }
        return np;
      });
    }, 9000);
    return () => clearInterval(id);
  }, [phase, chatDone, chatCust]);

  function endChatToRound() {
    setPhase("roundEnd");
    if (Math.random() < 0.4) setupBonusQuiz();
    const transcript = chatLog.length > 1
      ? chatLog.map((m) => `${m.role === "customer" ? "손님" : "딜러"}: ${m.text}`).join("\n")
      : `손님이 "${chatLog[0]?.text || ""}"라고 말했으나, 딜러는 응대 없이 게임 진행을 선택함.`;
    const worthCoaching = chatLog.length > 0 || roundMistakes.length > 0 || pressure >= 2 || changeMessy;
    if (!worthCoaching) { setCoaching({ state: "pass", text: "" }); return; }
    setCoaching({ state: "loading", text: "" });
    fetchCoaching(transcript);
  }
  async function fetchCoaching(transcript) {
    try {
      const parsed = await callClaude(`당신은 20년차 베테랑 카지노 딜러 '오 반장'. 라운드가 끝나고 신입에게 한마디 남길지 판단합니다.
[이번 라운드 기록]
- 절차 실수: ${roundMistakes.length ? roundMistakes.join(" / ") : "없음"}
- 손님 응대 (상대: ${chatCust ? `${chatCust.name} — ${chatCust.desc}` : "없음"}):
${transcript}
- 테이블 압박 도달: ${pressure}/3 ${pressure >= 2 ? "(다른 손님들이 재촉함)" : ""}
- 거스름 칩 구성: ${changeMessy ? "비효율적 (칩 개수 과다)" : "무난"}
[규칙]
- 교과서 말투 금지 ("공감을 표현하세요" 같은 매뉴얼 문구 금지).
- 쉬는 시간에 후배한테 툭 던지는 현장 말투. 최대 두 문장. 필요하면 실전 멘트를 따옴표로 하나 제시.
- 응대 없이 진행한 것이 그 손님에겐 오히려 정답일 수도 있음 (말 없는 손님 등). 맥락으로 판단.
- 정말 코칭할 게 없으면 pass:true.
다른 텍스트 없이 JSON만: {"pass":false,"coaching":"..."}`);
      if (parsed.pass) setCoaching({ state: "pass", text: "" });
      else setCoaching({ state: "done", text: parsed.coaching });
    } catch (e) { setCoaching({ state: "pass", text: "" }); }
  }

  // ── 보너스 칩 리딩 퀴즈 ──
  function setupBonusQuiz() {
    const base = [30, 70, 120, 270, 480, 850, 1300, 2400][Math.floor(Math.random() * 8)];
    const amount = (base + Math.floor(Math.random() * 30)) * MAN;
    const opts = new Set([amount]);
    while (opts.size < 4) {
      const p = amount + (Math.floor(Math.random() * 13) - 6) * 10 * MAN;
      if (p > 0 && p !== amount) opts.add(p);
    }
    setBonusQuiz({ amount, revealed: true, options: shuffle([...opts]), answered: null });
    later(() => setBonusQuiz((q) => (q ? { ...q, revealed: false } : q)), 2600);
  }
  function answerBonus(v) {
    setBonusQuiz((q) => {
      if (!q || q.answered !== null) return q;
      const ok = v === q.amount;
      const fid2 = Date.now() + Math.random();
      if (ok) { setScore((s) => s + 15); setFlash({ ok: true, text: "칩 리딩 정확! 보너스 +15", id: fid2 }); SFX.good(); }
      else { setFlash({ ok: false, text: `아깝네요 — 정답은 ${won(q.amount)}`, id: fid2 }); SFX.bad(); }
      later(() => setFlash((f) => (f && f.id === fid2 ? null : f)), 2200);
      return { ...q, answered: v };
    });
  }

  function endRound() { setRound((r) => r + 1); startRound(); }

  // ── 기록 저장 + 메인 화면 복귀 ──
  async function saveAndExit() {
    clearTimers();
    if (grabRef.current) { clearInterval(grabRef.current.timer); grabRef.current = null; setGrab(null); }
    const key = `${mode}-${custCount}`;
    const prev = records[key];
    if (!prev || score > prev.score) {
      const next = { ...records, [key]: { score, acc } };
      setRecords(next);
      try {
        localStorage.setItem("baccarat-best", JSON.stringify(next));
      } catch (e) { /* 저장 실패해도 진행 */ }
    }
    setExitConfirm(false);
    setBubble(null); bubbleQ.current = []; bubbleBusy.current = false;
    setArmOn(false);
    setScore(0); setRound(1); setDecisions({ total: 0, correct: 0 });
    setMistakes([]); setRoundMistakes([]);
    setPhase("intro");
  }

  // ═══════════ 렌더 ═══════════
  const stepList = [
    { key: "betting", label: "베팅 감시 · No More Bets" },
    { key: "dealing", label: "딜링 (P→B→P→B)" },
    { key: "callInitial", label: "초기 합계 콜링" },
    { key: "playerThird", label: "Player 3rd 판단" },
    { key: "bankerThird", label: "Banker 3rd 판단" },
    { key: "callWinner", label: "승자 콜링" },
    { key: "settleOrder", label: "정산 절차 판단" },
    { key: "takeWB", label: "테이크" },
    { key: "payWB", label: "페이 · 커미션" },
    { key: "chat", label: "손님 응대" },
  ];
  const alias = { lateBet: "betting", collecting: "takeWB", payout: "payWB", roundEnd: "chat", openPlayerCards: "dealing", openBankerCards: "dealing", openPlayerThird: "playerThird", openBankerThird: "bankerThird" };
  const phaseIdx = stepList.findIndex((s) => s.key === (alias[phase] || phase));
  const n = customers.length;
  const elbow = { x: (ARM_ORIGIN.x + armPos.x) / 2 - (armPos.x - ARM_ORIGIN.x) * 0.1, y: (ARM_ORIGIN.y + armPos.y) / 2 + 16 };
  const pct = (x, y) => ({ left: (x / SW) * 100 + "%", top: (y / SH) * 100 + "%" });

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(900px 600px at 50% -8%, #2a211a 0%, ${ROOM} 55%)`, color: IVORY, fontFamily: "'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif", padding: "16px 10px 44px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap');
        @keyframes bubIn { from {opacity:0; transform: translate(-50%,4px) scale(.95);} to {opacity:1; transform: translate(-50%,0) scale(1);} }
        .bubIn { animation: bubIn .22s ease both; }
        @keyframes flashIn { from {opacity:0; transform: translateY(-6px);} to {opacity:1; transform:none;} }
        .flashIn { animation: flashIn .22s ease both; }
        input::placeholder { color: #8a7f6e; }
      `}</style>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* 나가기 확인 */}
        {showStory && <StoryFlow onDone={() => setShowStory(false)} />}
        {showTraining && (
          <div style={{ position: "fixed", inset: 0, background: "#0d0a07", zIndex: 65, overflowY: "auto" }}>
            <TrainingMode onBack={() => setShowTraining(false)} />
          </div>
        )}
        {showGlossary && <GlossaryModal onClose={() => setShowGlossary(false)} />}
        {guideMsg && <GuideBubble title={guideMsg.title} body={guideMsg.body} onDismiss={() => setGuideMsg(null)} />}
        {exitConfirm && (
          <div onClick={() => setExitConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.62)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#241c14", border: `1px solid ${GOLD}66`, borderRadius: 14, padding: "20px 18px", maxWidth: 320, width: "100%", textAlign: "center", boxShadow: "0 12px 32px rgba(0,0,0,.6)" }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>근무를 종료할까요?</div>
              <div style={{ fontSize: 13, color: MUT, lineHeight: 1.6, marginBottom: 14 }}>현재까지의 기록이 저장되고<br />메인 화면으로 나갑니다.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setExitConfirm(false)} style={{ flex: 1, padding: "11px 8px", borderRadius: 10, background: "rgba(246,241,227,.06)", border: "1px solid rgba(246,241,227,.2)", color: IVORY, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>계속 근무</button>
                <button onClick={saveAndExit} style={{ flex: 1, padding: "11px 8px", borderRadius: 10, background: `linear-gradient(180deg, ${GOLD}, #b08c3e)`, border: "1px solid #e8caa0", color: "#1d1609", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>저장하고 나가기</button>
              </div>
            </div>
          </div>
        )}
        {/* 헤더 */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.26em", color: GOLD, fontFamily: "'Playfair Display', serif" }}>
              DEALER ACADEMY · BACCARAT <span style={{ fontStyle: "italic", letterSpacing: "0.08em" }}>(by cschi)</span>
            </div>
            <h1 style={{ margin: "3px 0 0", fontSize: 21, fontWeight: 800 }}>바카라 딜러 트레이닝</h1>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, alignItems: "flex-end" }}>
            <div style={{ textAlign: "right" }}><div style={{ color: MUT, fontSize: 10 }}>ROUND</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: GOLD }}>{round}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ color: MUT, fontSize: 10 }}>점수</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17 }}>{score}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ color: MUT, fontSize: 10 }}>정확도</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: acc >= 80 ? "#7fc98f" : acc >= 50 ? GOLD : "#d97b6c" }}>{acc}%</div></div>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => setSoundOnState((s) => !s)} title={soundOn ? "사운드 끄기" : "사운드 켜기"} style={{ width: 30, height: 30, borderRadius: 999, background: "rgba(246,241,227,.06)", border: "1px solid rgba(246,241,227,.2)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>{soundOn ? "🔊" : "🔇"}</button>
              {phase !== "intro" && (
                <button onClick={() => setExitConfirm(true)} style={{ height: 30, borderRadius: 999, background: "rgba(246,241,227,.06)", border: "1px solid rgba(246,241,227,.2)", color: MUT, cursor: "pointer", fontSize: 11, fontWeight: 700, padding: "0 11px", fontFamily: "inherit" }}>나가기</button>
              )}
            </div>
          </div>
        </header>

        {/* 인트로 */}
        {phase === "intro" && (
          <div style={{ background: "rgba(246,241,227,.04)", border: "1px solid rgba(210,171,92,.3)", borderRadius: 16, padding: "26px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>🂡</div>
            <h2 style={{ margin: "8px 0 8px", fontSize: 18 }}>딜러석에 오신 것을 환영합니다</h2>
            <p style={{ color: MUT, fontSize: 13.5, lineHeight: 1.7, maxWidth: 440, margin: "0 auto 18px" }}>
              베팅 감시부터 딜링, 3rd 카드 룰, 칩 리딩, 테이크 & 페이 컷팅, 커미션 정산, AI 손님 응대까지 — 딜러 1인칭 시점으로 전 과정을 수행합니다.
              테이블 한도 {won(TABLE_MIN)} ~ {won(TABLE_MAX)}.
            </p>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: MUT, marginBottom: 7 }}>모드</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {[["practice", "연습 — 금액 표시 · 객관식 정산"], ["real", "실전 — 칩 리딩 · 수동 컷팅"]].map(([m, label]) => (
                  <button key={m} onClick={() => setMode(m)} style={{ flex: 1, maxWidth: 220, padding: "11px 8px", borderRadius: 10, fontWeight: 800, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", lineHeight: 1.45, background: mode === m ? `linear-gradient(180deg, ${GOLD}, #b08c3e)` : "rgba(246,241,227,.06)", color: mode === m ? "#1d1609" : IVORY, border: mode === m ? "1px solid #e8caa0" : "1px solid rgba(246,241,227,.2)" }}>{label}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11.5, color: MUT, marginBottom: 7 }}>테이블 손님 수</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {[3, 4, 5, 6].map((k) => (
                  <button key={k} onClick={() => setCustCount(k)} style={{ width: 42, height: 42, borderRadius: 999, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", background: custCount === k ? `linear-gradient(180deg, ${GOLD}, #b08c3e)` : "rgba(246,241,227,.06)", color: custCount === k ? "#1d1609" : IVORY, border: custCount === k ? "1px solid #e8caa0" : "1px solid rgba(246,241,227,.2)" }}>{k}</button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12.5, marginBottom: 16, minHeight: 18 }}>
              {(() => {
                const r = records[`${mode}-${custCount}`];
                return r
                  ? <span style={{ color: GOLD }}>🏆 {mode === "real" ? "실전" : "연습"} · {custCount}인 최고 기록 — <b>{r.score}점</b> <span style={{ color: MUT }}>(정확도 {r.acc}%)</span></span>
                  : <span style={{ color: MUT }}>이 조합의 기록이 아직 없습니다 — 첫 기록을 세워 보세요</span>;
              })()}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center" }}>
              <button onClick={startRound} style={{ background: `linear-gradient(180deg, ${GOLD}, #b08c3e)`, color: "#1d1609", border: "1px solid #e8caa0", borderRadius: 999, padding: "12px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>근무 시작</button>
              <button onClick={() => setShowStory(true)} style={{ background: "rgba(246,241,227,.06)", color: IVORY, border: "1px solid rgba(246,241,227,.22)", borderRadius: 999, padding: "12px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>📖 스토리 보기</button>
              <button onClick={() => setShowGlossary(true)} style={{ background: "rgba(246,241,227,.06)", color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 999, padding: "12px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>📚 용어 사전</button>
            </div>
          </div>
        )}

        {phase !== "intro" && (
          <>
            {/* ─── 씬 ─── */}
            <div style={{ position: "relative", width: "100%", aspectRatio: `${SW}/${SH}`, marginBottom: 10, overflow: "hidden", borderRadius: 14 }}>
              <svg viewBox={`0 0 ${SW} ${SH}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                <rect x="0" y="0" width={SW} height={SH} fill="#1c1410" />
                <polygon points={`34,46 346,46 392,${SH + 8} -12,${SH + 8}`} fill="#0d5c46" stroke="#2c2017" strokeWidth="7" />
                <polygon points={`58,60 322,60 356,${SH} 24,${SH}`} fill="none" stroke="rgba(246,241,227,.22)" strokeWidth="1" strokeDasharray="5 4" />
                <text x={SW / 2} y="40" textAnchor="middle" fontSize="8" letterSpacing="3" fill="rgba(246,241,227,.45)" fontFamily="'Playfair Display',serif">BACCARAT · MIN 20만 — MAX 3,000만</text>
                {/* 슈 */}
                <rect x={POS_SHOE.x - 21} y={POS_SHOE.y - 13} width="42" height="26" rx="4" fill="#241c14" stroke={GOLD + "66"} strokeWidth="1" />
                <text x={POS_SHOE.x} y={POS_SHOE.y + 3} textAnchor="middle" fontSize="7" letterSpacing="2" fill={GOLD}>SHOE</text>
                {/* 카드 구역 */}
                <rect x={POS_BZONE.x - 66} y={POS_BZONE.y - 39} width="132" height="78" rx="8" fill="none" stroke="#c0392b88" strokeWidth="1.4" strokeDasharray="6 4" />
                <text x={POS_BZONE.x} y={POS_BZONE.y - 45} textAnchor="middle" fontSize="9" letterSpacing="2" fill="#e89a8e" fontWeight="700">BANKER</text>
                <rect x={POS_PZONE.x - 66} y={POS_PZONE.y - 39} width="132" height="78" rx="8" fill="none" stroke="#4a85c988" strokeWidth="1.4" strokeDasharray="6 4" />
                <text x={POS_PZONE.x} y={POS_PZONE.y - 45} textAnchor="middle" fontSize="9" letterSpacing="2" fill="#9dbfe6" fontWeight="700">PLAYER</text>
                {/* 베팅 스팟 */}
                {customers.map((c) => {
                  const sp = spotPos(c.seat, n);
                  return <ellipse key={c.id} cx={sp.x} cy={sp.y} rx="17" ry="8" fill="none" stroke={c.side ? sideColor[c.side] + "aa" : "rgba(246,241,227,.25)"} strokeWidth="1.3" />;
                })}
                {/* 팔 */}
                {armOn && (
                  <g>
                    <path d={`M ${ARM_ORIGIN.x} ${ARM_ORIGIN.y} Q ${elbow.x} ${elbow.y} ${armPos.x} ${armPos.y}`} stroke="#c9c2b1" strokeWidth="15" fill="none" strokeLinecap="round" />
                    <path d={`M ${ARM_ORIGIN.x} ${ARM_ORIGIN.y} Q ${elbow.x} ${elbow.y} ${armPos.x} ${armPos.y}`} stroke="#f3eee1" strokeWidth="12" fill="none" strokeLinecap="round" />
                    <circle cx={armPos.x} cy={armPos.y} r="8.5" fill="#f7f3ea" stroke="#c9c2b1" strokeWidth="1.5" />
                    <ellipse cx={armPos.x - 6} cy={armPos.y + 4} rx="3.4" ry="5" fill="#f7f3ea" stroke="#c9c2b1" strokeWidth="1" transform={`rotate(-35 ${armPos.x - 6} ${armPos.y + 4})`} />
                  </g>
                )}
              </svg>

              {/* 카드 — 합계 비표시 (직접 암산), 3rd 카드는 실제 관례대로 가로 */}
              <div style={{ position: "absolute", ...pct(POS_BZONE.x, POS_BZONE.y), transform: "translate(-50%,-50%)", display: "flex", gap: 4, alignItems: "center" }}>
                {bCards.map((c, i) => <CardView key={i} card={c} w={36} sideways={i === 2} />)}
              </div>
              <div style={{ position: "absolute", ...pct(POS_PZONE.x, POS_PZONE.y), transform: "translate(-50%,-50%)", display: "flex", gap: 4, alignItems: "center" }}>
                {pCards.map((c, i) => <CardView key={i} card={c} w={36} sideways={i === 2} />)}
              </div>

              {/* 스팟 칩 */}
              {customers.map((c) => {
                if (!c.side || c.bet <= 0) return null;
                const sp = spotPos(c.seat, n);
                return (
                  <div key={"chips" + c.id} style={{ position: "absolute", ...pct(sp.x, sp.y - 4), transform: "translate(-50%,-100%)", pointerEvents: "none" }}>
                    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", justifyContent: "center" }}>
                      <MiniStack amount={c.bet} invalid={c.invalidChip} />
                      {c.cashOnLayout && <div style={{ fontSize: 11, lineHeight: 1 }}>💵</div>}
                    </div>
                    {mode === "practice" && <div style={{ fontSize: 8.5, color: GOLD, textAlign: "center", fontWeight: 700, textShadow: "0 1px 2px #000" }}>{won(c.bet)}</div>}
                  </div>
                );
              })}

              {/* 아바타 */}
              {customers.map((c) => (
                <button key={"av" + c.id} onClick={() => setSelCust(selCust === c.id ? null : c.id)} style={{ position: "absolute", ...pct(seatX(c.seat, n), seatY(c.seat, n)), transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: 999, background: "#241c14", border: selCust === c.id ? `2px solid ${GOLD}` : "1.5px solid rgba(246,241,227,.3)", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  {c.emoji}
                </button>
              ))}
              {customers.map((c) => (
                <div key={"nm" + c.id} style={{ position: "absolute", ...pct(seatX(c.seat, n), seatY(c.seat, n) + 24), transform: "translate(-50%,0)", fontSize: 8.5, color: "rgba(246,241,227,.85)", fontWeight: 700, whiteSpace: "nowrap", textShadow: "0 1px 2px #000", pointerEvents: "none" }}>
                  {c.name}{c.side ? <span style={{ color: sideColor[c.side] }}> · {sideLabel[c.side][0]}</span> : ""}
                </div>
              ))}

              {/* 말풍선 — 가장자리 좌석은 화면 안쪽 정렬 */}
              {bubble && customers[bubble.seat] && (() => {
                const bx = seatX(bubble.seat, n);
                const by = Math.max(2, seatY(bubble.seat, n) - 26);
                const pos = bx < 105 ? { left: "2%" } : bx > 275 ? { right: "2%" } : { left: (bx / SW) * 100 + "%", transform: "translate(-50%,0)" };
                return (
                  <div className="bubIn" style={{ position: "absolute", top: (by / SH) * 100 + "%", ...pos, maxWidth: "54%", background: bubble.type === "warn" ? "rgba(120,32,24,.95)" : "rgba(246,241,227,.95)", color: bubble.type === "warn" ? "#ffd9d2" : "#26201a", borderRadius: 9, padding: "5px 9px", fontSize: 10.5, fontWeight: 700, lineHeight: 1.4, zIndex: 5, boxShadow: "0 3px 8px rgba(0,0,0,.5)" }}>
                    {bubble.text}
                  </div>
                );
              })()}

              {/* 콜링 배너 */}
              {banner && (
                <div style={{ position: "absolute", left: "50%", top: "85%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none", zIndex: 4 }}>
                  <div style={{ display: "inline-block", padding: "5px 18px", borderRadius: 999, background: "rgba(13,10,7,.78)", border: `1px solid ${GOLD}88`, fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 14.5, color: GOLD }}>“{banner.en}”</div>
                  <div style={{ fontSize: 9.5, color: "rgba(246,241,227,.75)", marginTop: 3, textShadow: "0 1px 2px #000" }}>{banner.ko}</div>
                </div>
              )}

              {/* 채점 플래시 — 레이아웃을 밀지 않는 토스트 */}
              {flash && (
                <div className="flashIn" style={{ position: "absolute", left: "50%", bottom: 6, transform: "translateX(-50%)", width: "94%", zIndex: 8, pointerEvents: "none", padding: "8px 12px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45, background: flash.ok ? "rgba(22,52,32,.94)" : "rgba(64,22,16,.94)", border: `1px solid ${flash.ok ? "rgba(127,201,143,.6)" : "rgba(217,123,108,.6)"}`, color: flash.ok ? "#9fdcab" : "#eda395", boxShadow: "0 4px 14px rgba(0,0,0,.5)" }}>
                  {flash.ok ? "✓ " : "✕ "}{flash.text}
                </div>
              )}
            </div>

            {/* 탭 상세 = 점검 화면 */}
            {selCust && (() => {
              const c = customers.find((x) => x.id === selCust);
              if (!c) return null;
              return (
                <div style={{ background: "rgba(246,241,227,.05)", border: `1px solid ${GOLD}55`, borderRadius: 12, padding: "10px 13px", marginBottom: 10, fontSize: 12.5, lineHeight: 1.6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b>{c.emoji} {c.name} <span style={{ color: MUT, fontWeight: 400 }}>{c.tag}</span></b>
                    <button onClick={() => setSelCust(null)} style={{ background: "none", border: "none", color: MUT, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
                  </div>
                  <div style={{ color: "rgba(246,241,227,.8)", marginTop: 3 }}>{c.desc}</div>
                  {c.side && (
                    <div style={{ marginTop: 6 }}>
                      <div>베팅: <b style={{ color: sideColor[c.side] }}>{sideLabel[c.side]}</b>{mode === "practice" && c.bet > 0 ? <b> · {won(c.bet)}</b> : ""}</div>
                      <div style={{ background: "rgba(13,10,7,.45)", borderRadius: 9, padding: "16px 8px 8px", marginTop: 5, overflowX: "auto" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                          <ChipStackVisual amount={c.bet} chipW={20} showAmount={false} />
                          {c.invalidChip && (
                            <div style={{ textAlign: "center" }}>
                              <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center" }}>
                                <Chip meta={chipMeta(5000)} w={20} h={8} />
                                <div style={{ marginBottom: -2 }}><Chip meta={chipMeta(1000)} w={20} h={8} /></div>
                              </div>
                            </div>
                          )}
                          {c.cashOnLayout && <div style={{ fontSize: 20 }}>💵</div>}
                        </div>
                      </div>
                      {phase === "betting" && (
                        <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
                          <button onClick={() => accuseCust(c)} style={{ flex: 1, padding: "10px 6px", borderRadius: 9, background: "rgba(193,76,60,.14)", border: "1px solid rgba(217,123,108,.5)", color: "#eda395", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>⚠ 규정 위반 지적</button>
                          <button onClick={() => setSelCust(null)} style={{ flex: 1, padding: "10px 6px", borderRadius: 9, background: "rgba(246,241,227,.06)", border: "1px solid rgba(246,241,227,.2)", color: IVORY, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>문제 없음</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ─── 액션 패널 ─── */}
            <div style={{ background: "rgba(246,241,227,.04)", border: "1px solid rgba(246,241,227,.12)", borderRadius: 14, padding: "14px 14px 16px", marginBottom: 12 }}>
              {phase === "betting" && (
                <>
                  <PanelTitle t="STEP 1 — 베팅 감시" d={bettingDone ? "베팅이 잦아들었습니다. 이상 베팅이 없는지 좌석을 점검하고 마감하세요." : "베팅이 들어오고 있습니다. 수상한 스택은 좌석을 탭해 점검하세요 (점검은 자유, 오지적은 감점)."} />
                  <ActionBtn accent disabled={!bettingDone} onClick={noMoreBets}>
                    {bettingDone ? "🔔 “No More Bets” — 베팅 마감 선언" : "베팅 진행 중… (잦아들 때까지 대기)"}
                  </ActionBtn>
                </>
              )}

              {phase === "lateBet" && lateBet && (
                <>
                  <PanelTitle t="⚠ 돌발 — 마감 후 베팅 시도" d={`${lateBet.emoji} ${lateBet.name} 님이 마감 직후 칩을 밀어 넣으려 합니다.`} />
                  <div style={{ display: "grid", gap: 8 }}>
                    {lateBetBtnOrder ? (
                      <>
                        <ActionBtn onClick={() => resolveLateBet(true)}>🖐 “No more bets, sir.” — 정중히 거절하고 칩을 돌려드린다</ActionBtn>
                        <ActionBtn onClick={() => resolveLateBet(false)}>이번 한 번만 받아준다</ActionBtn>
                      </>
                    ) : (
                      <>
                        <ActionBtn onClick={() => resolveLateBet(false)}>이번 한 번만 받아준다</ActionBtn>
                        <ActionBtn onClick={() => resolveLateBet(true)}>🖐 “No more bets, sir.” — 정중히 거절하고 칩을 돌려드린다</ActionBtn>
                      </>
                    )}
                  </div>
                </>
              )}

              {phase === "dealing" && (
                <>
                  <PanelTitle t={`STEP 2 — 딜링 (${Math.min(dealtCount + 1, 4)}/4)`} d="슈에서 카드를 뽑았습니다. 어느 쪽에?" />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => dealTo("B")} style={dealBtnStyle(RED)}>← BANKER</button>
                    <button onClick={() => dealTo("P")} style={dealBtnStyle(BLUE)}>PLAYER →</button>
                  </div>
                </>
              )}

              {phase === "openPlayerCards" && (
                <>
                  <PanelTitle t="STEP 2 — Player 카드 오픈" d="Player 카드 2장을 앞면으로 뒤집어 보여줍니다." />
                  <ActionBtn accent onClick={openPlayerCards}>오픈</ActionBtn>
                </>
              )}

              {phase === "openBankerCards" && (
                <>
                  <PanelTitle t="STEP 2 — Banker 카드 오픈" d="Banker 카드 2장을 앞면으로 뒤집어 보여줍니다." />
                  <ActionBtn accent onClick={openBankerCards}>오픈</ActionBtn>
                </>
              )}

              {phase === "openPlayerThird" && (
                <>
                  <PanelTitle t="STEP 4 — Player 3번째 카드 오픈" d="Player 3번째 카드를 앞면으로 공개합니다." />
                  <ActionBtn accent onClick={openPlayerThird}>오픈</ActionBtn>
                </>
              )}

              {phase === "openBankerThird" && (
                <>
                  <PanelTitle t="STEP 5 — Banker 3번째 카드 오픈" d="Banker 3번째 카드를 앞면으로 공개합니다." />
                  <ActionBtn accent onClick={openBankerThird}>오픈</ActionBtn>
                </>
              )}

              {phase === "callInitial" && (
                <>
                  <PanelTitle t="STEP 3 — 초기 합계 콜링" d="양쪽 합계를 콜하세요." />
                  <div style={{ display: "grid", gap: 8 }}>
                    {callOptions.map((o, i) => <ActionBtn key={i} onClick={() => pickInitialCall(o)}>🎙 “{o.label}”</ActionBtn>)}
                  </div>
                </>
              )}

              {phase === "playerThird" && (
                <>
                  <PanelTitle t="STEP 4 — Player 3rd 판단" d={`Player ${handTotal(pCards)}, Banker ${handTotal(bCards)}. Player에게 추가 카드?`} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => playerThirdDecision(true)} style={dealBtnStyle(BLUE)}>“Card for Player”</button>
                    <button onClick={() => playerThirdDecision(false)} style={dealBtnStyle("#7a7264")}>스탠드</button>
                  </div>
                </>
              )}

              {phase === "bankerThird" && (
                <>
                  <PanelTitle t="STEP 5 — Banker 3rd 판단" d={`Banker ${handTotal(bCards)}${pThirdRef.current === null ? " · Player 스탠드" : ` · Player 3rd 값: ${pThirdRef.current}`}. Banker에게 추가 카드?`} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => bankerThirdDecision(true)} style={dealBtnStyle(RED)}>“Card for Banker”</button>
                    <button onClick={() => bankerThirdDecision(false)} style={dealBtnStyle("#7a7264")}>스탠드</button>
                  </div>
                </>
              )}

              {phase === "callWinner" && (
                <>
                  <PanelTitle t="STEP 6 — 승자 콜링" d={`최종 — Player ${result?.pT}, Banker ${result?.bT}.`} />
                  <div style={{ display: "grid", gap: 8 }}>
                    {callOptions.map((o, i) => <ActionBtn key={i} onClick={() => pickWinnerCall(o)}>🎙 “{o.label}”</ActionBtn>)}
                  </div>
                </>
              )}

              {phase === "settleOrder" && result && (
                <>
                  <PanelTitle t="STEP 7 — 정산 절차 판단" d={result.winner === "tie" ? "타이입니다. 정산 절차는?" : "정산의 첫 번째 동작은?"} />
                  <div style={{ display: "grid", gap: 8 }}>
                    {settleOrderOpts.map((o, i) => <ActionBtn key={i} onClick={() => pickSettleOrder(o.ok)}>{o.label}</ActionBtn>)}
                  </div>
                </>
              )}

              {phase === "collecting" && <PanelTitle t="테이크 진행 중" d="지는 베팅을 좌석 순서대로 수거하고 있습니다…" />}

              {/* 실전 테이크 워크벤치 */}
              {phase === "takeWB" && takeState && (
                <div>
                  <PanelTitle t="STEP 8 — 테이크 (수동)" d="지는 베팅 스택을 탭하면 수거 확인창이 뜹니다. 이긴 베팅·푸시는 손대면 안 됩니다." />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 7, marginBottom: 10 }}>
                    {customers.filter((c) => c.side).map((c) => {
                      const taken = takeState.taken[c.id];
                      const isConfirming = takeConfirm && takeConfirm.id === c.id;
                      return (
                        <div key={c.id} style={{ position: "relative" }}>
                          <div onClick={() => { if (!taken && !isConfirming) setTakeConfirm({ id: c.id, cust: c }); }} style={{ background: taken ? "rgba(127,201,143,.08)" : "rgba(13,10,7,.5)", border: `1px solid ${taken ? "rgba(127,201,143,.4)" : isConfirming ? GOLD : "rgba(246,241,227,.18)"}`, borderRadius: 10, padding: "8px 6px", textAlign: "center", cursor: taken ? "default" : "pointer", userSelect: "none", WebkitTapHighlightColor: "transparent", opacity: taken ? 0.55 : 1 }}>
                            <div style={{ fontSize: 16 }}>{c.emoji}</div>
                            <div style={{ fontSize: 10.5, fontWeight: 700 }}>{c.name}</div>
                            <div style={{ fontSize: 9.5, color: sideColor[c.side], fontWeight: 800 }}>{sideLabel[c.side]}</div>
                            <div style={{ display: "flex", justifyContent: "center", marginTop: 4, minHeight: 30 }}>
                              {taken ? <div style={{ fontSize: 10, color: "#9fdcab", fontWeight: 700 }}>수거 ✓</div> : <MiniStack amount={c.bet} />}
                            </div>
                            {mode === "practice" && !taken && <div style={{ fontSize: 9, color: GOLD }}>{won(c.bet)}</div>}
                          </div>
                          {isConfirming && (
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(13,10,7,.92)", borderRadius: 10, border: `1px solid ${GOLD}88`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, zIndex: 10 }}>
                              <div style={{ fontSize: 10, color: IVORY, fontWeight: 700 }}>수거?</div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => { handleTakeDrop(c); if (c.side !== result.winner) { moveArm(spotPos(c.seat, customers.length), "테이크"); later(() => moveArm(POS_TRAY, ""), 500); } setTakeConfirm(null); }} style={{ background: GOLD, color: "#1d1609", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>수거</button>
                                <button onClick={() => setTakeConfirm(null)} style={{ background: "rgba(246,241,227,.08)", color: IVORY, border: "1px solid rgba(246,241,227,.2)", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <ActionBtn accent onClick={confirmTake}>테이크 완료</ActionBtn>
                </div>
              )}

              {/* 실전 페이 워크벤치 — 어림 집기 → 스프레드 → 탭 조정 → 확정 */}
              {phase === "payWB" && payWB && curWinner && (
                <div>
                  <PanelTitle t={`STEP 9 — 페이 (${payWB.idx + 1}/${payWB.queue.length}) · ${curWinner.emoji} ${curWinner.name}`} />
                  {result.winner === "banker"
                    ? <StepBar steps={["페이", "커미션", "수거", "환급"]} cur={["pay", "comm", "collect", "refund"].indexOf(payWB.step)} />
                    : <StepBar steps={[result.winner === "tie" ? "타이 8:1 페이" : "1:1 페이"]} cur={0} />}

                  <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, height: 138, overflowY: "auto", background: "rgba(13,10,7,.5)", borderRadius: 10, padding: "8px 9px", boxSizing: "border-box" }}>
                      <div style={{ fontSize: 10, color: MUT, marginBottom: 6, fontWeight: 700 }}>손님 베팅 스택 {result.winner === "tie" ? "(×8 지급)" : "(1:1 기준)"}</div>
                      <ChipStackVisual amount={curWinner.bet} chipW={22} showAmount={mode === "practice"} />
                    </div>
                    <div style={{ flex: 1.2, height: 138, overflowY: "auto", background: "rgba(210,171,92,.06)", border: `2px dashed ${GOLD}66`, borderRadius: 10, padding: "8px 9px", boxSizing: "border-box" }}>
                      <div style={{ fontSize: 10, color: GOLD, marginBottom: 6, fontWeight: 700 }}>
                        {payWB.step === "pay" ? "지급 구역 — 컷 탭=묶음 반환 · 낱개 탭=1개 반환" : payWB.step === "collect" ? "지급 스택 — 컷 탭=묶음 수거 · 낱개 탭=1개 수거" : "지급 스택"}
                      </div>
                      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "flex-end", minHeight: 44 }}>
                        {payWB.zone.length === 0 && <div style={{ fontSize: 11, color: MUT }}>비어 있음 — 트레이에서 어림으로 집어 오세요</div>}
                        {payWB.zone.map((g) => (
                          <SpreadGroups key={g.denom} denom={g.denom} count={g.count} chipW={22}
                            onTapGroup={payWB.step === "pay" || payWB.step === "collect" ? tapPayGroup : undefined} />
                        ))}
                      </div>
                      {mode === "practice" && payWB.step === "pay" && <div style={{ fontSize: 10.5, color: GOLD, marginTop: 5 }}>현재 {won(groupsTotal(payWB.zone))} / 목표 {won(payRequired)}</div>}
                      {payWB.step === "pay" && payWB.zone.length > 0 && (
                        <button onClick={regatherZone} style={{ marginTop: 7, background: "none", border: "1px solid rgba(246,241,227,.25)", color: MUT, borderRadius: 999, padding: "3px 11px", fontSize: 10.5, cursor: "pointer", fontFamily: "inherit" }}>↩ 전량 뭉쳐서 트레이로 반환</button>
                      )}
                    </div>
                  </div>

                  {(payWB.step === "pay" || payWB.step === "refund") && (
                    <div style={{ background: "rgba(36,28,20,.7)", border: "1px solid rgba(210,171,92,.35)", borderRadius: 10, padding: "8px 9px 10px", marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: GOLD, fontWeight: 700, marginBottom: 6 }}>
                        칩 트레이 — 꾹 누르면 어림으로 집힙니다 (오래 누를수록 많이 · 개수는 펼쳐 봐야 압니다)
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                        {CHIPS.map((meta) => {
                          const grabbing = grab && grab.denom === meta.v;
                          return (
                            <div key={meta.v}
                              onPointerDown={(e) => { e.preventDefault(); grabStart(meta.v); }}
                              onPointerUp={grabEnd}
                              onPointerLeave={grabEnd}
                              onPointerCancel={grabEnd}
                              onContextMenu={(e) => e.preventDefault()}
                              style={{ textAlign: "center", cursor: "grab", touchAction: "none", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none", WebkitTapHighlightColor: "transparent", flex: 1, borderRadius: 9, padding: "4px 2px 5px", background: grabbing ? "rgba(210,171,92,.18)" : "transparent", border: grabbing ? `1px solid ${GOLD}` : "1px solid transparent", transform: grabbing ? "scale(1.06)" : "none", transition: "transform .12s" }}>
                              <div style={{ position: "relative", width: 26, height: 34, margin: "0 auto", pointerEvents: "none" }}>
                                {[0, 1, 2, 3].map((k) => <div key={k} style={{ position: "absolute", bottom: k * 6.5, left: 0 }}><Chip meta={meta} w={26} h={10} /></div>)}
                              </div>
                              <div style={{ fontSize: 9, color: grabbing ? GOLD : "rgba(246,241,227,.85)", fontWeight: 800, marginTop: 2, pointerEvents: "none" }}>{grabbing ? "집는 중…" : meta.name}</div>
                              <div style={{ fontSize: 8, color: MUT, pointerEvents: "none" }}>{meta.v >= MAN ? meta.v / MAN + "만" : meta.v / 1000 + "천"}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {payWB.step === "comm" && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 13, marginBottom: 8 }}>페이한 스택을 컷팅하며 확인합니다 — <b style={{ color: GOLD }}>커미션 5%는 얼마?</b></div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input inputMode="numeric" value={payWB.commInput} onChange={(e) => setPayWB((wb) => ({ ...wb, commInput: e.target.value }))} placeholder="원 단위 입력 (예: 55000)" style={{ flex: 1, background: "rgba(246,241,227,.06)", border: "1px solid rgba(246,241,227,.2)", borderRadius: 10, padding: "11px 13px", color: IVORY, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                        <button onClick={confirmComm} style={{ background: `linear-gradient(180deg, ${GOLD}, #b08c3e)`, color: "#1d1609", border: "1px solid #e8caa0", borderRadius: 10, padding: "0 18px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>확인</button>
                      </div>
                    </div>
                  )}

                  {payWB.step === "collect" && (
                    <div style={{ border: `2px dashed ${GOLD}66`, background: "rgba(36,28,20,.7)", borderRadius: 10, padding: "9px 10px", marginBottom: 10, height: 104, overflowY: "auto", boxSizing: "border-box" }}>
                      <div style={{ fontSize: 10.5, color: GOLD, fontWeight: 700, marginBottom: 5 }}>
                        수거 구역 — 위 지급 스택을 탭해 가져옵니다 (탭하면 되돌림){mode === "practice" && <span style={{ color: MUT }}> · 커미션 {won(commission)}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "flex-end", minHeight: 30 }}>
                        {payWB.collected.length === 0 && <div style={{ fontSize: 11, color: MUT }}>비어 있음</div>}
                        {payWB.collected.map((g) => (
                          <SpreadGroups key={g.denom} denom={g.denom} count={g.count} chipW={20} onTapGroup={tapCollectedGroup} />
                        ))}
                      </div>
                      {mode === "practice" && <div style={{ fontSize: 10.5, color: "rgba(246,241,227,.8)", marginTop: 4 }}>회수: <b style={{ color: GOLD }}>{won(groupsTotal(payWB.collected))}</b></div>}
                    </div>
                  )}

                  {payWB.step === "refund" && (
                    <div style={{ border: "2px dashed rgba(127,201,143,.5)", background: "rgba(74,160,98,.07)", borderRadius: 10, padding: "9px 10px", marginBottom: 10, height: 118, overflowY: "auto", boxSizing: "border-box" }}>
                      <div style={{ fontSize: 10.5, color: "#9fdcab", fontWeight: 700, marginBottom: 5 }}>환급 구역 — 트레이에서 어림으로 집어 거스름을 만드세요 (컷 탭=묶음 · 낱개 탭=1개 반환) {mode === "practice" && <span style={{ color: MUT }}>· 목표 {won(groupsTotal(payWB.collected) - commission)}</span>}</div>
                      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "flex-end", minHeight: 30 }}>
                        {payWB.refundZone.length === 0 && <div style={{ fontSize: 11, color: MUT }}>비어 있음</div>}
                        {payWB.refundZone.map((g) => (
                          <SpreadGroups key={g.denom} denom={g.denom} count={g.count} chipW={20} onTapGroup={tapRefundGroup} />
                        ))}
                      </div>
                      {payWB.refundZone.length > 0 && (
                        <button onClick={regatherZone} style={{ marginTop: 6, background: "none", border: "1px solid rgba(246,241,227,.25)", color: MUT, borderRadius: 999, padding: "3px 11px", fontSize: 10.5, cursor: "pointer", fontFamily: "inherit" }}>↩ 전량 반환</button>
                      )}
                    </div>
                  )}

                  {payWB.step === "pay" && <ActionBtn accent onClick={confirmPay}>지급 확정 — 사이징 체크</ActionBtn>}
                  {payWB.step === "collect" && <ActionBtn accent onClick={confirmCollect}>수거 확정</ActionBtn>}
                  {payWB.step === "refund" && <ActionBtn accent onClick={confirmRefund}>환급 확정</ActionBtn>}
                </div>
              )}

              {/* 연습 페이 MC */}
              {phase === "payout" && payQueue[payIdx] && (
                <>
                  <PanelTitle t={`STEP 9 — 페이 (${payIdx + 1}/${payQueue.length})`} d={payQueue[payIdx].question} />
                  <div style={{ display: "grid", gap: 8 }}>
                    {payQueue[payIdx].options.map((o, i) => <ActionBtn key={i} onClick={() => pickPayoutMC(o)}>💰 {o.label}</ActionBtn>)}
                  </div>
                </>
              )}

              {/* 응대 */}
              {phase === "chat" && chatCust && (
                <>
                  <PanelTitle t={`STEP 10 — 손님 응대: ${chatCust.emoji} ${chatCust.name}`} d={`${chatCust.tag} · ${chatCust.outcome === "win" ? "적중" : chatCust.outcome === "push" ? "푸시" : "실패"}${pressure > 0 ? ` · ⏳ 테이블 압박 ${pressure}/3` : ""}`} />
                  <div ref={chatBoxRef} onScroll={(e) => { const el = e.currentTarget; chatPinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; }} style={{ background: "rgba(13,10,7,.5)", borderRadius: 12, padding: 11, maxHeight: 240, overflowY: "auto", marginBottom: 9 }}>
                    {chatLog.map((m, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: m.role === "dealer" ? "flex-end" : "flex-start", marginBottom: 8 }}>
                        <div style={{ maxWidth: "84%", padding: "8px 12px", borderRadius: 11, fontSize: 13.3, lineHeight: 1.55, background: m.role === "dealer" ? "rgba(210,171,92,.18)" : "rgba(246,241,227,.08)", border: m.role === "dealer" ? `1px solid ${GOLD}55` : "1px solid rgba(246,241,227,.12)" }}>
                          <span style={{ fontSize: 10.5, color: MUT, display: "block", marginBottom: 2 }}>{m.role === "dealer" ? "나 (딜러)" : `${chatCust.name} ${m.mood || ""}`}</span>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {chatBusy && <div style={{ fontSize: 12, color: MUT }}>{chatCust.name} 님이 반응하는 중… (압박 정지)</div>}
                  </div>
                  {!chatDone && (
                    <>
                      {quickReplies === null && <div style={{ fontSize: 11.5, color: MUT, marginBottom: 8 }}>추천 응대 준비 중…</div>}
                      {quickReplies && quickReplies.length > 0 && (
                        <div style={{ display: "grid", gap: 6, marginBottom: 8 }}>
                          {quickReplies.map((q, i) => (
                            <button key={i} onClick={() => sendChat(q)} disabled={chatBusy} style={{ background: "rgba(246,241,227,.05)", border: "1px solid rgba(210,171,92,.4)", color: IVORY, borderRadius: 999, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", textAlign: "left", fontFamily: "inherit", opacity: chatBusy ? 0.5 : 1 }}>💬 {q}</button>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="직접 응대 입력…" style={{ flex: 1, background: "rgba(246,241,227,.06)", border: "1px solid rgba(246,241,227,.2)", borderRadius: 10, padding: "11px 13px", color: IVORY, fontSize: 13.5, outline: "none", fontFamily: "inherit" }} />
                        <button onClick={() => sendChat()} disabled={chatBusy || !chatInput.trim()} style={{ background: `linear-gradient(180deg, ${GOLD}, #b08c3e)`, color: "#1d1609", border: "1px solid #e8caa0", borderRadius: 10, padding: "0 16px", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: chatBusy || !chatInput.trim() ? 0.5 : 1, fontFamily: "inherit" }}>응대</button>
                      </div>
                    </>
                  )}
                  <ActionBtn accent onClick={endChatToRound}>{chatDone ? "라운드 마무리 →" : "▶ “게임 진행하겠습니다” — 대화 정리하고 진행"}</ActionBtn>
                </>
              )}

              {/* 라운드 종료 */}
              {phase === "roundEnd" && (
                <>
                  <PanelTitle t={`라운드 ${round} 종료`} d={roundMistakes.length === 0 ? "절차 실수 없음 — 깔끔한 라운드였습니다." : `이번 라운드 실수 ${roundMistakes.length}건 — 실수 노트에 기록됨.`} />
                  {coaching.state === "loading" && <div style={{ fontSize: 12.5, color: MUT, marginBottom: 10 }}>🚬 오 반장이 다가옵니다…</div>}
                  {coaching.state === "done" && (
                    <div style={{ background: "rgba(210,171,92,.08)", border: "1px dashed rgba(210,171,92,.45)", borderRadius: 10, padding: "10px 13px", fontSize: 13, color: GOLD, lineHeight: 1.6, marginBottom: 10 }}>
                      🗣 <b>오 반장</b> — {coaching.text}
                    </div>
                  )}
                  {coaching.state === "pass" && chatLog.length > 0 && <div style={{ fontSize: 12, color: MUT, marginBottom: 10 }}>오 반장이 고개만 끄덕이고 지나갑니다. (무소식이 칭찬)</div>}
                  {bonusQuiz && (
                    <div style={{ background: "rgba(13,10,7,.5)", borderRadius: 12, padding: "11px 13px", marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 8 }}>⚡ 보너스 — 칩 리딩 (순간 판독)</div>
                      {bonusQuiz.revealed ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 8px" }}><ChipStackVisual amount={bonusQuiz.amount} chipW={24} /></div>
                      ) : bonusQuiz.answered === null ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                          {bonusQuiz.options.map((v, i) => <ActionBtn key={i} onClick={() => answerBonus(v)}>{won(v)}</ActionBtn>)}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12.5, color: bonusQuiz.answered === bonusQuiz.amount ? "#9fdcab" : "#eda395" }}>
                          {bonusQuiz.answered === bonusQuiz.amount ? "✓ 정확한 리딩!" : `✕ 정답: ${won(bonusQuiz.amount)}`}
                        </div>
                      )}
                    </div>
                  )}
                  <ActionBtn accent onClick={endRound} disabled={bonusQuiz ? bonusQuiz.revealed : false}>다음 라운드 시작 →</ActionBtn>
                  <div style={{ display: "flex", gap: 8, marginTop: 9, alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, color: MUT }}>모드:</span>
                    {[["practice", "연습"], ["real", "실전"]].map(([m, l]) => (
                      <button key={m} onClick={() => setMode(m)} style={{ background: mode === m ? "rgba(210,171,92,.2)" : "none", border: `1px solid ${mode === m ? GOLD : "rgba(246,241,227,.2)"}`, color: mode === m ? GOLD : MUT, borderRadius: 999, padding: "3px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 하단 패널 */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px", background: "rgba(246,241,227,.035)", border: "1px solid rgba(246,241,227,.1)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.16em", color: MUT, marginBottom: 8 }}>표준 절차</div>
                {stepList.map((s, i) => (
                  <div key={s.key} style={{ display: "flex", gap: 7, fontSize: 12.3, padding: "2.5px 0", color: i < phaseIdx ? "#8dbf98" : i === phaseIdx ? GOLD : "rgba(246,241,227,.4)" }}>
                    <span style={{ width: 13 }}>{i < phaseIdx ? "✓" : i === phaseIdx ? "▸" : "·"}</span>{s.label}
                  </div>
                ))}
              </div>
              <div style={{ flex: "1 1 250px", background: "rgba(246,241,227,.035)", border: "1px solid rgba(246,241,227,.1)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.16em", color: MUT, marginBottom: 8 }}>실수 노트 ({mistakes.length})</div>
                {mistakes.length === 0 ? (
                  <div style={{ fontSize: 12.3, color: "rgba(246,241,227,.45)" }}>아직 기록된 실수가 없습니다. 완벽한 근무 중!</div>
                ) : (
                  <div style={{ maxHeight: 160, overflowY: "auto" }}>
                    {mistakes.map((m, i) => (
                      <div key={i} style={{ fontSize: 12, lineHeight: 1.5, padding: "6px 0", borderBottom: "1px solid rgba(246,241,227,.07)" }}>
                        <span style={{ color: "#d97b6c", fontWeight: 700 }}>R{m.round} · {m.text}</span>
                        {m.fix && <div style={{ color: MUT, marginTop: 2 }}>→ {m.fix}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ flex: "1 1 100%", background: "rgba(246,241,227,.035)", border: "1px solid rgba(246,241,227,.1)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <button onClick={() => setShowChipChart(!showChipChart)} style={{ background: "none", border: "none", color: GOLD, fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>{showChipChart ? "▾" : "▸"} 칩 컬러 차트</button>
                  <GlossaryToggle />
                  <button onClick={() => setShowHint(!showHint)} style={{ background: "none", border: "none", color: GOLD, fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>{showHint ? "▾" : "▸"} 3rd 카드 룰 차트</button>
                </div>
                {showChipChart && (
                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {CHIPS.map((m) => (
                      <div key={m.v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <Chip meta={m} w={22} h={9} />
                        <span><b>{m.name}</b> {won(m.v)}{!BETTABLE.includes(m.v) && <span style={{ color: "#eda395" }}> · 베팅 불가</span>}</span>
                      </div>
                    ))}
                  </div>
                )}
                {showHint && (
                  <div style={{ marginTop: 10, fontSize: 12.3, lineHeight: 1.65, color: "rgba(246,241,227,.85)" }}>
                    <div style={{ marginBottom: 5 }}><b style={{ color: BLUE }}>PLAYER</b> — 0~5: 카드 / 6~7: 스탠드 / 8~9: 내추럴</div>
                    <div style={{ marginBottom: 4 }}><b style={{ color: RED }}>BANKER</b> — Player 스탠드 시: 0~5 카드, 6~7 스탠드. Player 3rd 카드의 <b>값</b> 기준:</div>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11.8 }}>
                      <thead><tr style={{ color: MUT }}><th style={thtd}>Banker</th><th style={thtd}>카드 (P 3rd 값)</th><th style={thtd}>스탠드</th></tr></thead>
                      <tbody>
                        <tr><td style={thtd}>0–2</td><td style={thtd}>항상</td><td style={thtd}>—</td></tr>
                        <tr><td style={thtd}>3</td><td style={thtd}>8 제외 전부</td><td style={thtd}>8</td></tr>
                        <tr><td style={thtd}>4</td><td style={thtd}>2–7</td><td style={thtd}>0,1,8,9</td></tr>
                        <tr><td style={thtd}>5</td><td style={thtd}>4–7</td><td style={thtd}>0–3,8,9</td></tr>
                        <tr><td style={thtd}>6</td><td style={thtd}>6–7</td><td style={thtd}>0–5,8,9</td></tr>
                        <tr><td style={thtd}>7</td><td style={thtd}>—</td><td style={thtd}>항상</td></tr>
                      </tbody>
                    </table>
                    <div style={{ marginTop: 7, color: MUT }}>배당 — P 1:1 · B 1:1 (커미션 5%: 페이→확인→수거→환급) · Tie 8:1 (P/B는 푸시)</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
