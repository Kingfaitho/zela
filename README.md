# Zela Non-Custodial USDC Vault for Africans

**The safest way for Nigerians and Africans to store, protect, and use USDC — without P2P stress, scams, or bad rates.**

Zela is a **non-custodial** USDC vault built on Solana. Your money stays in a smart contract that **only you control**. No bank. No company. No P2P trader. Just you and the blockchain.

## The Problem

Every day, many Nigerians earning in USDC lose money because of:
- Bad P2P rates on Binance and Bybit
- Scammers during P2P trades
- Inflation destroying Naira savings
- High hidden fees on remittance apps

## The Solution

Zela lets you deposit USDC into your personal vault on Solana.  
You can see your balance in **real-time Naira** using live exchange rates.  
You can withdraw your USDC **instantly** anytime no one can stop you.

## Key Features

- Create your own personal non-custodial vault
- Deposit USDC safely
- View live USDC → NGN rate (powered by CoinGecko)
- Withdraw USDC instantly to your wallet
- Full ownership, you control everything

## Smart Contract Instructions

- `initialize_vault` Creates your personal vault account (PDA)
- `deposit` Locks USDC into your vault
- `withdraw` Releases USDC back to your wallet

## Live Demo

Try it yourself on **Solana devnet**:

👉 **[https://zela-six-theta.vercel.app](https://zela-six-theta.vercel.app)**

Connect your Phantom wallet (set to devnet), create a vault, deposit test USDC, and withdraw.

## Tech Stack

- **On-chain Program**: Rust + Anchor (version 0.32.1)
- **Frontend**: React + TypeScript + TailwindCSS
- **Wallet**: Solana Wallet Adapter (Phantom)
- **Rates**: CoinGecko API for live USDC/NGN rate
- **Blockchain**: Solana devnet (mainnet deployment planned)

## Project Structure