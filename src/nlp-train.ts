import { NlpManager } from "node-nlp";
import * as fs from "fs";
import { getStaticPath } from "./utils";

interface TrainingItem {
  sentence: string;
  answer: string;
  nextContext: string;
}

interface Contexts {
  [intent: string]: TrainingItem[];
}

interface TrainingData {
  contexts: {
    [context: string]: Contexts;
  };
}

const manager = new NlpManager({ languages: ["fr"], forceNER: true });
const contextsInfo: { [key: string]: string } = {}; // Stocker les informations de contexte ici

const loadTrainingData = (filePath: string): void => {
  const data: TrainingData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const contexts = data.contexts;

  for (const context in contexts) {
    if (contexts.hasOwnProperty(context)) {
      for (const intent in contexts[context]) {
        if (contexts[context].hasOwnProperty(intent)) {
          for (const item of contexts[context][intent]) {
            const utterance = item.sentence.toLowerCase();
            const response = item.answer.toLowerCase();
            const nextContext = item.nextContext;

            manager.addDocument("fr", utterance, `${context}.${intent}`);
            manager.addAnswer("fr", `${context}.${intent}`, response);

            // Stocker le nextContext pour chaque intention
            contextsInfo[`${context}.${intent}`] = nextContext;
          }
        }
      }
    }
  }

  // Sauvegarder les informations de contexte dans un fichier séparé
  fs.writeFileSync(
    `${getStaticPath()}/models/contexts-info.json`,
    JSON.stringify(contextsInfo, null, 2)
  );
};

// Charger les données d'entraînement
loadTrainingData(`./src/model-train.json`);

(async () => {
  await manager.train();
  manager.save(`${getStaticPath()}/models/model.nlp`);
})();
