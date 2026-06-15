// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef } from "react";
import { GOLD, IVORY, MUT } from "@/lib/constants";

const S1 = () => (
  <svg viewBox="0 0 320 170" style={{ width: "100%", maxHeight: 170, display: "block" }}>
    <defs>
      <radialGradient id="s1g" cx="50%" cy="100%" r="75%">
        <stop offset="0%" stopColor="#d2ab5c" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#0d1a33" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="320" height="170" fill="#0d0a07" />
    <rect x="108" y="16" width="104" height="92" rx="3" fill="#0d1528" />
    <rect x="108" y="16" width="104" height="92" fill="url(#s1g)" />
    <circle cx="160" cy="106" r="16" fill="#d2ab5c" opacity="0.82" />
    <rect x="108" y="16" width="104" height="92" fill="none" stroke="#18120a" strokeWidth="7" />
    <line x1="160" y1="16" x2="160" y2="108" stroke="#18120a" strokeWidth="4" />
    <line x1="108" y1="62" x2="212" y2="62" stroke="#18120a" strokeWidth="4" />
    <rect x="0" y="0" width="108" height="170" fill="#110e0a" />
    <rect x="212" y="0" width="108" height="170" fill="#110e0a" />
    <rect x="0" y="108" width="320" height="62" fill="#110e0a" />
    <path d="M52 32 Q72 27 72 50 L72 112 L32 112 L32 50 Q32 27 52 32Z" fill="#1e1810" stroke="#2a2116" strokeWidth="1" />
    <path d="M52 32 L47 56 L52 70 L57 56Z" fill="#171310" />
    <path d="M50 53 L48 82 L52 88 L56 82 L54 53Z" fill="#8b1a1a" />
    <path d="M49 85 L52 92 L55 85Z" fill="#6b1414" />
    <circle cx="34" cy="102" r="2.5" fill="#d2ab5c" />
    <circle cx="70" cy="102" r="2.5" fill="#d2ab5c" />
    <circle cx="262" cy="58" r="18" fill="none" stroke="#d2ab5c" strokeWidth="1.5" opacity="0.55" />
    <circle cx="262" cy="58" r="1.5" fill="#d2ab5c" opacity="0.55" />
    <line x1="262" y1="58" x2="262" y2="44" stroke="#d2ab5c" strokeWidth="1.5" opacity="0.55" />
    <line x1="262" y1="58" x2="271" y2="63" stroke="#d2ab5c" strokeWidth="1.5" opacity="0.55" />
  </svg>
);

const S2 = () => (
  <svg viewBox="0 0 320 170" style={{ width: "100%", maxHeight: 170, display: "block" }}>
    <defs>
      <radialGradient id="s2g" cx="50%" cy="100%" r="55%">
        <stop offset="0%" stopColor="#d2ab5c" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#d2ab5c" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="320" height="170" fill="#07050f" />
    {[[28,18],[85,9],[145,23],[205,7],[265,17],[302,28],[52,44],[285,48],[170,14]].map(([x,y],i)=>(
      <circle key={i} cx={x} cy={y} r="1.2" fill="#f6f1e3" opacity={0.4+Math.sin(i)*0.3} />
    ))}
    <rect x="58" y="38" width="204" height="132" fill="#0d0b16" />
    {[[80,52,true],[114,52,false],[148,52,true],[182,52,false],[216,52,true],
      [80,82,false],[114,82,true],[148,82,false],[182,82,true],[216,82,false],
      [80,112,true],[114,112,true],[148,112,false],[182,112,false],[216,112,true]].map(([x,y,lit],i)=>(
      <rect key={i} x={x} y={y} width="22" height="16" rx="1.5"
        fill={lit ? "#d2ab5c" : "#1a1525"} opacity={lit ? 0.45 : 1} />
    ))}
    <ellipse cx="160" cy="170" rx="90" ry="42" fill="url(#s2g)" />
    <rect x="132" y="116" width="56" height="54" fill="#16121e" />
    <rect x="130" y="114" width="60" height="58" fill="none" stroke="#d2ab5c" strokeWidth="2" opacity="0.8" />
    <line x1="160" y1="114" x2="160" y2="172" stroke="#d2ab5c" strokeWidth="1" opacity="0.45" />
    <circle cx="152" cy="144" r="2.5" fill="#d2ab5c" opacity="0.8" />
    <circle cx="168" cy="144" r="2.5" fill="#d2ab5c" opacity="0.8" />
    <rect x="116" y="101" width="88" height="14" rx="2" fill="#16121e" stroke="#d2ab5c" strokeWidth="1" opacity="0.75" />
    <text x="160" y="111.5" textAnchor="middle" fontSize="8" fill="#d2ab5c" fontWeight="700" letterSpacing="3" opacity="0.9">CASINO</text>
    <ellipse cx="160" cy="169" rx="8" ry="3" fill="#07050f" opacity="0.7" />
    <rect x="156" y="150" width="8" height="20" rx="2" fill="#1a1610" />
    <circle cx="160" cy="147" r="5" fill="#c9a87c" />
  </svg>
);

