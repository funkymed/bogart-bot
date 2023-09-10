const ServiceAbstract = require("./abstract.service");

const { getRandom, randomIntFromInterval } = require("../utils.js");

class ServiceLol extends ServiceAbstract {
  dictionnaryFiles = {
    bend01: "./texts/01.yml",
    bend02: "./texts/02.yml",
    bend03: "./texts/03.yml",
    bend04: "./texts/04.yml",
    bend05: "./texts/05.yml",
    star: "./texts/star.yml",
    lieu: "./texts/lieu.yml",
    tv: "./texts/tv.yml",
    adj: "./texts/adj.yml",
    phrase: "./texts/phrase.yml",
    jcvd: "./texts/jcvd.yml",
    citation: "./texts/citation.yml",
  };

  serviceName = "lol";
  commande = "!lol";

  getCommands(text) {
    const txt = text.split(" ");
    return txt[1] ? txt[1] : false;
  }

  getHelp() {
    return "!lol optional (lol | random | citation | jcvd)";
  }

  makeLol() {
    const rand = randomIntFromInterval(1, 10);
    const numtxt = randomIntFromInterval(1, 4);
    const star = getRandom(this.dictionnary["star"]);
    const lieu = getRandom(this.dictionnary["lieu"]);
    const tv = getRandom(this.dictionnary["tv"]);
    const adj = getRandom(this.dictionnary["adj"]);
    const phrase = getRandom(this.dictionnary["phrase"]);

    let message;

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

  makeRandom() {
    const phrase = [
      `${getRandom(this.dictionnary["bend01"])},`,
      getRandom(this.dictionnary["bend02"]),
      getRandom(this.dictionnary["bend03"]),
      `${getRandom(this.dictionnary["bend04"])},`,
      getRandom(this.dictionnary["bend05"]),
    ];

    return phrase.join(" ");
  }

  makeJcvd() {
    return `> *Jean-Claude Van Damme* : ${getRandom(this.dictionnary["jcvd"])}`;
  }

  makeCitation() {
    return `> ${getRandom(this.dictionnary["citation"])}`;
  }

  getMessage(text) {
    const command = this.getCommands(text);
    return this.getLol(command);
  }

  getLol(command) {
    switch (command) {
      case "lol":
        return this.makeLol();
        break;
      case "random":
        return this.makeRandom();
        break;
      case "jcvd":
        return this.makeJcvd();
        break;
      case "citation":
        return this.makeCitation();
        break;
      case "help":
        return this.getHelp();
        break;
      default:
        const rand = randomIntFromInterval(1, 4);
        if (rand == 1) {
          return this.makeLol();
        } else if (rand === 2) {
          return this.makeRandom();
        } else if (rand === 3) {
          return this.makeJcvd();
        } else {
          return this.makeCitation();
        }
        break;
    }
  }
}

module.exports = ServiceLol;
