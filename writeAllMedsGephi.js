let fs = require('fs');
//let RiTa = require('rita');
let RiTa = require('./lib/rita-full');

let format = 'cyto';
let args = process.argv.slice(2);
let maxAllowedMed = args && Math.min(args[0],3) || 0;
let keys = new RiTa.RiLexicon().keys;
let edgeFile = 'edges-dist'+maxAllowedMed+'.csv';
let words = JSON.parse(fs.readFileSync('allnodes.json', 'utf8'));

if (maxAllowedMed < 1) {
  console.log('\nUsage: node logmeds [maxMed]');
  return;
}

let edgeData = "Source,Target,Type\n";
FOR: for (var i = 0; i < keys.length; i++) {
  for (var j = 0; j < keys.length; j++) {
    if (i == j) continue;
    var word1 = keys[i];
    var word2 = keys[j];
    var med = RiTa.minEditDistance(word1, word2);
    if (med <= maxAllowedMed) {
      if (format != 'cyto')
        edgeData += words[word1]+','+words[word2] + ",undirected\n";
      else
        edgeData += word1+','+word2 + "\n";
    }
  }
  if (i%100==0) console.log(Math.floor((i/keys.length)*1000)/10+'% complete');
}

fs.writeFileSync(edgeFile, edgeData);
console.log('Wrote file: '+edgeFile);
