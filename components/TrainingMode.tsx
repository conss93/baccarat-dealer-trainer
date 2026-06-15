// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { GOLD, IVORY, MUT, RED, BLUE } from "@/lib/constants";
import { drawCard, cardValue, handTotal, bankerShouldDraw, won } from "@/lib/utils";
import { CardView } from "@/components/GameUI";
import { SFX } from "@/lib/sound";

const MAN = 10000;

const AMOUNTS = [100,150,200,250,300,400,500,600,750,1000,175,340,450,680,1250].map(n=>n*MAN);

function makeCommissionQ() {
  const amt = AMOUNTS[Math.floor(Math.random()*AMOUNTS.length)];
  const correct = Math.round(amt*0.05);
  const candidates = [Math.round(amt*0.10),Math.round(amt*0.03),Math.round(amt*0.025),correct+10*MAN,Math.abs(correct-5*MAN),Math.round(amt*0.07)].filter(v=>v!==correct&&v>0);
  const wrongs = [];
  const seen = new Set([correct]);
  for (const c of candidates) { if (!seen.has(c)&&wrongs.length<2){seen.add(c);wrongs.push(c);} }
  while(wrongs.length<2) wrongs.push(correct+(wrongs.length+1)*5*MAN);
  const options = [correct,...wrongs].sort(()=>Math.random()-0.5);
  return {amt,correct,options};
}

function playerHintText(total) {
  if (total<=5) return `플레이어 합계 ${total} → 0~5 이므로 드로우`;
  return `플레이어 합계 ${total} → 6~7 이므로 스탠드`;
}

function bankerHintText(bTotal,pThird) {
  if (pThird===null) {
    if (bTotal<=5) return `플레이어 스탠드 → 뱅커 합계 ${bTotal} (0~5) → 드로우`;
    return `플레이어 스탠드 → 뱅커 합계 ${bTotal} (6~7) → 스탠드`;
  }
  if (bTotal<=2) return `뱅커 합계 ${bTotal} → 0~2면 무조건 드로우`;
  if (bTotal===3) return `뱅커 합계 3 → 플레이어 3rd가 8이 아니면 드로우 (현재 ${pThird})`;
  if (bTotal===4) return `뱅커 합계 4 → 플레이어 3rd가 2~7이면 드로우 (현재 ${pThird})`;
  if (bTotal===5) return `뱅커 합계 5 → 플레이어 3rd가 4~7이면 드로우 (현재 ${pThird})`;
  if (bTotal===6) return `뱅커 합계 6 → 플레이어 3rd가 6~7이면 드로우 (현재 ${pThird})`;
  return `뱅커 합계 7 → 항상 스탠드`;
}

const btnStyle = (accent) => ({
  width:"100%",padding:"13px 16px",borderRadius:10,fontSize:14,fontWeight:700,
  cursor:"pointer",fontFamily:"inherit",textAlign:"center",
  background:accent?`linear-gradient(180deg, ${GOLD}, #b08c3e)`:"rgba(246,241,227,.06)",
  color:accent?"#1d1609":IVORY,
  border:accent?"1px solid #e8caa0":"1px solid rgba(246,241,227,.2)",
});

const HintBox = ({text}) => (
  <div style={{padding:"10px 14px",borderRadius:8,background:"rgba(210,171,92,.1)",border:`1px solid ${GOLD}33`,fontSize:12.5,color:GOLD,marginBottom:12,lineHeight:1.65}}>
    💡 {text}
  </div>
);

const Feedback = ({ok,msg}) => (
  <div style={{padding:"10px 14px",borderRadius:10,background:ok?"rgba(127,201,143,.15)":"rgba(220,80,80,.15)",border:`1px solid ${ok?"#7fc98f":"#dc5050"}55`,fontSize:13,color:ok?"#9fdcab":"#f08080",lineHeight:1.6,marginBottom:12}}>
    {msg}
  </div>
);

