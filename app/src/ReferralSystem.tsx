import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function ReferralSystem() {
  const wallet = useWallet();
  const [copied, setCopied] = useState(false);

  const referralCode = wallet.publicKey
    ? wallet.publicKey.toString().slice(0, 8).toUpperCase()
    : "CONNECT";

  const referralLink = "https://zela-six-theta.vercel.app?ref=" + referralCode;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const message = "I use Zela to protect my USDC from inflation and avoid P2P stress. Join me and we both get $1 USDC bonus: " + referralLink;
    window.open("https://wa.me/?text=" + encodeURIComponent(message), "_blank");
  };

  const shareTwitter = () => {
    const message = "I stopped losing money to P2P traders. Now I use Zela to protect my USDC and see my balance in Naira in real time. Join me: " + referralLink;
    window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(message), "_blank");
  };

  if (!wallet.connected) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(0,212,170,0.2)",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>🎁</span>
        <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Refer and Earn</p>
        <span style={{ color: "#00d4aa", fontSize: 11, marginLeft: "auto", background: "rgba(0,212,170,0.1)", padding: "2px 8px", borderRadius: 20 }}>
          $1 USDC per referral
        </span>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
        Share Zela with friends. When they deposit their first USDC, you both earn $1 USDC — automatically.
      </p>

      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", wordBreak: "break-all", flex: 1, marginRight: 8 }}>
          {referralLink}
        </span>
        <button onClick={copyLink} style={{
          background: copied ? "#00d4aa" : "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: 8,
          color: "white",
          fontSize: 12,
          padding: "6px 12px",
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={shareWhatsApp} style={{
          flex: 1,
          padding: "12px",
          background: "#25D366",
          border: "none",
          borderRadius: 10,
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 14,
        }}>
          Share on WhatsApp
        </button>
        <button onClick={shareTwitter} style={{
          flex: 1,
          padding: "12px",
          background: "#1DA1F2",
          border: "none",
          borderRadius: 10,
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 14,
        }}>
          Share on X
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#00d4aa" }}>0</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Friends joined</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#00d4aa" }}>$0.00</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>USDC earned</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#00d4aa" }}>$1.00</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Per referral</p>
        </div>
      </div>
    </div>
  );
}
