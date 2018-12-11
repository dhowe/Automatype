let fs = require('fs');
let RiTa = require('rita');
let Automatype = require('./automatype').Automatype;

let args = process.argv.slice(2);
let maxAllowedMed = args && Math.min(args[0],3) || 0;
let keys = new RiTa.RiLexicon().keys;
let edgeFile = 'edges-dist'+maxAllowedMed+'.csv';
let nodeFile = 'nodes.csv';
let writeNodes = false;

if (maxAllowedMed < 1) {
  console.log('\nUsage: node logmeds [maxMed]');
  return;
}

let words = {},
  numWords = keys.length,
  nodeData = "Id,Label\n";
for (var i = 0; i < keys.length; i++) {
  writeNodes && (nodeData += (i + 1) + "," + keys[i] + "\n");
  words[keys[i]] = i+1;// { id: i + 1 , count: 0 };
}
if (writeNodes) {
  fs.writeFileSync(nodeFile, nodeData);
  console.log('Wrote file: '+nodeFile);
}

console.log('Creating edge file for nodes with med <= '+maxAllowedMed);

let edgeData = "Source,Target,Type\n";
FOR: for (var i = 0; i < keys.length; i++) {
  for (var j = 0; j < keys.length; j++) {
    if (i == j) continue;
    var word1 = keys[i];
    var word2 = keys[j];
    var med = RiTa.minEditDistance(word1, word2);
    if (med <= maxAllowedMed) {
      edgeData += words[word1]+','+words[word2] + ",undirected\n";
    }
    //if (i==20) break FOR;
  }
  if (i%50==49) console.log(Math.floor((i/numWords)*1000)/10+'% complete');
}

fs.writeFileSync(edgeFile, edgeData);
console.log('Wrote file: '+edgeFile);
