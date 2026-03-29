# Задачи для Dev 2 (Фронтенд) — 29 марта 2026

## Контекст

Контракт полностью готов: все 8 инструкций работают, 9 тестов проходят, задеплоено на devnet. IDL обновлён в `app/src/idl/sol_estate.json`. Dev 1 сейчас добавляет Anchor events, security fixes и cancel_listing — после этого IDL обновится ещё раз (будет пуш).

**Не жди Dev 1** — все задачи ниже можно делать параллельно. Текущий IDL в репо уже рабочий.

---

## Задача 1: Исправить Explorer ссылки (5 мин)

Во всех файлах заменить:
```
cluster=custom&customUrl=http://localhost:8899
```
на:
```
cluster=devnet
```

**Файлы:**
- `app/src/components/InvestModal.tsx` (строка ~114)
- `app/src/components/DividendWidget.tsx` (строка ~82)
- `app/src/app/portfolio/page.tsx` (строка ~75)

---

## Задача 2: Исправить лишние accounts в claimDividends (10 мин)

В `DividendWidget.tsx` и `portfolio/page.tsx` вызов `claimDividends()` передаёт лишние аккаунты, которых нет в Rust struct. Убрать:
- `kzteMint`
- `associatedTokenProgram`
- `systemProgram`

Оставить только:
```typescript
.accounts({
  investor: publicKey,
  property: propertyPda,
  vault: vaultPda,
  investorRecord: investorRecordPda,
  vaultTokenAccount: vaultTokenAccount,
  investorKzteAccount: investorKzteAccount,
  tokenProgram: TOKEN_PROGRAM_ID,
})
```

**Файлы:**
- `app/src/components/DividendWidget.tsx`
- `app/src/app/portfolio/page.tsx`

---

## Задача 3: Маркетплейс UI (3-4 часа)

Контракт для `list_shares` и `buy_shares` уже работает. Нужен фронтенд.

### Новые файлы:

**`app/src/hooks/useListings.ts`**
- Вызвать `program.account.listing.all()`
- Отфильтровать `active === true` на клиенте
- Для каждого листинга подтянуть название объекта через `program.account.propertyAccount.fetch(listing.property)`
- Вернуть `{ listings, loading, error, refetch }`

**`app/src/components/ListingCard.tsx`**
- Карточка: название объекта, продавец (первые 4...последние 4 символа адреса), кол-во долей, цена за долю, итого
- Кнопка "Купить" → вызов `program.methods.buyShares()`
- Аккаунты для buyShares (смотри `buy_shares.rs`):
  - buyer: publicKey
  - seller: listing.seller
  - property: listing.property
  - vault: PDA `["vault", property.propertyId]`
  - listing: PDA `["listing", property, seller]`
  - buyerKzteAccount: ATA(KZTE_MINT, buyer)
  - sellerKzteAccount: ATA(KZTE_MINT, seller)
  - escrowShareAccount: ATA(shareMint, listingPda, allowOffCurve=true)
  - buyerShareAccount: ATA(shareMint, buyer) — init_if_needed в программе
  - shareMint: property.shareMint
  - buyerRecord: PDA `["investor", property, buyer]`
  - sellerRecord: PDA `["investor", property, seller]`
  - systemProgram, tokenProgram, associatedTokenProgram, rent

**`app/src/components/SellModal.tsx`**
- Диалог: выбор объекта (из портфолио, где shares > 0), ввод кол-ва и цены за долю
- **Важно**: перед `listShares` нужно создать escrow ATA. Использовать `preInstructions`:
  ```typescript
  import { createAssociatedTokenAccountInstruction } from "@solana/spl-token";

  const escrowAta = getAssociatedTokenAddress(shareMint, listingPda, true);
  const createAtaIx = createAssociatedTokenAccountInstruction(
    publicKey, escrowAta, listingPda, shareMint
  );

  await program.methods
    .listShares(new BN(amount), new BN(pricePerShare))
    .accounts({ ... })
    .preInstructions([createAtaIx])
    .rpc();
  ```

**Заменить `app/src/app/marketplace/page.tsx`**
- "use client"
- Шапка: "Маркетплейс" + кнопка "Продать доли" → SellModal
- Сетка ListingCard
- Пустое состояние если нет листингов