const S3 = () => (
  <svg viewBox="0 0 320 170" style={{ width: "100%", maxHeight: 170, display: "block" }}>
    <rect width="320" height="170" fill="#110e0a" />
    <rect x="28" y="22" width="264" height="132" rx="12" fill="#0d5c46" />
    <rect x="28" y="22" width="264" height="132" rx="12" fill="none" stroke="#2c2017" strokeWidth="6" />
    <rect x="40" y="34" width="240" height="108" rx="8" fill="none" stroke="rgba(246,241,227,.14)" strokeWidth="1" strokeDasharray="5 3" />
    <rect x="52" y="44" width="98" height="66" rx="6" fill="none" stroke="#c0392b" strokeWidth="1.2" opacity="0.65" strokeDasharray="4 3" />
    <text x="101" y="73" textAnchor="middle" fontSize="8.5" fill="#e89a8e" fontWeight="700" letterSpacing="2">BANKER</text>
    <rect x="170" y="44" width="98" height="66" rx="6" fill="none" stroke="#4a85c9" strokeWidth="1.2" opacity="0.65" strokeDasharray="4 3" />
    <text x="219" y="73" textAnchor="middle" fontSize="8.5" fill="#9dbfe6" fontWeight="700" letterSpacing="2">PLAYER</text>
    <rect x="131" y="64" width="58" height="26" rx="4" fill="none" stroke="#d2ab5c" strokeWidth="1" opacity="0.5" />
    <text x="160" y="79" textAnchor="middle" fontSize="7.5" fill="#d2ab5c" fontWeight="700" letterSpacing="1">TIE</text>
    {[62,88,114].map((x,i)=><ellipse key={i} cx={x} cy={121} rx="11" ry="5.5" fill="none" stroke="rgba(246,241,227,.22)" strokeWidth="1"/>)}
    {[206,232,258].map((x,i)=><ellipse key={i} cx={x} cy={121} rx="11" ry="5.5" fill="none" stroke="rgba(246,241,227,.22)" strokeWidth="1"/>)}
    <rect x="36" y="108" width="38" height="22" rx="3" fill="#241c14" stroke="#d2ab5c" strokeWidth="0.8" opacity="0.65" />
    <text x="55" y="122" textAnchor="middle" fontSize="6" fill="#d2ab5c" letterSpacing="1" opacity="0.8">SHOE</text>
    <text x="160" y="36" textAnchor="middle" fontSize="6.5" fill="rgba(246,241,227,.35)" letterSpacing="2">MIN 20만 — MAX 3,000만</text>
    <rect x="250" y="108" width="34" height="22" rx="2" fill="#1c1510" stroke="#d2ab5c" strokeWidth="0.8" opacity="0.45" />
  </svg>
);

