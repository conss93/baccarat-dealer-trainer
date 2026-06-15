// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use client";
import React, { useState, useRef, useEffect } from "react";
import { GOLD, IVORY, MUT, BLUE, RED } from "@/lib/constants";
import { chipBreakdown, chipMeta, spreadPattern, won } from "@/lib/utils";
import { GLOSSARY } from "@/lib/glossary";

export const Chip = ({ meta, w, h }) => (
  <div style={{ width: w, height: h, borderRadius: 999, background: meta.c, border: `${Math.max(1, h * 0.18)}px dashed rgba(255,255,255,.55)`, outline: `1px solid ${meta.edge}`, boxSizing: "border-box", boxShadow: "0 1px 1.5px rgba(0,0,0,.45)" }} />
);

export const ChipStackVisual = ({ amount, chipW = 30, showAmount, maxPerCol = 20 }) => {
  const chipH = chipW * 0.26;
  const groups = chipBreakdown(amount);
  if (amount <= 0) return <div style={{ fontSize: 11, color: MUT }}>—</div>;
  const cols = [];
  groups.forEach((g) => {
    let left = g.cnt;
    while (left > 0) { const take = Math.min(left, maxPerCol); cols.push({ v: g.v, cnt: take }); left -= take; }
  });
  return (
    <div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", flexWrap: "wrap" }}>
        {cols.map((col, ci) => {
          const meta = chipMeta(col.v);
          const h = col.cnt * chipH + Math.floor((col.cnt - 1) / 5) * 3 + chipH;
          return (
            <div key={ci} style={{ position: "relative", width: chipW, height: h }} title={`${meta.name} × ${col.cnt}`}>
              {Array.from({ length: col.cnt }).map((_, i) => (
                <div key={i} style={{ position: "absolute", bottom: i * chipH + Math.floor(i / 5) * 3, left: 0 }}>
                  <Chip meta={meta} w={chipW} h={chipH * 1.6} />
                </div>
              ))}
              <div style={{ position: "absolute", top: -13, left: 0, width: chipW, textAlign: "center", fontSize: 9, color: "rgba(246,241,227,.8)", fontWeight: 700 }}>
                {meta.name}{col.cnt > 1 ? `×${col.cnt}` : ""}
              </div>
            </div>
          );
        })}
      </div>
      {showAmount && <div style={{ fontSize: 11, color: GOLD, marginTop: 4, fontWeight: 700 }}>{won(amount)}</div>}
    </div>
  );
};

export const SpreadGroups = ({ denom, count, chipW = 22, onTapGroup, dim }) => {
  const meta = chipMeta(denom);
  const chipH = chipW * 0.38;
  const pat = spreadPattern(count);
  if (!pat.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", opacity: dim ? 0.55 : 1 }}>
      {pat.map((g, gi) => {
        const tap = onTapGroup ? () => onTapGroup(denom, g) : undefined;
        const base = { cursor: tap ? "pointer" : "default", touchAction: "manipulation", userSelect: "none", WebkitTapHighlightColor: "transparent" };
        if (g.kind === "big") {
          return (
            <div key={gi} onClick={tap} style={{ ...base, textAlign: "center" }} title={`${meta.name} ×20 뭉탱이`}>
              <div style={{ position: "relative", width: chipW + 3, height: g.n * chipH * 0.3 + chipH }}>
                {Array.from({ length: g.n }).map((_, i) => (
                  <div key={i} style={{ position: "absolute", bottom: i * chipH * 0.3, left: 1.5 }}><Chip meta={meta} w={chipW} h={chipH} /></div>
                ))}
              </div>
              <div style={{ fontSize: 8.5, fontWeight: 800, color: GOLD, marginTop: 1 }}>×20</div>
            </div>
          );
        }
        if (g.kind === "stack") {
          return (
            <div key={gi} onClick={tap} style={{ ...base, position: "relative", width: chipW, height: g.n * chipH * 0.62 + chipH }} title={`${meta.name} 컷 ×${g.n}`}>
              {Array.from({ length: g.n }).map((_, i) => (
                <div key={i} style={{ position: "absolute", bottom: i * chipH * 0.62, left: 0 }}><Chip meta={meta} w={chipW} h={chipH} /></div>
              ))}
            </div>
          );
        }
        return (
          <div key={gi} onClick={tap} style={{ ...base, position: "relative", width: chipW + (g.n - 1) * chipW * 0.45, height: chipH + (g.n - 1) * chipH * 0.55 + 2 }} title={`${meta.name} 스프레드 ×${g.n}`}>
            {Array.from({ length: g.n }).map((_, i) => (
              <div key={i} style={{ position: "absolute", left: i * chipW * 0.45, top: i * chipH * 0.55 }}><Chip meta={meta} w={chipW} h={chipH} /></div>
            ))}
          </div>
        );
      })}
      <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(246,241,227,.85)" }}>{meta.name}</div>
    </div>
  );
};

