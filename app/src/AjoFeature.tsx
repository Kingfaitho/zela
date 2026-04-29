import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import ajoIdl from "./ajo.json";

const AJO_PROGRAM_ID = new PublicKey("DHhqgD4WSanbkFZHPgxM4oSmodn5f24Jw1pyzX7sZcfA");
const DEVNET_USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const USDC_DECIMALS = 6;

interface AjoGroup {
  publicKey: string;
  name: string;
  contributionAmount: number;
  maxMembers: number;
  currentMembers: number;
  currentRound: number;
  status: number;
  admin: string;
  nextRoundAt: number;
}

export default function AjoFeature() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [view, setView] = useState<"list" | "create" | "group">("list");
  const [groups, setGroups] = useState<AjoGroup[]>([]);
  const [myGroups, setMyGroups] = useState<AjoGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<AjoGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Create form state
  const [groupName, setGroupName] = useState("");
  const [contribution, setContribution] = useState("");
  const [maxMembers, setMaxMembers] = useState("5");
  const [duration, setDuration] = useState("7");
  const [groupType, setGroupType] = useState("0");

  const getProgram = useCallback(() => {
    const provider = new AnchorProvider(connection, wallet as any, {});
    setProvider(provider);
    return new Program(ajoIdl as any, provider) as any;
  }, [connection, wallet]);

  const createGroup = async () => {
    if (!wallet.publicKey || !groupName || !contribution) return;
    setLoading(true);
    setStatus("Creating Ajo group...");
    try {
      const program = getProgram();
      const [groupPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ajo_group"), wallet.publicKey.toBuffer(), Buffer.from(groupName)],
        AJO_PROGRAM_ID
      );

      await program.methods
        .createGroup(
          groupName,
          new BN(parseFloat(contribution) * Math.pow(10, USDC_DECIMALS)),
          parseInt(maxMembers),
          parseInt(duration),
          parseInt(groupType),
          1
        )
        .accounts({
          admin: wallet.publicKey,
          mint: DEVNET_USDC_MINT,
          group: groupPda,
          systemProgram: PublicKey.default,
        })
        .rpc();

      setStatus("Ajo group created successfully!");
      setGroupName("");
      setContribution("");
      setView("list");
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
    setLoading(false);
  };

  const joinGroup = async (group: AjoGroup) => {
    if (!wallet.publicKey) return;
    setLoading(true);
    setStatus("Joining group and locking security deposit...");
    try {
      const program = getProgram();
      const groupPubkey = new PublicKey(group.publicKey);

      const [memberPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ajo_member"), groupPubkey.toBuffer(), wallet.publicKey.toBuffer()],
        AJO_PROGRAM_ID
      );

      const [groupVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("group_vault"), groupPubkey.toBuffer()],
        AJO_PROGRAM_ID
      );

      const memberTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, wallet.publicKey);

      await program.methods
        .joinGroup()
        .accounts({
          member: wallet.publicKey,
          mint: DEVNET_USDC_MINT,
          group: groupPubkey,
          memberAccount: memberPda,
          memberTokenAccount,
          groupVault,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: PublicKey.default,
        })
        .rpc();

      setStatus("Joined! Security deposit locked in smart contract.");
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
    setLoading(false);
  };

  const contribute = async (group: AjoGroup) => {
    if (!wallet.publicKey) return;
    setLoading(true);
    setStatus("Contributing to round...");
    try {
      const program = getProgram();
      const groupPubkey = new PublicKey(group.publicKey);

      const [memberPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ajo_member"), groupPubkey.toBuffer(), wallet.publicKey.toBuffer()],
        AJO_PROGRAM_ID
      );

      const [groupVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("group_vault"), groupPubkey.toBuffer()],
        AJO_PROGRAM_ID
      );

      const memberTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, wallet.publicKey);

      await program.methods
        .contribute()
        .accounts({
          member: wallet.publicKey,
          mint: DEVNET_USDC_MINT,
          group: groupPubkey,
          memberAccount: memberPda,
          memberTokenAccount,
          groupVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: PublicKey.default,
        })
        .rpc();

      setStatus("Contribution successful!");
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
    setLoading(false);
  };

  const shareGroup = (group: AjoGroup) => {
    const msg = "Join my Ajo group on Zela! We save $" + (group.contributionAmount / Math.pow(10, USDC_DECIMALS)).toFixed(2) + " USDC every " + " days together. Protected by Solana smart contract — nobody can cheat. Join here: https://zela-six-theta.vercel.app";
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  };

  const statusColor = (s: number) => {
    if (s === 0) return { bg: "rgba(255,165,0,0.1)", border: "rgba(255,165,0,0.2)", color: "#ffa500", label: "Open" };
    if (s === 1) return { bg: "rgba(0,212,170,0.1)", border: "rgba(0,212,170,0.2)", color: "#00d4aa", label: "Active" };
    return { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", label: "Complete" };
  };

  if (!wallet.connected) return null;

  return (
    <div>
      {view === "list" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.3px" }}>Ajo Groups</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>Group savings — protected by Solana</p>
            </div>
            <button
              onClick={() => setView("create")}
              style={{ background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, padding: "10px 16px", cursor: "pointer" }}
            >
              + Create
            </button>
          </div>

          {/* How it works */}
          <div style={{ background: "linear-gradient(135deg, rgba(0,212,170,0.08), rgba(124,58,237,0.08))", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: 13 }}>How Zela Ajo Works</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "🔐", text: "Everyone locks a security deposit — no one can disappear" },
                { icon: "🔄", text: "Each round, one member receives the full pot" },
                { icon: "🗳️", text: "Emergency? Group votes to release funds early" },
                { icon: "⚡", text: "Smart contract handles everything — no organiser needed" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Demo group to show functionality */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15 }}>Lagos Freelancers Ajo</p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Created by you • 7-day rounds</p>
              </div>
              <span style={{ fontSize: 11, background: "rgba(255,165,0,0.1)", border: "1px solid rgba(255,165,0,0.2)", color: "#ffa500", padding: "3px 10px", borderRadius: 20 }}>Open</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800, color: "#00d4aa" }}>$10</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>per round</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800 }}>1/5</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>members</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800, color: "#ffa500" }}>$50</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>pot size</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => shareGroup({ publicKey: "", name: "Lagos Freelancers Ajo", contributionAmount: 10000000, maxMembers: 5, currentMembers: 1, currentRound: 0, status: 0, admin: "", nextRoundAt: 0 })}
                style={{ flex: 1, padding: "10px", background: "#25D366", border: "none", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
              >
                Invite on WhatsApp
              </button>
              <button
                style={{ flex: 1, padding: "10px", background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.25)", borderRadius: 10, color: "#00d4aa", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
              >
                View Group
              </button>
            </div>
          </div>

          <button
            onClick={() => setView("create")}
            style={{ width: "100%", padding: "14px", background: "transparent", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 14, color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer" }}
          >
            + Create your first Ajo group
          </button>

          {status && (
            <div style={{ padding: "12px 16px", background: status.includes("Error") ? "rgba(255,59,48,0.1)" : "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, fontSize: 13, color: status.includes("Error") ? "#ff6b6b" : "#00d4aa", marginTop: 14 }}>
              {status}
            </div>
          )}
        </div>
      )}

      {view === "create" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={() => setView("list")} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "white", fontSize: 13, padding: "6px 12px", cursor: "pointer" }}>
              Back
            </button>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.3px" }}>Create Ajo Group</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, marginBottom: 14 }}>
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Group Name</p>
              <input
                placeholder="e.g. Lagos Freelancers Ajo"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as any }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Contribution per round (USDC)</p>
              <input
                type="number"
                placeholder="e.g. 10"
                value={contribution}
                onChange={e => setContribution(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as any }}
              />
              {contribution && (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  Pot size: ${(parseFloat(contribution || "0") * parseInt(maxMembers)).toFixed(2)} USDC • Security deposit: ${parseFloat(contribution || "0").toFixed(2)} USDC
                </p>
              )}
            </div>

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
                {[
                  { value: "0", label: "Private", desc: "Invite only" },
                  { value: "1", label: "Community", desc: "Open to all" },
                  { value: "2", label: "Business", desc: "For cooperatives" },
                ].map(type => (
                  <button
                    key={type.value}
                    onClick={() => setGroupType(type.value)}
                    style={{ flex: 1, padding: "10px 6px", background: groupType === type.value ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid " + (groupType === type.value ? "rgba(0,212,170,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 10, color: groupType === type.value ? "#00d4aa" : "rgba(255,255,255,0.5)", cursor: "pointer", textAlign: "center" }}
                  >
                    <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 12 }}>{type.label}</p>
                    <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {contribution && groupName && (
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Summary</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    ["Group", groupName],
                    ["Contribution", "$" + contribution + " USDC per round"],
                    ["Members", maxMembers + " people"],
                    ["Pot size", "$" + (parseFloat(contribution) * parseInt(maxMembers)).toFixed(2) + " USDC"],
                    ["Your deposit", "$" + parseFloat(contribution).toFixed(2) + " USDC (refundable)"],
                    ["Duration", duration + " days per round"],
                  ].map(([label, value], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={createGroup}
              disabled={loading || !groupName || !contribution}
              style={{ width: "100%", padding: "14px", background: groupName && contribution ? "linear-gradient(135deg, #00d4aa, #7c3aed)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, cursor: groupName && contribution ? "pointer" : "not-allowed" }}
            >
              {loading ? "Creating group on Solana..." : "Create Ajo Group"}
            </button>
          </div>

          {status && (
            <div style={{ padding: "12px 16px", background: status.includes("Error") ? "rgba(255,59,48,0.1)" : "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, fontSize: 13, color: status.includes("Error") ? "#ff6b6b" : "#00d4aa" }}>
              {status}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
