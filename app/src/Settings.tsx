import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

interface SettingsProps {
  ngnRate: number;
}

export default function Settings({ ngnRate }: SettingsProps) {
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [activeSection, setActiveSection] = useState("profile");
  const [username, setUsername] = useState(() => localStorage.getItem("zela_username") || "");
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("zela_theme") || "dark");
  const [notifications, setNotifications] = useState(() => localStorage.getItem("zela_notifications") !== "false");
  const [saved, setSaved] = useState("");

  const userEmail = user?.email?.address || user?.phone?.number || "";
  const solanaWallet = wallets?.find(w => w.address && !w.address.startsWith("0x") && w.address.length >= 32)
    || wallets?.find(w => w.address && w.type === "solana")
    || wallets?.find(w => w.address && w.walletClientType === "privy");
  const walletAddress = solanaWallet?.address || wallets?.find(w => w.address)?.address || "";

  const saveUsername = () => {
    if (!tempUsername.trim()) return;
    const clean = tempUsername.toLowerCase().replace(/[^a-z0-9_]/g, "");
    localStorage.setItem("zela_username", clean);
    setUsername(clean);
    setEditingUsername(false);
    setSaved("Username saved!");
    setTimeout(() => setSaved(""), 2000);
  };

  const sections = [
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "wallets", icon: "🔗", label: "Connected Wallets" },
    { id: "security", icon: "🔐", label: "Security" },
    { id: "preferences", icon: "⚙️", label: "Preferences" },
    { id: "help", icon: "❓", label: "Help & Support" },
  ];

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  };

  return (
    <div>
      <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.3px" }}>Settings</p>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>Manage your account and preferences</p>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: activeSection === s.id ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.05)", border: "1px solid " + (activeSection === s.id ? "rgba(0,212,170,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 20, color: activeSection === s.id ? "#00d4aa" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: activeSection === s.id ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            <span>{s.icon}</span>{s.label}
          </button>
        ))}
      </div>

      {saved && <div style={{ padding: "10px 14px", background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, fontSize: 13, color: "#00d4aa", marginBottom: 14 }}>{saved}</div>}

      {activeSection === "profile" && (
        <div>
          <div style={cardStyle}>
            <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 14px" }}>Your Username</p>
            {!editingUsername ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 700, color: "#00d4aa" }}>
                      {username ? "@" + username : "No username set"}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                      {username ? "People can send money to @" + username : "Set a username so people can send you money easily"}
                    </p>
                  </div>
                  <button onClick={() => { setTempUsername(username); setEditingUsername(true); }}
                    style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "white", fontSize: 12, padding: "6px 12px", cursor: "pointer" }}>
                    {username ? "Edit" : "Set Username"}
                  </button>
                </div>
                {username && (
                  <div style={{ background: "rgba(0,212,170,0.08)", borderRadius: 8, padding: "8px 12px" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                      Your Zela link: zela-six-theta.vercel.app/@{username}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  value={tempUsername}
                  onChange={e => setTempUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="e.g. kayode_faith"
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" as any }}
                />
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  Only letters, numbers, and underscores. This becomes your Zela payment address.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveUsername} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Save</button>
                  <button onClick={() => setEditingUsername(false)} style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 10, color: "white", cursor: "pointer", fontSize: 14 }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 12px" }}>Account Info</p>
            {[
              { label: "Email / Phone", value: userEmail || "Not set" },
              { label: "Account created", value: "Active" },
              { label: "Plan", value: "Free" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "wallets" && (
        <div>
          <div style={cardStyle}>
            <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 12px" }}>Zela Embedded Wallet</p>
            {walletAddress ? (
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Solana Address</p>
                <p style={{ margin: "0 0 10px", fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.7)", wordBreak: "break-all" }}>{walletAddress}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { navigator.clipboard.writeText(walletAddress); setSaved("Address copied!"); setTimeout(() => setSaved(""), 2000); }}
                    style={{ flex: 1, padding: "9px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 9, color: "white", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                    Copy Address
                  </button>
                  <a href={"https://explorer.solana.com/address/" + walletAddress + "?cluster=devnet"} target="_blank" rel="noreferrer"
                    style={{ flex: 1, padding: "9px", background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 9, color: "#00d4aa", fontSize: 13, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
                    View on Solana
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 8 }}>
                  {wallets && wallets.length > 0 ? "Detecting Solana wallet..." : "Creating your wallet..."}
                </p>
                {wallets && wallets.map((w, i) => (
                  <p key={i} style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all", marginBottom: 4 }}>
                    Wallet {i+1}: {w.address?.slice(0,20)}...
                  </p>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>Connect External Wallet</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 14px", lineHeight: 1.5 }}>Already have USDC in Phantom or another Solana wallet? Connect it to use with Zela.</p>
            <div style={{ display: "flex", gap: 8 }}>
              {["Phantom", "Solflare", "Backpack"].map(w => (
                <button key={w} style={{ flex: 1, padding: "10px 6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 12px" }}>Get Test Funds (Devnet)</p>
            <div style={{ display: "flex", gap: 8 }}>
              <a href="https://faucet.solana.com" target="_blank" rel="noreferrer"
                style={{ flex: 1, padding: "12px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 10, color: "#a78bfa", fontSize: 13, fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                Get Free SOL
              </a>
              <a href="https://faucet.circle.com" target="_blank" rel="noreferrer"
                style={{ flex: 1, padding: "12px", background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, color: "#00d4aa", fontSize: 13, fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                Get Free USDC
              </a>
            </div>
          </div>
        </div>
      )}

      {activeSection === "security" && (
        <div>
          {[
            { icon: "🔐", title: "Two-Factor Authentication", desc: "Your account is protected by Privy's secure authentication", status: "Active", color: "#00d4aa" },
            { icon: "🛡️", title: "Non-Custodial Protection", desc: "Your funds are in a smart contract. Nobody can access them without your signature.", status: "Active", color: "#00d4aa" },
            { icon: "📱", title: "Login Method", desc: userEmail || "Email or phone", status: "Secured", color: "#00d4aa" },
          ].map((item, i) => (
            <div key={i} style={{ ...cardStyle, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{item.title}</p>
                  <span style={{ fontSize: 11, color: item.color, background: item.color + "20", padding: "2px 8px", borderRadius: 20 }}>{item.status}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === "preferences" && (
        <div>
          <div style={cardStyle}>
            <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 14px" }}>Preferences</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500 }}>Push Notifications</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Rate alerts and transaction updates</p>
              </div>
              <button onClick={() => { setNotifications(!notifications); localStorage.setItem("zela_notifications", (!notifications).toString()); }}
                style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: notifications ? "#00d4aa" : "rgba(255,255,255,0.15)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: notifications ? 23 : 3, transition: "left 0.2s" }} />
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500 }}>Currency Display</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Always shown in Naira</p>
              </div>
              <span style={{ fontSize: 12, color: "#00d4aa", fontWeight: 600 }}>NGN</span>
            </div>
          </div>
        </div>
      )}

      {activeSection === "help" && (
        <div>
          {[
            { icon: "📖", title: "How Zela Works", desc: "Learn about non-custodial savings and how your money is protected", action: "Read guide" },
            { icon: "🐛", title: "Report a Bug", desc: "Found something broken? Let us know", action: "Report" },
            { icon: "💬", title: "Contact Support", desc: "Get help from the Zela team", action: "Chat" },
            { icon: "🐙", title: "View Source Code", desc: "Zela is open source. Verify the smart contracts yourself", action: "GitHub" },
          ].map((item, i) => (
            <div key={i} style={{ ...cardStyle, display: "flex", gap: 14, alignItems: "center", cursor: "pointer" }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 14 }}>{item.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{item.desc}</p>
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{item.action}</span>
            </div>
          ))}

          <div style={{ ...cardStyle, textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Zela v1.0 · Solana Devnet</p>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Built by Kayode Faith · Lagos, Nigeria</p>
            <button onClick={logout}
              style={{ padding: "10px 24px", background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)", borderRadius: 10, color: "#ff6b6b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
