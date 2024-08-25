# Bogart Bot

A somewhat silly but useful bot developed by Cyril Pereira.

![Bogart](./docs/assets/image.jpeg)

## History
- In 2002 The bot was coded in Alambik for IRC. 
- In 2016 It was ported to PHP for Slack and got a name  : Bender (Futurama ftw).
- In 2023 a new version in Javascript (ES6) for Discord and got his name change to Bogart.
- In 2024 TypeScript version.

## Intall

```bash
yarn install
```

Copy the .env.dist file to .env. Add your configuration keys.

## Launch bot

in dev locally

```bash
yarn dev
```

for production

```bash
yarn build
yarn start
```

## NLP

### train nlp with bogart data

```bash
yarn train
```

you can edit `model-train.json` tu add your own conversationnal information.
The system use multiple context, when you start a conversation, the next result is unlock by the next context.

### Test nlp

```bash
yarn test
```