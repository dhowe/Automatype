let Automatype = require('./automatype').Automatype;

let word;
let count = 0;
let nodes = {};
let args = process.argv.slice(2);
let numlines = args && args[0] || 10;

console.log('Source,Target');

millis = function () { return -1; }
textWidth = function () { return -1; }
textAscent = function () { return -1; }
textDescent = function () { return -1; }

onActionComplete = function (next, med) {
  if (next) {
    if (word) console.log(word + ',' + next);
    word = next;
    count++;
  }
}

step = function () {
  typer.step();
  if (count < numlines) {
    setTimeout(step, 1);
  }
}

typer = new Automatype();
step();
