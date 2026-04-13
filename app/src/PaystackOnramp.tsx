import { useState } from "react";

interface PaystackOnrampProps {
  ngnRate: number;
  userEmail: string;
  onSuccess: () => void;
}

export default function PaystackOnramp({ ngnRate, userEmail, onSuccess }: PaystackOnrampProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const usdcEquivalent = amount ? (parseFloat(amount) / ngnRate).toFixed(2) : "0.00";

  const handlePayment = () => {
    if (!amount || parseFloat(amount) < 100) {
      alert("Minimum amount is ₦100");
      return;
    }
    setLoading(true);

    const handler = (window as any).PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_KEY,
      email: userEmail || "user@zela.app",
      amount: parseFloat(amount) * 100,
      currency: "NGN",
      ref: "ZELA_" + Date.now(),
      metadata: {
        custom_fields: [
          {
            display_name: "USDC Amount",
            variable_name: "usdc_amount",
            value: usdcEquivalent,
          },
        ],
      },
      callback: (response: any) => {
        console.log("Payment successful:", response.reference);
        setLoading(false);
        setAmount("");
        onSuccess();
        alert("Payment successful! Your USDC will be credited shortly. Ref: " + response.reference);
      },
      onClose: () => {
        setLoading(false);
      },
    });

    handler.openIframe();
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(0,212,170,0.3)",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>🇳🇬</span>
        <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Add Money with Naira</p>
        <span style={{ color: "#00d4aa", fontSize: 11, marginLeft: "auto", background: "rgba(0,212,170,0.1)", padding: "2px 8px", borderRadius: 20 }}>No P2P needed</span>
      </div>

      <div style={{ background: "rgba(0,212,170,0.08)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
          Pay in Naira → Receive USDC in your vault instantly
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>You pay (NGN)</p>
          <input
            type="number"
            placeholder="e.g. 10000"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "white",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 20, color: "rgba(255,255,255,0.4)", fontSize: 18 }}>→</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>You receive (USDC)</p>
          <div style={{
            padding: "12px 14px",
            background: "rgba(0,212,170,0.08)",
            border: "1px solid rgba(0,212,170,0.2)",
            borderRadius: 10,
            fontSize: 15,
            color: "#00d4aa",
            fontWeight: 700,
          }}>
            ${usdcEquivalent}
          </div>
        </div>
      </div>

      <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
        Rate: ₦{ngnRate.toLocaleString()} = $1 USDC • Fee: 0.5%
      </p>

      <button
        onClick={handlePayment}
        disabled={loading || !amount}
        style={{
          width: "100%",
          padding: "14px",
          background: amount ? "linear-gradient(135deg, #00d4aa, #7c3aed)" : "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: 12,
          color: "white",
          fontSize: 15,
          fontWeight: 700,
          cursor: amount ? "pointer" : "not-allowed",
        }}
      >
        {loading ? "Opening payment..." : "Pay with Paystack →"}
      </button>
    </div>
  );
}
