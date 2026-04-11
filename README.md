# Zela

The safest way for Africans to store, protect, and use USDC — without P2P stress.

Zela is a non-custodial USDC vault built on Solana. Your money sits in a smart contract that only you control. Not Zela. Not a bank. Not a P2P trader. You.

## The Problem

Every day, millions of Nigerians earning in USDC lose money to:
- Bad P2P rates on Bybit and Binance
- Inflation eating their Naira savings overnight
- Scammers in P2P trades
- Hidden fees on remittance platforms

## The Solution

Zela holds your USDC safely on Solana. You see your balance in Naira in real time. You withdraw instantly, anytime, with no permission needed from anyone.

## Live Rate

Zela pulls live USDC/NGN rates so Tunde always knows exactly what his savings are worth in Naira — without converting manually or trusting a P2P trader.

## Smart Contract

- initialize_vault — creates your personal non-custodial vault
- deposit — locks USDC in your vault on Solana
- withdraw — releases USDC back to you instantly

## Tests
## Stack

- Rust + Anchor 0.32.1
- React + TypeScript frontend
- Solana Wallet Adapter — Phantom
- CoinGecko API for live NGN rates
- Deployed on Solana devnet

## Run the smart contract

```bash
git clone https://github.com/Kingfaitho/zela
cd zela
npm install
anchor test
```

## Live Demo

https://zela-six-theta.vercel.app

Connect your Phantom wallet on devnet and try it yourself.

## Run the frontend

```bash
cd app
npm install
npm run dev
```

---

Built by someone who lost money to P2P. So nobody else has to.
