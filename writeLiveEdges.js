let fs = require('fs');
//let RiTa = require('rita');
let RiTa = require('./lib/rita-full');
let Automatype = require('./automatype').Automatype;

millis = function () { return +Date.now(); }
textWidth = function () { return -1; }
textAscent = function () { return -1; }
textDescent = function () { return -1; }

let word, count = 0;
let args = process.argv.slice(2);
let numlines = args && args[0] || 10;
let edgeFile = 'live-edges-'+numlines+'.'+millis()+'.csv';
let edgeData = 'source,target,med,step\n';

step = function () {
  typer.step();
  if (count <= numlines) {

    setTimeout(step, 1);
  } else {

    //console.log(edgeData);
    fs.writeFileSync(edgeFile, edgeData);
    console.log('Wrote file: ' + edgeFile)
  }
}

onActionComplete = function (next, med) {
  if (next) {
    if (word) {
      edgeData += word + ',' + next + ',' + med+','+count+'\n';
      //word && console.log(key);
    }
    word = next;
    count++;
    if (count % 500 == 0) console.log(Math.floor((count / numlines) * 1000) / 10 + '% complete');
  }
}

typer = new Automatype();
step();
