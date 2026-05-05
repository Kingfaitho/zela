import { useState } from "react";

interface OnboardingProps {
  onComplete: () => void;
  userName: string;
}

const steps = [
  {
    emoji: "🔐",
    title: "Your money is protected",
    body: "Zela holds your USDC in a smart contract on Solana. Only you can withdraw it. Not Zela. Not any bank. Only you.",
    cta: "I understand, continue",
  },
  {
    emoji: "📈",
    title: "Stop losing to inflation",
    body: "The Naira loses value every week. By saving in USDC on Zela, your money keeps its value and can grow over time.",
    cta: "That makes sense",
  },
  {
    emoji: "🤝",
    title: "Save with your community",
    body: "Zela Ajo lets you save in groups the traditional way. Except now the smart contract holds the money. Nobody can run away with the pot.",
    cta: "Let us get started",
  },
];

export default function Onboarding({ onComplete, userName }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "linear-gradient(160deg, #080810 0%, #0d1220 60%, #0a1628 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, zIndex: 200,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #00d4aa, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 }}>Z</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 4, height: 4, marginBottom: 40, overflow: "hidden" }}>
          <div style={{ height: "100%", width: progress + "%", background: "linear-gradient(90deg, #00d4aa, #7c3aed)", borderRadius: 4, transition: "width 0.4s ease" }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>{current.emoji}</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.5px", lineHeight: 1.2, color: "white" }}>
            {current.title}
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
            {current.body}
          </p>
        </div>

        <button
          onClick={next}
          style={{
            width: "100%", padding: "16px",
            background: "linear-gradient(135deg, #00d4aa, #7c3aed)",
            border: "none", borderRadius: 14, color: "white",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            marginBottom: 16,
          }}
        >
          {current.cta}
        </button>

        <button
          onClick={onComplete}
          style={{ width: "100%", padding: "12px", background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer" }}
        >
          Skip for now
        </button>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#00d4aa" : "rgba(255,255,255,0.15)", transition: "all 0.3s ease" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
