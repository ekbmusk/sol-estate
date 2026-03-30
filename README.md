# CarbonKZ

Первый маркетплейс токенизированных углеродных кредитов в Центральной Азии на Solana. Полный цикл: верификация проекта, токенизация, инвестирование за KZTE (стейблкоин 1:1 к тенге), дивиденды, P2P торговля, гашение кредитов с immutable proof on-chain.

**Хакатон:** Decentrathon 5.0, Кейс 1 (RWA)

## Проблема

Казахстан — 4-е место в мире по CO2/ВВП. 349 млн тонн CO2/год. Рынок углеродных кредитов существует с 2013 года (KZ ETS), но мёртв: $1/тонна, 135 участников, только спот. Цель правительства — $50/тонна к 2030 (x50 рост). Ни одного блокчейн-проекта по carbon credits в ЦА.

## Решение

CarbonKZ токенизирует углеродные кредиты реальных зелёных проектов Казахстана на Solana:

- **Верификация** — doc hash фиксируется on-chain
- **Инвестирование** — покупка долей за KZTE, share-токены на кошелёк
- **Дивиденды** — выручка от продажи кредитов распределяется пропорционально
- **Retire (гашение)** — burn токенов + immutable RetireRecord PDA. Double counting невозможен.

## Архитектура

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│         Next.js 16 + Tailwind + shadcn/ui   │
│         Wallet: Phantom (wallet-adapter)     │
└──────────────────┬──────────────────────────┘
                   │ @coral-xyz/anchor
┌──────────────────▼──────────────────────────┐
│            Solana Program (Anchor)           │
│                                              │
│  initialize_project  verify_project  invest  │
│  distribute_revenue  claim_dividends         │
│  retire_credits      mint_carbon_tokens      │
│  list_shares         buy_shares              │
│  cancel_listing      create_share_metadata   │
│                                              │
│  PDA Accounts:                               │
│  CarbonProject  InvestorRecord  VaultAccount │
│  RetireRecord   Listing                      │
└──────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Solana (Devnet) |
| Smart Contract | Anchor 0.32, Rust |
| Token | SPL Token (KZTE, CarbonToken, ShareToken) |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Wallet | @solana/wallet-adapter (Phantom) |
| Payments | KZTE stablecoin (1:1 KZT, 6 decimals) |

## Devnet

- **Program ID:** `3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg`
- **KZTE Mint:** `tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE`
- [Explorer](https://explorer.solana.com/address/3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg?cluster=devnet)

## Быстрый старт

```bash
# Контракт
anchor build
anchor test --provider.cluster localnet    # 16/16 tests

# Деплой на devnet
solana config set --url devnet
anchor deploy --provider.cluster devnet

# Создать проекты на devnet
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-node scripts/setup-devnet.ts

# Фронтенд
cd app && npm install && npm run dev
```

## Проекты на devnet

| Проект | Тип | CO2/год | Локация |
|--------|-----|---------|---------|
| СЭС Университета Ахмеда Ясави | Solar | 36 т | Туркестан |
| Ветропарк Ерейментау | Wind | 12,000 т | Акмолинская обл. |
| Лесовосстановление Бурабай | Forest | 3,000 т | Нац. парк Бурабай |
| ArcelorMittal Теміртау | Industrial | 8,000 т | Карагандинская обл. |

## Killer Feature: Retire (Гашение)

1. Компания покупает CarbonToken
2. Вызывает `retire_credits` с количеством и целью
3. Токены **сжигаются** навсегда (SPL Token burn)
4. Создаётся immutable `RetireRecord` PDA on-chain
5. Double counting невозможен — сожжённый токен не существует
6. On-chain proof для аудиторов через Solana Explorer

## Команда

Decentrathon 5.0 — Кейс 1 (RWA)
