let test = [1,3,5,2,3,6];
console.log(longestCycle(test, 6));
return;

let fs = require('fs');
let args = process.argv.slice(2);
if (!args.length) {
  console.log("\nUsage: node longestCycle.js [live-edge-file]");
  return;
}
let lines = fs.readFileSync(args[0], 'utf8').split('\n');
let data = [],
  count = 0,
  delim = ',';
lines.forEach(parseLine);
console.log('parsed ' + count + ' lines');
let lrs = longestCycle(data, data.length);
console.log(lrs);

/////////////////////////////////////////////////////////////////////

function longestCycle(arr, N) {
  let maxlen = -1;
  let visited = new Array(arr.length);
  visited.fill(false);
  for (let i = 0; i < N; i++) {
    if (!visited[i]) {
      let len = 0;
      dfs(i, arr[i], arr, N, visited, len);
      maxlen = Math.max(maxlen, len);
    }
  }
  return maxlen;
}

function dfs(start, idx, arr, N, visited, len) {
  if (idx >= N) {
    len = 1;
    return;
  }
  visited[idx] = true;
  len++;
  if (!visited[arr[idx]]) {
    dfs(start, arr[idx], arr, N, visited, len);
  }
  else if (start == idx) {
    return;
  }
}

function parseLine(l) {
  if (!l.startsWith('source,target,med,step')) {
    let parts = l.split(',');
    if (parts && parts.length == 4) {
      data.push(parts[0]);
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
