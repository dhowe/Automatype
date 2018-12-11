let Automatype = require('./automatype').Automatype;

// TODO: next create nodes(if not exists)/links(from last->word) ??
//       check data-viz package first (gephi)

let word, count = 0;
let nodes = {}; // each node has list [] of links (with timestamp?) ?
let args = process.argv.slice(2);
let numlines = args && args[0] || 10;
let format = args && args[1] || 'gephi-csv';
//console.log('myArgs: ', args);

console.log('Source,Target');

millis = function() { return -1; }
textWidth = function() { return -1; }
textAscent = function() { return -1; }
textDescent = function() { return -1; }

onActionComplete = function(next) {
  if (next) {
     if (word) console.log(word+','+next);
     word = next;
     count++;
   }
}

step = function() {
  typer.step();
  if (count < numlines) {
    setTimeout(step, 1);
  }
}

typer = new Automatype();
step();
