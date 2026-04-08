# 🌿 CarbonKZ — Tokenized Carbon Credits Marketplace on Solana
DEMO: https://www.bekarys.me

📹 **Видео:** https://www.youtube.com/watch?v=RwAD03HL6j8

### 🇰🇿 Первый маркетплейс токенизированных углеродных кредитов в Центральной Азии

Полный цикл: верификация зелёного проекта → токенизация → инвестирование за KZTE (₸) → дивиденды → P2P marketplace → retire (гашение с on-chain proof)

**Хакатон:** Decentrathon 5.0 · Кейс 1 (RWA) · Апрель 2026

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana&logoColor=white)](https://explorer.solana.com/address/3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg?cluster=devnet)
[![Anchor](https://img.shields.io/badge/Anchor-0.32.1-blue)](https://www.anchor-lang.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Tests](https://img.shields.io/badge/Tests-16%2F16_passing-34D399)](tests/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🔥 Проблема

Казахстан — **349 млн тонн CO₂/год**, 17.5 т/чел (3× ОЭСР). Углеродный рынок KZ ETS мёртв: **$1/тонна** при $91 в ЕС, 135 участников, банки не допущены, double counting — норма. Цель правительства — **$50/т к 2030** (×50). World Bank: $4.8M грант. Solana Economic Zone KZ. **0 блокчейн-проектов** в ЦА.

---

## 💡 Решение

CarbonKZ токенизирует углеродные кредиты реальных зелёных проектов Казахстана на Solana и открывает рынок для всех: инвесторов, банков, ESG-компаний.

```
 Зелёный проект          Инвестор              Загрязнитель
      │                     │                      │
      ▼                     ▼                      ▼
 ┌─────────┐        ┌──────────────┐       ┌──────────────┐
 │ Verify  │        │   Invest     │       │   Retire     │
 │ doc_hash│        │  KZTE→Vault  │       │ BURN tokens  │
 │ on-chain│        │ Share tokens │       │ + RetireRecord│
 └─────────┘        └──────┬───────┘       └──────────────┘
                           │
                    ┌──────▼───────┐
                    │  Dividends   │
                    │ claim KZTE   │
                    └──────────────┘
```

---

## ⛓️ On-chain архитектура

### Solana Program (Anchor 0.32.1)

**Program ID:** `3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg`

#### 📋 Instructions (12)

| Wave | Instruction | Caller | Действие |
|------|------------|--------|----------|
| 1 | `initialize_project` | Owner | Создание проекта, mints, vault |
| 1 | `verify_project` | Authority | Проверка doc_hash, verified=true |
| 1 | `invest` | Investor | KZTE→vault, mint share tokens |
| 1 | `distribute_revenue` | Owner | KZTE→vault, обновить dividends_per_share |
| 1 | `claim_dividends` | Investor | Забрать `(total_dps - last_claimed) × shares / PRECISION` |
| 1 | `retire_credits` | Polluter | **BURN** CarbonTokens + RetireRecord PDA |
| 1 | `mint_carbon_tokens` | Authority | Mint carbon tokens (capped at total_credits) |
| 2 | `list_shares` | Investor | Escrow shares, создать Listing |
| 2 | `buy_shares` | Buyer | KZTE→seller, shares→buyer |
| 2 | `cancel_listing` | Seller | Return escrowed shares |
| + | `create_share_metadata` | Authority | Metaplex metadata для share mint |
| + | `mint_retire_certificate` | Authority | NFT сертификат гашения |

#### 🗄️ PDA Accounts (5)

```
CarbonProject         ["project", project_id]
├── authority, name, project_type (enum)
├── carbon_mint, share_mint, vault
├── total_credits, credits_retired
├── total_shares, shares_sold, price_per_share
├── total_dividends_per_share (u128)
├── document_hash ([u8; 32] — SHA-256)
├── verified, status (Active/Funded/Retired)
└── listing_count

InvestorRecord        ["investor", project, wallet]
├── owner, shares_owned, kzte_invested
├── last_claimed (u128)
└── is_initialized

VaultAccount          ["vault", project_id]
├── project, kzte_mint
├── total_deposited, total_claimed

RetireRecord          ["retire", project, buyer, retire_id]
├── buyer, amount_retired, timestamp
└── purpose (String max 128)

Listing               ["listing", project, seller, listing_count]
├── seller, listing_id, amount
├── price_per_share, active
```

#### 🔐 Безопасность

- ✅ `checked_add` / `checked_mul` / `checked_div` — **везде**, никогда `+`, `*`, `/`
- ✅ Vault PDA — единственный authority над KZTE ATA
- ✅ Mint authority = CarbonProject PDA (не admin)
- ✅ Retire: burn **ПЕРЕД** state mutation (reentrancy protection)
- ✅ Escrow owner validation в buy_shares (listing PDA)
- ✅ Dividend precision: multiply before divide (u128 headroom)
- ✅ RetireRecord PDA uniqueness — double-retire невозможен
- ✅ `document_hash` immutable после создания

---

## 🏗️ Структура проекта

```
carbon-kz/
├── programs/carbon_kz/src/
│   ├── lib.rs                           # entry point, #[program]
│   ├── errors.rs                        # 11 error codes
│   ├── events.rs                        # 9 event types
│   ├── instructions/
│   │   ├── initialize_project.rs        # Create project, mints, vault
│   │   ├── verify_project.rs            # Verify doc_hash
│   │   ├── invest.rs                    # KZTE→vault, mint shares
│   │   ├── distribute_revenue.rs        # Revenue → dividends
│   │   ├── claim_dividends.rs           # Investor claims KZTE
│   │   ├── retire_credits.rs            # BURN + RetireRecord
│   │   ├── mint_carbon_tokens.rs        # Mint carbon to recipient
│   │   ├── list_shares.rs              # Escrow → Listing
│   │   ├── buy_shares.rs              # P2P purchase
│   │   ├── cancel_listing.rs          # Return escrow
│   │   ├── create_share_metadata.rs   # Metaplex metadata
│   │   └── mint_retire_certificate.rs # Retirement NFT
│   └── state/
│       ├── project.rs                   # CarbonProject PDA
│       ├── investor.rs                  # InvestorRecord PDA
│       ├── vault.rs                     # VaultAccount PDA
│       ├── retire.rs                    # RetireRecord PDA
│       └── listing.rs                   # Listing PDA
├── tests/
│   └── carbon_kz.ts                     # 16 tests (10 happy + 6 negative)
├── scripts/
│   ├── setup-devnet.ts                  # Initialize devnet projects
│   ├── mint-kzte.ts                     # KZTE faucet
│   ├── mint-carbon-tokens.ts            # Carbon token minting
│   ├── distribute-revenue.ts            # Dividend distribution
│   └── create-share-metadata.ts         # Token metadata
├── app/                                 # Next.js 16
│   ├── src/app/
│   │   ├── page.tsx                     # Landing + project catalog
│   │   ├── project/[id]/page.tsx        # Project details + invest
│   │   ├── portfolio/page.tsx           # Investor dashboard
│   │   ├── marketplace/page.tsx         # P2P trading
│   │   ├── retire/page.tsx              # Carbon retirement
│   │   ├── calculator/page.tsx          # CO₂ calculator
│   │   └── api/                         # 5 API routes
│   ├── src/components/                  # 15+ React components
│   ├── src/hooks/                       # 9 on-chain hooks
│   ├── src/lib/                         # Constants, utils, mock data
│   └── src/idl/                         # Anchor IDL (auto-generated)
├── Anchor.toml
└── README.md
```


---

## 🗺️ Roadmap

| Этап | Срок | Задачи |
|------|------|--------|
| **MVP** | Апрель 2026 | Контракт на devnet, веб-интерфейс, полный цикл, демо |
| **Phase 2** | Q3 2026 | Verra/Gold Standard интеграция, Caspy API, IoT MRV, mainnet |
| **Phase 3** | 2027 | Центральная Азия, партнёрство с Жасыл Даму, деривативы, DAO |

---

## 👥 Команда

**Zerde** (г. Павлодар, г. Туркестан)

Decentrathon 5.0 — Кейс 1 (RWA: Real World Assets)

| | Telegram |
|---|---|
| Бекарыс | [@callmebekaa](https://t.me/callmebekaa) |
| Темирлан | [@kimjjk](https://t.me/kimjjk) |

---

<p align="center">
  <strong>🌿 CarbonKZ</strong> — Углеродный рынок Казахстана. Прозрачный. Токенизированный.
  <br/>
  <sub>Built on Solana · Powered by KZTE · Made in Kazakhstan 🇰🇿</sub>
</p>
