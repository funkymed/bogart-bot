import Storage from "node-storage";
import * as YAML from "yaml";
import * as fs from "fs";

const store = new Storage("./storage");

function sanitize(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getRandom<T>(obj: T): T[keyof T] {
  const keys = Object.keys(obj) as Array<keyof T>;
  return obj[keys[(keys.length * Math.random()) << 0]];
}

function addNickToMessage(
  msg: string,
  str: string,
  nickname: string
): string | undefined {
  if (msg) {
    msg = msg.replace("%user_name", `<@${nickname}> `);
    msg = msg.replace("%text", str);
    return msg;
  }
}

function setStorage(key: string, data: any): void {
  store.put(key, JSON.stringify(data));
}

function getStorage<T>(key: string): T | false {
  const data = store.get(key);
  return data ? (JSON.parse(data) as T) : false;
}

function clearStorage(key: string): void {
  store.remove(key);
}

function randomIntFromInterval(min: number, max: number): number {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const dictionnaryFiles: { [key: string]: string } = {
  bend01: "texts/01.yml",
  bend02: "texts/02.yml",
  bend03: "texts/03.yml",
  bend04: "texts/04.yml",
  bend05: "texts/05.yml",
  star: "texts/star.yml",
  lieu: "texts/lieu.yml",
  tv: "texts/tv.yml",
  adj: "texts/adj.yml",
  phrase: "texts/phrase.yml",
  jcvd: "texts/jcvd.yml",
  citation: "texts/citation.yml",
};

const dictionnary: any = [];
let dicoLoaded = false;

const getDictionnary = () => {
  if (!dicoLoaded) {
    for (let k in dictionnaryFiles) {
      if (dictionnaryFiles.hasOwnProperty(k)) {
        const fileName = `${getStaticPath()}/${dictionnaryFiles[k]}`;
        const file = fs.readFileSync(fileName, "utf8");
        dictionnary[k] = YAML.parse(file);
      }
    }
    dicoLoaded = true;
  } else {
  }
  return dictionnary;
};

const getStaticPath = () => {
  return `${__dirname}/assets`;
};

export {
  sleep,
  sanitize,
  getRandom,
  addNickToMessage,
  setStorage,
  getStorage,
  clearStorage,
  randomIntFromInterval,
  getDictionnary,
  getStaticPath,
};