const IntroCard = ({lines,onStart,onBack}) => (
  <div style={{padding:"20px 16px"}}>
    <div style={{background:"rgba(210,171,92,.07)",border:`1px solid ${GOLD}44`,borderRadius:14,padding:"20px 16px",marginBottom:16}}>
      <div style={{fontSize:12,color:GOLD,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>오반장의 한마디</div>
      <div style={{fontSize:14,color:IVORY,lineHeight:1.85}}>{lines}</div>
    </div>
    <button onClick={onStart} style={btnStyle(true)}>시작</button>
    <button onClick={onBack} style={{...btnStyle(false),marginTop:8,color:MUT,border:"none",background:"none"}}>← 뒤로</button>
  </div>
);

function CardDrawMode({onBack}) {
  const seen = typeof window!=="undefined"&&localStorage.getItem("training-card-seen");
  const [showIntro,setShowIntro] = useState(!seen);
  const [pCards,setPCards] = useState([]);
  const [bCards,setBCards] = useState([]);
  const [step,setStep] = useState("idle");
  const [hint,setHint] = useState(false);
  const [feedback,setFeedback] = useState(null);
  const [roundCount,setRoundCount] = useState(0);

  function newRound() {
    const p1=drawCard(),b1=drawCard(),p2=drawCard(),b2=drawCard();
    const p=[p1,p2],b=[b1,b2];
    const pT=handTotal(p),bT=handTotal(b);
    setPCards(p);setBCards(b);setFeedback(null);setHint(false);
    setRoundCount(r=>r+1);
    setStep(pT>=8||bT>=8?"natural":"playerDecision");
  }

  function answerPlayer(draw) {
    if (feedback) return;
    const pT=handTotal(pCards);
    const correct=pT<=5;
    const ok=draw===correct;
    const msg=ok?`정확합니다! 플레이어 합계 ${pT} → ${correct?"드로우":"스탠드"}`:`오답. 플레이어 합계 ${pT} → ${correct?"드로우":"스탠드"}가 맞습니다.`;
    ok?SFX.good():SFX.bad();
    const newP=draw?[...pCards,drawCard()]:[...pCards];
    if(ok){setPCards(newP);setFeedback({ok,msg});setTimeout(()=>setFeedback(null),1200);setStep("bankerDecision");}
    else{setFeedback({ok,msg});setTimeout(()=>{setPCards(newP);setFeedback(null);setHint(false);setStep("bankerDecision");},1800);}
  }

  function answerBanker(draw) {
    if (feedback) return;
    const bT=handTotal(bCards);
    const pThird=pCards[2]?cardValue(pCards[2]):null;
    const correct=bankerShouldDraw(bT,pThird);
    const ok=draw===correct;
    const msg=ok?`정확합니다! 뱅커 합계 ${bT} → ${correct?"드로우":"스탠드"}`:`오답. 뱅커 합계 ${bT} → ${correct?"드로우":"스탠드"}가 맞습니다.`;
    ok?SFX.good():SFX.bad();
    const newB=draw?[...bCards,drawCard()]:[...bCards];
    if(ok){setBCards(newB);setFeedback({ok,msg});setTimeout(()=>{setFeedback(null);setStep("result");},1000);}
    else{setFeedback({ok,msg});setTimeout(()=>{setBCards(newB);setFeedback(null);setStep("result");},1800);}
  }

  const pT=handTotal(pCards),bT=handTotal(bCards);
  const winner=pT>bT?"PLAYER":bT>pT?"BANKER":"TIE";
  const wColor=winner==="PLAYER"?BLUE:winner==="BANKER"?RED:GOLD;

  if(showIntro) return (
    <IntroCard
      lines={<>카드 드로우 연습이야.<br/><br/>내가 4장을 딜하면, 네가 3rd 카드 드로우 여부를 판단해.<br/><br/><b>플레이어</b>는 합계 0~5면 드로우, 6~7이면 스탠드.<br/><b>뱅커</b>는 플레이어 결과에 따라 차트가 달라져 — 힌트 버튼 활용해.<br/><br/>틀려도 돼, 정답 바로 알려줄게.</>}
      onStart={()=>{localStorage.setItem("training-card-seen","1");setShowIntro(false);newRound();}}
      onBack={onBack}
    />
  );

  if(step==="idle") return <div style={{padding:16}}><button onClick={newRound} style={btnStyle(true)}>시작</button></div>;

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:MUT,cursor:"pointer",fontSize:13,padding:0}}>← 뒤로</button>
        <div style={{fontSize:11,color:GOLD,fontWeight:700,letterSpacing:"0.15em"}}>카드 드로우 연습</div>
        <div style={{fontSize:12,color:MUT}}>#{roundCount}</div>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:20}}>
        <div style={{flex:1}}>
          <div style={{fontSize:10.5,color:RED,fontWeight:700,letterSpacing:"0.1em",marginBottom:6}}>BANKER · {bT}</div>
          <div style={{display:"flex",gap:4}}>{bCards.map((c,i)=><CardView key={i} card={c} w={44}/>)}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:10.5,color:BLUE,fontWeight:700,letterSpacing:"0.1em",marginBottom:6}}>PLAYER · {pT}</div>
          <div style={{display:"flex",gap:4}}>{pCards.map((c,i)=><CardView key={i} card={c} w={44}/>)}</div>
        </div>
      </div>
      {feedback&&<Feedback ok={feedback.ok} msg={feedback.msg}/>}
      {step==="natural"&&!feedback&&(
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:800,color:GOLD,marginBottom:8}}>🎴 내추럴!</div>
          <div style={{fontSize:13,color:MUT,marginBottom:20,lineHeight:1.65}}>합계 8 또는 9 — 추가 드로우 없이 결과를 확인합니다.</div>
          <button onClick={()=>setStep("result")} style={btnStyle(true)}>결과 확인</button>
        </div>
      )}
      {step==="playerDecision"&&!feedback&&(
        <div>
          <div style={{fontSize:14,fontWeight:700,color:IVORY,marginBottom:4}}>플레이어 합계 {pT}</div>
          <div style={{fontSize:13,color:MUT,marginBottom:14}}>추가 카드를 드로우해야 할까요?</div>
          {hint&&<HintBox text={playerHintText(pT)}/>}
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <button onClick={()=>answerPlayer(true)} style={{...btnStyle(false),flex:1}}>드로우</button>
            <button onClick={()=>answerPlayer(false)} style={{...btnStyle(false),flex:1}}>스탠드</button>
          </div>
          <button onClick={()=>setHint(!hint)} style={{width:"100%",padding:"9px",background:"none",border:`1px solid ${GOLD}44`,color:GOLD,borderRadius:8,fontSize:12.5,cursor:"pointer",fontFamily:"inherit"}}>💡 힌트 {hint?"숨기기":"보기"}</button>
        </div>
      )}
      {step==="bankerDecision"&&!feedback&&(
        <div>
          <div style={{fontSize:14,fontWeight:700,color:IVORY,marginBottom:4}}>뱅커 합계 {bT}</div>
          <div style={{fontSize:13,color:MUT,marginBottom:14}}>
            {pCards[2]?`플레이어 3rd 카드: ${cardValue(pCards[2])}`:"플레이어 스탠드"} — 뱅커 추가 카드?
          </div>
          {hint&&<HintBox text={bankerHintText(bT,pCards[2]?cardValue(pCards[2]):null)}/>}
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <button onClick={()=>answerBanker(true)} style={{...btnStyle(false),flex:1}}>드로우</button>
            <button onClick={()=>answerBanker(false)} style={{...btnStyle(false),flex:1}}>스탠드</button>
          </div>
          <button onClick={()=>setHint(!hint)} style={{width:"100%",padding:"9px",background:"none",border:`1px solid ${GOLD}44`,color:GOLD,borderRadius:8,fontSize:12.5,cursor:"pointer",fontFamily:"inherit"}}>💡 힌트 {hint?"숨기기":"보기"}</button>
        </div>
      )}
      {step==="result"&&(
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:24,fontWeight:800,color:wColor,marginBottom:6}}>{winner} WIN</div>
          <div style={{fontSize:13,color:MUT,marginBottom:22}}>플레이어 {pT} · 뱅커 {bT}</div>
          <button onClick={newRound} style={btnStyle(true)}>다음 라운드</button>
        </div>
      )}
    </div>
  );
}

