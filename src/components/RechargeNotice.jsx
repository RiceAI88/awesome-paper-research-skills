import React, { useEffect, useRef } from "react";
import { CloseOutlined, ArrowUpOutlined } from "@ant-design/icons";

export function RechargeNotice({ lang }) {
  const dialog = useRef(null);
  const zh = lang === "zh";
  useEffect(() => {
    if (!dialog.current.open) {
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
