import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

interface Transaction {
  signature: string;
  type: string;
  amount: string;
  time: string;
  status: string;
}

const PROGRAM_ID = new PublicKey("G7BsDNn5y6h1dFngYtf1xNpg7btMFjmT24R6jWENK1yB");

export default function TransactionHistory() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wallet.publicKey) return;
    fetchHistory();
  }, [wallet.publicKey]);

  const fetchHistory = async () => {
    if (!wallet.publicKey) return;
    setLoading(true);
    try {
      const signatures = await connection.getSignaturesForAddress(
        wallet.publicKey,
        { limit: 10 }
      );

      const history: Transaction[] = signatures.map((sig, i) => {
        const date = sig.blockTime
          ? new Date(sig.blockTime * 1000).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Unknown";

        return {
          signature: sig.signature,
          type: i === 0 ? "Recent" : "Transaction",
          amount: "USDC",
          time: date,
          status: sig.err ? "Failed" : "Success",
        };
      });

      setTxs(history);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!wallet.connected) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Transaction History</p>
        <button
          onClick={fetchHistory}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" }}>
          Loading history...
        </p>
      )}

      {!loading && txs.length === 0 && (
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" }}>
          No transactions yet. Make your first deposit!
        </p>
      )}

      {txs.map((tx, i) => (
        <div key={i} style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          borderBottom: i < txs.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: tx.status === "Success" ? "rgba(0,212,170,0.15)" : "rgba(255,59,48,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}>
              {tx.status === "Success" ? "✓" : "✗"}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{tx.type}</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{tx.time}</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{
              margin: 0,
              fontSize: 12,
              color: tx.status === "Success" ? "#00d4aa" : "#ff3b30",
              fontWeight: 600,
            }}>
              {tx.status}
            </p>
            
              href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}
            >
              View ↗
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
