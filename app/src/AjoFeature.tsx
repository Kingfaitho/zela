/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import ajoIdl from "./ajo.json";

const AJO_PROGRAM_ID = new PublicKey("DHhqgD4WSanbkFZHPgxM4oSmodn5f24Jw1pyzX7sZcfA");
const DEVNET_USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const USDC_DECIMALS = 6;
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export default function AjoFeature() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [groupName, setGroupName] = useState("");
  const [contribution, setContribution] = useState("");
  const [maxMembers, setMaxMembers] = useState("5");
  const [duration, setDuration] = useState("7");
  const [groupType, setGroupType] = useState("0");

  const getWalletPubkey = () => {
    const w = wallets?.[0];
    if (!w?.address) return null;
    try { return new PublicKey(w.address); } catch { return null; }
  };

  const getProgram = useCallback(async () => {
    const w = wallets?.[0] as any;
    const pk = getWalletPubkey();
    if (!w || !pk) return null;
    try {
      const provider = new AnchorProvider(connection, {
        publicKey: pk,
        signTransaction: async (tx: any) => w.signTransaction ? w.signTransaction(tx) : tx,
        signAllTransactions: async (txs: any) => w.signAllTransactions ? w.signAllTransactions(txs) : txs,
      } as any, { commitment: "confirmed" });
      return new Program(ajoIdl as any, provider) as any;
    } catch { return null; }
  }, [wallets]);

  const createGroup = async () => {
    const pk = getWalletPubkey();
    if (!pk || !groupName || !contribution) return;
    setLoading(true);
    setStatus("Creating Ajo group on Solana...");
    try {
      const program = await getProgram();
      if (!program) throw new Error("Wallet not ready");
      const [groupPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ajo_group"), pk.toBuffer(), Buffer.from(groupName)],
        AJO_PROGRAM_ID
      );
      await program.methods
        .createGroup(groupName, new BN(parseFloat(contribution) * Math.pow(10, USDC_DECIMALS)), parseInt(maxMembers), parseInt(duration), parseInt(groupType), 1)
        .accounts({ admin: pk, mint: DEVNET_USDC_MINT, group: groupPda, systemProgram: PublicKey.default })
        .rpc();
      setStatus("Ajo group created on Solana!");
      setView("list");
    } catch (e: any) { setStatus("Error: " + e.message); }
    setLoading(false);
  };

  const shareGroup = () => {
    const msg = "Join my Ajo savings group on Zela. We save $" + contribution + " USDC together every " + duration + " days. Protected by Solana smart contract. Join: https://zela-six-theta.vercel.app";
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  };

  if (!authenticated) return null;

  return (
    <div>
      {view === "list" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 2px" }}>Ajo Groups</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>Save together on Solana</p>
            </div>
            <button onClick={() => setView("create")} style={{ background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, padding: "10px 16px", cursor: "pointer" }}>
              + Create
            </button>
          </div>

          <div style={{ background: "linear-gradient(135deg, rgba(0,212,170,0.08), rgba(124,58,237,0.08))", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: 13 }}>How Zela Ajo Works</p>
            {["Everyone locks a security deposit so no one can disappear", "Each round, one member receives the full pot", "Emergency? Group votes to release funds early", "Smart contract handles everything automatically"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <span style={{ color: "#00d4aa", fontSize: 12, flexShrink: 0 }}>✓</span>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15 }}>Lagos Freelancers Ajo</p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Demo group · 7-day rounds</p>
              </div>
              <span style={{ fontSize: 11, background: "rgba(255,165,0,0.1)", border: "1px solid rgba(255,165,0,0.2)", color: "#ffa500", padding: "3px 10px", borderRadius: 20, height: "fit-content" }}>Open</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[["$10", "per round"], ["1/5", "members"], ["$50", "pot size"]].map(([val, label], i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800, color: i === 2 ? "#ffa500" : "white" }}>{val}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{label}</p>
                </div>
              ))}
            </div>
            <button onClick={shareGroup} style={{ width: "100%", padding: "10px", background: "#25D366", border: "none", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              Invite Friends on WhatsApp
            </button>
          </div>

          <button onClick={() => setView("create")} style={{ width: "100%", padding: "14px", background: "transparent", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 14, color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer" }}>
            + Create your first Ajo group
          </button>

          {status && <div style={{ padding: "12px 16px", background: "rgba(0,212,170,0.1)", borderRadius: 12, fontSize: 13, color: "#00d4aa", marginTop: 14 }}>{status}</div>}
        </div>
      )}

      {view === "create" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={() => setView("list")} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "white", fontSize: 13, padding: "6px 12px", cursor: "pointer" }}>Back</button>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Create Ajo Group</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
            {[
              { label: "Group Name", value: groupName, set: setGroupName, placeholder: "e.g. Lagos Freelancers Ajo", type: "text" },
              { label: "Contribution per round (USDC)", value: contribution, set: setContribution, placeholder: "e.g. 10", type: "number" },
            ].map((field, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{field.label}</p>
                <input type={field.type} placeholder={field.placeholder} value={field.value} onChange={e => field.set(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as any }} />
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Max Members</p>
                <select value={maxMembers} onChange={e => setMaxMembers(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none" }}>
                  {[2,3,4,5,6,7,8,10,12,15,20].map(n => <option key={n} value={n} style={{ background: "#0d1220" }}>{n} members</option>)}
                </select>
              </div>
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Round Duration</p>
                <select value={duration} onChange={e => setDuration(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none" }}>
                  <option value="7" style={{ background: "#0d1220" }}>Weekly</option>
                  <option value="14" style={{ background: "#0d1220" }}>Bi-weekly</option>
                  <option value="30" style={{ background: "#0d1220" }}>Monthly</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Group Type</p>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ value: "0", label: "Private", desc: "Invite only" }, { value: "1", label: "Community", desc: "Open to all" }, { value: "2", label: "Business", desc: "Cooperative" }].map(type => (
                  <button key={type.value} onClick={() => setGroupType(type.value)}
                    style={{ flex: 1, padding: "10px 6px", background: groupType === type.value ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid " + (groupType === type.value ? "rgba(0,212,170,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 10, color: groupType === type.value ? "#00d4aa" : "rgba(255,255,255,0.5)", cursor: "pointer", textAlign: "center" as any }}>
                    <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 12 }}>{type.label}</p>
                    <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {contribution && groupName && (
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                {[["Group", groupName], ["Contribution", "$" + contribution + " USDC per round"], ["Members", maxMembers + " people"], ["Pot size", "$" + (parseFloat(contribution || "0") * parseInt(maxMembers)).toFixed(2) + " USDC"], ["Security deposit", "$" + parseFloat(contribution || "0").toFixed(2) + " USDC refundable"]].map(([label, value], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={createGroup} disabled={loading || !groupName || !contribution}
              style={{ width: "100%", padding: "14px", background: groupName && contribution ? "linear-gradient(135deg, #00d4aa, #7c3aed)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, cursor: groupName && contribution ? "pointer" : "not-allowed" }}>
              {loading ? "Creating on Solana..." : "Create Ajo Group"}
            </button>

            {status && <div style={{ padding: "12px 16px", background: status.includes("Error") ? "rgba(255,59,48,0.1)" : "rgba(0,212,170,0.1)", borderRadius: 12, fontSize: 13, color: status.includes("Error") ? "#ff6b6b" : "#00d4aa", marginTop: 14 }}>{status}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
