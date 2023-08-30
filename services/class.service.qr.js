const ServiceAbstract = require("./abstract.service");

const {
  sanitize,
  getRandom,
  addNickToMessage,
  setStorage,
  getStorage,
  clearStorage,
} = require("../utils.js");

class ServiceQr extends ServiceAbstract {
  dictionnaryFiles = { qr: "./texts/qr.yml" };
  serviceName = "qr";
  commande = false;
  getMessage(message) {
    const response = getStorage(this.nickname);
    clearStorage(this.nickname);
    let answer;
    if (response) {
      answer = this.getResponse(message, response);
    }
    return answer ? answer : this.getResponse(message, this.dictionnary.qr);
  }

  getSentence(v, str, nickname, response) {
    let msg = "";
    msg = getRandom(v);
    if (msg && msg.replace && typeof msg.replace === "function") {
      msg = addNickToMessage(msg, str, nickname);
      if (response) {
        setStorage(nickname, response);
      }
      return msg;
    }
  }

  getResponse(str, qr) {
    const text = sanitize(str);
    const t = text.split(" ");

    for (const k in qr) {
      let v = qr[k];

      // found recursive response
      let response = false;
      if (v["--response--"]) {
        response = v["--response--"];
        delete v["--response--"];
      }

      // one sentence
      if (sanitize(k).split(",").includes(text.toLowerCase())) {
        return this.getSentence(v, str, this.nickname, response);
      }

      // one word
      for (const word of t) {
        if (sanitize(k).split(",").includes(sanitize(word))) {
          return this.getSentence(v, str, this.nickname, response);
        }
      }
    }
  }
}

module.exports = ServiceQr;
