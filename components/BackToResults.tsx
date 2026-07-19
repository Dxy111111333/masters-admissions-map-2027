"use client";

export function BackToResults({ fallbackQuery }: { fallbackQuery: string }) {
  return <button className="back-link" type="button" onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.href = `/?${fallbackQuery}#results`; }}>← 返回筛选结果</button>;
}
