# SolEstate Protocol — Полное описание проекта

## Содержание

1. [Что это за проект](#1-что-это-за-проект)
2. [Словарь терминов](#2-словарь-терминов)
3. [Архитектура](#3-архитектура)
4. [Смарт-контракт (on-chain)](#4-смарт-контракт-on-chain)
5. [Аккаунты и PDA](#5-аккаунты-и-pda)
6. [8 инструкций — что делает каждая](#6-8-инструкций--что-делает-каждая)
7. [Модель дивидендов](#7-модель-дивидендов)
8. [P2P Marketplace](#8-p2p-marketplace)
9. [Governance (голосование)](#9-governance-голосование)
10. [Фронтенд](#10-фронтенд)
11. [Структура файлов](#11-структура-файлов)
12. [Ключевые адреса](#12-ключевые-адреса)
13. [Как всё работает вместе](#13-как-всё-работает-вместе)

---

## 1. Что это за проект

**SolEstate** — платформа фракционного (долевого) владения недвижимостью на блокчейне Solana, ориентированная на Казахстан.

### Проблема
Квартира в Астане стоит 50 000 000 тенге. Обычному человеку сложно инвестировать в недвижимость — нужна вся сумма сразу.

### Решение
Объект недвижимости разбивается на **доли** (share-токены). Каждая доля стоит, например, 5 000 тенге. Инвестор может купить хоть 1 долю и получать **дивиденды** из арендного дохода пропорционально своим долям.

### Полный цикл
```
Владелец создаёт объект → Инвесторы покупают доли за KZTE →
Владелец получает арендный доход → Распределяет дивиденды →
Инвесторы забирают свои дивиденды →
Инвесторы могут продать доли на маркетплейсе →
Инвесторы голосуют по вопросам управления объектом
```

### Контекст
- **Хакатон**: Decentrathon 5.0, Кейс 1 — RWA (Real World Assets) Tokenization
- **Дедлайн**: 7 апреля 2026
- **Сеть**: Solana Devnet (тестовая сеть)

---

## 2. Словарь терминов

### Блокчейн / Solana

| Термин | Что это |
|--------|---------|
| **Solana** | Быстрый блокчейн (сеть). Транзакции подтверждаются за ~400мс. Комиссии ~0.00025 SOL |
| **SOL** | Нативная валюта Solana. Нужна для оплаты комиссий (gas) за транзакции |
| **Devnet** | Тестовая сеть Solana. SOL там бесплатный (через faucet). Идеально для разработки |
| **Транзакция (tx)** | Запись в блокчейн. Каждая операция (покупка долей, клейм дивидендов) = 1 транзакция |
| **Кошелёк (wallet)** | Пара ключей: публичный (адрес, как номер счёта) + приватный (подпись, как пароль) |
| **Phantom** | Популярный кошелёк-расширение для браузера. Подписывает транзакции |
| **PublicKey (Pubkey)** | Адрес кошелька или аккаунта. 32 байта, отображается как base58 строка |
| **Lamports** | Минимальная единица SOL. 1 SOL = 1 000 000 000 lamports |

### SPL Token (токены на Solana)

| Термин | Что это |
|--------|---------|
| **SPL Token** | Стандарт токенов на Solana (аналог ERC-20 в Ethereum) |
| **Mint** | «Печатный станок» токена. Определяет: название, decimals, кто может чеканить |
| **Mint Authority** | Кто имеет право создавать новые токены. У share-токенов authority = PropertyAccount PDA |
| **ATA** | Associated Token Account — стандартный адрес для хранения конкретного токена у конкретного кошелька. Вычисляется детерминированно из (кошелёк + mint) |
| **Decimals** | Количество знаков после запятой. KZTE decimals = 6, значит 1 KZTE = 1 000 000 lamports |
| **KZTE** | Наш собственный SPL Token стейблкоин. 1 KZTE = 1 тенге (₸). Decimals: 6 |
| **Share-токен** | SPL Token, представляющий 1 долю в объекте недвижимости. Decimals: 0 (целые числа) |

### Anchor / Программирование

| Термин | Что это |
|--------|---------|
| **Anchor** | Фреймворк для разработки смарт-контрактов на Solana (на языке Rust) |
| **Program** | Смарт-контракт на Solana. Код, живущий в блокчейне. Неизменяемая логика |
| **Instruction** | Одна операция в программе (например, `invest`, `claim_dividends`). Вызывается через транзакцию |
| **Account** | Хранилище данных в Solana. Всё — аккаунты: кошельки, токены, данные программы |
| **PDA** | Program Derived Address — адрес, вычисленный из seeds (строк). Не имеет приватного ключа. Программа может подписывать от его имени |
| **Seeds** | Набор байтов для вычисления PDA. Например, `["property", "expo-city"]` → уникальный адрес |
| **Bump** | Дополнительный байт для PDA, чтобы адрес гарантированно не совпал с реальным кошельком |
| **CPI** | Cross-Program Invocation — вызов одной программы из другой (например, наша программа вызывает SPL Token для transfer) |
| **IDL** | Interface Description Language — JSON-файл, описывающий все инструкции, аккаунты и типы программы. Генерируется при `anchor build`. Фронтенд использует IDL для типизированных вызовов |
| **checked_add/mul/div** | Безопасная арифметика в Rust. Возвращает ошибку вместо паники при переполнении |

### Проект SolEstate

| Термин | Что это |
|--------|---------|
| **Объект (Property)** | Конкретная недвижимость: квартира, офис, коттедж. Хранится как PropertyAccount PDA |
| **Доля (Share)** | 1 share-токен = 1 доля владения в объекте. Можно покупать, продавать, голосовать |
| **Дивиденд** | Часть арендного дохода, причитающаяся инвестору пропорционально его долям |
| **Vault** | «Хранилище» — PDA-аккаунт, где хранятся KZTE от инвестиций и дивидендов |
| **Listing** | Объявление о продаже долей на маркетплейсе. Доли блокируются в escrow |
| **Escrow** | Промежуточное хранение токенов до завершения сделки |
| **Proposal** | Предложение для голосования (например, «ремонт крыши»). Вес голоса = количество долей |
| **Claim** | Действие инвестора — «забрать» свои начисленные дивиденды |
| **Wave** | Этап разработки. Wave 1 = базовый функционал, Wave 2 = маркетплейс, Wave 3 = голосование |

---

## 3. Архитектура

### Общая схема

```
┌─────────────────────────────────────────────────────────┐
│                    ПОЛЬЗОВАТЕЛЬ                         │
│              (Phantom кошелёк в браузере)                │
└──────────────────────┬──────────────────────────────────┘
                       │ подписывает транзакции
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  ФРОНТЕНД (Next.js)                     │
│                                                         │
│  Страницы:     Каталог → Объект → Портфолио →          │
│                Маркетплейс → Голосование                │
│                                                         │
│  Хуки:         useRwaProgram → useProperty →            │
│                useInvestor → useKzte                    │
│                                                         │
│  Подключение:  @coral-xyz/anchor + IDL → program.methods│
└──────────────────────┬──────────────────────────────────┘
                       │ RPC запросы (devnet)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              SOLANA DEVNET (блокчейн)                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │          SolEstate Program (Rust/Anchor)          │   │
│  │                                                    │   │
│  │  Инструкции:                                      │   │
│  │  Wave 1: initialize_property, invest,             │   │
│  │          distribute_dividends, claim_dividends    │   │
│  │  Wave 2: list_shares, buy_shares                  │   │
│  │  Wave 3: create_proposal, vote                    │   │
│  └──────────────┬───────────────────────────────────┘   │
│                 │ читает/пишет                           │
│                 ▼                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Аккаунты (данные в блокчейне)             │   │
│  │                                                    │   │
│  │  PropertyAccount  InvestorRecord  VaultAccount     │   │
│  │  Listing          Proposal        VoteRecord       │   │
│  │  KZTE Mint        Share Mints     Token Accounts   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Стек технологий

```
Смарт-контракт:    Rust + Anchor 0.32 + anchor-spl + mpl-token-metadata
Фронтенд:         Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
Кошелёк:          @solana/wallet-adapter-react (Phantom, Solflare)
Вызовы программы:  @coral-xyz/anchor + IDL (типизированные program.methods.*)
Графики:           Recharts 3.x
Сеть:              Solana Devnet
```

---

## 4. Смарт-контракт (on-chain)

### Что такое смарт-контракт в контексте Solana?

Это **программа** (program), написанная на Rust, скомпилированная в BPF байткод и загруженная в блокчейн. Программа:
- Живёт по адресу `AtqkY8tyT9AwUe7JPDFnGuFoFtfXcj264AVEJWtMnL2u`
- Принимает **инструкции** (функции) от пользователей через транзакции
- Читает и пишет **аккаунты** (хранилища данных)
- Не может быть изменена без ключа upgrade authority

### Точка входа — `lib.rs`

Файл `programs/sol_estate/src/lib.rs` — это «маршрутизатор». Он объявляет все 8 инструкций и делегирует их обработку в отдельные файлы:

```
lib.rs
  ├── initialize_property → instructions/initialize_property.rs
  ├── invest              → instructions/invest.rs
  ├── distribute_dividends→ instructions/distribute_dividends.rs
  ├── claim_dividends     → instructions/claim_dividends.rs
  ├── list_shares         → instructions/list_shares.rs
  ├── buy_shares          → instructions/buy_shares.rs
  ├── create_proposal     → instructions/create_proposal.rs
  └── vote                → instructions/vote.rs
```

Каждый файл инструкции содержит:
1. **Accounts struct** — описание всех аккаунтов, которые нужны инструкции (с проверками)
2. **Handler function** — логика инструкции

---

## 5. Аккаунты и PDA

### Что такое PDA?

PDA (Program Derived Address) — адрес, вычисленный программой из **seeds** (массива байтов). Ключевое свойство: у PDA нет приватного ключа. Только программа может «подписывать» от имени PDA.

Пример: для объекта с `property_id = "expo-city"` PDA вычисляется так:
```
PDA = hash(["property", "expo-city", program_id]) → 3sB4vZUA...
```

Один и тот же `property_id` всегда даёт один и тот же адрес. Это гарантирует уникальность.

### Все аккаунты проекта

#### PropertyAccount — объект недвижимости
```
Seeds: ["property", property_id]
```
| Поле | Тип | Описание |
|------|-----|----------|
| authority | Pubkey | Владелец объекта (кто создал) |
| property_id | String(32) | Уникальный ID, например "expo-city" |
| name | String(64) | Название, например "ЖК Expo City" |
| total_shares | u64 | Всего долей (например, 10000) |
| shares_sold | u64 | Продано долей |
| price_per_share | u64 | Цена 1 доли в KZTE lamports |
| share_mint | Pubkey | Адрес mint для share-токенов этого объекта |
| vault | Pubkey | Адрес VaultAccount |
| total_dividends_per_share | u64 | Кумулятивный дивиденд на 1 долю (для claim-модели) |
| document_hash | [u8; 32] | SHA-256 хеш документа на собственность (immutable) |
| status | enum | Active / Funded / Closed |
| bump | u8 | PDA bump seed |

#### InvestorRecord — запись инвестора
```
Seeds: ["investor", property_pubkey, wallet_pubkey]
```
| Поле | Тип | Описание |
|------|-----|----------|
| owner | Pubkey | Кошелёк инвестора |
| property | Pubkey | Адрес PropertyAccount |
| shares_owned | u64 | Количество долей |
| kzte_invested | u64 | Сколько KZTE вложено |
| last_claimed | u64 | Значение total_dividends_per_share на момент последнего клейма |
| bump | u8 | PDA bump seed |

#### VaultAccount — хранилище средств
```
Seeds: ["vault", property_id]
```
| Поле | Тип | Описание |
|------|-----|----------|
| property | Pubkey | Адрес PropertyAccount |
| kzte_mint | Pubkey | Адрес KZTE mint |
| total_deposited | u64 | Всего внесено KZTE |
| total_claimed | u64 | Всего выплачено инвесторам |
| bump | u8 | PDA bump seed |

У VaultAccount есть ещё **token account** (ATA) — это отдельный аккаунт, где физически хранятся KZTE токены. Vault PDA является owner этого token account.

#### Listing — объявление о продаже (Wave 2)
```
Seeds: ["listing", property_pubkey, seller_pubkey]
```
| Поле | Тип | Описание |
|------|-----|----------|
| seller | Pubkey | Продавец |
| property | Pubkey | Объект |
| amount | u64 | Количество долей на продажу |
| price_per_share | u64 | Цена за 1 долю |
| active | bool | Активен ли листинг |
| bump | u8 | PDA bump seed |

#### Proposal — предложение для голосования (Wave 3)
```
Seeds: ["proposal", property_pubkey, proposal_id_bytes]
```
| Поле | Тип | Описание |
|------|-----|----------|
| property | Pubkey | Объект |
| creator | Pubkey | Кто создал |
| description | String(256) | Текст предложения |
| votes_for | u64 | Голоса «за» (в share-токенах) |
| votes_against | u64 | Голоса «против» |
| deadline | i64 | Unix timestamp окончания голосования |
| executed | bool | Выполнено ли |
| proposal_id | u64 | Номер предложения |
| bump | u8 | PDA bump seed |

#### VoteRecord — запись о голосе
```
Seeds: ["vote", proposal_pubkey, voter_pubkey]
```
| Поле | Тип | Описание |
|------|-----|----------|
| voter | Pubkey | Кто голосовал |
| proposal | Pubkey | По какому предложению |
| bump | u8 | PDA bump seed |

Используется для защиты от двойного голосования: если VoteRecord PDA уже существует, повторный `init` упадёт с ошибкой.

---

## 6. 8 инструкций — что делает каждая

### Wave 1 — Базовый функционал

#### 1. `initialize_property` — Создание объекта

**Кто вызывает**: Владелец (authority)

**Что происходит**:
1. Создаётся PropertyAccount PDA (хранит информацию об объекте)
2. Создаётся VaultAccount PDA (хранилище для KZTE)
3. Создаётся ShareMint PDA — новый SPL Token mint для долей этого объекта (decimals = 0, authority = PropertyAccount PDA)
4. Создаётся vault token account (ATA для хранения KZTE, owner = VaultAccount PDA)
5. Записывается document_hash (SHA-256 хеш документа) — **неизменяемый** после создания
6. Status = Active

**Пример**: Создаём объект "Expo City" с 10000 долями по 5000 KZTE каждая.

---

#### 2. `invest` — Покупка долей

**Кто вызывает**: Инвестор

**Что происходит**:
1. Проверки: status == Active, amount > 0, достаточно свободных долей
2. Рассчитывается стоимость: `cost = amount * price_per_share`
3. KZTE переводятся с кошелька инвестора → vault (CPI: `token::transfer`)
4. Share-токены чеканятся и отправляются инвестору (CPI: `token::mint_to`, подпись от PropertyAccount PDA)
5. Создаётся / обновляется InvestorRecord (shares_owned, kzte_invested)
6. Обновляется shares_sold. Если все доли проданы → status = Funded

**Пример**: Инвестор покупает 100 долей Expo City → платит 100 * 5000 = 500 000 KZTE → получает 100 share-токенов.

---

#### 3. `distribute_dividends` — Распределение дивидендов

**Кто вызывает**: Владелец (authority)

**Что происходит**:
1. Проверка: shares_sold > 0 (есть инвесторы)
2. KZTE переводятся с кошелька владельца → vault
3. Рассчитывается: `dividend_per_share = amount / shares_sold`
4. Обновляется: `total_dividends_per_share += dividend_per_share`

**Пример**: Владелец вносит 50 000 KZTE. Продано 100 долей. dividend_per_share = 500 KZTE.

**Важно**: KZTE физически переводятся в vault, но инвесторам автоматически ничего не отправляется. Каждый инвестор должен сам вызвать `claim_dividends`.

---

#### 4. `claim_dividends` — Получение дивидендов

**Кто вызывает**: Инвестор

**Что происходит**:
1. Рассчитывается: `unclaimed = total_dividends_per_share - last_claimed`
2. Рассчитывается: `claimable = unclaimed * shares_owned`
3. Проверка: claimable > 0
4. KZTE переводятся из vault → инвестору (CPI с подписью VaultAccount PDA)
5. Обновляется: `last_claimed = total_dividends_per_share`

**Пример**: Инвестор с 100 долями, unclaimed_per_share = 500 → получает 50 000 KZTE.

**Защита от двойного клейма**: после клейма `last_claimed` устанавливается в текущее значение `total_dividends_per_share`. Повторный вызов даёт unclaimed = 0.

---

### Wave 2 — P2P Marketplace

#### 5. `list_shares` — Выставление долей на продажу

**Кто вызывает**: Инвестор-продавец

**Что происходит**:
1. Проверка: shares_owned >= amount
2. Share-токены переводятся из кошелька продавца → escrow (блокировка)
3. Создаётся Listing PDA с ценой и количеством
4. Уменьшается investor_record.shares_owned

**Зачем escrow?** Чтобы продавец не мог продать одни и те же доли дважды. Токены физически заблокированы.

---

#### 6. `buy_shares` — Покупка долей на маркетплейсе

**Кто вызывает**: Покупатель

**Что происходит**:
1. Рассчитывается: `total_cost = listing.amount * listing.price_per_share`
2. KZTE переводятся: покупатель → продавец (напрямую, без vault)
3. Share-токены переводятся: escrow → покупатель (подпись от Listing PDA)
4. Создаётся / обновляется InvestorRecord покупателя
5. Listing деактивируется (active = false)

**Важно**: `last_claimed` нового покупателя устанавливается в текущий `total_dividends_per_share`, чтобы он не мог забрать дивиденды, накопленные до покупки.

---

### Wave 3 — Governance

#### 7. `create_proposal` — Создание предложения

**Кто вызывает**: Инвестор (shares_owned > 0)

**Что происходит**:
1. Проверка: у создателя есть доли
2. Создаётся Proposal PDA
3. deadline = текущее время + duration_seconds

---

#### 8. `vote` — Голосование

**Кто вызывает**: Инвестор (shares_owned > 0)

**Что происходит**:
1. Проверка: deadline не прошёл
2. Вес голоса = shares_owned
3. Если `approve = true` → votes_for += weight, иначе votes_against += weight
4. Создаётся VoteRecord PDA (защита от повторного голосования)

---

## 7. Модель дивидендов

Это **claim-based** модель (инвестор сам забирает), а не push-модель (автоматическая рассылка). Почему?

### Push-модель (плохо для Solana):
```
Владелец вызывает 1 транзакцию → программа отправляет KZTE каждому инвестору
```
Проблема: если 1000 инвесторов, нужно 1000 переводов в одной транзакции. Solana имеет лимит на количество аккаунтов в транзакции (~64). Не масштабируется.

### Claim-модель (наш подход):
```
Владелец вызывает distribute_dividends → обновляется 1 число (total_dividends_per_share)
Каждый инвестор сам вызывает claim_dividends → получает свою долю
```
Масштабируется на любое количество инвесторов. Газ платит инвестор, не владелец.

### Математика

```
total_dividends_per_share — кумулятивная сумма дивидендов на 1 долю за всё время

При distribute:
  dividend_per_share = amount / shares_sold
  total_dividends_per_share += dividend_per_share

При claim:
  unclaimed = total_dividends_per_share - investor.last_claimed
  claimable = unclaimed * investor.shares_owned
  investor.last_claimed = total_dividends_per_share
```

**Пример по шагам**:

| Событие | total_div_per_share | Инвестор A (50 долей) last_claimed | Инвестор B (30 долей) last_claimed |
|---------|--------------------|------------------------------------|-------------------------------------|
| Начало | 0 | 0 | 0 |
| Distribute 8000 KZTE (80 долей) | 100 | 0 | 0 |
| A клеймит: (100-0)*50 = 5000 KZTE | 100 | 100 | 0 |
| Distribute 4000 KZTE | 150 | 100 | 0 |
| B клеймит: (150-0)*30 = 4500 KZTE | 150 | 100 | 150 |
| A клеймит: (150-100)*50 = 2500 KZTE | 150 | 150 | 150 |

---

## 8. P2P Marketplace

Маркетплейс позволяет инвесторам торговать долями между собой.

### Поток

```
1. Продавец: list_shares(20 долей, 6000 KZTE/доля)
   → 20 share-токенов переводятся в escrow
   → investor_record.shares_owned уменьшается на 20
   → создаётся Listing PDA

2. Покупатель: buy_shares()
   → 120 000 KZTE (20 * 6000) переводятся продавцу
   → 20 share-токенов из escrow переводятся покупателю
   → listing.active = false
```

### Ценообразование
Продавец сам устанавливает `price_per_share`. Это может быть выше или ниже изначальной цены — свободный рынок.

### Ограничение
Один продавец может иметь только один активный листинг на один объект (PDA seeds содержат seller + property).

---

## 9. Governance (голосование)

### Зачем?
Инвесторы совместно владеют объектом. Решения (ремонт, смена арендатора, продажа) принимаются голосованием.

### Как работает
1. Любой инвестор (с долями > 0) создаёт proposal с описанием и дедлайном
2. Каждый инвестор голосует «за» или «против»
3. Вес голоса = количество долей (shares_owned)
4. Каждый инвестор может проголосовать только 1 раз (VoteRecord PDA)
5. После дедлайна голосование закрывается

### Пример
```
Предложение: "Ремонт крыши ЖК Expo City"
Дедлайн: через 7 дней

Инвестор А (100 долей) → голосует "за"   → votes_for = 100
Инвестор Б (50 долей)  → голосует "за"   → votes_for = 150
Инвестор В (30 долей)  → голосует "против" → votes_against = 30

Результат: 150 за, 30 против → предложение принято
```

---

## 10. Фронтенд

### Стек
- **Next.js 16** — React фреймворк с App Router
- **TypeScript** — типизация
- **Tailwind CSS 4** — стилизация
- **shadcn/ui** — готовые компоненты (Button, Card, Dialog, Toast)
- **Recharts** — графики
- **@solana/wallet-adapter-react** — подключение Phantom/Solflare
- **@coral-xyz/anchor** — типизированные вызовы программы через IDL

### Как фронтенд общается с блокчейном

```
1. Пользователь подключает Phantom → WalletProvider даёт publicKey и signTransaction
2. useRwaProgram() создаёт Anchor Program из IDL → типизированный клиент
3. program.methods.invest(amount).accounts({...}).rpc() → создаёт транзакцию
4. Phantom открывает попап "Подтвердите транзакцию" → пользователь подписывает
5. Транзакция отправляется в Solana Devnet → выполняется программа
6. Фронтенд показывает ссылку на Explorer
```

### Хуки

| Хук | Что делает |
|-----|-----------|
| `useRwaProgram()` | Создаёт Anchor Program instance из IDL + кошелька. Возвращает `program` или `null` |
| `useProperty(id)` | Загружает PropertyAccount PDA по property_id. Возвращает данные объекта |
| `useInvestor(propertyId)` | Загружает InvestorRecord PDA для текущего кошелька + объекта |
| `useKzte()` | Загружает баланс KZTE токена для текущего кошелька |

### Страницы

| Путь | Описание |
|------|----------|
| `/` | Каталог объектов — сетка PropertyCard |
| `/asset/[id]` | Детали объекта + кнопка «Купить доли» → InvestModal |
| `/portfolio` | Мои инвестиции + DividendWidget (клейм дивидендов) |
| `/marketplace` | P2P торговля долями |
| `/governance` | Голосования по предложениям |

### UI правила
- Язык интерфейса: **русский**
- Цены: **всегда в тенге (₸)**, формат `1 500 000 ₸` (пробел-разделитель)
- Тёмная тема по умолчанию
- Toast после каждой транзакции (зелёный = успех, красный = ошибка)
- Ссылка на Solana Explorer после успешной транзакции

---

## 11. Структура файлов

```
sol-estate/
├── programs/sol_estate/src/           # Смарт-контракт (Rust)
│   ├── lib.rs                         # Точка входа, объявление инструкций
│   ├── instructions/                  # По 1 файлу на инструкцию
│   │   ├── initialize_property.rs
│   │   ├── invest.rs
│   │   ├── distribute_dividends.rs
│   │   ├── claim_dividends.rs
│   │   ├── list_shares.rs
│   │   ├── buy_shares.rs
│   │   ├── create_proposal.rs
│   │   └── vote.rs
│   ├── state/                         # По 1 файлу на тип аккаунта
│   │   ├── property.rs
│   │   ├── investor.rs
│   │   ├── vault.rs
│   │   ├── listing.rs
│   │   ├── proposal.rs
│   │   └── vote_record.rs
│   └── errors.rs                      # Коды ошибок
│
├── tests/sol_estate.ts                # Anchor тесты (9 тестов)
├── target/idl/sol_estate.json         # Сгенерированный IDL
├── scripts/setup-devnet.ts            # Скрипт инициализации объектов на devnet
│
├── app/                               # Фронтенд (Next.js)
│   └── src/
│       ├── app/                       # App Router страницы
│       │   ├── page.tsx               # Главная — каталог
│       │   ├── asset/[id]/page.tsx    # Страница объекта
│       │   ├── portfolio/page.tsx     # Портфолио
│       │   ├── marketplace/page.tsx   # Маркетплейс
│       │   ├── governance/page.tsx    # Голосования
│       │   └── api/upload/route.ts    # SHA-256 API
│       ├── components/
│       │   ├── providers/WalletProvider.tsx
│       │   ├── PropertyCard.tsx
│       │   ├── InvestModal.tsx
│       │   ├── DividendWidget.tsx
│       │   └── Navbar.tsx
│       ├── hooks/
│       │   ├── useRwaProgram.ts
│       │   ├── useProperty.ts
│       │   ├── useInvestor.ts
│       │   └── useKzte.ts
│       ├── idl/sol_estate.json        # Копия IDL для фронтенда
│       └── lib/constants.ts           # Program ID, KZTE mint, утилиты
│
├── Anchor.toml                        # Конфигурация Anchor
├── CLAUDE.md                          # Инструкции для Claude Code
├── CLAUDE_DEV1_CONTRACT.md            # План Dev 1 (контракт)
└── CLAUDE_DEV2_FRONTEND.md            # План Dev 2 (фронтенд)
```

---

## 12. Ключевые адреса

| Что | Адрес | Описание |
|-----|-------|----------|
| Program ID | `AtqkY8tyT9AwUe7JPDFnGuFoFtfXcj264AVEJWtMnL2u` | Адрес программы на devnet |
| KZTE Mint | `tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE` | SPL Token mint стейблкоина KZTE |
| CLI Wallet | `2gJFYAL9vJPHuvjYZxxsMLg3QWCYhX8ik45MjtbJn2uJ` | Кошелёк для деплоя (authority объектов) |
| Phantom Wallet | `GCN67VBEov2K48YCiy9ryBwmtm2SgC8poqGsa36ZYBkF` | Тестовый кошелёк в браузере |

### Объекты на devnet

| Объект | property_id | Property PDA | Share Mint |
|--------|-------------|-------------|------------|
| ЖК "Expo City" | expo-city | `3sB4vZUA...` | `CpKL3ngt...` |
| БЦ "Аль-Фараби" | al-farabi | `9NAPN17r...` | `Avz81uWm...` |
| Курорт "Бурабай" | burabay-residence | `9RWg8FGa...` | `EoJZwTCM...` |

---

## 13. Как всё работает вместе

### Сценарий 1: Инвестор покупает доли

```
1. Инвестор открывает сайт → подключает Phantom
2. Видит каталог объектов (PropertyCard загружают PropertyAccount из блокчейна)
3. Кликает на "Expo City" → страница /asset/expo-city
4. Нажимает "Купить 100 долей" → открывается InvestModal
5. InvestModal вызывает program.methods.invest(100)
6. Phantom показывает попап: "Подтвердите перевод 500 000 KZTE"
7. Инвестор подписывает → транзакция уходит в Solana
8. Программа: проверяет → переводит KZTE в vault → чеканит 100 share-токенов → обновляет InvestorRecord
9. Фронтенд показывает toast: "Успешно! Посмотреть на Explorer"
```

### Сценарий 2: Получение дивидендов

```
1. Владелец получил аренду 50 000 KZTE/мес
2. Владелец вызывает distribute_dividends(50_000_000000) — KZTE уходят в vault
3. total_dividends_per_share увеличивается на 500 (50000 / 100 долей)
4. Инвестор заходит в /portfolio → видит DividendWidget: "Начислено: 50 000 ₸"
5. Нажимает "Забрать дивиденды" → claim_dividends()
6. KZTE переводятся из vault на кошелёк инвестора
7. last_claimed обновляется — повторный клейм невозможен
```

### Сценарий 3: Продажа долей

```
1. Инвестор А хочет продать 20 долей по 6000 KZTE/доля
2. list_shares(20, 6000_000000) → share-токены блокируются в escrow
3. Объявление появляется на /marketplace
4. Инвестор Б видит объявление → нажимает "Купить"
5. buy_shares() → 120 000 KZTE от Б к А, 20 share-токенов из escrow к Б
6. Листинг деактивируется
```

### Сценарий 4: Голосование

```
1. Инвестор создаёт предложение: "Ремонт крыши" с дедлайном 7 дней
2. Другие инвесторы голосуют "за" или "против"
3. Вес голоса = количество долей
4. После дедлайна результат виден на /governance
```
