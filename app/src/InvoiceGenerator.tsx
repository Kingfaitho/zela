import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface InvoiceProps {
  ngnRate: number;
}

export default function InvoiceGenerator({ ngnRate }: InvoiceProps) {
  const wallet = useWallet();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: "1", price: "" }]);
  const [currency, setCurrency] = useState<"NGN" | "USDC">("NGN");
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [invoiceId] = useState("ZL-" + Date.now().toString().slice(-6));

  const addItem = () => setItems([...items, { description: "", quantity: "1", price: "" }]);

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.price || "0") * parseFloat(item.quantity || "1"));
  }, 0);

  const totalUsdc = currency === "NGN" ? total / ngnRate : total;

  const generateInvoice = () => {
    if (!clientName || items[0].price === "") return;
    setInvoiceGenerated(true);
  };

  const shareInvoice = () => {
    const invoiceText = "ZELA INVOICE " + invoiceId + "\n" +
      "To: " + clientName + "\n" +
      items.map(i => i.description + " x" + i.quantity + " = " + currency + " " + (parseFloat(i.price || "0") * parseFloat(i.quantity || "1")).toLocaleString()).join("\n") +
      "\n\nTotal: " + currency + " " + total.toLocaleString() +
      "\nUSDC: $" + totalUsdc.toFixed(2) +
      "\n\nPay via Zela: https://zela-six-theta.vercel.app?pay=invoice&to=" + wallet.publicKey?.toString() + "&amount=" + totalUsdc.toFixed(2);
    window.open("https://wa.me/?text=" + encodeURIComponent(invoiceText), "_blank");
  };

  // Show always

  return (
    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>🧾</span>
        <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Invoice Generator</p>
        <span style={{ fontSize: 11, color: "#7c3aed", background: "rgba(124,58,237,0.1)", padding: "2px 8px", borderRadius: 20, marginLeft: "auto" }}>Professional</span>
      </div>

      {!invoiceGenerated ? (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input placeholder="Client name" value={clientName} onChange={e => setClientName(e.target.value)}
              style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }} />
            <select value={currency} onChange={e => setCurrency(e.target.value as "NGN" | "USDC")}
              style={{ padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}>
              <option value="NGN" style={{ background: "#1a1a2e" }}>NGN</option>
              <option value="USDC" style={{ background: "#1a1a2e" }}>USDC</option>
            </select>
          </div>

          <input placeholder="Client email (optional)" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", marginBottom: 14, boxSizing: "border-box" as any }} />

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>Line Items</p>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input placeholder="Description" value={item.description} onChange={e => updateItem(i, "description", e.target.value)}
                style={{ flex: 2, padding: "9px 10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 12, outline: "none" }} />
              <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)}
                style={{ width: 48, padding: "9px 6px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 12, outline: "none", textAlign: "center" }} />
              <input type="number" placeholder="Price" value={item.price} onChange={e => updateItem(i, "price", e.target.value)}
                style={{ flex: 1, padding: "9px 10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "white", fontSize: 12, outline: "none" }} />
            </div>
          ))}

          <button onClick={addItem} style={{ background: "transparent", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 8, color: "rgba(255,255,255,0.5)", fontSize: 12, padding: "8px", width: "100%", cursor: "pointer", marginBottom: 14 }}>
            + Add Line Item
          </button>

          {total > 0 && (
            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Total ({currency})</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{currency === "NGN" ? "₦" : "$"}{total.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>USDC equivalent</span>
                <span style={{ fontSize: 12, color: "#00d4aa", fontWeight: 600 }}>${totalUsdc.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button onClick={generateInvoice} disabled={!clientName || !items[0].price}
            style={{ width: "100%", padding: "13px", background: clientName && items[0].price ? "linear-gradient(135deg, #7c3aed, #00d4aa)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontWeight: 700, cursor: clientName && items[0].price ? "pointer" : "not-allowed" }}>
            Generate Invoice
          </button>
        </div>
      ) : (
        <div>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #00d4aa, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Z</div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>ZELA INVOICE</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 2px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Invoice ID</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#00d4aa" }}>{invoiceId}</p>
              </div>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Bill To</p>
            <p style={{ margin: "0 0 16px", fontWeight: 600, fontSize: 14 }}>{clientName}</p>
            {items.filter(i => i.description).map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{item.description} x{item.quantity}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{currency === "NGN" ? "₦" : "$"}{(parseFloat(item.price || "0") * parseFloat(item.quantity || "1")).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Total</span>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 16 }}>{currency === "NGN" ? "₦" : "$"}{total.toLocaleString()}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#00d4aa" }}>${totalUsdc.toFixed(2)} USDC</p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setInvoiceGenerated(false)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, color: "white", fontSize: 13, cursor: "pointer" }}>Edit</button>
            <button onClick={shareInvoice} style={{ flex: 2, padding: "12px", background: "#25D366", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Share on WhatsApp</button>
          </div>
        </div>
      )}
    </div>
  );
}
