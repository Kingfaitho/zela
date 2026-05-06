import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ZelaAIProps {
  ngnRate: number;
  usdcBalance: number;
  vaultBalance: number;
}

export default function ZelaAI({ ngnRate, usdcBalance, vaultBalance }: ZelaAIProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your Zela financial assistant. Ask me anything about your money, the exchange rate, or when to convert your USDC to Naira.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    try {
      const systemPrompt = "You are Zela AI, a financial assistant for Nigerians holding USDC. " +
        "Current NGN/USDC rate: " + ngnRate + " Naira per 1 USDC. " +
        "User wallet: $" + usdcBalance.toFixed(2) + " USDC. " +
        "User vault: $" + vaultBalance.toFixed(2) + " USDC = NGN " + (vaultBalance * ngnRate).toLocaleString() + ". " +
        "Speak plainly in English or Pidgin. Keep answers under 80 words. Be specific and helpful. No jargon.";

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + import.meta.env.VITE_OPENROUTER_API_KEY,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://zela-six-theta.vercel.app",
          "X-Title": "Zela AI",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free",
          messages: [
            { role: "system", content: systemPrompt },
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 200,
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Sorry, I could not connect right now. Please try again.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I could not connect right now. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #00d4aa, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>Z</div>
        <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Zela AI</p>
        <span style={{ color: "#00d4aa", fontSize: 11, marginLeft: "auto", background: "rgba(0,212,170,0.1)", padding: "2px 8px", borderRadius: 20 }}>Live</span>
      </div>

      <div style={{ height: 220, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? "linear-gradient(135deg, #7c3aed, #00d4aa)" : "rgba(255,255,255,0.08)", fontSize: 13, lineHeight: 1.5, color: "white" }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.08)", borderRadius: "16px 16px 16px 4px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Ask about your money..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none" }}
        />
        <button onClick={sendMessage} disabled={loading} style={{ padding: "10px 16px", background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
