var RiTa, RiLexicon;

if (typeof module != 'undefined') {
  RiTa = require('rita');
  RiLexicon = RiTa.RiLexicon;
}

function HistoryQueue(sz) {
  this.q = [];
  this.capacity = sz;
  this.add = function() {
    for (var i = 0; i < arguments.length; i++) {
      this.q.push(arguments[i]);
    }
    while (this.q.length > this.capacity) {
      this.q.shift();
    }
  };
  this.contains = function(w) {
    return this.q.indexOf(w) > -1;
  };
  this.newest = function() {
    return this.q[this.q.length - 1];
  };
  this.removeOldest = function() {
    return this.q.shift();
  };
  this.empty = function() {
    return this.q.length > 0;
  };
  this.oldest = function() {
    return this.q[0];
  };
  this.size = function() {
    return this.q.length;
  };
  this.indexOf = function(e) {
    return this.q.indexOf(e);
  };
  this.shorten = function(n) {
    while (this.q.length > n) {
      this.removeOldest();
    }
    return this;
  };
  this.clear = function() {
    this.q = [];
    return this;
  };
}

function LexiconLookup() {
  this.lex = new RiLexicon();
  this.hq = new HistoryQueue(20);
  this.minHistorySize = 10;

  this.randomWord = function(len) {
    // TODO: fix me
    var w = this.lex.randomWord();
    while (w.length !== len) {
      w = this.lex.randomWord();
    }
    return w;
  };

  this.getDeletion = function(input) {
    var result = this.getDeletions(input);
    // shuffle result ?
    for (var i = 0; i < result.length; i++) {
      if (!this.hq.contains(result[i])) {
        return result[i];
      }
    }
  };

  this.getDeletions = function(input) {
    var result = [], len = input.length;
    for (var i = 0; i < len; i++) {
      var pre = input.substring(0, i), post = input.substring(i + 1);
      if (this.lex.containsWord(pre + post)) {
        result.push(pre + post);
      }
    }
    return result;
  };

  this.getInsertions = function(input) {
    var result = [], len = input.length;
    for (var i = 0; i < len; i++) {
      var pre = input.substring(0, i), post = input.substring(i);
      for (var j = 0; j < 26; j++) {
        var sub = String.fromCharCode(j + 97);
        var test = pre + sub + post;
        if (this.lex.containsWord(test)) {
          result.push(test);
        }
      }
    }
    return result;
  };

  this.getInsertion = function(input) {
    var result = this.getInsertions(input);
    // shuffle result ?
    for (var i = 0; i < result.length; i++) {
      if (!this.hq.contains(result[i])) {
        return result[i];
      }
    }
  };

  this.mutateWord = function(current) {
    return this.mutations(current)[0];
  };

  this.mutations = function(word) {
    var result, lexicon = this.lex, dbug = false, history = this.hq;

    var fail = function(ll, m) {
      console.error("[WARN] similarByLetter failed for '" + word + "';", m);
      //throw Error();
      return [ll.randomWord(word.length)];
    };

    var findSimilars = function(word, preserveLength, tryNum) {
      dbug && tryNum && console.log('Trying ' + tryNum + ': ', word);
      var current = lexicon.similarByLetter(word, 1, preserveLength);
      var res = current.filter(function(w) {
        var lenOk = !preserveLength || Math.abs(word.length - w.length) < 2;
        return lenOk && !history.contains(w);
      });
      dbug && res.length && console.log('Found: ', res);
      return res;
    };

    // Sort by minEditDistance; pick random if med is equal
    var medShuffle = function(a, b) {
      var amed = RiTa.minEditDistance(word, a),
        bmed = RiTa.minEditDistance(word, b);
      //console.log(a,'=',amed,'\n',b,'=',bmed);
      return amed === bmed ? Math.random() - 0.5 : amed - bmed;
    };

    // 1. check for similars of same-length not in full-history
    var result = findSimilars(word, true, 1);

    // 2. check for similars of 1-off-length not in full-history
    if (!result.length) result = findSimilars(word, false, 2);

    // reduce the history size and retry
    if (!result.length) history.shorten(this.minHistorySize);

    // 3. check for similars of same-length in short-history
    if (!result.length) result = findSimilars(word, true, 3);

    // 4. check for similars of same-length in short-history
    if (!result.length) result = findSimilars(word, false, 4);

    // 5. give up, print warning, return a random word
    if (!result.length) return fail(this, 'no similarByLetter result');

    return result.sort(medShuffle);
  };
} // end class

if (typeof module != 'undefined' && module.exports) {
  module.exports = LexiconLookup;
}
