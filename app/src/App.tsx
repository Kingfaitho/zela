import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import ZelaApp from "./ZelaApp";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./App.css";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

function App() {
  return (
    <PrivyProvider
      appId="cmo5etk1q00i90cl7gk2u4xg2"
      config={{
        loginMethods: ["email", "sms", "google", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#00d4aa",
          landingHeader: "Welcome to Zela",
          loginMessage: "Sign in to protect your money from inflation",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      <ZelaApp />
    </PrivyProvider>
  );
}

export default App;
