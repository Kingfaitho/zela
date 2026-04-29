import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface PaymentLinkProps {
  ngnRate: number;
}

export default function BusinessPaymentLink({ ngnRate }: PaymentLinkProps) {
  const wallet = useWallet();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<"NGN" | "USDC">("NGN");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<any[]>(() => {
    const saved = localStorage.getItem("zela_payment_links");
    return saved ? JSON.parse(saved) : [];
  });

  const generateLink = () => {
    if (!amount || !description || !wallet.publicKey) return;
    const linkId = Date.now().toString(36);
    const usdcAmount = currency === "NGN"
      ? (parseFloat(amount) / ngnRate).toFixed(2)
      : amount;
    const link = window.location.origin + "?pay=" + linkId +
      "&amount=" + usdcAmount +
      "&desc=" + encodeURIComponent(description) +
      "&to=" + wallet.publicKey.toString();

    const newLink = {
      id: linkId,
      description,
      amount,
      currency,
      usdcAmount,
      link,
      created: new Date().toLocaleDateString("en-NG"),
      paid: false,
    };

    const updatedLinks = [newLink, ...links];
    setLinks(updatedLinks);
    localStorage.setItem("zela_payment_links", JSON.stringify(updatedLinks));
    setGeneratedLink(link);
    setAmount("");
    setDescription("");
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = (link: string, desc: string, amount: string, currency: string) => {
    const msg = "Please pay " + currency + " " + amount + " for " + desc + " via Zela: " + link;
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  };

  if (!wallet.connected) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🔗</span>
          <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Create Payment Link</p>
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
          Generate a link. Share on WhatsApp. Customer pays. You receive USDC instantly.
        </p>

        <input
          placeholder="What is this payment for? (e.g. Logo design)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" as any }}
        />

        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, padding: "12px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "white", fontSize: 14, outline: "none" }}
          />
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as "NGN" | "USDC")}
            style={{ padding: "12px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "white", fontSize: 14, outline: "none" }}
          >
            <option value="NGN" style={{ background: "#1a1a2e" }}>NGN</option>
            <option value="USDC" style={{ background: "#1a1a2e" }}>USDC</option>
          </select>
        </div>

        {amount && (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 12 }}>
            Customer pays: {currency === "NGN" ? "₦" + parseFloat(amount).toLocaleString() + " ≈ $" + (parseFloat(amount) / ngnRate).toFixed(2) + " USDC" : "$" + amount + " USDC ≈ ₦" + (parseFloat(amount) * ngnRate).toLocaleString()}
          </p>
        )}

        <button
          onClick={generateLink}
          disabled={!amount || !description}
          style={{ width: "100%", padding: "14px", background: amount && description ? "linear-gradient(135deg, #00d4aa, #7c3aed)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, cursor: amount && description ? "pointer" : "not-allowed" }}
        >
          Generate Payment Link
        </button>

        {generatedLink && (
          <div style={{ marginTop: 14, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, padding: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#00d4aa", fontWeight: 600 }}>Link ready to share!</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => copyLink(generatedLink)} style={{ flex: 1, padding: "8px", background: "rgba(0,212,170,0.2)", border: "none", borderRadius: 8, color: "white", fontSize: 12, cursor: "pointer" }}>
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button onClick={() => shareWhatsApp(generatedLink, description, amount, currency)} style={{ flex: 1, padding: "8px", background: "#25D366", border: "none", borderRadius: 8, color: "white", fontSize: 12, cursor: "pointer" }}>
                WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>

      {links.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20 }}>
          <p style={{ fontWeight: 700, margin: "0 0 14px", fontSize: 14 }}>Your Payment Links ({links.length})</p>
          {links.slice(0, 5).map((link, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < Math.min(links.length, 5) - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500 }}>{link.description}</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{link.currency} {link.amount} • {link.created}</p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => copyLink(link.link)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6, color: "white", fontSize: 11, padding: "4px 8px", cursor: "pointer" }}>Copy</button>
                <button onClick={() => shareWhatsApp(link.link, link.description, link.amount, link.currency)} style={{ background: "#25D366", border: "none", borderRadius: 6, color: "white", fontSize: 11, padding: "4px 8px", cursor: "pointer" }}>WA</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
