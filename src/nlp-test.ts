import { NlpManager } from "node-nlp";
import * as fs from "fs";
import * as clc from "cli-color";
import { getStaticPath } from "./utils";

interface UserContext {
  context: string;
  channel: string | null;
}

interface ContextsInfo {
  [intent: string]: string;
}

const manager = new NlpManager({ languages: ["fr"] });
manager.load(`${getStaticPath()}/models/model.nlp`);

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
  console.log(clc.blackBright(`[${currentContext}]`));
  const response = await manager.process("fr", sentence, userContext);

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
      answer += " 😁";
    } else if (response.sentiment.vote === "negative") {
      answer += " 😭";
    }

    return answer;
  } else {
    return false;
  }
};

const testSentences = [
  "bye",
  "salut le gentil",
  "bye",
  "Salut le nul",
  "ça va ?",
  "je pars en vacances",
  "à taiwan",
  "non en corée",
  "je vais devoir charette ce soir",
  "tu fais chier",
];

const test = async () => {
  console.log("");
  console.log(clc.blueBright(":======================:"));
  console.log(clc.blue("    B O G A R T - IA   "));
  console.log(clc.blueBright(":======================:"));
  console.log("");

  for (const s of testSentences) {
    let resp: any = await processNlp(s, "user_1");

    if (resp) resp = resp.replace("%user_name", `@user_1`);

    console.log(clc.yellow("user_1:"), s);
    console.log(clc.green("bogart:"), resp);
    console.log("");
  }
};

test();
