import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

interface Bill {
  id: number;
  title: string;
  total: number;
  currency: string;
  paidBy: string;
  participants: string[];
  perPerson: number;
  created: string;
  settled: boolean;
}

interface ZelaSplitProps {
  ngnRate: number;
}

export default function ZelaSplit({ ngnRate }: ZelaSplitProps) {
  const { user } = usePrivy();
  const [view, setView] = useState<"list" | "create">("list");
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [participants, setParticipants] = useState("");
  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem("zela_bills");
    return saved ? JSON.parse(saved) : [];
  });

  const myName = user?.email?.address?.split("@")[0] ||
    user?.phone?.number?.slice(-4) || "You";

  const createBill = () => {
    if (!title || !total || !participants) return;
    const names = participants.split(",").map(p => p.trim()).filter(Boolean);
    const allParticipants = [myName, ...names];
    const totalNum = parseFloat(total);
    const perPerson = totalNum / allParticipants.length;

    const newBill: Bill = {
      id: Date.now(),
      title,
      total: totalNum,
      currency,
      paidBy: myName,
      participants: allParticipants,
      perPerson,
      created: new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
      settled: false,
    };

    const updated = [newBill, ...bills];
    setBills(updated);
    localStorage.setItem("zela_bills", JSON.stringify(updated));
    setTitle("");
    setTotal("");
    setParticipants("");
    setView("list");
  };

  const shareOnWhatsApp = (bill: Bill) => {
    const usdcAmount = bill.currency === "NGN"
      ? (bill.perPerson / ngnRate).toFixed(2)
      : bill.perPerson.toFixed(2);
    const ngnAmount = bill.currency === "NGN"
      ? bill.perPerson.toLocaleString()
      : (bill.perPerson * ngnRate).toLocaleString();

    const msg = "Hi! " + myName + " paid for " + bill.title + " on Zela." +
      "\n\nYour share: " + bill.currency + " " + bill.perPerson.toFixed(2) +
      " (about " + (bill.currency === "NGN" ? "$" + usdcAmount + " USDC" : "NGN " + ngnAmount) + ")" +
      "\n\nPay instantly via Zela: https://zela-six-theta.vercel.app" +
      "\n\nNo P2P. No stress. Settled in seconds.";

    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  };

  const settleBill = (id: number) => {
    const updated = bills.map(b => b.id === id ? { ...b, settled: true } : b);
    setBills(updated);
    localStorage.setItem("zela_bills", JSON.stringify(updated));
  };

  const deleteBill = (id: number) => {
    const updated = bills.filter(b => b.id !== id);
    setBills(updated);
    localStorage.setItem("zela_bills", JSON.stringify(updated));
  };

  const totalOwed = bills
    .filter(b => !b.settled)
    .reduce((sum, b) => sum + (b.perPerson * (b.participants.length - 1)), 0);

  return (
    <div style={{ marginBottom: 16 }}>
      {view === "list" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.3px" }}>Bill Splitting</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>Split bills. Collect via WhatsApp.</p>
            </div>
            <button onClick={() => setView("create")} style={{ background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, padding: "10px 16px", cursor: "pointer" }}>
              Split Bill
            </button>
          </div>

          {bills.filter(b => !b.settled).length > 0 && (
            <div style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 14, padding: "14px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13 }}>Total to collect</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{bills.filter(b => !b.settled).length} unsettled bills</p>
              </div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#00d4aa" }}>
                NGN {totalOwed.toLocaleString()}
              </p>
            </div>
          )}

          {bills.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 14, padding: 24, textAlign: "center" }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>🍽️</p>
              <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 14 }}>No bills yet</p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Split your next group expense and collect instantly</p>
            </div>
          ) : bills.map((bill, i) => (
            <div key={bill.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid " + (bill.settled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)"), borderRadius: 14, padding: 16, marginBottom: 10, opacity: bill.settled ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 14 }}>{bill.title}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{bill.created} • {bill.participants.length} people</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 16, color: bill.settled ? "rgba(255,255,255,0.4)" : "#00d4aa" }}>
                    {bill.currency} {bill.perPerson.toFixed(0)}/person
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    Total: {bill.currency} {bill.total.toFixed(0)}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {bill.participants.map((p, pi) => (
                  <span key={pi} style={{ fontSize: 11, background: pi === 0 ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.06)", border: "1px solid " + (pi === 0 ? "rgba(0,212,170,0.2)" : "rgba(255,255,255,0.08)"), borderRadius: 20, padding: "3px 10px", color: pi === 0 ? "#00d4aa" : "rgba(255,255,255,0.6)" }}>
                    {pi === 0 ? p + " (paid)" : p}
                  </span>
                ))}
              </div>

              {!bill.settled ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => shareOnWhatsApp(bill)} style={{ flex: 2, padding: "9px", background: "#25D366", border: "none", borderRadius: 9, color: "white", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                    Request on WhatsApp
                  </button>
                  <button onClick={() => settleBill(bill.id)} style={{ flex: 1, padding: "9px", background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 9, color: "#00d4aa", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                    Mark Settled
                  </button>
                  <button onClick={() => deleteBill(bill.id)} style={{ padding: "9px 12px", background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.15)", borderRadius: 9, color: "#ff6b6b", cursor: "pointer", fontSize: 12 }}>
                    X
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#00d4aa" }}>Settled</p>
                  <button onClick={() => deleteBill(bill.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 12 }}>Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {view === "create" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={() => setView("list")} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "white", fontSize: 13, padding: "6px 12px", cursor: "pointer" }}>Back</button>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>New Bill Split</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>What was this for?</p>
              <input placeholder="Dinner at Chicken Republic, Uber ride..." value={title} onChange={e => setTitle(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as any }} />
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Total amount</p>
                <input type="number" placeholder="5000" value={total} onChange={e => setTotal(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as any }} />
              </div>
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Currency</p>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  style={{ padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", height: "100%" }}>
                  <option value="NGN" style={{ background: "#0d1220" }}>NGN</option>
                  <option value="USDC" style={{ background: "#0d1220" }}>USDC</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Who else? (separate with commas)</p>
              <input placeholder="Tunde, Amaka, Chidi..." value={participants} onChange={e => setParticipants(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as any }} />
            </div>

            {total && participants && (
              <div style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.12)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Split preview</p>
                <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#00d4aa" }}>
                  {currency} {(parseFloat(total) / (participants.split(",").filter(Boolean).length + 1)).toFixed(0)} per person
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  {participants.split(",").filter(Boolean).length + 1} people including you
                </p>
              </div>
            )}

            <button onClick={createBill} disabled={!title || !total || !participants}
              style={{ width: "100%", padding: "14px", background: title && total && participants ? "linear-gradient(135deg, #00d4aa, #7c3aed)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, cursor: title && total && participants ? "pointer" : "not-allowed" }}>
              Create and Send Requests
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
