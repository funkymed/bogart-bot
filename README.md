# Bogart Bot

A somewhat silly but useful bot developed by Cyril Pereira.

## History
This bot was created in the 2000s for IRC. It was later ported to Slack before being developed for Discord.

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