import { useState } from "react";

interface OfframpProps {
  ngnRate: number;
  vaultBalance: number;
  onWithdraw: (amount: number) => void;
}

const NIGERIAN_BANKS = [
  "Access Bank", "First Bank", "GTBank", "Zenith Bank",
  "UBA", "Fidelity Bank", "Union Bank", "Sterling Bank",
  "Kuda Bank", "Opay", "PalmPay", "Moniepoint"
];

export default function PaystackOfframp({ ngnRate, vaultBalance, onWithdraw }: OfframpProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const ngnEquivalent = amount ? (parseFloat(amount) * ngnRate * 0.995).toFixed(2) : "0.00";
  const fee = amount ? (parseFloat(amount) * ngnRate * 0.005).toFixed(2) : "0.00";

  const verifyAccount = async () => {
    if (!accountNumber || accountNumber.length !== 10 || !bank) {
      setStatus("Enter a valid 10-digit account number and select your bank");
      return;
    }
    setLoading(true);
    setStatus("Verifying account...");
    await new Promise(r => setTimeout(r, 1500));
    setAccountName("ADEBAYO TUNDE");
    setStatus("");
    setStep(3);
    setLoading(false);
  };

  const processWithdrawal = async () => {
    if (!amount || parseFloat(amount) > vaultBalance) {
      setStatus("Insufficient vault balance");
      return;
    }
    setLoading(true);
    setStatus("Processing withdrawal...");
    await new Promise(r => setTimeout(r, 2000));
    onWithdraw(parseFloat(amount));
    setStatus("Withdrawal initiated! ₦" + parseFloat(ngnEquivalent).toLocaleString() + " will arrive in your " + bank + " account within 5 minutes.");
    setStep(4);
    setLoading(false);
  };

  const reset = () => {
    setStep(1);
    setAmount("");
    setBank("");
    setAccountNumber("");
    setAccountName("");
    setStatus("");
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(124,58,237,0.3)",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>🏦</span>
        <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Withdraw to Bank</p>
        <span style={{ color: "#7c3aed", fontSize: 11, marginLeft: "auto", background: "rgba(124,58,237,0.1)", padding: "2px 8px", borderRadius: 20 }}>
          USDC to Naira
        </span>
      </div>

      {step === 1 && (
        <div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>
            Convert your USDC directly to your Nigerian bank account. No P2P needed.
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            Amount (USDC) — Vault: ${vaultBalance.toFixed(2)} available
          </p>
          <input
            type="number"
            placeholder="e.g. 5"
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
              marginBottom: 10,
            }}
          />
          {amount && (
            <div style={{ background: "rgba(124,58,237,0.1)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>You receive</span>
                <span style={{ fontSize: 13, color: "white", fontWeight: 700 }}>₦{parseFloat(ngnEquivalent).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Fee (0.5%)</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>₦{parseFloat(fee).toLocaleString()}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => amount && parseFloat(amount) > 0 ? setStep(2) : null}
            disabled={!amount || parseFloat(amount) <= 0}
            style={{
              width: "100%",
              padding: "14px",
              background: amount ? "linear-gradient(135deg, #7c3aed, #00d4aa)" : "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: amount ? "pointer" : "not-allowed",
            }}
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", padding: "0 0 16px" }}>
            Back
          </button>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Select your bank</p>
          <select
            value={bank}
            onChange={e => setBank(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "white",
              fontSize: 14,
              outline: "none",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          >
            <option value="" style={{ background: "#1a1a2e" }}>Choose bank...</option>
            {NIGERIAN_BANKS.map(b => (
              <option key={b} value={b} style={{ background: "#1a1a2e" }}>{b}</option>
            ))}
          </select>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Account number</p>
          <input
            type="text"
            placeholder="10-digit account number"
            value={accountNumber}
            onChange={e => setAccountNumber(e.target.value.slice(0, 10))}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "white",
              fontSize: 15,
              outline: "none",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          {status && <p style={{ color: "#ff3b30", fontSize: 13, marginBottom: 10 }}>{status}</p>}
          <button
            onClick={verifyAccount}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #7c3aed, #00d4aa)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "Verifying..." : "Verify Account"}
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", padding: "0 0 16px" }}>
            Back
          </button>
          <div style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Account verified</p>
            <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700 }}>{accountName}</p>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{bank} • {accountNumber}</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Sending</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>${amount} USDC</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>You receive</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#00d4aa" }}>₦{parseFloat(ngnEquivalent).toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Fee (0.5%)</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>₦{parseFloat(fee).toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={processWithdrawal}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #7c3aed, #00d4aa)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "Processing..." : "Confirm Withdrawal"}
          </button>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Withdrawal Initiated!</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            {status}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "12px 24px",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 10,
              color: "white",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
