import { useState, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import ZelaAI from "./ZelaAI";
import PaystackOnramp from "./PaystackOnramp";
import PaystackOfframp from "./PaystackOfframp";
import ReferralSystem from "./ReferralSystem";
import SavingsGoals from "./SavingsGoals";
import InflationTracker from "./InflationTracker";
import AjoFeature from "./AjoFeature";
import ZelaSplit from "./ZelaSplit";
import idl from "./zela.json";
import ZelaScore from "./ZelaScore";
import Onboarding from "./Onboarding";
import FamilyVault from "./FamilyVault";

const ZELA_PROGRAM_ID = new PublicKey("G7BsDNn5y6h1dFngYtf1xNpg7btMFjmT24R6jWENK1yB");
const DEVNET_USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const USDC_DECIMALS = 6;
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

type Tab = "home" | "money" | "save" | "ai" | "business";

export default function ZelaApp() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  const [ngnRate, setNgnRate] = useState(1650);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [vaultExists, setVaultExists] = useState(false);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [depositCount, setDepositCount] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [streak, setStreak] = useState(0);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("zela_onboarded");
  });

  const wallet = wallets?.[0];
  const publicKey = (() => {
    try {
      return wallet?.address ? new PublicKey(wallet.address) : null;
    } catch {
      return null;
    }
  })();

  const getProgram = useCallback(async () => {
    if (!wallet || !publicKey) return null;
    try {
      const solanaWallet = wallet as any;
      const anchorProvider = new AnchorProvider(
        connection,
        {
          publicKey,
          signTransaction: async (tx: any) => {
            if (solanaWallet.signTransaction) return solanaWallet.signTransaction(tx);
            throw new Error("Wallet does not support signTransaction");
          },
          signAllTransactions: async (txs: any) => {
            if (solanaWallet.signAllTransactions) return solanaWallet.signAllTransactions(txs);
            return Promise.all(txs.map((tx: any) => solanaWallet.signTransaction(tx)));
          },
        } as any,
        { commitment: "confirmed" }
      );
      return new Program(idl as any, anchorProvider) as any;
    } catch (e) {
      console.error("Program error:", e);
      return null;
    }
  }, [wallet, publicKey]);

  const getVaultPda = useCallback(() => {
    if (!publicKey) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), publicKey.toBuffer(), DEVNET_USDC_MINT.toBuffer()],
      ZELA_PROGRAM_ID
    );
    return pda;
  }, [publicKey]);

  const fetchRate = async () => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data.rates?.NGN) setNgnRate(data.rates.NGN);
    } catch { setNgnRate(1650); }
  };

  const fetchData = useCallback(async () => {
    if (!authenticated || !publicKey) return;
    try {
      try {
        const userUsdcAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, publicKey);
        const usdcAccount = await getAccount(connection, userUsdcAccount);
        setUsdcBalance(Number(usdcAccount.amount) / Math.pow(10, USDC_DECIMALS));
      } catch { setUsdcBalance(0); }

      const vaultPda = getVaultPda();
      if (!vaultPda) return;

      try {
        const program = await getProgram();
        if (!program) return;
        const vault = await program.account.zelaVault.fetch(vaultPda);
        setVaultExists(true);
        setTotalDeposited(vault.totalDeposited.toNumber() / Math.pow(10, USDC_DECIMALS));
        setDepositCount(vault.depositCount.toNumber());
      } catch { setVaultExists(false); }

      const sigs = await connection.getSignaturesForAddress(publicKey, { limit: 8 });
      setTxHistory(sigs.map(s => ({
        sig: s.signature,
        time: s.blockTime ? new Date(s.blockTime * 1000).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "Unknown",
        status: s.err ? "Failed" : "Success",
      })));
    } catch (e) { console.error(e); }
  }, [authenticated, publicKey, getProgram, getVaultPda]);

  useEffect(() => {
    fetchRate();
    const i = setInterval(fetchRate, 60000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (authenticated && publicKey) {
      fetchData();
      const key = publicKey.toString();
      const savedStreak = localStorage.getItem("zela_streak_" + key);
      const lastLogin = localStorage.getItem("zela_last_login_" + key);
      const today = new Date().toDateString();
      if (lastLogin !== today) {
        const s = savedStreak ? parseInt(savedStreak) + 1 : 1;
        setStreak(s);
        localStorage.setItem("zela_streak_" + key, s.toString());
        localStorage.setItem("zela_last_login_" + key, today);
      } else {
        setStreak(savedStreak ? parseInt(savedStreak) : 1);
      }
    }
  }, [authenticated, publicKey]);

  const deposit = async () => {
    if (!publicKey || !depositAmount) return;
    setLoading(true); setStatus("");
    try {
      const program = await getProgram();
      if (!program) throw new Error("Wallet not ready");
      const vaultPda = getVaultPda();
      const amount = new BN(parseFloat(depositAmount) * Math.pow(10, USDC_DECIMALS));
      const ownerTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, publicKey);
      const vaultTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, vaultPda!, true);
      await program.methods.deposit(amount).accounts({
        owner: publicKey, mint: DEVNET_USDC_MINT, vault: vaultPda,
        ownerTokenAccount, vaultTokenAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID, systemProgram: PublicKey.default,
      }).rpc();
      setStatus("Deposited successfully!"); setDepositAmount(""); fetchData();
    } catch (e: any) { setStatus("Error: " + e.message); }
    setLoading(false);
  };

  const withdraw = async () => {
    if (!publicKey || !withdrawAmount) return;
    setLoading(true); setStatus("");
    try {
      const program = await getProgram();
      if (!program) throw new Error("Wallet not ready");
      const vaultPda = getVaultPda();
      const amount = new BN(parseFloat(withdrawAmount) * Math.pow(10, USDC_DECIMALS));
      const ownerTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, publicKey);
      const vaultTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, vaultPda!, true);
      await program.methods.withdraw(amount).accounts({
        owner: publicKey, mint: DEVNET_USDC_MINT, vault: vaultPda,
        ownerTokenAccount, vaultTokenAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID, systemProgram: PublicKey.default,
      }).rpc();
      setStatus("Withdrawn successfully!"); setWithdrawAmount(""); fetchData();
    } catch (e: any) { setStatus("Error: " + e.message); }
    setLoading(false);
  };

  const transferUsdc = async () => {
    if (!publicKey || !sendAmount || !recipientAddress) return;
    setLoading(true); setStatus("");
    try {
      const program = await getProgram();
      if (!program) throw new Error("Wallet not ready");
      const vaultPda = getVaultPda();
      const amount = new BN(parseFloat(sendAmount) * Math.pow(10, USDC_DECIMALS));
      const senderVaultTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, vaultPda!, true);
      const recipientPubkey = new PublicKey(recipientAddress);
      const recipientTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, recipientPubkey);
      await program.methods.transferUsdc(amount).accounts({
        sender: publicKey, mint: DEVNET_USDC_MINT,
        senderVault: vaultPda, senderVaultTokenAccount,
        recipient: recipientPubkey, recipientTokenAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID, systemProgram: PublicKey.default,
      }).rpc();
      setStatus("Sent! No P2P stress."); setSendAmount(""); setRecipientAddress(""); fetchData();
    } catch (e: any) { setStatus("Error: " + e.message); }
    setLoading(false);
  };

  const ngnBalance = (totalDeposited * ngnRate).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
  const userIdentifier = user?.email?.address || user?.phone?.number || user?.google?.email || publicKey?.toString().slice(0, 8) || "";
  const streakEmoji = streak >= 100 ? "🏆" : streak >= 30 ? "🥇" : streak >= 7 ? "🥈" : "🔥";

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "money", icon: "💸", label: "Money" },
    { id: "save", icon: "🎯", label: "Save" },
    { id: "ai", icon: "🤖", label: "AI" },
    { id: "business", icon: "🤝", label: "Ajo" },
  ];

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: "12px 14px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, color: "white", fontSize: 14, outline: "none",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: 20, marginBottom: 14,
  };

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #00d4aa, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>Z</div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Loading Zela...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #080810 0%, #0d1220 60%, #0a1628 100%)", color: "white", fontFamily: "'Inter', -apple-system, sans-serif", width: "100%", maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 90, boxSizing: "border-box" as any }}>

      {/* Onboarding Overlay */}
      {showOnboarding && authenticated && (
        <Onboarding
          onComplete={() => {
            localStorage.setItem("zela_onboarded", "true");
            setShowOnboarding(false);
          }}
          userName={userIdentifier}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "rgba(8,8,16,0.95)", backdropFilter: "blur(20px)", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #00d4aa, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 }}>Z</div>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px" }}>Zela</span>
          {authenticated && streak > 0 && (
            <span style={{ fontSize: 11, background: "rgba(255,165,0,0.12)", border: "1px solid rgba(255,165,0,0.25)", borderRadius: 20, padding: "2px 8px", color: "#ffa500" }}>
              {streakEmoji} {streak}d
            </span>
          )}
        </div>
        {authenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userIdentifier}</span>
            <button onClick={logout} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: 12, padding: "6px 12px", cursor: "pointer" }}>
              Sign out
            </button>
          </div>
        ) : (
          <button onClick={login} style={{ background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", cursor: "pointer" }}>
            Sign In
          </button>
        )}
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        {!authenticated ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ width: 88, height: 88, borderRadius: 28, background: "linear-gradient(135deg, rgba(0,212,170,0.15), rgba(124,58,237,0.15))", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 28px" }}>🔐</div>
            <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 14, letterSpacing: "-1.5px", lineHeight: 1.15 }}>Your money,<br/>protected.</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.7, marginBottom: 36, maxWidth: 300, margin: "0 auto 36px" }}>
              Stop losing money to bad P2P rates and inflation. Join Zela and protect your savings today.
            </p>
            <button
              onClick={login}
              style={{ background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 14, color: "white", fontSize: 16, fontWeight: 700, padding: "16px 40px", cursor: "pointer", marginBottom: 24, width: "100%", maxWidth: 300 }}
            >
              Get Started Free
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 260, margin: "0 auto" }}>
              {[
                "Save in dollars, see balance in Naira",
                "Protected from inflation automatically",
                "Send money across Africa instantly",
                "Only you control your money",
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(0,212,170,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#00d4aa", flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textAlign: "left" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeTab === "home" && (
              <>
                <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,212,170,0.2))", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "22px 20px", marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.8px", textTransform: "uppercase" }}>Vault Balance</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#00d4aa", background: "rgba(0,212,170,0.1)", padding: "3px 8px", borderRadius: 20 }}>
                        $1 = ₦{ngnRate.toLocaleString()}
                      </span>
                      <button onClick={() => setBalanceHidden(!balanceHidden)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.7)", fontSize: 13, padding: "4px 8px", cursor: "pointer" }}>
                        {balanceHidden ? "👁" : "🙈"}
                      </button>
                    </div>
                  </div>
                  <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-1.5px" }}>
                    {balanceHidden ? "₦ ••••••" : ngnBalance}
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 18px" }}>
                    {balanceHidden ? "$••••" : "$" + totalDeposited.toFixed(2)} USDC protected
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16 }}>
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Wallet</p>
                      <p style={{ color: "white", fontWeight: 700, margin: 0, fontSize: 14 }}>{balanceHidden ? "••••" : "$" + usdcBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Deposits</p>
                      <p style={{ color: "white", fontWeight: 700, margin: 0, fontSize: 14 }}>{depositCount}</p>
                    </div>
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</p>
                      <p style={{ color: "#00d4aa", fontWeight: 700, margin: 0, fontSize: 14 }}>Protected</p>
                    </div>
                  </div>
                </div>

                {!vaultExists && publicKey && (
                  <div style={{ background: "linear-gradient(135deg, rgba(0,212,170,0.15), rgba(124,58,237,0.15))", border: "1px solid rgba(0,212,170,0.25)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 15 }}>Create your Zela Vault</p>
                    <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                      Your vault is the smart contract that holds your USDC on Solana. Only you can access it.
                    </p>
                    <button
                      onClick={async () => {
                        setLoading(true);
                        setStatus("Creating your vault on Solana...");
                        try {
                          const program = await getProgram();
                          if (!program) throw new Error("Wallet not ready");
                          const vaultPda = getVaultPda();
                          await program.methods.initializeVault().accounts({
                            owner: publicKey,
                            mint: DEVNET_USDC_MINT,
                            vault: vaultPda,
                            systemProgram: PublicKey.default,
                          }).rpc();
                          setVaultExists(true);
                          setStatus("Vault created! You are protected.");
                          fetchData();
                        } catch (e: any) {
                          if (e.message.includes("already in use")) {
                            setVaultExists(true);
                            setStatus("Vault is ready!");
                            fetchData();
                          } else {
                            setStatus("Error: " + e.message);
                          }
                        }
                        setLoading(false);
                      }}
                      disabled={loading}
                      style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
                    >
                      {loading ? "Creating vault..." : "Create My Vault"}
                    </button>
                  </div>
                )}
                {publicKey && usdcBalance === 0 && totalDeposited === 0 && (
                  <div style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13, color: "#ffa500" }}>Get started with test funds</p>
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                      Your wallet is ready. Get free test SOL and USDC to try Zela.
                    </p>
                    <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{publicKey.toString().slice(0,20)}...</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(publicKey.toString()); }}
                        style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, color: "white", fontSize: 11, padding: "4px 8px", cursor: "pointer" }}
                      >
                        Copy
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href="https://faucet.solana.com" target="_blank" rel="noreferrer"
                        style={{ flex: 1, padding: "9px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 9, color: "#a78bfa", fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
                        Get SOL
                      </a>
                      <a href="https://faucet.circle.com" target="_blank" rel="noreferrer"
                        style={{ flex: 1, padding: "9px", background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.25)", borderRadius: 9, color: "#00d4aa", fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
                        Get USDC
                      </a>
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
                  {[
                    { icon: "⬆️", label: "Add", action: () => setActiveTab("money") },
                    { icon: "⬇️", label: "Withdraw", action: () => setActiveTab("money") },
                    { icon: "📤", label: "Send", action: () => setActiveTab("money") },
                    { icon: "🎯", label: "Goals", action: () => setActiveTab("save") },
                  ].map((a, i) => (
                    <button key={i} onClick={a.action} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 6px", color: "white", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 20, marginBottom: 5 }}>{a.icon}</div>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{a.label}</p>
                    </button>
                  ))}
                </div>

                {streak > 0 && (
                  <div style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.18)", borderRadius: 14, padding: "14px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13 }}>{streakEmoji} {streak} Day Streak</p>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                        {streak >= 30 ? "Gold Saver!" : streak >= 7 ? "Silver Saver!" : "Keep saving daily!"}
                      </p>
                    </div>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#ffa500" }}>{streak}</p>
                  </div>
                )}

                <ZelaScore
                  totalDeposited={totalDeposited}
                  depositCount={depositCount}
                  streak={streak}
                  ngnRate={ngnRate}
                />

                <InflationTracker vaultBalance={totalDeposited} totalDeposited={totalDeposited} ngnRate={ngnRate} depositCount={depositCount} />

                <div style={cardStyle}>
                  <button onClick={() => setShowHistory(!showHistory)} style={{ width: "100%", background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>📋</span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>Transaction History</span>
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)", padding: "4px 10px", borderRadius: 20 }}>
                      {showHistory ? "Hide" : "View All"}
                    </span>
                  </button>
                  {showHistory && (
                    <div style={{ marginTop: 16 }}>
                      {txHistory.length === 0 ? (
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", padding: "10px 0" }}>No transactions yet</p>
                      ) : txHistory.map((tx, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < txHistory.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: tx.status === "Success" ? "rgba(0,212,170,0.12)" : "rgba(255,59,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: tx.status === "Success" ? "#00d4aa" : "#ff6b6b" }}>
                              {tx.status === "Success" ? "✓" : "!"}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Transaction</p>
                              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{tx.time}</p>
                            </div>
                          </div>
                          <button onClick={() => window.open("https://explorer.solana.com/tx/" + tx.sig + "?cluster=devnet", "_blank")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "money" && (
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.3px" }}>Money</p>
                <PaystackOnramp ngnRate={ngnRate} userEmail={userIdentifier} onSuccess={fetchData} />
                <PaystackOfframp ngnRate={ngnRate} vaultBalance={totalDeposited} onWithdraw={(amount) => { setStatus("Withdrawal of $" + amount + " initiated!"); fetchData(); }} />
                {vaultExists && (
                  <>
                    <div style={cardStyle}>
                      <p style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Deposit USDC to Vault</p>
                      <div style={{ display: "flex", gap: 10 }}>
                        <input type="number" placeholder="Amount in USDC" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} style={inputStyle} />
                        <button onClick={deposit} disabled={loading} style={{ padding: "12px 18px", background: "#00d4aa", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>
                          {loading ? "..." : "Deposit"}
                        </button>
                      </div>
                      {depositAmount && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 8, marginBottom: 0 }}>≈ ₦{(parseFloat(depositAmount || "0") * ngnRate).toLocaleString()}</p>}
                    </div>
                    <div style={cardStyle}>
                      <p style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Withdraw USDC</p>
                      <div style={{ display: "flex", gap: 10 }}>
                        <input type="number" placeholder="Amount in USDC" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} style={inputStyle} />
                        <button onClick={withdraw} disabled={loading} style={{ padding: "12px 18px", background: "#7c3aed", border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>
                          {loading ? "..." : "Withdraw"}
                        </button>
                      </div>
                    </div>
                    <div style={cardStyle}>
                      <p style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Send USDC to Anyone</p>
                      <input type="text" placeholder="Recipient wallet address" value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)}
                        style={{ ...inputStyle, width: "100%", marginBottom: 10, boxSizing: "border-box" }} />
                      <div style={{ display: "flex", gap: 10 }}>
                        <input type="number" placeholder="Amount in USDC" value={sendAmount} onChange={e => setSendAmount(e.target.value)} style={inputStyle} />
                        <button onClick={transferUsdc} disabled={loading} style={{ padding: "12px 18px", background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>
                          {loading ? "..." : "Send"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "save" && (
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.3px" }}>Save & Grow</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 16px" }}>Set goals. Track progress. Earn rewards for saving daily.</p>
                <FamilyVault ngnRate={ngnRate} totalDeposited={totalDeposited} />
                <SavingsGoals vaultBalance={totalDeposited} ngnRate={ngnRate} />
                <ReferralSystem />
              </div>
            )}

            {activeTab === "ai" && (
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.3px" }}>Zela AI</p>
                <ZelaAI ngnRate={ngnRate} usdcBalance={usdcBalance} vaultBalance={totalDeposited} />
              </div>
            )}

            {activeTab === "business" && (
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.3px" }}>Business</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 16px" }}>Save together on Solana. Nobody can steal.</p>
                <AjoFeature />
                <ZelaSplit ngnRate={ngnRate} />
              </div>
            )}

            {status && (
              <div style={{ padding: "12px 16px", background: status.includes("Error") ? "rgba(255,59,48,0.1)" : "rgba(0,212,170,0.1)", border: "1px solid " + (status.includes("Error") ? "rgba(255,59,48,0.2)" : "rgba(0,212,170,0.2)"), borderRadius: 12, fontSize: 13, color: status.includes("Error") ? "#ff6b6b" : "#00d4aa", marginBottom: 16, lineHeight: 1.5 }}>
                {status}
              </div>
            )}
          </>
        )}
      </div>

      {authenticated && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "rgba(6,6,14,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", padding: "10px 0 24px", zIndex: 100, boxSizing: "border-box" as any }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "4px 2px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: activeTab === tab.id ? "rgba(0,212,170,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                <span style={{ fontSize: 18 }}>{tab.icon}</span>
              </div>
              <span style={{ fontSize: 9, color: activeTab === tab.id ? "#00d4aa" : "rgba(255,255,255,0.3)", fontWeight: activeTab === tab.id ? 700 : 400, letterSpacing: "0.2px", whiteSpace: "nowrap" }}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}