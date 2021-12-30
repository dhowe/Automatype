let fs = require('fs');
let args = process.argv.slice(2);
if (!args.length) {
  console.log("\nUsage: node writeFormatDOT.js live-edge-file [graph-name]");
  return;
}
let graphName = 'graphname';
if (args.length > 1) graphName = args[1];
let lines = fs.readFileSync(args[0], 'utf8').split('\n');
let data = 'digraph ' + graphName + ' {\n', count = 0;
lines.forEach(parseLine);
//console.log('parsed ' + count + ' lines');
data += '}';
console.log(data);

/////////////////////////////////////////////////////////////////////

function parseLine(l) {
  if (!l.startsWith('source,target,med,step')) {
    let parts = l.split(',');
    if (parts && parts.length == 4) {
      data += '  ' + parts[0] + ' -> ' + parts[1] + ';\n';
      count++;
    }
  }
}

function getMatches(s, re, idx) {
  let matches = [],
    m;
  do {
    m = re.exec(s);
    if (m) matches.push(m[1]);
  } while (m);
  return matches;
}