export const MiniStack = ({ amount, invalid }) => {
  const groups = chipBreakdown(amount);
  const cols = [];
  groups.forEach((g) => {
    let left = g.cnt;
    while (left > 0 && cols.length < 2) { const take = Math.min(left, 10); cols.push({ v: g.v, cnt: take }); left -= take; }
  });
  const shown = cols.reduce((s, c) => s + c.cnt, 0);
  const totalCnt = groups.reduce((s, g) => s + g.cnt, 0);
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", justifyContent: "center" }}>
      {cols.map((col, ci) => {
        const meta = chipMeta(col.v);
        return (
          <div key={ci} style={{ position: "relative", width: 14, height: col.cnt * 3.4 + 5 }}>
            {Array.from({ length: col.cnt }).map((_, i) => (
              <div key={i} style={{ position: "absolute", bottom: i * 3.4, left: 0 }}><Chip meta={meta} w={14} h={5.5} /></div>
            ))}
          </div>
        );
      })}
      {invalid && <div style={{ position: "relative", width: 14, height: 12 }}><div style={{ position: "absolute", bottom: 0 }}><Chip meta={chipMeta(5000)} w={14} h={5.5} /></div><div style={{ position: "absolute", bottom: 3.4 }}><Chip meta={chipMeta(1000)} w={14} h={5.5} /></div></div>}
      {totalCnt > shown && <div style={{ fontSize: 8.5, color: GOLD, fontWeight: 800 }}>+{totalCnt - shown}</div>}
    </div>
  );
};

