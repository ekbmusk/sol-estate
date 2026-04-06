# 🌿 CarbonKZ — Tokenized Carbon Credits Marketplace on Solana
DEMO: https://sol-estate-ivory.vercel.app/
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

> Казахстан входит в **топ-10 стран мира** по углеродоёмкости ВВП — CO₂/ВВП на 70% выше мирового среднего

| Факт | Значение |
|------|----------|
| CO₂ выбросы/год | **349 млн тонн** |
| На душу населения | **17.5 т/чел** (~3× ОЭСР) |
| Текущая цена кредита KZ ETS | **$1/тонна** |
| Целевая цена к 2030 | **$50/тонна** (×50 рост) |
| Участники Caspy Exchange | **135 компаний**, только спот |
| Блокчейн carbon credit проекты в ЦА | **0** |

### Почему рынок мёртв

- 🔒 **Закрытый доступ** — банки и финансовые институты не допущены к торгам
- 💧 **Нулевая ликвидность** — 135 участников, нет деривативов, торги приостановлены в 2022
- 🔄 **Double counting** — один кредит заявлен несколькими сторонами
- 🚫 **Непрозрачность** — верификация вручную, конфликт интересов у аудиторов

### Почему всё меняется прямо сейчас

- 🎯 Цель правительства: **$50/тонна к 2030**, углеродная нейтральность к 2060
- 🏦 **World Bank выделил $4.8M** на развитие углеродного рынка КЗ (март 2025)
- ⚡ **Solana Economic Zone Kazakhstan** — $100M Web3 зона (май 2025)
- 💰 **ЦБ РК: $350 млн** в цифровые активы (март 2026)
- 🪙 **KZTE стейблкоин** — Нацбанк + Solana + Mastercard (сентябрь 2025)

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

## 🖥️ Frontend

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Charts | Recharts 2.x |
| Wallet | @solana/wallet-adapter (Phantom, Solflare) |
| Anchor | @coral-xyz/anchor 0.32.1 (typed IDL) |
| Payments | KZTE stablecoin (1:1 к KZT, decimals: 6) |
| Deploy | Vercel |

### 📱 Pages (6)

| Страница | Путь | Описание |
|----------|------|----------|
| Каталог проектов | `/` | Hero, статистика, фильтрация по типам, "Как работает" |
| Страница проекта | `/project/[id]` | Детали, прогресс, инвестирование, дивиденды, Solarman |
| Портфель | `/portfolio` | Инвестиции, доходность, pie chart, claim dividends |
| Маркетплейс | `/marketplace` | P2P торговля долями, escrow, buy/sell |
| Гашение | `/retire` | Burn кредитов, RetireRecord, сертификаты |
| Калькулятор | `/calculator` | Расчёт CO₂ следа с KZ-specific коэффициентами |

### 🔌 API Routes (5)

| Route | Method | Описание |
|-------|--------|----------|
| `/api/faucet` | POST | Mint 100K KZTE (rate limit 24h) |
| `/api/solarman` | GET | Данные солнечного инвертора (live/mock) |
| `/api/certificate` | GET | SVG сертификат гашения + JSON metadata |
| `/api/upload` | POST | SHA-256 хеш документа |
| `/api/actions/retire` | GET/POST | Solana Actions (Blinks) — retire через QR |

### 🪝 Hooks → On-chain Data

| Hook | Данные | Источник |
|------|--------|----------|
| `useCarbonProgram` | Typed Program | IDL |
| `useProjects` | Все CarbonProject | `program.account.carbonProject.all()` |
| `useProject(id)` | Один проект | `program.account.carbonProject.fetch(pda)` |
| `useInvestor(id)` | InvestorRecord | `program.account.investorRecord.fetch(pda)` |
| `usePortfolio` | Все инвестиции | memcmp filter по wallet |
| `useListings` | Активные листинги | filter `active=true` |
| `useRetireRecords` | История гашений | `program.account.retireRecord.all()` |
| `useKzte` | KZTE баланс | SPL token account |

---

## 🏆 Ключевые фичи

### 🔥 Retire (Гашение) — killer feature

```
Загрязнитель вызывает retire_credits(amount, purpose)
        │
        ▼
   SPL Token BURN         ──→  Токены уничтожены навсегда
        │
        ▼
   RetireRecord PDA       ──→  Immutable proof: кто, сколько, когда, зачем
        │
        ▼
   Double counting = 0    ──→  Сожжённый токен НЕ существует
```

### 📊 Carbon Calculator

Расчёт углеродного следа с казахстанскими коэффициентами:

| Источник | Коэффициент |
|----------|------------|
| Электричество | 0.636 кг CO₂/кВт·ч (угольная генерация КЗ) |
| Автомобиль | 0.21 кг CO₂/км |
| Авиация | 0.255 кг CO₂/пасс-км |
| Природный газ | 2.0 кг CO₂/м³ |

### ⚡ Solana Actions (Blinks)

Retire кредитов через URL/QR-код без захода на сайт:

