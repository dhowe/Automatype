let fs = require('fs');
//let RiTa = require('rita');
let RiTa = require('./lib/rita-full');
let Automatype = require('./automatype').Automatype;
let edgeFile = 'live-edges-gephi.csv';
let words = JSON.parse(fs.readFileSync('allnodes.json', 'utf8'));


let word, count = 0;
let args = process.argv.slice(2);
let numlines = args && args[0] || 10;
let edgeData = {};

millis = function () { return -1; }
textWidth = function () { return -1; }
textAscent = function () { return -1; }
textDescent = function () { return -1; }

function stringifyEdges(edges) {
  let ekeys = Object.keys(edges);
  let edgeStr = "Source,Target,Med,Count\n";
  for (var i = 0; i < ekeys.length; i++) {
    let parts = ekeys[i].split(',');
    //console.log(i+") "+parts);
    parts[0] = words[parts[0]];
    parts[1] = words[parts[1]];
    parts.push(edges[ekeys[i]]); // the count
    edgeStr += parts.join(',') + '\n';
  }
  return edgeStr;
}

step = function () {
  typer.step();
  if (count < numlines) {

    setTimeout(step, 1);
  } else {

    //console.log(edgeData);
    let edgeStr = stringifyEdges(edgeData);
    fs.writeFileSync(edgeFile, edgeStr);
    console.log('Wrote file: ' + edgeFile)
  }
}

onActionComplete = function (next, med) {
  if (next) {
    let key = word + ',' + next + ',' + med;
    //word && console.log(key);
    if (!words.hasOwnProperty(next)) {
      throw Error('No entry for words['+next+'] in words, got '+words[next]+" / "+word+" -> "+next);
    }
    if (!edgeData.hasOwnProperty[key]) {
      edgeData[key] = 0;
    }
    edgeData[key]++;
    word = next;
    count++;
    if (count%500==0) console.log(Math.floor((count/numlines)*1000)/10+'% complete');
  }
}

typer = new Automatype();
step();
