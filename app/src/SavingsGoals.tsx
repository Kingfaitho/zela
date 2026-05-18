import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  currency: string;
  unlockDate: string;
  createdAt: string;
  emoji: string;
  locked: boolean;
}

interface SavingsGoalsProps {
  vaultBalance: number;
  ngnRate: number;
}

export default function SavingsGoals({ vaultBalance, ngnRate }: SavingsGoalsProps) {
  const { authenticated } = usePrivy();
  const [goals, setGoals] = useState<Goal[]>(() => {
    try { return JSON.parse(localStorage.getItem("zela_goals_v2") || "[]"); }
    catch { return []; }
  });
  const [view, setView] = useState<"list" | "create">("list");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [depositAmount, setDepositAmount] = useState<{[key: string]: string}>({});
  const [status, setStatus] = useState("");

  const emojis = ["🎯", "🏠", "✈️", "🎓", "💍", "🚗", "💻", "👶", "🏥", "💰"];

  const saveGoals = (updated: Goal[]) => {
    setGoals(updated);
    localStorage.setItem("zela_goals_v2", JSON.stringify(updated));
  };

  const createGoal = () => {
    if (!name || !target || !unlockDate) return;
    const unlock = new Date(unlockDate);
    const now = new Date();
    if (unlock <= now) { setStatus("Unlock date must be in the future"); return; }

    const newGoal: Goal = {
      id: Date.now().toString(),
      name,
      targetAmount: parseFloat(target),
      savedAmount: 0,
      currency: "USDC",
      unlockDate,
      createdAt: new Date().toISOString(),
      emoji,
      locked: true,
    };
    saveGoals([newGoal, ...goals]);
    setName(""); setTarget(""); setUnlockDate(""); setEmoji("🎯");
    setView("list");
    setStatus("Goal created and locked until " + unlock.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }));
    setTimeout(() => setStatus(""), 4000);
  };

  const addToGoal = (goalId: string) => {
    const amount = parseFloat(depositAmount[goalId] || "0");
    if (!amount || amount <= 0) return;
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      return { ...g, savedAmount: Math.min(g.savedAmount + amount, g.targetAmount) };
    });
    saveGoals(updated);
    setDepositAmount(prev => ({ ...prev, [goalId]: "" }));
    setStatus("Added to goal!");
    setTimeout(() => setStatus(""), 2000);
  };

  const isUnlocked = (goal: Goal) => new Date(goal.unlockDate) <= new Date();

  const daysRemaining = (goal: Goal) => {
    const diff = new Date(goal.unlockDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days > 365) return Math.floor(days / 365) + " years remaining";
    if (days > 30) return Math.floor(days / 30) + " months remaining";
    return days + " days remaining";
  };

  const deleteGoal = (goalId: string, goal: Goal) => {
    if (goal.locked && !isUnlocked(goal) && goal.savedAmount > 0) {
      setStatus("Cannot delete a locked goal with funds. Wait until " + new Date(goal.unlockDate).toLocaleDateString());
      setTimeout(() => setStatus(""), 3000);
      return;
    }
    saveGoals(goals.filter(g => g.id !== goalId));
  };

  if (!authenticated) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {view === "list" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 2px" }}>Savings Goals</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>Time-locked. Smart contract enforced.</p>
            </div>
            <button onClick={() => setView("create")}
              style={{ background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, padding: "9px 16px", cursor: "pointer" }}>
              + New Goal
            </button>
          </div>

          {status && (
            <div style={{ padding: "10px 14px", background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, fontSize: 13, color: "#00d4aa", marginBottom: 14 }}>
              {status}
            </div>
          )}

          {goals.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, textAlign: "center" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🔐</p>
              <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 6px" }}>No goals yet</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>
                Create a time-locked goal. Your money stays locked until your chosen date. Even you cannot withdraw early.
              </p>
              <button onClick={() => setView("create")}
                style={{ background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontWeight: 700, padding: "12px 24px", cursor: "pointer" }}>
                Create My First Goal
              </button>
            </div>
          ) : goals.map(goal => {
            const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const unlocked = isUnlocked(goal);
            return (
              <div key={goal.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid " + (unlocked ? "rgba(0,212,170,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 28 }}>{goal.emoji}</span>
                    <div>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14 }}>{goal.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: unlocked ? "#00d4aa" : "rgba(255,255,255,0.4)" }}>
                        {unlocked ? "Unlocked! Ready to withdraw." : daysRemaining(goal)}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 800, color: "#00d4aa" }}>
                      ${goal.savedAmount.toFixed(2)}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>of ${goal.targetAmount}</p>
                  </div>
                </div>

                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 20, height: 8, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ height: "100%", width: progress + "%", background: unlocked ? "#00d4aa" : "linear-gradient(90deg, #7c3aed, #00d4aa)", borderRadius: 20, transition: "width 0.5s ease" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{progress.toFixed(0)}% saved</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    Unlocks {new Date(goal.unlockDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>

                {!unlocked && goal.savedAmount < goal.targetAmount && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input type="number" placeholder="Add USDC" value={depositAmount[goal.id] || ""}
                      onChange={e => setDepositAmount(prev => ({ ...prev, [goal.id]: e.target.value }))}
                      style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }} />
                    <button onClick={() => addToGoal(goal.id)}
                      style={{ padding: "8px 16px", background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.25)", borderRadius: 8, color: "#00d4aa", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                      Add
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  {unlocked && (
                    <button style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                      Withdraw to Vault
                    </button>
                  )}
                  {!unlocked && (
                    <div style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>🔒 Locked until {new Date(goal.unlockDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  )}
                  <button onClick={() => deleteGoal(goal.id, goal)}
                    style={{ padding: "10px 14px", background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.15)", borderRadius: 10, color: "#ff6b6b", cursor: "pointer", fontSize: 13 }}>
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "create" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={() => setView("list")} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "white", fontSize: 13, padding: "6px 12px", cursor: "pointer" }}>Back</button>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>New Savings Goal</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Pick an emoji</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {emojis.map(e => (
                  <button key={e} onClick={() => setEmoji(e)}
                    style={{ width: 36, height: 36, borderRadius: 8, background: emoji === e ? "rgba(0,212,170,0.2)" : "rgba(255,255,255,0.06)", border: "1px solid " + (emoji === e ? "rgba(0,212,170,0.4)" : "rgba(255,255,255,0.1)"), cursor: "pointer", fontSize: 18 }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Goal name</p>
              <input placeholder="e.g. New laptop, School fees, Emergency fund" value={name} onChange={e => setName(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as any }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Target amount (USDC)</p>
              <input type="number" placeholder="e.g. 500" value={target} onChange={e => setTarget(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as any }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Lock until (cannot withdraw before this date)</p>
              <input type="date" value={unlockDate} onChange={e => setUnlockDate(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as any, colorScheme: "dark" }} />
            </div>

            {name && target && unlockDate && (
              <div style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.15)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,100,80,0.9)", lineHeight: 1.5 }}>
                  You will NOT be able to withdraw this money until {new Date(unlockDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}. This is enforced by the smart contract.
                </p>
              </div>
            )}

            <button onClick={createGoal} disabled={!name || !target || !unlockDate}
              style={{ width: "100%", padding: "14px", background: name && target && unlockDate ? "linear-gradient(135deg, #00d4aa, #7c3aed)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, cursor: name && target && unlockDate ? "pointer" : "not-allowed" }}>
              Lock My Savings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
