var RiTa, RiLexicon;

if (typeof module != 'undefined') {
  RiTa = require('rita');
  RiLexicon = RiTa.RiLexicon;
}

function Automatype() {

  this.char = '|';
  this.cursor = 3;
  this.lex = new LexiconLookup();
  this.width = textWidth(this.char);

  word = this.lex.randomWord(Math.round(maxWordLen - minWordLen/2));

  this.draw = function() {
    text(this.char, this.offset(), height / 2);
  };

  this.step = function() {

    //console.log('step: ', 'current='+this.cursor, 'next='+this.nextPos);
    if (this.nextPos < this.cursor) {
      //console.log('move left');
      this.cursor--; // move left

    } else if (this.nextPos > this.cursor) {
      //console.log('move right');
      this.cursor++; // move right

    } else {

      //console.log('replace');
      this.doAction();
      if (word === target) {
        target = undefined;
        bg = 100;
      } else {
        this.findNextEdit();
      }
    }
  };

  this.doAction = function() {

    switch (nextAction) {
      case DELETE_ACTION:
        word = word.substring(0, this.cursor - 1) +
          word.substring(this.cursor);
        break;
      case INSERT_ACTION:
        word = word.substring(0, this.cursor) +
          this.nextChar + word.substring(this.cursor);
        break;
      default:  // REPLACE
        word = word.substring(0, this.cursor - 1) +
          this.nextChar + word.substring(this.cursor);
    }
  };

  this.offset = function() {

    return width/2 - textWidth(word)/2 + (this.cursor * this.width);
  };

  this.pickNextTarget = function() {

    var next, prob;

    // try deletions
    if (!next) {
      prob = max(0, word.length - minWordLen) * 0.1;
      if (Math.random() < prob) {
        nextAction = DELETE_ACTION;
        next = this.lex.getDeletion(word);
        //next && console.log('DELETE');
      }
    }

    // try insertions
    if (!next) {
      prob = max(0, maxWordLen - word.length) * 0.1;
      if (Math.random() < prob) {
        nextAction = INSERT_ACTION;
        next = this.lex.getInsertion(word);
        //next && console.log('INSERT');
      }
    }

    // try mutations
    if (!next) {
      nextAction = REPLACE_ACTION; // is this always true??
      next = this.lex.mutateWord(word);
    }

    // add to hq and set target text
    this.lex.addToHistory(next);
    target = next;

    console.log(target+'('+RiTa.minEditDistance(word, target)+')');
  };

  this.findNextEdit = function() {

    if (target) {
      var minLength = Math.min(word.length, target.length);
      while (this.cursor >= minLength) { // if cursor is past end of word
        console.log('WALK BACK');
        this.cursor--;
      }
    }

    if (word.length === target.length + 1) {      // delete
      this.positionForDelete(word, target);
    } else if (word.length === target.length - 1) { // insert
      this.positionForInsert(word, target);
    } else {
      this.positionForReplace(this.cursor, word, target); // replace
    }
  };

  this.positionForDelete = function(current, next) {
    var idx = 0, a, b;
    for (; idx < next.length; idx++) {
      a = current.charAt(idx);
      b = next.charAt(idx);
      if (a !== b) break;
    }
    this.nextPos = idx + 1;
    this.nextChar = DELETE_ACTION;
  };

  this.positionForInsert = function(current, next) {
    var idx = 0, result = '~', a, b;
    for (; idx < current.length; idx++) {
      a = current.charAt(idx);
      b = next.charAt(idx);
      if (a !== b) {
        result = b;
        break;
      }
    }
    if (result === '~') {
      console.warn('TAKING last char!!');
      result = next.charAt(idx);
    }
    this.nextPos = idx;
    this.nextChar = result;
  };

  this.positionForReplace = function(cursIdx, current, next) {

    var numChecks = 0, a = current.charAt(cursIdx),
      b = next.charAt(cursIdx);

    while (a === b && numChecks++ <= current.length) {
      if (++cursIdx === current.length) cursIdx = 0;
      a = current.charAt(cursIdx);
      b = next.charAt(cursIdx);
    }
    this.nextPos = cursIdx + 1;
    this.nextChar = b;
    //console.log('positionForReplace', this.nextChar,
      //'current='+cursIdx, 'next='+this.nextPos);
  };

} // end class

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

  this.dbug = false;
  this.lex = new RiLexicon();
  this.hq = new HistoryQueue(20);
  this.minHistorySize = 10;

  this.addToHistory = function(word) {
    this.hq.add(word);
  };

  this.randomWord = function(len) {
    // TODO: fix me
    var w = this.lex.randomWord();
    while (w.length !== len) {
      w = this.lex.randomWord();
    }
    this.addToHistory(w); // ?
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
    for (var i = 0; i <= len; i++) {
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

  // TODO: make sure we have tests for each below
  // a. check similars not in history (med=1)
  // b. compact history and retry
  // c. check similars with med relaxed (med=2..n)
  // d. check similars with any length
  // e. pick random
  this.mutations = function(word) {
    var result,
      dbug = this.dbug,
      med = 1,
      history = this.hq,
      tmp = this.lex.similarByLetter(word, med, true);

    var notInHistory = function(w) {
      return !history.contains(w);
    };

    var fail = function(ll, m) {
      console.error(
        "[WARN] similarByLetter failed for '" + word + "';",
        m + '\n',
        this.hq
      );
      //throw Error();
      return [ll.randomWord(word.length)];
    };

    // Sort by minEditDistance; pick random if med is equal
    var medShuffle = function(a, b) {
      var amed = RiTa.minEditDistance(word, a),
        bmed = RiTa.minEditDistance(word, b);
      //console.log(a,'=',amed,'\n',b,'=',bmed);
      return amed === bmed ? Math.random() - 0.5 : amed - bmed;
    };

    dbug && console.log('\n1. Try(' + word + '): ', tmp);

    if (tmp.length) {
      med = RiTa.minEditDistance(tmp[0], word);
      dbug && console.log('Found (med=' + med + ')', tmp);

      // try for similars not in history
      result = tmp.filter(notInHistory);
      dbug && console.log('2. Filter(' + word + '): ', result);

      if (!result.length) { // no result, compact history, retry
        history.shorten(this.minHistorySize);
        result = tmp.filter(notInHistory);
        dbug && console.log('4. Compacted-filter (' + word + '): ', result);
      }
    }

    // no result, relax our med constraints until we find something
    while (!result.length && med < word.length) {
      tmp = this.lex.similarByLetter(word, ++med, true);
      dbug && console.log('5. Relaxing(' + word + ')(' + med + ') ->', tmp);
      if (tmp.length) {
        result = tmp.filter(notInHistory);
        dbug && console.log('6. Filtered (' + word + ')(' + med + ')', result);
      }
    }

    if (!result.length) {
      // give up, print warning, pick a random word -- needed ??
      result = this.lex.similarByLetter(word, med, false).filter(notInHistory);
      console.log('7. Any-length(' + word + '): ', result);
    }

    return result.length
      ? result.sort(medShuffle)
      : fail(this, '8. *** fail->random(' + word + '):');
  };

} // end class

if (typeof module != 'undefined' && module.exports) {
  module.exports.LexiconLookup = LexiconLookup;
  module.exports.Automatype = Automatype;
}