const S4 = () => (
  <svg viewBox="0 0 320 170" style={{ width: "100%", maxHeight: 170, display: "block" }}>
    <defs>
      <radialGradient id="s4g" cx="50%" cy="0%" r="85%">
        <stop offset="0%" stopColor="#d2ab5c" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#d2ab5c" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="320" height="170" fill="#0d0a07" />
    <ellipse cx="160" cy="0" rx="130" ry="65" fill="url(#s4g)" />
    <rect x="18" y="138" width="284" height="32" rx="8" fill="#0d5c46" stroke="#2c2017" strokeWidth="3" />
    <ellipse cx="104" cy="168" rx="19" ry="6" fill="#08070a" opacity="0.5" />
    <rect x="88" y="105" width="32" height="62" rx="4" fill="#18140f" />
    <rect x="82" y="112" width="36" height="11" rx="3" fill="#18140f" />
    <circle cx="104" cy="100" r="13" fill="#18140f" />
    <circle cx="104" cy="99" r="9" fill="#b8895a" />
    <path d="M122 116 Q148 110 158 113" stroke="#241c14" strokeWidth="6" fill="none" strokeLinecap="round" />
    <circle cx="160" cy="113" r="4" fill="#c9a87c" opacity="0.8" />
    <ellipse cx="216" cy="168" rx="19" ry="6" fill="#08070a" opacity="0.5" />
    <rect x="200" y="110" width="32" height="58" rx="4" fill="#1e1a14" />
    <circle cx="216" cy="106" r="12" fill="#1e1a14" />
    <circle cx="216" cy="105" r="8" fill="#c9a87c" />
    <path d="M214 108 L213 128 L216 133 L219 128 L218 108Z" fill="#8b1a1a" opacity="0.7" />
  </svg>
);

const S5 = () => (
  <svg viewBox="0 0 320 170" style={{ width: "100%", maxHeight: 170, display: "block" }}>
    <defs>
      <radialGradient id="s5g" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#0e6b50" />
        <stop offset="100%" stopColor="#083d2d" />
      </radialGradient>
    </defs>
    <rect width="320" height="170" fill="#0d0a07" />
    <path d="M0 170 L55 58 L265 58 L320 170Z" fill="url(#s5g)" />
    <path d="M0 170 L55 58 L265 58 L320 170Z" fill="none" stroke="#2c2017" strokeWidth="4" />
    <path d="M18 166 L67 68 L253 68 L302 166Z" fill="none" stroke="rgba(246,241,227,.1)" strokeWidth="1" strokeDasharray="5 3" />
    <g transform="rotate(-4,100,112)">
      <rect x="74" y="88" width="40" height="54" rx="4" fill="#1a3a6b" stroke="#d2ab5c" strokeWidth="0.8" opacity="0.85" />
      <rect x="78" y="92" width="32" height="46" rx="2" fill="none" stroke="#d2ab5c" strokeWidth="0.5" opacity="0.35" />
      <text x="94" y="118" textAnchor="middle" fontSize="20" fill="#d2ab5c" opacity="0.2">&#9830;</text>
    </g>
    <g transform="rotate(-2,122,110)">
      <rect x="92" y="84" width="40" height="54" rx="4" fill="#1a3a6b" stroke="#d2ab5c" strokeWidth="0.8" opacity="0.85" />
      <rect x="96" y="88" width="32" height="46" rx="2" fill="none" stroke="#d2ab5c" strokeWidth="0.5" opacity="0.35" />
      <text x="112" y="114" textAnchor="middle" fontSize="20" fill="#d2ab5c" opacity="0.2">&#9830;</text>
    </g>
    <g transform="rotate(2,198,112)">
      <rect x="178" y="88" width="40" height="54" rx="4" fill="#1a3a6b" stroke="#d2ab5c" strokeWidth="0.8" opacity="0.85" />
      <rect x="182" y="92" width="32" height="46" rx="2" fill="none" stroke="#d2ab5c" strokeWidth="0.5" opacity="0.35" />
      <text x="198" y="118" textAnchor="middle" fontSize="20" fill="#d2ab5c" opacity="0.2">&#9830;</text>
    </g>
    <g transform="rotate(4,220,110)">
      <rect x="200" y="84" width="40" height="54" rx="4" fill="#1a3a6b" stroke="#d2ab5c" strokeWidth="0.8" opacity="0.85" />
      <rect x="204" y="88" width="32" height="46" rx="2" fill="none" stroke="#d2ab5c" strokeWidth="0.5" opacity="0.35" />
      <text x="220" y="114" textAnchor="middle" fontSize="20" fill="#d2ab5c" opacity="0.2">&#9830;</text>
    </g>
    {[[136,"#d4af37"],[154,"#2e7d4f"],[172,"#c0392b"]].map(([x,c],i)=>(
      <g key={i}>
        {[150,145,140].map((y,j)=>(
          <ellipse key={j} cx={x} cy={y} rx="8.5" ry="3.8" fill={c} stroke="#1a1610" strokeWidth="0.5" />
        ))}
      </g>
    ))}
    <text x="101" y="78" textAnchor="middle" fontSize="7" fill="#e89a8e" fontWeight="700" letterSpacing="2" opacity="0.6">BANKER</text>
    <text x="219" y="78" textAnchor="middle" fontSize="7" fill="#9dbfe6" fontWeight="700" letterSpacing="2" opacity="0.6">PLAYER</text>
    <ellipse cx="95" cy="170" rx="24" ry="8" fill="#c9a87c" opacity="0.45" />
    <ellipse cx="225" cy="170" rx="24" ry="8" fill="#c9a87c" opacity="0.45" />
  </svg>
);

