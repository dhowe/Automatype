let fs = require('fs');
let RiTa = require('rita');
let levenshtein = require('fast-levenshtein');

let args = process.argv.slice(2);
let maxAllowedMed = args && Math.min(args[0],3) || 0;
let keys = new RiTa.RiLexicon().keys;
let edgeFile = 'edges-dist'+maxAllowedMed+'.csv';
//let words = JSON.parse(fs.readFileSync('allnodes.json', 'utf8'));

if (maxAllowedMed < 1) {
  console.log('\nUsage: node writeAllMeds 4');
  return;
}

let edgeData = "Source,Target,Med\n";
for (var i = 0; i < keys.length; i++) {
  for (var j = 0; j < keys.length; j++) {

    if (i == j) continue;

    var word1 = keys[i], word2 = keys[j];

    // words 3-7 chars only
    if (Math.min(word1.length,word2.length) < 3) continue;
    if (Math.max(word1.length,word2.length) > 7) continue;

    var med = levenshtein.get(word1, word2);
    if (med <= maxAllowedMed) {
       // edgeData += words[word1]+','+words[word2] + ",undirected\n";
      edgeData += word1+','+word2 +','+med+ "\n";
    }
  }
  if (i%100==0) {
    console.log(Math.floor((i/keys.length)*1000)/10+'% complete');
    fs.appendFileSync(edgeFile, edgeData);
    edgeData = '';
  }
}

fs.writeFileSync(edgeFile, edgeData);
console.log('Wrote file: '+edgeFile);
