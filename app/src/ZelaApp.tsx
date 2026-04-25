import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Program, AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import ZelaAI from "./ZelaAI";
import TransactionHistory from "./TransactionHistory";
import PaystackOnramp from "./PaystackOnramp";
import PaystackOfframp from "./PaystackOfframp";
import ReferralSystem from "./ReferralSystem";
import SavingsGoals from "./SavingsGoals";
import InflationTracker from "./InflationTracker";
import idl from "./zela.json";

const PROGRAM_ID = new PublicKey("G7BsDNn5y6h1dFngYtf1xNpg7btMFjmT24R6jWENK1yB");
const DEVNET_USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const USDC_DECIMALS = 6;

type Tab = "home" | "send" | "save" | "ai" | "more";

export default function ZelaApp() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [ngnRate, setNgnRate] = useState(1650);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [vaultExists, setVaultExists] = useState(false);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [depositCount, setDepositCount] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const getProgram = useCallback(() => {
    const provider = new AnchorProvider(connection, wallet as any, {});
    setProvider(provider);
    return new Program(idl as any, provider) as any;
  }, [connection, wallet]);

  const getVaultPda = useCallback(() => {
    if (!wallet.publicKey) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), wallet.publicKey.toBuffer(), DEVNET_USDC_MINT.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  }, [wallet.publicKey]);

  const fetchRate = async () => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data.rates?.NGN) setNgnRate(data.rates.NGN);
    } catch { setNgnRate(1650); }
  };

  const fetchData = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey) return;
    try {
      try {
        const userUsdcAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, wallet.publicKey);
        const usdcAccount = await getAccount(connection, userUsdcAccount);
        setUsdcBalance(Number(usdcAccount.amount) / Math.pow(10, USDC_DECIMALS));
      } catch { setUsdcBalance(0); }
      const vaultPda = getVaultPda();
      if (!vaultPda) return;
      try {
        const program = getProgram();
        const vault = await program.account.zelaVault.fetch(vaultPda);
        setVaultExists(true);
        setTotalDeposited(vault.totalDeposited.toNumber() / Math.pow(10, USDC_DECIMALS));
        setDepositCount(vault.depositCount.toNumber());
      } catch { setVaultExists(false); }
    } catch (e) { console.error(e); }
  }, [wallet.connected, wallet.publicKey, getProgram, getVaultPda, connection]);

  useEffect(() => { fetchRate(); const i = setInterval(fetchRate, 60000); return () => clearInterval(i); }, []);
  useEffect(() => { if (wallet.connected) fetchData(); }, [wallet.connected, fetchData]);

  const deposit = async () => {
    if (!wallet.publicKey || !depositAmount) return;
    setLoading(true);
    setStatus("Processing deposit...");
    try {
      const program = getProgram();
      const vaultPda = getVaultPda();
      const amount = new BN(parseFloat(depositAmount) * Math.pow(10, USDC_DECIMALS));
      const ownerTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, wallet.publicKey);
      const vaultTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, vaultPda!, true);
      await program.methods.deposit(amount).accounts({
        owner: wallet.publicKey, mint: DEVNET_USDC_MINT, vault: vaultPda,
        ownerTokenAccount, vaultTokenAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: PublicKey.default,
      }).rpc();
      setStatus("Deposited! Your USDC is protected.");
      setDepositAmount("");
      fetchData();
    } catch (e: any) { setStatus("Error: " + e.message); }
    setLoading(false);
  };

  const withdraw = async () => {
    if (!wallet.publicKey || !withdrawAmount) return;
    setLoading(true);
    setStatus("Processing withdrawal...");
    try {
      const program = getProgram();
      const vaultPda = getVaultPda();
      const amount = new BN(parseFloat(withdrawAmount) * Math.pow(10, USDC_DECIMALS));
      const ownerTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, wallet.publicKey);
      const vaultTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, vaultPda!, true);
      await program.methods.withdraw(amount).accounts({
        owner: wallet.publicKey, mint: DEVNET_USDC_MINT, vault: vaultPda,
        ownerTokenAccount, vaultTokenAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: PublicKey.default,
      }).rpc();
      setStatus("Withdrawn!");
      setWithdrawAmount("");
      fetchData();
    } catch (e: any) { setStatus("Error: " + e.message); }
    setLoading(false);
  };

  const ngnBalance = (totalDeposited * ngnRate).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
  const userEmail = wallet.publicKey?.toString().slice(0, 8) || "";

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "send", icon: "💸", label: "Send" },
    { id: "save", icon: "🎯", label: "Save" },
    { id: "ai", icon: "🤖", label: "AI" },
    { id: "more", icon: "⚡", label: "More" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)", color: "white", fontFamily: "'Inter', sans-serif", maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #00d4aa, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>Z</div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Zela</span>
        </div>
        <WalletMultiButton style={{ background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, padding: "8px 14px" }} />
      </div>

      <div style={{ padding: "0 20px", paddingTop: 16 }}>
        {!wallet.connected ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🔐</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: "-1px" }}>Your money, protected.</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
              Stop losing money to bad P2P rates.<br/>Zela keeps your USDC safe on Solana.
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Connect Phantom wallet to get started</p>
          </div>
        ) : (
          <>
            {/* Balance Card - always visible */}
            <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(0,212,170,0.3))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "24px 20px", marginBottom: 20, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Vault Balance</span>
                <span style={{ fontSize: 12, color: "#00d4aa", background: "rgba(0,212,170,0.1)", padding: "2px 8px", borderRadius: 20 }}>
                  $1 = ₦{ngnRate.toLocaleString()}
                </span>
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-1px" }}>{ngnBalance}</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 16px" }}>${totalDeposited.toFixed(2)} USDC</p>
              <div style={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 2px" }}>Wallet</p>
                  <p style={{ color: "white", fontWeight: 700, margin: 0, fontSize: 14 }}>${usdcBalance.toFixed(2)}</p>
                </div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 2px" }}>Deposits</p>
                  <p style={{ color: "white", fontWeight: 700, margin: 0, fontSize: 14 }}>{depositCount}</p>
                </div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 2px" }}>Protected</p>
                  <p style={{ color: "#00d4aa", fontWeight: 700, margin: 0, fontSize: 14 }}>Active</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {activeTab === "home" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <button onClick={() => setActiveTab("send")} style={{ background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 14, padding: "16px 12px", color: "white", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>💸</div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Add Money</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Naira to USDC</p>
                  </button>
                  <button onClick={() => setActiveTab("send")} style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 14, padding: "16px 12px", color: "white", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🏦</div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Withdraw</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>To bank account</p>
                  </button>
                  <button onClick={() => setActiveTab("send")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 12px", color: "white", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>⬆️</div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Deposit</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>USDC to vault</p>
                  </button>
                  <button onClick={() => setActiveTab("send")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 12px", color: "white", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📤</div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Send</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>To any wallet</p>
                  </button>
                </div>
                <InflationTracker totalDeposited={totalDeposited} ngnRate={ngnRate} depositCount={depositCount} />
                <TransactionHistory />
              </div>
            )}

            {activeTab === "send" && (
              <div>
                <PaystackOnramp ngnRate={ngnRate} userEmail={userEmail} onSuccess={fetchData} />
                <PaystackOfframp ngnRate={ngnRate} vaultBalance={totalDeposited} onWithdraw={(amount) => { setStatus("Withdrawal of $" + amount + " initiated!"); fetchData(); }} />
                {vaultExists && (
                  <>
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                      <p style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Deposit USDC to Vault</p>
                      <div style={{ display: "flex", gap: 10 }}>
                        <input type="number" placeholder="Amount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                          style={{ flex: 1, padding: "12px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "white", fontSize: 15, outline: "none" }} />
                        <button onClick={deposit} disabled={loading} style={{ padding: "12px 20px", background: "#00d4aa", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, cursor: "pointer" }}>
                          {loading ? "..." : "Deposit"}
                        </button>
                      </div>
                      {depositAmount && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 8 }}>≈ ₦{(parseFloat(depositAmount || "0") * ngnRate).toLocaleString()}</p>}
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                      <p style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Withdraw USDC</p>
                      <div style={{ display: "flex", gap: 10 }}>
                        <input type="number" placeholder="Amount" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                          style={{ flex: 1, padding: "12px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "white", fontSize: 15, outline: "none" }} />
                        <button onClick={withdraw} disabled={loading} style={{ padding: "12px 20px", background: "#7c3aed", border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer" }}>
                          {loading ? "..." : "Withdraw"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "save" && (
              <div>
                <SavingsGoals vaultBalance={totalDeposited} ngnRate={ngnRate} />
                <ReferralSystem />
              </div>
            )}

            {activeTab === "ai" && (
              <ZelaAI ngnRate={ngnRate} usdcBalance={usdcBalance} vaultBalance={totalDeposited} />
            )}

            {activeTab === "more" && (
              <div>
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>About Zela</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, margin: "0 0 16px" }}>
                    Zela is a non-custodial USDC vault built on Solana. Your money is protected by smart contracts — not even Zela can access it.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <a href="https://explorer.solana.com/address/G7BsDNn5y6h1dFngYtf1xNpg7btMFjmT24R6jWENK1yB?cluster=devnet" target="_blank" rel="noreferrer"
                      style={{ color: "#00d4aa", fontSize: 13, textDecoration: "none" }}>
                      View Smart Contract on Solana Explorer
                    </a>
                    <a href="https://github.com/Kingfaitho/zela" target="_blank" rel="noreferrer"
                      style={{ color: "#00d4aa", fontSize: 13, textDecoration: "none" }}>
                      View Source Code on GitHub
                    </a>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Coming Soon</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {["🤝 Ajo — Group Savings on Solana", "📱 Mobile App", "🌍 More African Languages", "🏦 Mainnet Launch"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14 }}>{item}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 20 }}>Soon</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {status && (
              <div style={{ padding: "14px 16px", background: status.includes("Error") ? "rgba(255,59,48,0.15)" : "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 12, fontSize: 14, color: status.includes("Error") ? "#ff3b30" : "#00d4aa", marginBottom: 16 }}>
                {status}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Tab Bar */}
      {wallet.connected && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "rgba(10,10,10,0.95)", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", padding: "8px 0", zIndex: 100 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}>
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, color: activeTab === tab.id ? "#00d4aa" : "rgba(255,255,255,0.4)", fontWeight: activeTab === tab.id ? 700 : 400 }}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#00d4aa" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