function CommissionMode({onBack}) {
  const seen = typeof window!=="undefined"&&localStorage.getItem("training-commission-seen");
  const [showIntro,setShowIntro] = useState(!seen);
  const [q,setQ] = useState(()=>makeCommissionQ());
  const [selected,setSelected] = useState(null);
  const [count,setCount] = useState(0);

  function next(){setQ(makeCommissionQ());setSelected(null);setCount(c=>c+1);}
  function answer(opt){if(selected!==null)return;setSelected(opt);opt===q.correct?SFX.good():SFX.bad();}

  if(showIntro) return (
    <IntroCard
      lines={<>커미션 계산 연습이야.<br/><br/>뱅커 베팅이 적중하면 당첨금의 <b>5%</b>를 카지노가 수수료로 가져가.<br/><br/>예) 200만원 베팅 → 커미션 <b>10만원</b><br/>예) 500만원 베팅 → 커미션 <b>25만원</b><br/><br/>빠르게 암산하는 연습이야. 틀려도 돼.</>}
      onStart={()=>{localStorage.setItem("training-commission-seen","1");setShowIntro(false);}}
      onBack={onBack}
    />
  );

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:MUT,cursor:"pointer",fontSize:13,padding:0}}>← 뒤로</button>
        <div style={{fontSize:11,color:GOLD,fontWeight:700,letterSpacing:"0.15em"}}>커미션 계산 연습</div>
        <div style={{fontSize:12,color:MUT}}>#{count+1}</div>
      </div>
      <div style={{background:"rgba(246,241,227,.04)",border:"1px solid rgba(246,241,227,.12)",borderRadius:14,padding:"20px 16px",marginBottom:22,textAlign:"center"}}>
        <div style={{fontSize:12,color:MUT,marginBottom:8,letterSpacing:"0.08em"}}>뱅커 베팅 적중</div>
        <div style={{fontSize:28,fontWeight:800,color:IVORY,marginBottom:6}}>{won(q.amt)}</div>
        <div style={{fontSize:13.5,color:MUT}}>커미션 5%는?</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {q.options.map((opt,i)=>{
          const isCorrect=opt===q.correct,isSelected=selected===opt,revealed=selected!==null;
          return (
            <button key={i} onClick={()=>answer(opt)} style={{
              padding:"14px 16px",borderRadius:10,fontSize:15,fontWeight:700,
              cursor:revealed?"default":"pointer",fontFamily:"inherit",
              background:revealed?(isCorrect?"rgba(127,201,143,.2)":isSelected?"rgba(220,80,80,.2)":"rgba(246,241,227,.04)"):"rgba(246,241,227,.06)",
              border:revealed?(isCorrect?"1px solid #7fc98f":isSelected?"1px solid #dc5050":"1px solid rgba(246,241,227,.1)"):"1px solid rgba(246,241,227,.2)",
              color:revealed?(isCorrect?"#9fdcab":isSelected?"#f08080":MUT):IVORY,
            }}>{won(opt)}</button>
          );
        })}
      </div>
      {selected!==null&&(
        <div>
          {selected!==q.correct&&<div style={{fontSize:13,color:"#f08080",marginBottom:12,textAlign:"center"}}>정답은 {won(q.correct)} ({won(q.amt)} × 5%)</div>}
          {selected===q.correct&&<div style={{fontSize:13,color:"#9fdcab",marginBottom:12,textAlign:"center"}}>정확합니다 ✓</div>}
          <button onClick={next} style={btnStyle(true)}>다음 문제</button>
        </div>
      )}
    </div>
  );
}

