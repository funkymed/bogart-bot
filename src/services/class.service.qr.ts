import ServiceAbstract from "./abstract.service";
import processNlp from "./class.service.nlp";

import { addNickToMessage } from "../utils.js";

interface Dictionary {
  [key: string]: any;
}

export default class ServiceQr extends ServiceAbstract {
  // dictionnaryFiles: { [key: string]: string } = { qr: "./assets/texts/qr.yml" };
  serviceName: string = "qr";
  commande: boolean = false;

  async getMessage(message: string): Promise<string | undefined> {
    let answer: any = await processNlp(message, this.nickname);

    if (answer) {
      answer = addNickToMessage(answer, message, this.nickname);
      return answer;
    }
    return undefined;
  }
}
