import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import axios from "axios";
import idl from "./zela.json";

const PROGRAM_ID = new PublicKey("G7BsDNn5y6h1dFngYtf1xNpg7btMFjmT24R6jWENK1yB");
const USDC_DECIMALS = 6;

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

  const getProgram = useCallback(() => {
    const provider = new AnchorProvider(connection, wallet as any, {});
    setProvider(provider);
    return new Program(idl as any, provider) as any;
  }, [connection, wallet]);

  const getVaultPda = useCallback(() => {
    if (!wallet.publicKey) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), wallet.publicKey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  }, [wallet.publicKey]);

  const fetchRate = async () => {
    try {
      const res = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ngn"
      );
      const rate = res.data["usd-coin"]?.ngn;
      if (rate) setNgnRate(rate);
    } catch {
      setNgnRate(1650);
    }
  };

  const fetchVaultData = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey) return;
    try {
      const program = getProgram();
      const vaultPda = getVaultPda();
      if (!vaultPda) return;
      const vault = await program.account.zelaVault.fetch(vaultPda);
      setVaultExists(true);
      setTotalDeposited(vault.totalDeposited.toNumber() / Math.pow(10, USDC_DECIMALS));
      setDepositCount(vault.depositCount.toNumber());
    } catch {
      setVaultExists(false);
    }
  }, [wallet.connected, wallet.publicKey, getProgram, getVaultPda]);

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (wallet.connected) fetchVaultData();
  }, [wallet.connected, fetchVaultData]);

  const initializeVault = async () => {
    if (!wallet.connected || !wallet.publicKey) return;
    setLoading(true);
    setStatus("Initializing your Zela vault...");
    try {
      const program = getProgram();
      const vaultPda = getVaultPda();
      await program.methods
        .initializeVault()
        .accounts({
          owner: wallet.publicKey,
          vault: vaultPda,
          systemProgram: PublicKey.default,
        })
        .rpc();
      setVaultExists(true);
      setStatus("Vault created! Your money is now protected.");
      fetchVaultData();
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
    setLoading(false);
  };

  const ngnBalance = (totalDeposited * ngnRate).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
      color: "white",
      fontFamily: "'Inter', sans-serif",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #00d4aa, #7c3aed)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}>Z</div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>Zela</span>
        </div>
        <WalletMultiButton style={{
          background: "linear-gradient(135deg, #00d4aa, #7c3aed)",
          border: "none",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 600,
        }} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>

        {!wallet.connected ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
              Your money, protected.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
              Stop losing money to bad P2P rates and inflation.
              Zela keeps your USDC safe on Solana — only you can touch it.
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
              Connect your Phantom wallet to get started
            </p>
          </div>
        ) : (
          <>
            {/* Rate Banner */}
            <div style={{
              background: "rgba(0,212,170,0.1)",
              border: "1px solid rgba(0,212,170,0.3)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>Live Rate</span>
              <span style={{ color: "#00d4aa", fontWeight: 700, fontSize: 14 }}>
                $1 USDC = ₦{ngnRate.toLocaleString()}
              </span>
            </div>

            {/* Balance Card */}
            <div style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,212,170,0.2))",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: "32px 24px",
              marginBottom: 24,
              textAlign: "center",
            }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 8 }}>
                Your Vault Balance
              </p>
              <h1 style={{ fontSize: 42, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-1px" }}>
                {ngnBalance}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: "0 0 20px" }}>
                ${totalDeposited.toFixed(2)} USDC
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>Total Deposits</p>
                  <p style={{ color: "white", fontWeight: 600, margin: 0 }}>{depositCount}</p>
                </div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>Protection</p>
                  <p style={{ color: "#00d4aa", fontWeight: 600, margin: 0 }}>Active ✓</p>
                </div>
              </div>
            </div>

            {!vaultExists ? (
              <button
                onClick={initializeVault}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "linear-gradient(135deg, #00d4aa, #7c3aed)",
                  border: "none",
                  borderRadius: 14,
                  color: "white",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: 16,
                }}
              >
                {loading ? "Creating vault..." : "Create My Zela Vault"}
              </button>
            ) : (
              <>
                {/* Deposit */}
                <div style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                }}>
                  <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Deposit USDC</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      type="number"
                      placeholder="Amount in USDC"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
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
                      disabled={loading}
                      onClick={() => {
                        setStatus("Deposit coming soon — connecting to devnet...");
                      }}
                      style={{
                        padding: "12px 20px",
                        background: "#00d4aa",
                        border: "none",
                        borderRadius: 10,
                        color: "#000",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: 15,
                      }}
                    >
                      Deposit
                    </button>
                  </div>
                  {depositAmount && (
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 8 }}>
                      ≈ ₦{(parseFloat(depositAmount || "0") * ngnRate).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Withdraw */}
                <div style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                }}>
                  <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Withdraw USDC</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      type="number"
                      placeholder="Amount in USDC"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
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
                      disabled={loading}
                      style={{
                        padding: "12px 20px",
                        background: "#7c3aed",
                        border: "none",
                        borderRadius: 10,
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: 15,
                      }}
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Status */}
            {status && (
              <div style={{
                padding: "14px 16px",
                background: status.includes("Error") ? "rgba(255,59,48,0.15)" : "rgba(0,212,170,0.15)",
                border: `1px solid ${status.includes("Error") ? "rgba(255,59,48,0.3)" : "rgba(0,212,170,0.3)"}`,
                borderRadius: 12,
                fontSize: 14,
                color: status.includes("Error") ? "#ff3b30" : "#00d4aa",
              }}>
                {status}
              </div>
            )}

            {/* Bottom message */}
            <p style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
              marginTop: 24,
              lineHeight: 1.6,
            }}>
              Your funds are secured by Solana smart contracts.
              Not even Zela can access your money.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
