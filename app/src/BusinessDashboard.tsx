import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface BusinessDashboardProps {
  ngnRate: number;
  
  totalDeposited: number;
  depositCount: number;
}

export default function BusinessDashboard({ ngnRate, totalDeposited, depositCount }: BusinessDashboardProps) {
  const wallet = useWallet();
  const [expenses, setExpenses] = useState<any[]>(() => {
    const saved = localStorage.getItem("zela_expenses");
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Operations");

  const categories = ["Operations", "Marketing", "Staff", "Inventory", "Transport", "Other"];

  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
  const totalRevenue = totalDeposited * ngnRate;
  const profit = totalRevenue - totalExpenses;

  const addExpense = () => {
    if (!expenseName || !expenseAmount) return;
    const newExpense = {
      id: Date.now(),
      name: expenseName,
      amount: expenseAmount,
      category: expenseCategory,
      date: new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    localStorage.setItem("zela_expenses", JSON.stringify(updated));
    setExpenseName("");
    setExpenseAmount("");
    setShowAddExpense(false);
  };

  // Show always

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 14, padding: 16 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Revenue</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#00d4aa" }}>₦{totalRevenue.toLocaleString()}</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{depositCount} transactions</p>
        </div>
        <div style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)", borderRadius: 14, padding: 16 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Expenses</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#ff6b6b" }}>₦{totalExpenses.toLocaleString()}</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{expenses.length} items</p>
        </div>
        <div style={{ background: profit >= 0 ? "rgba(0,212,170,0.08)" : "rgba(255,59,48,0.08)", border: "1px solid " + (profit >= 0 ? "rgba(0,212,170,0.15)" : "rgba(255,59,48,0.15)"), borderRadius: 14, padding: 16, gridColumn: "1 / -1" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Net Profit</p>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: profit >= 0 ? "#00d4aa" : "#ff6b6b" }}>
            {profit >= 0 ? "+" : ""}₦{profit.toLocaleString()}
          </p>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>Expenses</p>
          <button onClick={() => setShowAddExpense(!showAddExpense)} style={{ background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 8, color: "white", fontSize: 12, padding: "6px 12px", cursor: "pointer", fontWeight: 600 }}>
            {showAddExpense ? "Cancel" : "+ Add"}
          </button>
        </div>

        {showAddExpense && (
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <input placeholder="Expense description" value={expenseName} onChange={e => setExpenseName(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" as any }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="number" placeholder="Amount (NGN)" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)}
                style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }} />
              <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)}
                style={{ padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}>
                {categories.map(c => <option key={c} value={c} style={{ background: "#1a1a2e" }}>{c}</option>)}
              </select>
            </div>
            <button onClick={addExpense} style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 8, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              Save Expense
            </button>
          </div>
        )}

        {expenses.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" }}>No expenses yet. Track your business costs here.</p>
        ) : expenses.slice(0, 6).map((exp, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < Math.min(expenses.length, 6) - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500 }}>{exp.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{exp.category} • {exp.date}</p>
            </div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#ff6b6b" }}>-₦{parseFloat(exp.amount).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
