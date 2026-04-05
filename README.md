# CarbonKZ

Первый маркетплейс токенизированных углеродных кредитов в Центральной Азии на Solana. Полный цикл: верификация проекта, токенизация, инвестирование за KZTE (стейблкоин 1:1 к тенге), дивиденды, P2P торговля, гашение кредитов с immutable proof on-chain.

**Хакатон:** Decentrathon 5.0, Кейс 1 (RWA)

 ▎ Казахстан входит в топ-10 стран мира по углеродоёмкости ВВП — CO₂/ВВП на 70% выше мирового среднего. 349 млн тонн
  CO₂ в год. 17,5 тонн на человека — почти в 3 раза выше среднего ОЭСР.

  ▎ Рынок углеродных кредитов существует с 2013 года (KZ ETS) — но он мёртв: $1 за тонну при $91 в Евросоюзе. Всего 135
   участников, только спот, без деривативов. Банки и финансовые институты не допущены к торгам на Caspy Exchange — по
  закону участвовать могут только промышленные эмитенты.

  ▎ Но всё меняется:
  ▎ - Цель правительства — $50/тонна к 2030 (×50 рост), углеродная нейтральность к 2060
  ▎ - World Bank выделил $4.8M на развитие углеродного рынка КЗ (март 2025)
  ▎ - Solana Economic Zone Kazakhstan запущена в мае 2025 — $100M на Web3
  ▎ - Стратегия нейтральности оценена в $660 млрд инвестиций

  ▎ Ни одного блокчейн-маркетплейса токенизированных углеродных кредитов в Центральной Азии. CarbonKZ — первый. Мы
  открываем рынок для всех: инвесторов, банков, ESG-компаний — через токенизацию на Solana.

## Решение

CarbonKZ токенизирует углеродные кредиты реальных зелёных проектов Казахстана на Solana:

- **Верификация** — doc hash фиксируется on-chain
- **Инвестирование** — покупка долей за KZTE, share-токены на кошелёк
- **Дивиденды** — выручка от продажи кредитов распределяется пропорционально
- **Retire (гашение)** — burn токенов + immutable RetireRecord PDA. Double counting невозможен
- **Soulbound сертификат** — NFT с freeze (Token-2022 NonTransferable v2)
- **Pyth Oracle** — динамическое ценообразование через price feeds
- **Solana Actions (Blinks)** — retire кредитов через QR-код / ссылку без захода на сайт
- **Carbon Calculator** — расчёт углеродного следа с KZ-specific коэффициентами

## Архитектура

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│    Next.js 16 + Tailwind 4 + shadcn/ui      │
│    Recharts · Wallet Adapter · Blinks API    │
└──────────────────┬──────────────────────────┘
                   │ @coral-xyz/anchor
┌──────────────────▼──────────────────────────┐
│         Solana Program (Anchor 0.32)         │
│                                              │
│  initialize_project  verify_project  invest  │
│  distribute_revenue  claim_dividends         │
│  retire_credits      mint_carbon_tokens      │
│  list_shares  buy_shares  cancel_listing     │
│  create_share_metadata                       │
│  mint_retire_certificate (soulbound)         │
│  mint_retire_certificate_v2 (Token-2022)     │
│  update_price (Pyth Oracle)                  │
│                                              │
│  PDA: CarbonProject · InvestorRecord         │
│       VaultAccount · RetireRecord            │
│       Listing · OracleConfig                 │
└──────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Solana (Devnet) |
| Smart Contract | Anchor 0.32.1, Rust |
| Token | SPL Token + Token-2022 (KZTE, CarbonToken, ShareToken) |
| Oracle | Pyth Network (pyth-solana-receiver-sdk 1.1.0) |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Recharts |
| Wallet | @solana/wallet-adapter (Phantom, Solflare) |
| Payments | KZTE stablecoin (1:1 KZT, 6 decimals) |
| Deploy | Vercel (frontend), Solana Devnet (program) |

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

| Проект | Тип | CO₂/год | Локация |
|--------|-----|---------|---------|
| СЭС Университета Ахмеда Ясави | Solar | 36 т | Туркестан | Realtime Monitoring
| Ветропарк Ерейментау | Wind | 12,000 т | Акмолинская обл. |
| Лесовосстановление Бурабай | Forest | 3,000 т | Нац. парк Бурабай |
| ArcelorMittal Теміртау | Industrial | 8,000 т | Карагандинская обл. |

## Ключевые фичи

### Retire (Гашение) — killer feature
1. Компания покупает CarbonToken
2. Вызывает `retire_credits` с количеством и целью
3. Токены **сжигаются** навсегда (SPL Token burn)
4. Создаётся immutable `RetireRecord` PDA on-chain
5. Soulbound NFT-сертификат (frozen / Token-2022 NonTransferable)
6. Double counting невозможен — сожжённый токен не существует

### Solana Actions (Blinks)
Retire кредитов через URL/QR-код без захода на сайт:
```
GET  /api/actions/retire              — список всех проектов
GET  /api/actions/retire?projectId=X  — конкретный проект
POST /api/actions/retire              — unsigned tx для кошелька
```

### Carbon Calculator
Расчёт углеродного следа с казахстанскими коэффициентами:
- Электричество: 0.636 кг CO₂/кВт·ч (угольная генерация КЗ)
- Автомобиль: 0.21 кг CO₂/км
- Авиация: 0.255 кг CO₂/пасс-км
- Газ: 2.0 кг CO₂/м³

### Pyth Oracle
Динамическое ценообразование через Pyth price feeds с конвертацией USD → KZT.

## Безопасность
- Checked arithmetic (`checked_add/mul/div`) — везде, без исключений
- Vault PDA — единственный authority над KZTE ATA
- Mint authority = CarbonProject PDA (не admin)
- Retire: burn ПЕРЕД state mutation (reentrancy protection)
- Escrow owner validation в buy_shares (listing PDA)
- Dividend precision: multiply before divide (u128 headroom)
- RetireRecord PDA uniqueness — double-retire невозможен
- `document_hash` immutable после создания

## Команда

Decentrathon 5.0 — Кейс 1 (RWA)
