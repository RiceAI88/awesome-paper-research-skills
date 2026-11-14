import React, { useEffect, useRef } from "react";
import { CloseOutlined, ArrowUpOutlined } from "@ant-design/icons";

export const NOTICE_STORAGE_KEY = "prs-recharge-notice-shown-v2";
export const NOTICE_INTERVAL_MS = 12 * 60 * 60 * 1000;

// Returns true when the entry notice has not been shown in the last 12 hours,
// and records the current time so the next visit within the window is quiet.
export function claimNoticeSlot(storage, now = Date.now()) {
  try {
    const last = Number(storage?.getItem(NOTICE_STORAGE_KEY));
    if (Number.isFinite(last) && last > 0 && now - last >= 0 && now - last < NOTICE_INTERVAL_MS)
      return false;
    storage?.setItem(NOTICE_STORAGE_KEY, String(now));
  } catch {
    // Storage blocked: fall back to showing the notice.
  }
  return true;
}

export function RechargeNotice({ lang }) {
  const dialog = useRef(null);
  const zh = lang === "zh";
  useEffect(() => {
    let storage = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    if (!dialog.current.open && claimNoticeSlot(storage)) {
      dialog.current.showModal();
      dialog.current.querySelector("h2")?.focus();
    }
  }, []);
  const close = () => dialog.current.close();
  return (
    <dialog ref={dialog} className="recharge-notice" aria-labelledby="recharge-notice-title" aria-describedby="recharge-notice-description">
      <div className="recharge-notice-top">
        <span>{zh ? "本站自营服务" : "Our own service"}</span>
        <button type="button" className="recharge-notice-close" onClick={close} aria-label={zh ? "关闭代充提示" : "Close top-up notice"}>
          <CloseOutlined aria-hidden="true" />
        </button>
      </div>
      <h2 id="recharge-notice-title" tabIndex={-1} autoFocus>{zh ? "GPT 正规代充" : "GPT top-up service"}</h2>
      <p className="recharge-notice-invoice">{zh ? "可开发票" : "Invoices available"}</p>
      <p id="recharge-notice-description">{zh ? "自营 GPT / Codex 代充服务，有账单、可开发票。需要代充的朋友，可以了解一下，也支持本站持续维护。" : "Self-operated GPT / Codex top-ups with billing records and invoices. Explore the service and support this site's upkeep."}</p>
      <div className="recharge-notice-actions">
        <a href="https://catfk.com/shop/1991" target="_blank" rel="sponsored noopener noreferrer" onClick={close}>
          {zh ? "查看代充服务" : "View top-up service"} <ArrowUpOutlined rotate={45} aria-hidden="true" />
        </a>
        <button type="button" onClick={close}>{zh ? "继续浏览" : "Continue browsing"}</button>
      </div>
    </dialog>
  );
}
