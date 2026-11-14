import React, { useRef } from "react";
import { CloseOutlined } from "@ant-design/icons";
import qrImage from "../../assets/research-community-2026-11-02.png";

export function CommunityCard({ lang }) {
  const dialog = useRef(null);
  const zh = lang === "zh";
  const title = zh ? "各专业科研 Skills 交流群" : "Research Skills Community";
  return (
    <>
      <button
        type="button"
        className="community-card"
        aria-label={zh ? "加入各专业科研 Skills 交流群，点击放大二维码" : "Join AI Research Community, enlarge QR code"}
        aria-haspopup="dialog"
        onClick={() => dialog.current.showModal()}
      >
        <span className="community-card-copy">
          <span className="community-card-eyebrow">{zh ? "一起发现好用的科研 Skills" : "Discover useful research Skills"}</span>
          <strong>{zh ? <>加入各专业<br className="community-title-break" />科研 Skills 交流群</> : "Join our cross-discipline Skills community"}</strong>
          <span>{zh ? "交流使用经验，分享或推荐你所在专业的 Skills。" : "Share experiences and recommend Skills for your discipline."}</span>
          <span className="community-card-hint">{zh ? "微信扫码入群 · 点击放大 ↗" : "Scan with WeChat · Enlarge ↗"}</span>
        </span>
        <span className="community-qr-padding" aria-hidden="true">
          <span className="community-qr-crop"><img src={qrImage} alt="" width="450" height="680" /></span>
        </span>
      </button>
      <dialog
        ref={dialog}
        className="community-dialog"
        aria-labelledby="community-dialog-title"
        onClick={(event) => {
          if (event.target === dialog.current) {
            const box = dialog.current.getBoundingClientRect();
            if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.current.close();
          }
        }}
      >
        <div className="community-dialog-heading">
          <h2 id="community-dialog-title">{title}</h2>
          <button type="button" aria-label={zh ? "关闭二维码" : "Close QR code"} onClick={() => dialog.current.close()}><CloseOutlined aria-hidden="true" /></button>
        </div>
        <img src={qrImage} alt={zh ? "AI科研交流群1 微信入群二维码，11月9日前有效" : "WeChat group QR code, valid before November 9"} width="450" height="680" />
        <p>{zh ? "微信扫码加入，手机端可长按保存图片。" : "Scan with WeChat, or save the image on your phone."}</p>
      </dialog>
    </>
  );
}
