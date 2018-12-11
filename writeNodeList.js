let fs = require('fs');
let RiTa = require('rita');
let Automatype = require('./automatype').Automatype;

let keys = new RiTa.RiLexicon().keys;
let nodeFile = 'allnodes';

let word = 9;
let count = 0;
let nodes = {};
let args = process.argv.slice(2);
let numlines = args && args[0] || Number.MAX_SAFE_INTEGER;

let words = {},
  numWords = keys.length,
  nodeData = "Id,Label\n";

function addKey(entry, id) {
  if (!word.hasOwnProperty(entry)) {
    words[entry] = id;
    nodeData += id + ',' + entry + '\n';
  }
}

var idx = 1;
for (var i = 0; i < keys.length; i++) {
  addKey(keys[i], idx++);
  if (RiTa.containsWord(keys[i] + 's')) addKey(keys[i] + 's', idx++);
  if (RiTa.containsWord(keys[i] + 'es')) addKey(keys[i] + 'es', idx++);
  if (idx >= numlines) break;
}

console.log('Wrote ' + Object.keys(words).length + ' words, dict.length: ', numWords);

fs.writeFileSync(nodeFile+".csv", nodeData);
console.log('Wrote text to file: '+nodeFile+".csv");

fs.writeFileSync(nodeFile+".json", JSON.stringify(words, null, 2));
console.log('Wrote json to file: '+nodeFile+".json");
