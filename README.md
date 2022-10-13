# SBT contracts

Create SBT and deploy to Baobab.

## Prerequisites

Generate mnemonic.

```shell
npx mnemonics
```

Create `.env` from `.env.example`

```shell
cp .env.example .env
```

and fill in generated mnemonic to `MNEMONIC` environment variable.

## Deploy locally

```shell
npx hardhat run --network localhost ./scripts/deploy.ts
```

## Deploy to Baobab

```shell
npx hardhat run --network baobab ./scripts/deploy.ts
```

## Run test

```shell
npx hardhat test
```

## Package

```shell
npx hardhat compile
yarn build
yarn pub
```
