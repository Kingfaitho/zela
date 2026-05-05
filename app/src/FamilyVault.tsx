import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

interface FamilyVaultProps {
  ngnRate: number;
  totalDeposited: number;
}

export default function FamilyVault({ ngnRate, totalDeposited }: FamilyVaultProps) {
  const { user } = usePrivy();
  const [view, setView] = useState<"main" | "setup" | "checkin">("main");
  const [beneficiary, setBeneficiary] = useState(() => localStorage.getItem("zela_beneficiary") || "");
  const [beneficiaryName, setBeneficiaryName] = useState(() => localStorage.getItem("zela_beneficiary_name") || "");
  const [interval, setInterval] = useState("90");
  const [isSetup, setIsSetup] = useState(() => !!localStorage.getItem("zela_family_setup"));
  const [lastCheckin, setLastCheckin] = useState(() => localStorage.getItem("zela_last_checkin") || new Date().toISOString());
  const [status, setStatus] = useState("");

  const daysSinceCheckin = Math.floor((Date.now() - new Date(lastCheckin).getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = parseInt(interval) - daysSinceCheckin;
  const urgency = daysRemaining < 7 ? "critical" : daysRemaining < 30 ? "warning" : "safe";
  const urgencyColor = urgency === "critical" ? "#ff3b30" : urgency === "warning" ? "#ffa500" : "#00d4aa";

  const setupFamily = () => {
    if (!beneficiary || !beneficiaryName) return;
    localStorage.setItem("zela_beneficiary", beneficiary);
    localStorage.setItem("zela_beneficiary_name", beneficiaryName);
    localStorage.setItem("zela_family_setup", "true");
    localStorage.setItem("zela_checkin_interval", interval);
    setIsSetup(true);
    setView("main");
    setStatus("Family vault protected. Your loved ones are covered.");
  };

  const doCheckin = () => {
    const now = new Date().toISOString();
    localStorage.setItem("zela_last_checkin", now);
    setLastCheckin(now);
    setStatus("Checked in. Your family vault timer has been reset.");
    setView("main");
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {view === "main" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.3px" }}>Family Vault</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>Protect your family after you.</p>
            </div>
            {isSetup && (
              <button onClick={() => setView("checkin")} style={{ background: urgency === "critical" ? "rgba(255,59,48,0.15)" : "rgba(0,212,170,0.15)", border: "1px solid " + urgencyColor, borderRadius: 10, color: urgencyColor, fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer" }}>
                Check In
              </button>
            )}
          </div>

          {!isSetup ? (
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 16, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Protect your family</p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                If you stop checking in for 90 days, Zela automatically releases your vault to your chosen person. No lawyer needed. No frozen account.
              </p>
              <button onClick={() => setView("setup")} style={{ background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontWeight: 700, padding: "12px 24px", cursor: "pointer" }}>
                Set Up Family Protection
              </button>
            </div>
          ) : (
            <div>
              <div style={{ background: "linear-gradient(135deg, rgba(0,212,170,0.1), rgba(124,58,237,0.1))", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 16, padding: 20, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Protected for</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{beneficiaryName}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Vault value</p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#00d4aa" }}>
                      NGN {(totalDeposited * ngnRate).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Days since check-in</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: urgencyColor }}>{daysSinceCheckin} days</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, height: 6, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: Math.min((daysSinceCheckin / parseInt(interval)) * 100, 100) + "%", background: urgencyColor, borderRadius: 20, transition: "width 0.5s ease" }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: urgencyColor, fontWeight: 600 }}>
                    {urgency === "critical" ? "Check in now. Release imminent." : urgency === "warning" ? daysRemaining + " days before automatic release" : "Protected. Next check-in in " + daysRemaining + " days."}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button onClick={() => setView("checkin")} style={{ padding: "12px", background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  I am alive. Check in.
                </button>
                <button onClick={() => setView("setup")} style={{ padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                  Update settings
                </button>
              </div>
            </div>
          )}

          {status && (
            <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, fontSize: 13, color: "#00d4aa" }}>
              {status}
            </div>
          )}
        </div>
      )}

      {view === "setup" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={() => setView("main")} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "white", fontSize: 13, padding: "6px 12px", cursor: "pointer" }}>Back</button>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Family Protection Setup</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Who should receive your vault?</p>
              <input placeholder="Full name (e.g. Amaka Faith)" value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as any, marginBottom: 10 }} />
              <input placeholder="Their wallet address or phone number" value={beneficiary} onChange={e => setBeneficiary(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as any }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Release after how many days without check-in?</p>
              <div style={{ display: "flex", gap: 8 }}>
                {["30", "60", "90", "180"].map(d => (
                  <button key={d} onClick={() => setInterval(d)} style={{ flex: 1, padding: "10px 6px", background: interval === d ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid " + (interval === d ? "rgba(0,212,170,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 10, color: interval === d ? "#00d4aa" : "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13, fontWeight: interval === d ? 700 : 400 }}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.15)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,165,0,0.8)", lineHeight: 1.5 }}>
                If you do not check in for {interval} days, {beneficiaryName || "your beneficiary"} will automatically receive your entire vault. Make sure you check in regularly.
              </p>
            </div>

            <button onClick={setupFamily} disabled={!beneficiary || !beneficiaryName} style={{ width: "100%", padding: "14px", background: beneficiary && beneficiaryName ? "linear-gradient(135deg, #00d4aa, #7c3aed)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, cursor: beneficiary && beneficiaryName ? "pointer" : "not-allowed" }}>
              Protect My Family
            </button>
          </div>
        </div>
      )}

      {view === "checkin" && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>I am here</h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            Confirm you are alive and active. This resets your {interval}-day timer and lets your family know everything is fine.
          </p>
          <button onClick={doCheckin} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 14, color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
            Confirm Check-In
          </button>
          <button onClick={() => setView("main")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
        </div>
      )}
    </div>
  );
}
