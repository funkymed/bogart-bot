var Storage = require("node-storage");
var store = new Storage("./storage");

function sanitize(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getRandom(obj) {
  var keys = Object.keys(obj);
  return obj[keys[(keys.length * Math.random()) << 0]];
}

function addNickToMessage(msg, str, nickname) {
  msg = msg.replace("%user_name", `@${nickname} `);
  msg = msg.replace("%text", str);
  return msg;
}

function setStorage(key, data) {
  store.put(key, JSON.stringify(data));
}

function getStorage(key) {
  const data = store.get(key);
  return data ? JSON.parse(data) : false;
}

function clearStorage(key) {
  store.remove(key);
}

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  sleep,
  sanitize,
  getRandom,
  addNickToMessage,
  setStorage,
  getStorage,
  clearStorage,
  randomIntFromInterval,
};
