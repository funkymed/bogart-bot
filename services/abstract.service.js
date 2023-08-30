const fs = require("fs");
const YAML = require("yaml");

module.exports = class ServiceAbstract {
  nickname;
  serviceName = "";
  commande = false;
  dictionnaryFiles = {};
  dictionnary = {};

  /**
   *
   * @param {string} nickname
   */
  constructor(nickname) {
    this.nickname = nickname;
    this.loadDictionnary();
  }

  loadDictionnary() {
    for (const k in this.dictionnaryFiles) {
      const fileName = this.dictionnaryFiles[k];
      const file = fs.readFileSync(fileName, "utf8");
      this.dictionnary[k] = YAML.parse(file);
    }
  }

  /**
   *
   * @param {string} message
   */
  getMessage(message) {}

  getServiceName() {
    return this.serviceName;
  }
  getCommande() {
    return this.commande;
  }
};
