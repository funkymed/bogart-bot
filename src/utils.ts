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

// Mapping des catégories vers les fichiers YAML
const dictionnaryFiles: { [key: string]: string } = {
  demoscene: "texts/demoscene.yml",
  personality: "texts/personality.yml",
  "dev-web": "texts/dev-web.yml",
  "droit-travail": "texts/droit-travail.yml",
  politique: "texts/politique.yml",
};

// Cache des dictionnaires chargés
const dictionnaryCache: { [key: string]: any } = {};

/**
 * Charge un dictionnaire YAML par catégorie
 * @param category - Nom de la catégorie (ex: "demoscene")
 * @returns Le contenu du dictionnaire ou null si non trouvé
 */
const getDictionnary = (category: string): any | null => {
  // Vérifier si déjà en cache
  if (dictionnaryCache[category]) {
    return dictionnaryCache[category];
  }

  // Vérifier si la catégorie existe
  if (!dictionnaryFiles[category]) {
    console.warn(`[getDictionnary] Unknown category: ${category}`);
    return null;
  }

  try {
    const fileName = `${getStaticPath()}/${dictionnaryFiles[category]}`;
    const file = fs.readFileSync(fileName, "utf8");
    const parsed = YAML.parse(file);

    // Mettre en cache
    dictionnaryCache[category] = parsed;

    return parsed;
  } catch (error) {
    console.error(`[getDictionnary] Failed to load ${category}:`, error);
    return null;
  }
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

