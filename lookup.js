var RiTa, RiLexicon;

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
  this.indexOf = function(e) { return this.q.indexOf(e); }
  this.shorten = function(n) { while (this.q.length > n) this.removeOldest(); }
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

    return RiTa.randomItem(this.mutations(current));
  }

  this.mutations = function(word) {

    var fail = function(m) {
      console.error('[WARN] similarByLetter failed for '+word, m);
      if (1) throw Error();
      return [ this.randomWord(word.length) ];
    }

    // Sort by minEditDistance; pick random if med is equal
    var medShuffle = function(a, b) {
      var amed = RiTa.minEditDistance(word, a),
        bmed = RiTa.minEditDistance(word, b);
      //console.log(a,'=',amed,'\n',b,'=',bmed);
      return (amed === bmed) ? Math.random()-.5 : amed - bmed;
    }

    var history = this.hq;

    // 1. check for similars of same-length not in full-history
    var current = this.lex.similarByLetter(word, 1, true);
    var good = current.filter(function(w) {
      return !history.contains(w);
    });

    // 2. check for similars of 1-off-length not in full-history
    if (!good.length) {
      console.log('Trying 2: ',word);
      current = this.lex.similarByLetter(word, 1, false);
      good = current.filter(function(w) {
        return !history.contains(w) && Math.abs(word.length - w.length) < 2;
      });
      console.log('FOUND: ',good);
    }

    // 3. check for similars of same-length not in short-history
    if (!good.length) {
      console.log('Trying 3: ',word);
      good = current.filter(function(w) {
        return history.indexOf(w) < this.minHistorySize;
      });
    }

    // 4. check for similars of 1-off-length not in short-history
    if (!good.length) {
      console.log('Trying 4: ',word);
      good = current.filter(function(w) {
        return history.indexOf(w) < this.minHistorySize;
      });
    }

    return good.sort(medShuffle) || fail('no similarByLetter result');
  }

}// End class

if (typeof module != 'undefined' && module.exports) { // for node

  module.exports = LexiconLookup;
  //   LexiconLookup: LexiconLookup,
  //   HistoryQueue: HistoryQueue
  // }
}
