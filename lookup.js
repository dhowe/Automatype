if (typeof module != 'undefined') { // for node
  RiTa = require('rita');
  RiLexicon = RiTa.RiLexicon;
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
  this.removeOldest = function() { return this.q.shift(); }
  this.empty = function() { return this.q.length > 0; }
  this.oldest = function() { return this.q[0]; }
  this.size = function() { return this.q.length; }
}

function LexiconLookup() {

  this.lex = RiLexicon();
  this.hq = new HistoryQueue(20);
  this.minHistorySize = 10;

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

    var relaxConstraints = function(current, minMed) {
      var result = [];
      while (result.size() < 1) {
        minMed = this.lex.similarByLetter(current, result, minMed, true);
        minMed++;
      }
      return result;
    }

    var result = this.lex.similarByLetter(current, true),
      history = this.hq, constraintsRelaxed = false, nextWord = result.pop();

    while (!history.empty() && history.contains(nextWord)) {

      if (result.length === 0) { //  one result

        if (history.size() > this.minHistorySize) {

          history.removeOldest();
          result.add(nextWord); // re-add & re-try
          continue;
        }

        // relax constraints and retry
        if (!constraintsRelaxed) {

          constraintsRelaxed = true;
          while (result.length < 2) {
            result = this.relaxConstraints(current, ++med);
          }

          nextWord = result.shift();
          continue;
        }

        console.err("[WARN] Only one result for: " + current + "->" +
          nextWord + ", but its already in history("+history.size()+"): ", history);

        nextWord = this.randomWord(current.length);
      }

      //  multiple results
      nextWord = RiTa.randomItem(result);
    }

    return nextWord;
  }

}// end class

if (typeof module != 'undefined' && module.exports) { // for node

  module.exports = LexiconLookup;
  //   LexiconLookup: LexiconLookup,
  //   HistoryQueue: HistoryQueue
  // }
}
