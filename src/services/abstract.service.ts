import * as fs from "fs";
import * as YAML from "yaml";
import { getDictionnary } from "../utils";

export default abstract class ServiceAbstract {
  nickname: string;
  serviceName: string = "";
  commande: boolean | string = false;
  dictionnaryFiles: { [key: string]: string } = {};
  dictionnary: { [key: string]: any } = getDictionnary();

  /**
   * @param {string} nickname
   */
  constructor(nickname: string) {
    this.nickname = nickname;
    this.loadDictionnary();
  }

  loadDictionnary(): void {
    for (const k in this.dictionnaryFiles) {
      if (this.dictionnaryFiles.hasOwnProperty(k)) {
        const fileName = `${process.cwd()}/src/${this.dictionnaryFiles[k]}`;
        const file = fs.readFileSync(fileName, "utf8");
        this.dictionnary[k] = YAML.parse(file);
      }
    }
  }

  /**
   * @param {string} message
   */
  abstract getMessage(message: string): any;

  getServiceName(): string {
    return this.serviceName;
  }

  getCommande(): boolean | string {
    return this.commande;
  }
}