export default function TrainingMode({onBack}) {
  const [screen,setScreen] = useState("select");
  if(screen==="cardDraw") return <CardDrawMode onBack={()=>setScreen("select")}/>;
  if(screen==="commission") return <CommissionMode onBack={()=>setScreen("select")}/>;
  return (
    <div style={{padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:MUT,cursor:"pointer",fontSize:13,padding:0}}>← 인트로</button>
      </div>
      <div style={{fontSize:13,letterSpacing:"0.18em",color:GOLD,fontWeight:700,marginBottom:6}}>훈련 모드</div>
      <div style={{fontSize:13,color:MUT,marginBottom:22,lineHeight:1.6}}>점수 없이 반복 연습합니다. 편하게 틀려보세요.</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <button onClick={()=>setScreen("cardDraw")} style={{padding:"20px 18px",background:"rgba(246,241,227,.05)",border:`1px solid ${GOLD}44`,borderRadius:14,textAlign:"left",cursor:"pointer",color:IVORY,fontFamily:"inherit"}}>
          <div style={{fontSize:14,fontWeight:800,marginBottom:6}}>🃏 카드 드로우 연습</div>
          <div style={{fontSize:12.5,color:MUT,lineHeight:1.55}}>딜링 순서 · 3rd 카드 룰 판단 · 승자 선언</div>
        </button>
        <button onClick={()=>setScreen("commission")} style={{padding:"20px 18px",background:"rgba(246,241,227,.05)",border:`1px solid ${GOLD}44`,borderRadius:14,textAlign:"left",cursor:"pointer",color:IVORY,fontFamily:"inherit"}}>
          <div style={{fontSize:14,fontWeight:800,marginBottom:6}}>💰 커미션 계산 연습</div>
          <div style={{fontSize:12.5,color:MUT,lineHeight:1.55}}>뱅커 적중 · 5% 커미션 빠르게 계산하기</div>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ maxWidth: 480, width: "100%", margin: "0 auto" }}>
        {content}
      </div>
    </div>
  );
}
