let fs = require('fs');
let args = process.argv.slice(2);
if (!args.length) {
  console.log("\nUsage: node longestRepeatedSequence.js [edge-file]");
  return;
}
let lines = fs.readFileSync(args[0], 'utf8').split('\n');
let data = '', count = 0, delim = ',';
lines.forEach(parseLine);
//console.log('parsed ' + count + ' lines');
let lrs = longestRepeatedSubstring(data);
let matches = getMatches(lrs, /<(\w+)>/g, 1);

console.log(matches.join(','));

function parseLine(l) {
  if (!l.startsWith('source,target,med,step')) {
    let parts = l.split(',');
    if (parts && parts.length == 4) {
      data += '<' + parts[0] + '>';
      count++;
    }
  }
}

function getMatches(s, re, idx) {
  let matches=[], m;
  do {
    m = re.exec(s);
    if (m) matches.push(m[1]);
  } while (m);
  return matches;
}

function longestRepeatedSubstring(str) {

  let n = str.length;
  let lcrs = Array(n + 1).fill().map(() => Array(n + 1));
  let res = ''; // To store result
  let longest = 0; // To store length of result

  let i, index = 0;
  for (i = 1; i <= n; i++) {
    for (let j = i + 1; j <= n; j++) {
      if (str[i - 1] == str[j - 1] && lcrs[i - 1][j - 1] < (j - i))
      {
        lcrs[i][j] = lcrs[i - 1][j - 1] + 1;
        if (lcrs[i][j] > longest) {
          longest = lcrs[i][j];
          index = Math.max(i, index);
        }
      } else {
        lcrs[i][j] = 0;
      }
    }
  }
  if (longest > 0) {
    for (i = index - longest + 1; i <= index; i++) {
      res += str[i - 1];
    }
  }
  return res;
}
