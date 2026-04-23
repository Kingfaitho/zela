import { useState, useEffect } from "react";

interface InflationTrackerProps {
  vaultBalance: number;
  totalDeposited: number;
  ngnRate: number;
  depositCount: number;
}

export default function InflationTracker({ totalDeposited, ngnRate, depositCount }: InflationTrackerProps) {
  const [historicalRate, setHistoricalRate] = useState(1200);
  const [savedAmount, setSavedAmount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("zela_first_rate");
    if (saved) {
      setHistoricalRate(parseFloat(saved));
    } else if (ngnRate > 0) {
      localStorage.setItem("zela_first_rate", ngnRate.toString());
      setHistoricalRate(ngnRate);
    }
  }, [ngnRate]);

  useEffect(() => {
    if (totalDeposited > 0 && ngnRate > historicalRate) {
      const saved = totalDeposited * (ngnRate - historicalRate);
      setSavedAmount(saved);
    }
  }, [totalDeposited, ngnRate, historicalRate]);

  const nairaSaved = savedAmount.toLocaleString("en-NG", { style: "currency", currency: "NGN" });
  const percentageGain = historicalRate > 0 ? (((ngnRate - historicalRate) / historicalRate) * 100).toFixed(1) : "0.0";
  const isGaining = ngnRate > historicalRate;

  if (depositCount === 0) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(0,212,170,0.15), rgba(124,58,237,0.15))",
      border: "1px solid rgba(0,212,170,0.3)",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>📈</span>
        <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Inflation Protection</p>
        <span style={{ color: "#00d4aa", fontSize: 11, marginLeft: "auto" }}>
          {isGaining ? "+" + percentageGain + "%" : percentageGain + "%"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: 14, textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>When you joined</p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>₦{historicalRate.toLocaleString()}</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>per $1 USDC</p>
        </div>
        <div style={{ background: "rgba(0,212,170,0.1)", borderRadius: 10, padding: 14, textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Today</p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#00d4aa" }}>₦{ngnRate.toLocaleString()}</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>per $1 USDC</p>
        </div>
      </div>

      {isGaining && savedAmount > 0 ? (
        <div style={{ background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 12, padding: 16, textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            By holding USDC instead of Naira, you protected
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#00d4aa" }}>{nairaSaved}</p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            from inflation since you joined Zela
          </p>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            Your USDC is protected from Naira inflation
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            Rate changes will show your savings here
          </p>
        </div>
      )}

      <div style={{ marginTop: 14, padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.6 }}>
          If you had kept ₦{(totalDeposited * historicalRate).toLocaleString()} in your bank account,
          it would now be worth ${(totalDeposited * historicalRate / ngnRate).toFixed(2)} USDC.
          Instead you have ${totalDeposited.toFixed(2)} USDC protected in Zela.
        </p>
      </div>
    </div>
  );
}