---

## Задача 4: Голосование UI (2-3 часа)

Контракт для `create_proposal` и `vote` уже работает.

### Новые файлы:

**`app/src/hooks/useProposals.ts`**
- `program.account.proposal.all()`
- Подтянуть названия объектов
- Вычислить статус: active (deadline > Date.now()/1000), completed

**`app/src/components/ProposalCard.tsx`**
- Карточка: описание, название объекта, создатель (4...4), дедлайн (форматировать: "осталось 2 дня" или "завершено")
- Прогресс-бар: голоса за / против
- Кнопки "За" / "Против" → `program.methods.vote(true/false)`
- Аккаунты для vote:
  - voter: publicKey
  - property: proposal.property
  - proposal: proposalPda `["proposal", propertyPda, proposalId.toLE(8)]`
  - investorRecord: PDA `["investor", propertyPda, voter]`
  - voteRecord: PDA `["vote", proposalPda, voter]`
  - systemProgram
- Задизейблить кнопки если дедлайн прошёл

**`app/src/components/CreateProposalModal.tsx`**
- Выбор объекта, описание (textarea), длительность (1/3/7 дней)
- `proposal_id = new BN(Date.now())` — уникально для хакатона
- `program.methods.createProposal(proposalId, description, new BN(durationSeconds))`
- Нужен investorRecord (должен иметь доли)

**Заменить `app/src/app/governance/page.tsx`**
- Табы: "Активные" / "Завершённые"
- Сетка ProposalCard
- Кнопка "Создать предложение" → CreateProposalModal

---

## Задача 5: Proof-of-Asset + подключить реальные данные на странице объекта (2 часа)

**`app/src/components/DocumentVerifier.tsx`** (новый)
- Принимает `documentHash: number[]` (32 байта из PropertyAccount)
- Показывает хеш как hex строку
- Кнопка загрузки файла → POST на `/api/upload` → сравнить `response.hash` с on-chain `documentHash`
- Зелёная галочка если совпадает, красный крестик если нет

**Изменить `app/src/app/asset/[id]/page.tsx`**
- Использовать хук `useProperty(id)` для реальных данных из блокчейна (totalShares, sharesSold, pricePerShare, documentHash)
- Оставить mockProperties для полей которых нет on-chain (location, description)
- Использовать `useInvestor(id)` для DividendWidget — реальные claimable суммы вместо хардкода
- Добавить `<DocumentVerifier documentHash={property.documentHash} />` вместо статичного хеша
- Исправить Explorer URL (задача 1)

---

## Порядок выполнения (рекомендуемый)

1. **Задача 1** — Explorer ссылки (5 мин) ← сделай сразу
2. **Задача 2** — Лишние accounts (10 мин) ← сделай сразу
3. **Задача 3** — Маркетплейс ← основная работа
4. **Задача 4** — Голосование
5. **Задача 5** — Proof-of-asset + реальные данные

---

## Ключевые адреса (для справки)

| Что | Адрес |
|-----|-------|
| Program ID | `AtqkY8tyT9AwUe7JPDFnGuFoFtfXcj264AVEJWtMnL2u` |
| KZTE Mint | `tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE` |
| Expo City property PDA | `3sB4vZUAbswiRLgCcLtQ6WsuqcXkbxRSACCnZLqD4HfT` |

## PDA seeds для деривации

```typescript
// Property
["property", Buffer.from(propertyId)]

// Vault
["vault", Buffer.from(propertyId)]

// Share Mint
["share_mint", Buffer.from(propertyId)]

// Investor Record
["investor", propertyPda.toBuffer(), wallet.toBuffer()]

// Listing
["listing", propertyPda.toBuffer(), seller.toBuffer()]

// Proposal
["proposal", propertyPda.toBuffer(), proposalId.toArrayLike(Buffer, "le", 8)]

// Vote Record
["vote", proposalPda.toBuffer(), voter.toBuffer()]
```

## Доступные shadcn компоненты
button, card, badge, tabs, progress, dialog, sonner (toast)

Если нужны новые: `cd app && npx shadcn@latest add <component>`
