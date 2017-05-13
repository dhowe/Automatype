if (typeof module != 'undefined') { // for node
  RiLexicon = require('rita').RiLexicon;
}

function HistoryQueue(sz) {
  this.q = [];
  this.capacity = sz;
  this.add = function(e) {
    this.q.push(e);
    while (this.q.length > this.capacity)
      this.q.shift();
  }
  this.contains = function(w) { return this.q.indexOf(w) > -1; }
  this.newest = function() { return this.q[this.q.length-1]; }
  this.empty = function() { return this.q.length > 0; }
  this.oldest = function() { return this.q[0]; }
}

function LexiconLookup() {

  this.lex = RiLexicon();
  this.hq = new HistoryQueue(20);

  this.randomWord = function(len) {

    var w = this.lex.randomWord();
    while (w.length !== len)
      w = this.lex.randomWord();
    return w;
  }

  this.getDeletion = function(input) {

    var result = this.getDeletions(input);
    // shuffle result ?
    for (var r of result) {
      if (!this.hq.contains(r))
        return r;
    }
  }

  this.getDeletions = function(input) {

    var result = [], len = input.length;
    for (var i = 0; i < len; i++)
    {
      var pre = input.substring(0, i),
        post = input.substring(i + 1);
      if (this.lex.containsWord(pre + post))
        result.push(pre + post);
    }
    return result;
  }

  this.getInsertions = function(input) {

    var result = [], len = input.length;
    for (var i = 0; i < len; i++)
    {
      var pre = input.substring(0, i),
        post = input.substring(i);
      for (var j = 0; j < 26; j++) {
        var sub = String.fromCharCode(j+97);
        var test = pre + sub + post;
        if (this.lex.containsWord(test))
          result.push(test);
      }
    }
    return result;
  }

  this.getInsertion = function(input) {

    var result = this.getInsertions(input);
    // shuffle result ?
    for (var r of result) {
      if (!this.hq.contains(r))
        return r;
    }
  }

  this.mutateWord = function(current) {
    var result = [];
    var med = this.lex.similarByLetter(current, true);
    console.log(result, med);
    var constraintsRelaxed = false, nextWord = med.pop();
    while (!this.hq.empty() && this.hq.contains(nextWord)) {

    }
  }
}

if (typeof module != 'undefined' && module.exports) { // for node

  module.exports = LexiconLookup;
  //   LexiconLookup: LexiconLookup,
  //   HistoryQueue: HistoryQueue
  // }
}
