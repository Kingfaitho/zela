# Zela

Zela helps Africans protect their money from inflation, send it across borders, and save together in groups - all on Solana.

Built by someone who lost money to P2P traders. So nobody else has to.

## Live Demo

https://zela-six-theta.vercel.app

Sign in with your email, phone, or Google. No wallet needed.

## The Problem

Every day, millions of Nigerians earning in USDC lose money to bad P2P rates, inflation eating their Naira savings, and expensive transfer fees. There is no safe and simple way to hold digital dollars in Africa without trusting a middleman who can disappear with your money.

## What Zela Does

**Zela Vault**
Your USDC sits in a smart contract on Solana. Only you can withdraw it. Not Zela. Not a bank. Not a P2P trader. The code is the only rule.

**Ajo Protocol**
Ajo is a rotating savings tradition where groups contribute money together and one member takes the pot each round. Zela puts Ajo on the blockchain. No organiser can steal. No member can disappear without losing their deposit. The contract distributes automatically.

**Zela AI**
Ask about your money in plain English or Pidgin. Get real answers based on your actual balance and the live exchange rate.

**Paystack Onramp and Offramp**
Add money with Naira. Withdraw to your Nigerian bank account. No crypto exchange needed.

**Business Tools**
Create payment links in seconds. Share on WhatsApp. Generate professional invoices. Track income and expenses.

## What Makes Zela Different

Zela is the only African fintech that protects your money in three ways at once:

1. From inflation : USDC holds value while Naira loses value

2. From P2P scammers : non-custodial smart contract, nobody holds your money

3. From death and loss : Family Vault automatically releases to your loved ones if you stop checking in

## What Makes Zela Different

Zela is the only African fintech that protects your money in three ways at once:

1. From inflation : USDC holds value while Naira loses value

2. From P2P scammers : non-custodial smart contract, nobody holds your money

3. From death and loss : Family Vault automatically releases to your loved ones if you stop checking in

## What Makes Zela Different

Zela is the only African fintech that protects your money in three ways at once:

1. From inflation : USDC holds value while Naira loses value

2. From P2P scammers : non-custodial smart contract, nobody holds your money

3. From death and loss : Family Vault automatically releases to your loved ones if you stop checking in

## Smart Contracts

Zela Vault: G7BsDNn5y6h1dFngYtf1xNpg7btMFjmT24R6jWENK1yB

Ajo Protocol: DHhqgD4WSanbkFZHPgxM4oSmodn5f24Jw1pyzX7sZcfA

Both deployed on Solana devnet.

## Tech Stack

Rust and Anchor for smart contracts, React and TypeScript for the frontend, Privy for email and phone login, Groq AI for the financial assistant, Paystack for Naira payments.

## Run It Locally

```bash
git clone https://github.com/Kingfaitho/zela
cd zela
npm install
anchor test
cd app
npm install
npm run dev
```

## Tests

4 passing on Zela Vault: initialize, deposit, withdraw, overdraft protection

Ajo Protocol: group creation, member joining, emergency requests

## About

Built by Kayode Faith, a product manager turned Solana developer from Lagos, Nigeria.

Applied for Solana Foundation grant. Building toward mainnet.
