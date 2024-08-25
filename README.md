# Bogart Bot

Un bot un peut bête mais utile développé par Cyril Pereira

## Historique
Ce bot a été crée dans les années 2000 pour IRC
Il a été ensuite porté sur Slack avant d'etre développé pour Discord

## Intall

```bash
yarn install
```

copiez le fichier copy.json.dist en copy.json
Ajoutez vos clef de configuration

## Launch bot

```bash
node bot.js
```

## NLP

### train nlp with bogart data

```bash
node train.js
```

you can edit `model-train.json` tu add your own conversationnal information.
The system use multiple context, when you start a conversation, the next result is unlock by the next context.

### Test nlp

```bash
node test-train.js
```