export const CardView = ({ card, w = 30, sideways }) => {
  const h = w * 1.45;
  const inner = card.faceDown ? (
    <div style={{ width: w, height: h, borderRadius: 4, background: "linear-gradient(135deg, #1a3a6b, #0d2044)", border: `1px solid ${GOLD}44`, boxShadow: "0 2px 6px rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: w * 0.7, height: h * 0.7, borderRadius: 2, border: `1px solid ${GOLD}66`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: w * 0.45, opacity: 0.5, color: GOLD }}>♦</div>
      </div>
    </div>
  ) : (
    <div style={{ width: w, height: h, borderRadius: 4, background: IVORY, color: card.color, boxShadow: "0 2px 6px rgba(0,0,0,.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>
      <div style={{ fontSize: w * 0.52, lineHeight: 1 }}>{card.rank}</div>
      <div style={{ fontSize: w * 0.5, lineHeight: 1.05 }}>{card.suit}</div>
    </div>
  );
  if (!sideways) return inner;
  return (
    <div style={{ width: h, height: w, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ transform: "rotate(90deg)" }}>{inner}</div>
    </div>
  );
};

export const ActionBtn = ({ children, onClick, accent, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: accent ? `linear-gradient(180deg, ${GOLD}, #b08c3e)` : "rgba(246,241,227,.06)",
    color: accent ? "#1d1609" : IVORY, border: accent ? "1px solid #e8caa0" : "1px solid rgba(246,241,227,.18)",
    borderRadius: 10, padding: "12px 16px", fontSize: 14, fontWeight: 700, cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.45 : 1, width: "100%", textAlign: "left", fontFamily: "inherit",
  }}>{children}</button>
);

export const PanelTitle = ({ t, d }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11.5, letterSpacing: "0.18em", color: GOLD, fontWeight: 700 }}>{t}</div>
    {d && <div style={{ fontSize: 13.8, color: IVORY, marginTop: 4, lineHeight: 1.55 }}>{d}</div>}
  </div>
);

export const StepBar = ({ steps, cur }) => (
  <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
    {steps.map((s, i) => (
      <div key={i} style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", padding: "4px 9px", borderRadius: 999, background: i === cur ? GOLD : i < cur ? "rgba(127,201,143,.2)" : "rgba(246,241,227,.07)", color: i === cur ? "#1d1609" : i < cur ? "#9fdcab" : MUT }}>
        {i < cur ? "✓ " : ""}{s}
      </div>
    ))}
  </div>
);


export const GlossaryModal = ({ onClose }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: "#1e1710", border: `1px solid ${GOLD}55`, borderRadius: 16, padding: "18px 16px", width: "100%", maxWidth: 500, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, letterSpacing: "0.18em", color: GOLD, fontWeight: 700 }}>GLOSSARY · 용어 사전</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: MUT, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
      </div>
      <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
        {GLOSSARY.map((g) => (
          <div key={g.en} style={{ padding: "9px 10px", borderRadius: 8, background: "rgba(246,241,227,.04)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 3 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: IVORY }}>{g.ko}</span>
              <span style={{ fontSize: 10.5, color: GOLD, fontWeight: 700, letterSpacing: "0.04em" }}>{g.en}</span>
            </div>
            <div style={{ fontSize: 12.3, color: "rgba(246,241,227,.75)", lineHeight: 1.55 }}>{g.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const GlossaryToggle = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: GOLD, fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>{open ? "▾" : "▸"} 용어 사전</button>
      {open && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 1, maxHeight: 320, overflowY: "auto" }}>
          {GLOSSARY.map((g) => (
            <div key={g.en} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(246,241,227,.04)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 2 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: IVORY }}>{g.ko}</span>
                <span style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>{g.en}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(246,241,227,.75)", lineHeight: 1.5 }}>{g.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const thtd = { border: "1px solid rgba(246,241,227,.14)", padding: "4px 8px", textAlign: "center" };
export const sideLabel = { player: "PLAYER", banker: "BANKER", tie: "TIE" };
export const sideColor = { player: BLUE, banker: RED, tie: GOLD };
export const dealBtnStyle = (color) => ({ flex: 1, background: "rgba(246,241,227,.05)", border: `1.5px solid ${color}99`, color: IVORY, borderRadius: 10, padding: "14px 8px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" });

export function useTween(target) {
  const [pos, setPos] = useState(target);
  const posRef = useRef(target);
  const rafRef = useRef(0);
  useEffect(() => {
    const from = { ...posRef.current };
    const t0 = performance.now();
    const dur = 480;
    cancelAnimationFrame(rafRef.current);
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const p = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e };
      posRef.current = p; setPos(p);
      if (k < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target.x, target.y]);
  return pos;
}

export const GuideBubble = ({ title, body, onDismiss }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", zIndex: 55, display: "flex", alignItems: "flex-end", padding: "0 16px 28px" }}>
    <div style={{ width: "100%", maxWidth: 560, margin: "0 auto", background: "#1e1710", border: `1px solid ${GOLD}55`, borderRadius: 16, padding: "18px 16px 14px" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>👨‍💼</div>
        <div>
          <div style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: "0.1em" }}>오반장</div>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: IVORY }}>{title}</div>
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: "rgba(246,241,227,.85)", lineHeight: 1.85, marginBottom: 14, whiteSpace: "pre-line" }}>{body}</div>
      <button onClick={onDismiss} style={{ width: "100%", padding: "13px", background: `linear-gradient(180deg, ${GOLD}, #b08c3e)`, color: "#1d1609", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>알겠습니다</button>
    </div>
  </div>
);