```
GET  /api/actions/retire              — список проектов
GET  /api/actions/retire?projectId=X  — конкретный проект
POST /api/actions/retire              — unsigned tx для кошелька
```

### 🔌 Pyth Oracle

Динамическое ценообразование через Pyth price feeds с конвертацией USD → KZT.

### 💰 Dividend Model

```
PRECISION = 10^12

distribute_revenue:
  total_dividends_per_share += (amount × PRECISION) / total_shares

claim_dividends:
  claimable = (total_dps - last_claimed) × shares_owned / PRECISION
```

Gas платит инвестор, не владелец → масштабируемо. Double-claim невозможен через `last_claimed`.

---

## 🚀 Быстрый старт

### Prerequisites

- Rust + Solana CLI + Anchor 0.32.1
- Node.js 18+
- Phantom Wallet (браузер)

### Контракт

```bash
# Build & test
anchor build
anchor test --provider.cluster localnet    # 16/16 tests

# Deploy
solana config set --url devnet
anchor deploy --provider.cluster devnet

# IDL sync (ОБЯЗАТЕЛЬНО после каждого anchor build)
cp target/idl/carbon_kz.json app/src/idl/carbon_kz.json
```

### Devnet Setup

```bash
# Создать проекты на devnet
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-node scripts/setup-devnet.ts

# Mint KZTE токенов
npx ts-node scripts/mint-kzte.ts <recipient> [amount]

# Mint carbon tokens
npx ts-node scripts/mint-carbon-tokens.ts <project-id> <recipient> <amount>

# Distribute revenue (дивиденды)
npx ts-node scripts/distribute-revenue.ts
```

### Frontend

```bash
cd app
npm install
npm run dev       # Turbopack → http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint
```

### Environment Variables

```bash
# app/.env.local
NEXT_PUBLIC_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=...
HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=...
SOLARMAN_APP_ID=...          # (optional) solar inverter data
SOLARMAN_APP_SECRET=...
```

---

## 🌍 Проекты на Devnet

| Проект | Тип | CO₂/год | Локация | |
|--------|-----|---------|---------|---|
| 🌞 СЭС Университета Ахмеда Ясави | Solar | 36 т | Туркестан | Realtime Monitoring |
| 💨 Ветропарк Ерейментау | Wind | 12,000 т | Акмолинская обл. | |
| 🌲 Лесовосстановление Бурабай | Forest | 3,000 т | Нац. парк Бурабай | |
| 🏭 ArcelorMittal Теміртау | Industrial | 8,000 т | Карагандинская обл. | |

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

## 🎯 Demo Scenario (7 шагов)

1. **Проблема** — «Казахстан — топ-10 по CO₂/ВВП. Рынок мёртв — $1/тонна. Мы это меняем.»
2. **Каталог** — Показать 4 верифицированных проекта с on-chain данными
3. **Invest** — Инвестор покупает 100 долей за 50,000 KZTE → live tx → Explorer
4. **Revenue** — Project owner вносит доход → 10,000 KZTE в vault
5. **Claim** — Инвестор клеймит дивиденды → получает KZTE на кошелёк
6. **🔥 RETIRE** — «КазМунайГаз» гасит 500 тонн → burn → RetireRecord → «Double counting решён навсегда»
7. **Итог** — «Прозрачность. Ликвидность. Верификация. Solana — быстро и дёшево. Казахстан — первый в ЦА.»

---

## 📊 Devnet Details

| | |
|---|---|
| **Program ID** | [`3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg`](https://explorer.solana.com/address/3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg?cluster=devnet) |
| **KZTE Mint** | [`tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE`](https://explorer.solana.com/address/tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE?cluster=devnet) |
| **Network** | Solana Devnet |
| **Tests** | 16/16 passing (10 happy path + 6 negative) |

---

## 🗺️ Roadmap

| Этап | Срок | Задачи |
|------|------|--------|
| **MVP** | Апрель 2026 | Контракт на devnet, веб-интерфейс, полный цикл, демо |
| **Phase 2** | Q3 2026 | Verra/Gold Standard интеграция, Caspy API, IoT MRV, mainnet |
| **Phase 3** | 2027 | Центральная Азия, партнёрство с Жасыл Даму, деривативы, DAO |

---

## 🏁 Конкуренты

| | CarbonKZ | Toucan Protocol | KlimaDAO |
|---|---|---|---|
| Регион | 🇰🇿 Казахстан + ЦА | Глобальный | Глобальный |
| Блокчейн | Solana | Polygon | Polygon |
| Стейблкоин | KZTE (₸) | USDC | — |
| Compliance market | ✅ KZ ETS | ❌ | ❌ |
| Retire + proof | ✅ Burn + PDA | ✅ Retire | ❌ |
| P2P marketplace | ✅ On-chain escrow | ❌ | ❌ |
| Дивиденды | ✅ Claim model | ❌ | Staking |

**В Центральной Азии: 0 конкурентов. Чистая ниша.**

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