const SCENES = [
  { svg: <S1 />, text: "오늘은 첫 출근이다.\n3개월간의 교육을 마치고, 드디어 실전 배치.\n거울 앞에서 넥타이를 매며 생각했다 — 잘 할 수 있을까." },
  { svg: <S2 />, text: "카지노 입구 앞에 서자 발걸음이 잠깐 멈췄다.\n안에서 흘러나오는 낮은 음악, 은은한 조명.\n이제 저 안이 내 일터다." },
  { svg: <S3 />, text: "처음으로 바카라 테이블 앞에 섰다.\n생각보다 훨씬 컸다. 초록 펠트, 금색 테두리.\n이 테이블 위에서 모든 것이 결정된다." },
  { svg: <S4 />, text: "\"어이, 신입.\"\n오 반장이 다가왔다.\n\"긴장되냐? 당연하지. 근데 여기선 티 내면 안 돼.\n오늘 내가 옆에서 봐줄게.\"" },
  { svg: <S5 />, text: "딜러석에 앉아 처음으로 테이블을 내려다봤다.\n카드, 칩, 그리고 곧 찾아올 손님들.\n베팅 마감부터 정산까지 — 이제 시작이다." },
];

export default function StoryFlow({ onDone }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);
  const timerRef = useRef(null);
  const scene = SCENES[idx];
  const full = scene.text;
  useEffect(() => {
    setDisplayed("");
    setTyping(true);
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setDisplayed(full.slice(0, i));
      if (i >= full.length) { clearInterval(timerRef.current); setTyping(false); }
    }, 28);
    return () => clearInterval(timerRef.current);
  }, [idx]);
  const finish = () => { localStorage.setItem("baccarat-story-seen", "1"); onDone(); };
  const handleTap = () => {
    if (typing) { clearInterval(timerRef.current); setDisplayed(full); setTyping(false); }
    else if (idx < SCENES.length - 1) { setIdx((n) => n + 1); }
    else { finish(); }
  };
  return (
    <div onClick={handleTap} style={{ position: "fixed", inset: 0, background: "#0d0a07", zIndex: 70, display: "flex", flexDirection: "column", cursor: "pointer", userSelect: "none", WebkitUserSelect: "none" }}>
      <style>{"@keyframes blink{0%,100%{opacity:.6}50%{opacity:0}}"}</style>
      <div style={{ position: "absolute", top: 20, left: 20, display: "flex", gap: 6 }}>
        {SCENES.map((_, i) => (
          <div key={i} style={{ width: 22, height: 2.5, borderRadius: 999, background: i <= idx ? GOLD : "rgba(246,241,227,.18)", transition: "background .3s" }} />
        ))}
      </div>
      <button onClick={(e) => { e.stopPropagation(); finish(); }} style={{ position: "absolute", top: 14, right: 16, zIndex: 10, background: "rgba(246,241,227,.06)", border: "1px solid rgba(246,241,227,.18)", color: MUT, borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>건너뛰기</button>
      <div style={{ marginTop: 50, flexShrink: 0 }}>{scene.svg}</div>
      <div style={{ flex: 1, padding: "22px 28px 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 16, lineHeight: 2, color: IVORY, minHeight: 120, fontFamily: "\'Pretendard\',\'Apple SD Gothic Neo\',\'Noto Sans KR\',sans-serif" }}>
          {displayed.split("\n").map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
          {typing && <span style={{ animation: "blink 1s step-end infinite" }}>|</span>}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 12, fontSize: 11.5, color: MUT, textAlign: "right", opacity: typing ? 0 : 1, transition: "opacity .3s" }}>
          {idx < SCENES.length - 1 ? "탭하여 계속 →" : "탭하여 시작 →"}
        </div>
      </div>
    </div>
  );
}
