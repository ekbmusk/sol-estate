# Запуск CarbonKZ на Windows (WSL2)

## 1. Установка WSL2

PowerShell (от администратора):
```powershell
wsl --install -d Ubuntu
```
Перезагрузить. Открыть Ubuntu, создать пользователя.

## 2. Установка зависимостей (внутри WSL2)

```bash
# Обновление
sudo apt update && sudo apt upgrade -y

# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

# Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.32.1
avm use 0.32.1

# Yarn (нужен для Anchor)
npm install -g yarn
```

Проверить:
```bash
node -v          # v20+
solana --version # 1.18+
anchor --version # 0.32.1
```

## 3. Создание кошелька

```bash
solana-keygen new -o ~/.config/solana/id.json
```
Запишите seed phrase! Это ваш CLI кошелёк для деплоя и скриптов.

Показать публичный адрес:
```bash
solana address
```

## 4. Настройка сети

```bash
# Для локальной разработки (тесты)
solana config set --url localhost

# Для devnet (деплой, взаимодействие с живой сетью)
solana config set --url devnet
```

## 5. Клонирование проекта

```bash
git clone https://github.com/ekbmusk/sol-estate.git
cd sol-estate
```

## 6. Сборка контракта

```bash
anchor build
```
Первый раз долго (~5 мин). Создаст `target/deploy/carbon_kz.so` и `target/idl/carbon_kz.json`.

## 7. Запуск тестов (локальный валидатор)

```bash
anchor test --provider.cluster localnet
```
Это автоматически:
- Запускает локальный валидатор (`solana-test-validator`)
- Деплоит программу
- Запускает 16 тестов
- Останавливает валидатор

Все 16 тестов должны пройти.

## 8. Запуск фронтенда

```bash
cd app
npm install
npm run dev
```
Откроется на `http://localhost:3000`.

## 9. Подключение Phantom

1. Установите [Phantom](https://phantom.app/) расширение в браузере
2. Создайте кошелёк или импортируйте существующий
3. Переключите Phantom на **Devnet**: Settings → Developer Settings → Change Network → Devnet
4. На сайте нажмите "Select Wallet" → Phantom

## 10. Получение тестовых токенов

### SOL (для комиссий)
```bash
# Через CLI (может быть rate limit)
solana airdrop 2 <АДРЕС_PHANTOM> --url devnet

# Или через faucet: https://faucet.solana.com
```

### KZTE (для инвестиций)
Через API фронтенда (если запущен `npm run dev`):
```bash
curl -X POST http://localhost:3000/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"wallet": "АДРЕС_PHANTOM"}'
```

Или через скрипт (из корня проекта):
```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-node scripts/mint-kzte.ts <АДРЕС_PHANTOM> 100000
```

## 11. Работа с devnet

### Создать проекты на devnet
```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-node scripts/setup-devnet.ts
```

### Заминтить carbon tokens (для retire)
```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-node scripts/mint-carbon-tokens.ts ses-yasavi <АДРЕС_PHANTOM> 20
```

### Распределить дивиденды
```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-node scripts/distribute-revenue.ts ses-yasavi 50000
```

## 12. Деплой на devnet (если нужно передеплоить)

```bash
# Нужно ~5 SOL на CLI кошельке
solana airdrop 5 --url devnet

# Деплой
anchor deploy --provider.cluster devnet

# Или upgrade существующей программы
anchor upgrade --provider.cluster devnet \
  --program-id 3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg \
  target/deploy/carbon_kz.so

# Синхронизировать IDL с фронтом
cp target/idl/carbon_kz.json app/src/idl/carbon_kz.json
```

## Важные адреса

| Что | Адрес |
|-----|-------|
| Program ID | `3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg` |
| KZTE Mint | `tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE` |
| Explorer | https://explorer.solana.com/address/3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg?cluster=devnet |

## Частые проблемы

| Проблема | Решение |
|----------|---------|
| `anchor build` fails с "linker cc not found" | `sudo apt install build-essential` |
| `solana airdrop` rate limited | Подождать или использовать https://faucet.solana.com |
| Phantom не видит KZTE | Добавить токен вручную: token address `tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE` |
| `npm run dev` порт занят | `npx kill-port 3000` или `npm run dev -- -p 3001` |
| WSL2 не видит localhost | Открывать `http://localhost:3000` из Windows браузера |
| `anchor test` зависает | Убить старый валидатор: `pkill -f solana-test-validator` |
