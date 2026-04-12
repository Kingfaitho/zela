import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Program, AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import axios from "axios";
import idl from "./zela.json";
import ZelaAI from "./ZelaAI";

const PROGRAM_ID = new PublicKey("G7BsDNn5y6h1dFngYtf1xNpg7btMFjmT24R6jWENK1yB");
const DEVNET_USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const USDC_DECIMALS = 6;
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

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
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");

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
      const res = await fetch(
        "https://open.er-api.com/v6/latest/USD"
      );
      const data = await res.json();
      const ngnPerUsd = data.rates?.NGN;
      if (ngnPerUsd) setNgnRate(ngnPerUsd);
    } catch {
      setNgnRate(1650);
    }
  };

  const fetchData = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey) return;
    try {
      const program = getProgram();
      const vaultPda = getVaultPda();
      if (!vaultPda) return;

      // Fetch USDC balance
      try {
        const userUsdcAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, wallet.publicKey);
        const usdcAccount = await getAccount(connection, userUsdcAccount);
        setUsdcBalance(Number(usdcAccount.amount) / Math.pow(10, USDC_DECIMALS));
      } catch { setUsdcBalance(0); }

      // Fetch vault
      try {
        const vault = await program.account.zelaVault.fetch(vaultPda);
        setVaultExists(true);
        setTotalDeposited(vault.totalDeposited.toNumber() / Math.pow(10, USDC_DECIMALS));
        setDepositCount(vault.depositCount.toNumber());
      } catch { setVaultExists(false); }
    } catch (e) { console.error(e); }
  }, [wallet.connected, wallet.publicKey, getProgram, getVaultPda, connection]);

  useEffect(() => { fetchRate(); const i = setInterval(fetchRate, 60000); return () => clearInterval(i); }, []);
  useEffect(() => { if (wallet.connected) fetchData(); }, [wallet.connected, fetchData]);

  const initializeVault = async () => {
    if (!wallet.publicKey) return;
    setLoading(true);
    setStatus("Creating your Zela vault...");
    try {
      const program = getProgram();
      const vaultPda = getVaultPda();
      await program.methods.initializeVault().accounts({
        owner: wallet.publicKey,
        mint: DEVNET_USDC_MINT,
        vault: vaultPda,
        systemProgram: PublicKey.default,
      }).rpc();
      setStatus("Vault created! Your money is now protected on Solana.");
      fetchData();
    } catch (e: any) {
      if (e.message.includes("already in use")) {
        setStatus("Vault already exists! Loading your vault...");
        setVaultExists(true);
        fetchData();
      } else {
        setStatus("Error: " + e.message);
      }
    }
    setLoading(false);
  };

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
        owner: wallet.publicKey,
        mint: DEVNET_USDC_MINT,
        vault: vaultPda,
        ownerTokenAccount,
        vaultTokenAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: PublicKey.default,
      }).rpc();
      setStatus("Deposited successfully! Your USDC is protected.");
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
        owner: wallet.publicKey,
        mint: DEVNET_USDC_MINT,
        vault: vaultPda,
        ownerTokenAccount,
        vaultTokenAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: PublicKey.default,
      }).rpc();
      setStatus("Withdrawn successfully!");
      setWithdrawAmount("");
      fetchData();
    } catch (e: any) { setStatus("Error: " + e.message); }
    setLoading(false);
  };


  const transferUsdc = async () => {
    if (!wallet.publicKey || !sendAmount || !recipientAddress) return;
    setLoading(true);
    setStatus("Sending USDC...");
    try {
      const program = getProgram();
      const vaultPda = getVaultPda();
      const amount = new BN(parseFloat(sendAmount) * Math.pow(10, USDC_DECIMALS));
      const senderVaultTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, vaultPda!, true);
      const recipientPubkey = new PublicKey(recipientAddress);
      const recipientTokenAccount = await getAssociatedTokenAddress(DEVNET_USDC_MINT, recipientPubkey);

      await program.methods.transferUsdc(amount).accounts({
        sender: wallet.publicKey,
        mint: DEVNET_USDC_MINT,
        senderVault: vaultPda,
        senderVaultTokenAccount,
        recipient: recipientPubkey,
        recipientTokenAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: PublicKey.default,
      }).rpc();
      setStatus("Sent successfully! No P2P stress. No bad rates.");
      setSendAmount("");
      setRecipientAddress("");
      fetchData();
    } catch (e: any) { setStatus("Error: " + e.message); }
    setLoading(false);
  };

  const ngnBalance = (totalDeposited * ngnRate).toLocaleString("en-NG", { style: "currency", currency: "NGN" });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)", color: "white", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #00d4aa, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>Z</div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>Zela</span>
        </div>
        <WalletMultiButton style={{ background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600 }} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
        {!wallet.connected ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🔐</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: "-1px" }}>Your money, protected.</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
              Stop losing money to bad P2P rates and inflation.<br/>
              Zela keeps your USDC safe on Solana — only you can touch it.
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Connect your Phantom wallet to get started</p>
          </div>
        ) : (
          <>
            <div style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>Live Rate</span>
              <span style={{ color: "#00d4aa", fontWeight: 700, fontSize: 14 }}>$1 USDC = ₦{ngnRate.toLocaleString()}</span>
            </div>

            <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,212,170,0.2))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "32px 24px", marginBottom: 24, textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 8 }}>Vault Balance</p>
              <h1 style={{ fontSize: 42, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-1px" }}>{ngnBalance}</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: "0 0 20px" }}>${totalDeposited.toFixed(2)} USDC</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 4px" }}>Wallet USDC</p>
                  <p style={{ color: "white", fontWeight: 700, margin: 0 }}>${usdcBalance.toFixed(2)}</p>
                </div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 4px" }}>Deposits</p>
                  <p style={{ color: "white", fontWeight: 700, margin: 0 }}>{depositCount}</p>
                </div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 4px" }}>Protection</p>
                  <p style={{ color: "#00d4aa", fontWeight: 700, margin: 0 }}>Active ✓</p>
                </div>
              </div>
            </div>

            {!vaultExists ? (
              <button onClick={initializeVault} disabled={loading} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #00d4aa, #7c3aed)", border: "none", borderRadius: 14, color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>
                {loading ? "Creating vault..." : "Create My Zela Vault"}
              </button>
            ) : (
              <>
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Deposit USDC</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input type="number" placeholder="Amount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                      style={{ flex: 1, padding: "12px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "white", fontSize: 15, outline: "none" }} />
                    <button onClick={deposit} disabled={loading} style={{ padding: "12px 20px", background: "#00d4aa", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
                      {loading ? "..." : "Deposit"}
                    </button>
                  </div>
                  {depositAmount && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 8 }}>≈ ₦{(parseFloat(depositAmount || "0") * ngnRate).toLocaleString()}</p>}
                </div>

                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Withdraw USDC</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input type="number" placeholder="Amount" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                      style={{ flex: 1, padding: "12px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "white", fontSize: 15, outline: "none" }} />
                    <button onClick={withdraw} disabled={loading} style={{ padding: "12px 20px", background: "#7c3aed", border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
                      {loading ? "..." : "Withdraw"}
                    </button>
                  </div>
                  {withdrawAmount && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 8 }}>≈ ₦{(parseFloat(withdrawAmount || "0") * ngnRate).toLocaleString()}</p>}
                </div>

                {/* Send USDC */}
                <div style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                }}>
                  <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Send USDC</p>
                  <input
                    type="text"
                    placeholder="Recipient wallet address"
                    value={recipientAddress}
                    onChange={e => setRecipientAddress(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 10,
                      color: "white",
                      fontSize: 14,
                      outline: "none",
                      marginBottom: 10,
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      type="number"
                      placeholder="Amount USDC"
                      value={sendAmount}
                      onChange={e => setSendAmount(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "12px 14px",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 10,
                        color: "white",
                        fontSize: 15,
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={transferUsdc}
                      disabled={loading}
                      style={{
                        padding: "12px 20px",
                        background: "linear-gradient(135deg, #00d4aa, #7c3aed)",
                        border: "none",
                        borderRadius: 10,
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: 15,
                      }}
                    >
                      {loading ? "..." : "Send"}
                    </button>
                  </div>
                </div>
              </>
            )}

            <ZelaAI ngnRate={ngnRate} usdcBalance={usdcBalance} vaultBalance={totalDeposited} />

            {status && (
              <div style={{ padding: "14px 16px", background: status.includes("Error") ? "rgba(255,59,48,0.15)" : "rgba(0,212,170,0.15)", border: `1px solid ${status.includes("Error") ? "rgba(255,59,48,0.3)" : "rgba(0,212,170,0.3)"}`, borderRadius: 12, fontSize: 14, color: status.includes("Error") ? "#ff3b30" : "#00d4aa", marginBottom: 16 }}>
                {status}
              </div>
            )}

            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 16, lineHeight: 1.6 }}>
              Your funds are secured by Solana smart contracts.<br/>Not even Zela can access your money.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
