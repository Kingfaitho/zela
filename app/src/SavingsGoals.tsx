import { useState, useEffect } from "react";

interface Goal {
  id: number;
  name: string;
  targetUsd: number;
  deadline: string;
  createdAt: string;
}

interface SavingsGoalsProps {
  vaultBalance: number;
  ngnRate: number;
}

export default function SavingsGoals({ vaultBalance, ngnRate }: SavingsGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("zela_goals");
    if (saved) setGoals(JSON.parse(saved));
  }, []);

  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    localStorage.setItem("zela_goals", JSON.stringify(newGoals));
  };

  const addGoal = () => {
    if (!goalName || !targetAmount || !deadline) return;
    const newGoal: Goal = {
      id: Date.now(),
      name: goalName,
      targetUsd: parseFloat(targetAmount),
      deadline,
      createdAt: new Date().toISOString(),
    };
    saveGoals([...goals, newGoal]);
    setGoalName("");
    setTargetAmount("");
    setDeadline("");
    setShowForm(false);
  };

  const deleteGoal = (id: number) => {
    saveGoals(goals.filter(g => g.id !== id));
  };

  const getProgress = (goal: Goal) => {
    return Math.min((vaultBalance / goal.targetUsd) * 100, 100);
  };

  const getDaysLeft = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Savings Goals</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: "linear-gradient(135deg, #00d4aa, #7c3aed)",
          border: "none",
          borderRadius: 8,
          color: "white",
          fontSize: 12,
          padding: "6px 12px",
          cursor: "pointer",
          fontWeight: 600,
        }}>
          {showForm ? "Cancel" : "+ Add Goal"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <input
            placeholder="Goal name (e.g. School fees)"
            value={goalName}
            onChange={e => setGoalName(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input
              type="number"
              placeholder="Target in USDC"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 14, outline: "none" }}
            />
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 14, outline: "none" }}
            />
          </div>
          <button onClick={addGoal} style={{
            width: "100%",
            padding: "10px",
            background: "linear-gradient(135deg, #00d4aa, #7c3aed)",
            border: "none",
            borderRadius: 8,
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
          }}>
            Save Goal
          </button>
        </div>
      )}

      {goals.length === 0 && !showForm && (
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" }}>
          No goals yet. Set a savings goal and Zela will track your progress.
        </p>
      )}

      {goals.map(goal => {
        const progress = getProgress(goal);
        const daysLeft = getDaysLeft(goal.deadline);
        const ngnTarget = (goal.targetUsd * ngnRate).toLocaleString("en-NG", { style: "currency", currency: "NGN" });

        return (
          <div key={goal.id} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{goal.name}</p>
              <button onClick={() => deleteGoal(goal.id)} style={{ background: "none", border: "none", color: "rgba(255,59,48,0.6)", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                ${vaultBalance.toFixed(2)} of ${goal.targetUsd} USDC
              </span>
              <span style={{ fontSize: 12, color: daysLeft < 7 ? "#ff3b30" : "rgba(255,255,255,0.5)" }}>
                {daysLeft > 0 ? daysLeft + " days left" : "Deadline passed"}
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, height: 8, overflow: "hidden", marginBottom: 8 }}>
              <div style={{
                height: "100%",
                width: progress + "%",
                background: progress >= 100 ? "#00d4aa" : "linear-gradient(90deg, #7c3aed, #00d4aa)",
                borderRadius: 20,
                transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#00d4aa", fontWeight: 600 }}>{progress.toFixed(0)}% complete</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Target: {ngnTarget}</span>
            </div>
            {progress >= 100 && (
              <div style={{ marginTop: 10, background: "rgba(0,212,170,0.15)", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                <p style={{ margin: 0, color: "#00d4aa", fontSize: 13, fontWeight: 600 }}>Goal reached! Withdraw when ready.</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
