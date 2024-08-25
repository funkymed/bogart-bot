import ServiceAbstract from "./abstract.service";
import { getRandom, randomIntFromInterval } from "../utils";

export default class ServiceLol extends ServiceAbstract {
  constserviceName: string = "lol";
  commande: string = "!lol";

  getCommands(text: string): string | false {
    const txt = text.split(" ");
    return txt[1] ? txt[1] : false;
  }

  getHelp(): string {
    return "!lol optional (lol | random | citation | jcvd)";
  }

  makeLol(): string | undefined {
    const rand = randomIntFromInterval(1, 10);
    const numtxt = randomIntFromInterval(1, 4);
    const star = getRandom(this.dictionnary["star"]);
    const lieu = getRandom(this.dictionnary["lieu"]);
    const tv = getRandom(this.dictionnary["tv"]);
    const adj = getRandom(this.dictionnary["adj"]);
    const phrase = getRandom(this.dictionnary["phrase"]);

    let message: string | undefined;

    switch (rand) {
      case 1:
        message = `ça branche quelqu'un ${numtxt} places pour ${star} ${lieu} ?`;
        break;
      case 2:
        message = `je suis abonné à la chaine de ${star}`;
        break;
      case 3:
        message = `hier je suis allé ${lieu} et j'ai pas mal marché`;
        break;
      case 4:
        message = `quelqu'un connait un bon site sur ${star} ?`;
        break;
      case 5:
        message = `j'ai participé à l'enregistrement de ${tv} et ${star} était ${adj}`;
        break;
      default:
      case 6:
        message = phrase;
        break;
      case 7:
        message = `wow cool, y a ${star} sur ${tv} à ${numtxt}H du mat`;
        break;
      case 8:
        message = `vous connaissez ${star} ? `;
        break;
      case 9:
        message = `j'ai un faux air de ${star} vous ne trouvez pas ?`;
        break;
      case 10:
        message = `j'habite juste a côté, ${lieu} je croise parfois ${star}`;
        break;
    }
    if (message) {
      message = message.replace("de les", "des");
      return message;
    }
  }

  makeRandom(): string {
    const phrase = [
      `${getRandom(this.dictionnary["bend01"])},`,
      getRandom(this.dictionnary["bend02"]),
      getRandom(this.dictionnary["bend03"]),
      `${getRandom(this.dictionnary["bend04"])},`,
      getRandom(this.dictionnary["bend05"]),
    ];

    return phrase.join(" ");
  }

  makeJcvd(): string {
    return `> *Jean-Claude Van Damme* : ${getRandom(this.dictionnary["jcvd"])}`;
  }

  makeCitation(): string {
    return `> ${getRandom(this.dictionnary["citation"])}`;
  }

  async getMessage(text: string): Promise<string | undefined> {
    const command = this.getCommands(text);
    return this.getLol(command);
  }

  getLol(command: string | boolean): string | undefined {
    switch (command) {
      case "lol":
        return this.makeLol();
      case "random":
        return this.makeRandom();
      case "jcvd":
        return this.makeJcvd();
      case "citation":
        return this.makeCitation();
      case "help":
        return this.getHelp();
      default:
        const rand = randomIntFromInterval(1, 4);
        if (rand === 1) {
          return this.makeLol();
        } else if (rand === 2) {
          return this.makeRandom();
        } else if (rand === 3) {
          return this.makeJcvd();
        } else {
          return this.makeCitation();
        }
    }
  }
}
