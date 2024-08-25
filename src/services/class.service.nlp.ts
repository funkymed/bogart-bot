import { NlpManager } from "node-nlp";
import * as fs from "fs";
import { getStaticPath } from "../utils";

const manager = new NlpManager({ languages: ["fr"] });

const positiveEmoji = "😁";
const negatifEmoji = "😭";

manager.load(`${getStaticPath()}/models/model.nlp`);

interface UserContext {
  context: string;
  channel: string | null;
}

interface ContextsInfo {
  [intent: string]: string;
}

const contextsInfo: ContextsInfo = JSON.parse(
  fs.readFileSync(`${getStaticPath()}/models/contexts-info.json`, "utf8")
);

const userContexts: { [userId: string]: UserContext } = {};

const processNlp = async (
  sentence: string,
  userId: string
): Promise<string | boolean> => {
  if (!userContexts[userId]) {
    userContexts[userId] = { context: "default", channel: null };
  }

  const userContext = userContexts[userId];
  const currentContext = userContext.context;

  let response = await manager.process("fr", sentence, userContext);

  const contextPrefix = response.intent.split(".")[0];
  if (contextPrefix !== currentContext) {
    // Si l'intention ne correspond pas au contexte actuel, fournir une réponse par défaut
    response.intent = "none";
    response.answer = "";
  } else {
    // Sinon, mettre à jour le contexte en fonction du nextContext
    const nextContext = contextsInfo[response.intent] || "default";
    userContexts[userId].context = nextContext;
  }

  if (response.answer) {
    let answer = response.answer;

    if (response.sentiment.vote === "positive") {
      answer += ` ${positiveEmoji}`;
    } else if (response.sentiment.vote === "negative") {
      answer += ` ${negatifEmoji}`;
    }

    return answer;
  } else {
    return false;
  }
};

export default processNlp;
