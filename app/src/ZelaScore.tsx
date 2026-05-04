import { useMemo } from "react";

interface ZelaScoreProps {
  totalDeposited: number;
  depositCount: number;
  streak: number;
  ngnRate: number;
}

export default function ZelaScore({ totalDeposited, depositCount, streak, ngnRate }: ZelaScoreProps) {
  const score = useMemo(() => {
    let s = 0;
    if (totalDeposited >= 1) s += 20;
    if (totalDeposited >= 10) s += 15;
    if (totalDeposited >= 100) s += 15;
    if (depositCount >= 1) s += 10;
    if (depositCount >= 5) s += 10;
    if (depositCount >= 10) s += 10;
    if (streak >= 3) s += 5;
    if (streak >= 7) s += 10;
    if (streak >= 30) s += 5;
    return Math.min(s, 100);
  }, [totalDeposited, depositCount, streak]);

  const level = score >= 80 ? "Gold" : score >= 50 ? "Silver" : score >= 20 ? "Bronze" : "Starter";
  const levelColor = score >= 80 ? "#FFD700" : score >= 50 ? "#C0C0C0" : score >= 20 ? "#CD7F32" : "#00d4aa";
  const levelEmoji = score >= 80 ? "🏆" : score >= 50 ? "🥈" : score >= 20 ? "🥉" : "🌱";

  const nextLevel = score >= 80 ? null : score >= 50 ? { name: "Gold", points: 80 - score } : score >= 20 ? { name: "Silver", points: 50 - score } : { name: "Bronze", points: 20 - score };

  const tips = [];
  if (totalDeposited < 1) tips.push("Make your first deposit to earn 20 points");
  if (totalDeposited < 10) tips.push("Save $10 USDC to earn 15 more points");
  if (streak < 7) tips.push("Keep a 7 day streak to earn 10 points");
  if (depositCount < 5) tips.push("Make 5 deposits to earn 10 more points");

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Zela Score</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 42, fontWeight: 800, color: levelColor, letterSpacing: "-2px" }}>{score}</p>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>/100</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>{levelEmoji}</div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: levelColor }}>{level} Saver</p>
        </div>
      </div>

      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 20, height: 8, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ height: "100%", width: score + "%", background: "linear-gradient(90deg, " + levelColor + "88, " + levelColor + ")", borderRadius: 20, transition: "width 0.8s ease" }} />
      </div>

      {nextLevel && (
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          {nextLevel.points} more points to reach {nextLevel.name}
        </p>
      )}

      {score >= 100 && (
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#FFD700" }}>
          Maximum score reached. You are a Gold Saver.
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: tips.length > 0 ? 16 : 0 }}>
        {[
          { label: "Saved", value: "$" + totalDeposited.toFixed(2) },
          { label: "Deposits", value: depositCount.toString() },
          { label: "Streak", value: streak + "d" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700 }}>{stat.value}</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {tips.length > 0 && (
        <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.12)", borderRadius: 12, padding: 12 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#00d4aa" }}>How to improve your score</p>
          {tips.slice(0, 2).map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < 1 ? 6 : 0 }}>
              <span style={{ color: "#00d4aa", fontSize: 11, flexShrink: 0, marginTop: 1 }}>+</span>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
