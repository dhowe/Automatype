var RiTa, RiLexicon;
const DEFCOL = [0,0,0];
// NEXT:
// When ok, then run writeLiveEdges 100000
// Then check/run writeAllMeds[1,2,3]

if (typeof module != 'undefined' && !process.versions.hasOwnProperty('electron')) {
  //RiTa = require('rita');
  RiTa = require('./lib/rita-full');
  RiLexicon = RiTa.RiLexicon;
}

function Automatype(wordCompleteCallback) {

  var REPLACE_ACTION = 1,
    DELETE_ACTION = 2,
    INSERT_ACTION = 3;

  this.cursor = 3;
  this.lastMed = -1;
  this.minWordLen = 3;
  this.maxWordLen = 7;
  this.highlight = false;
  this.lex = new LexiconLookup();
  this.cursorWidth = textWidth('|');
  this.cursorHeight = textAscent() + textDescent();
  this.word = this.lex.randomWord(Math.round(this.minWordLen + (this.maxWordLen - this.minWordLen) / 2));

  //console.log(this.word);

  this.draw = function (rgb) {

    if (!rgb || rgb.length != 3) {
      console.log('default bg: '+bg);
      rgb = [255 - bg, 255 - bg, 255 - bg];
    }
    fill(rgb[0],rgb[1],rgb[2]);
    text(this.word, width / 2, height / 2);

    if (this.highlight) {

      noStroke();
      fill(0, 0, 200, 32);
      rect(this.offset(), height / 2 - this.cursorHeight / 2,
        -this.cursorWidth, this.cursorHeight);

    } else {

      if ((millis() - this.cursorLastMove) % 800 < 400) {
        fill(0);
        text('|', this.offset(), height / 2); // fix to #7
      }
    }
  };

  this.step = function () {
    this.cursorLastMove = millis();

    if (!this.target) {
      typer.pickNextTarget(); // this?
      typer.findNextEdit(); // this?
    }

    if (this.nextPos < this.cursor) {

      this.cursor--; // move left
      this.highlight = false;
      //type.play(); // #17
      onActionComplete();

    } else if (this.nextPos > this.cursor) {

      this.cursor++; // move right
      this.highlight = false;
      //type.play(); // #17
      onActionComplete();

    } else if (!this.highlight && this.nextAction === REPLACE_ACTION) {

      this.highlight = true; // fix to #8, #3
      return; // no type sound, only highlight

    } else {

      this.highlight = false;
      this.doAction();

      if (this.word === this.target) {

        this.target = undefined;
        onActionComplete(this.word, this.lastMed);

      } else {

        this.findNextEdit();
      }
    }
  };

  this.doAction = function () {

    switch (this.nextAction) {
    case DELETE_ACTION:
      this.word = this.word.substring(0, this.cursor - 1) +
        this.word.substring(this.cursor);
      if (this.cursor > this.word.length) { // fix to #5
        this.cursor--;
      }
      break;
    case INSERT_ACTION:
      this.word = this.word.substring(0, this.cursor) +
        this.nextChar + this.word.substring(this.cursor);
      this.cursor++;
      break;
    case REPLACE_ACTION:
      this.word = this.word.substring(0, this.cursor - 1) +
        this.nextChar + this.word.substring(this.cursor);
      break;
    }
  };

  this.offset = function () {

    return width / 2 - textWidth(this.word) / 2 + (this.cursor * this.cursorWidth);
  };

  this.pickNextTarget = function () {

    var result, prob;

    // try deletions
    if (!result) {
      prob = Math.max(0, this.word.length - this.minWordLen) * 0.1;
      if (Math.random() < prob) {
        this.nextAction = DELETE_ACTION;
        result = this.lex.getDeletion(this.word);
      }
    }

    // try insertions
    if (!result) {
      prob = Math.max(0, this.maxWordLen - this.word.length) * 0.1;
      if (Math.random() < prob) {
        this.nextAction = INSERT_ACTION;
        result = this.lex.getInsertion(this.word);
      }
    }

    // try mutations
    if (!result) {
      this.nextAction = REPLACE_ACTION; // is this always true??
      result = this.lex.mutateWord(this.word);

      // this should very rarely, if ever happen
      if (this.word.length != result.length) {
        this.nextAction = this.word.length < result.length ? INSERT_ACTION : DELETE_ACTION;
        console.error("[WARN] Non-equal-length mutation: " +
          (this.word + '->' + result + ' ' + this.nextAction));
      }
    }

    // add to hq and set this.target text
    this.lex.addToHistory(result);

    if (this.word) this.lastMed = RiTa.minEditDistance(this.word, result);

    this.target = result;

    //console.log(this.target +'('+RiTa.minEditDistance(this.word, this.target)+')');
  };

  this.findNextEdit = function () {
    if (this.target) {
      var minLength = Math.min(this.word.length, this.target.length);
      while (this.cursor >= minLength) { // if cursor is past end of word
        this.cursor--;
      }
    }
    if (this.word.length === this.target.length + 1) { // delete
      this.positionForDelete(this.word, this.target);
    } else if (this.word.length === this.target.length - 1) { // insert
      this.positionForInsert(this.word, this.target);
    } else {
      this.positionForReplace(this.cursor, this.word, this.target); // replace
    }
  };

  this.positionForDelete = function (current, next) {
    var idx = 0,
      a, b;
    for (; idx < next.length; idx++) {
      a = current.charAt(idx);
      b = next.charAt(idx);
      if (a !== b) break;
    }
    this.nextPos = idx + 1;
    this.nextChar = DELETE_ACTION;
  };

  this.positionForInsert = function (current, next) {
    var idx = 0,
      result = '~',
      a, b;
    for (; idx < current.length; idx++) {
      a = current.charAt(idx);
      b = next.charAt(idx);
      if (a !== b) {
        result = b;
        break;
      }
    }
    if (result === '~') {
      //console.warn('TAKING last char!!');
      result = next.charAt(idx);
    }
    this.nextPos = idx;
    this.nextChar = result;
  };

  this.positionForReplace = function (cursIdx, current, next) {

    var numChecks = 0,
      a = current.charAt(cursIdx),
      b = next.charAt(cursIdx);

    while (a === b && numChecks++ <= current.length) {
      if (++cursIdx === current.length) cursIdx = 0;
      a = current.charAt(cursIdx);
      b = next.charAt(cursIdx);
    }
    this.nextPos = cursIdx + 1;
    this.nextChar = b;
  };
}

function HistoryQueue(sz) {
  this.q = [];
  this.capacity = sz;
  this.add = function () {
    for (var i = 0; i < arguments.length; i++) {
      this.q.push(arguments[i]);
    }
    while (this.q.length > this.capacity) {
      this.q.shift();
    }
  };
  this.contains = function (w) {
    return this.q.indexOf(w) > -1;
  };
  this.newest = function () {
    return this.q[this.q.length - 1];
  };
  this.removeOldest = function () {
    return this.q.shift();
  };
  this.empty = function () {
    return this.q.length > 0;
  };
  this.oldest = function () {
    return this.q[0];
  };
  this.size = function () {
    return this.q.length;
  };
  this.indexOf = function (e) {
    return this.q.indexOf(e);
  };
  this.shorten = function (n) {
    while (this.q.length > n) {
      this.removeOldest();
    }
    return this;
  };
  this.clear = function () {
    this.q = [];
    return this;
  };
}

function LexiconLookup() {

  this.dbug = 0;
  this.hq = new HistoryQueue(20);
  this.rlex = new RiLexicon();
  this.minHistorySize = 10;

  this.wordExists = function(test) {
    return this.rlex.data.hasOwnProperty(test);
  };

  this.addToHistory = function (w) {
    this.hq.add(w);
  };

  this.randomWord = function (len) {
    // TODO: fix me
    var w = this.rlex.randomWord();
    while (w.length !== len) {
      w = this.rlex.randomWord();
    }
    this.addToHistory(w); // ?
    return w;
  };

  this.getDeletion = function (input) {
    var result = this.getDeletions(input);
    var start = Math.floor(Math.random()*result.length);
    for (var i = start; i < result.length+start; i++) {
      var idx = i % result.length;
      if (!this.hq.contains(result[idx])) {
        return result[idx];
      }
    }
  };

  this.getDeletions = function (input) {
    var result = [],
      len = input.length;
    for (var i = 0; i < len; i++) {
      var pre = input.substring(0, i),
        post = input.substring(i + 1);
      if (this.wordExists(pre + post)) {
        result.push(pre + post);
      }
    }
    return result;
  };

  this.getInsertions = function (input) {
    var result = [],
      len = input.length;
    for (var i = 0; i <= len; i++) {
      var pre = input.substring(0, i),
        post = input.substring(i);
      for (var j = 0; j < 26; j++) {
        var sub = String.fromCharCode(j + 97);
        var test = pre + sub + post;
        if (this.wordExists(test)) {
          //if ((sub != 's' && sub != 'e') || post.length > 0) {
            result.push(test);

          //else console.log("SKIP", test, pre, sub, post);
        }
      }
    }
    return result;
  };

  this.getInsertion = function (input) {
    var result = this.getInsertions(input);
    var start = Math.floor(Math.random()*result.length);
    for (var i = start; i < result.length+start; i++) {
      var idx = i % result.length;
      if (!this.hq.contains(result[idx])) {
        return result[idx];
      }
    }
  };

  this.mutateWord = function (current) {
    return this.mutations(current)[0];
  };

  // TODO: make sure we have tests for each below
  // a. check similars not in history (med=1)
  // b. compact history and retry
  // c. check similars with med relaxed (med=2..n)
  // d. check similars with any length
  // e. pick random
  this.mutations = function (input) {
    var result,
      med = 1,
      dbug = this.dbug,
      history = this.hq,
      tmp = this.rlex.similarByLetter(input, med, true);

    var notInHistory = function (w) { return !history.contains(w) };

    var fail = function (ll, m) {
      console.error(
        "[WARN] similarByLetter failed for '" + input + "';",
        m + '\n',
        this.hq
      );
      //throw Error();
      return [ll.randomWord(input.length)];
    };

    // Sort by minEditDistance; pick random if med is equal
    var medShuffle = function (a, b) {
      var amed = RiTa.minEditDistance(input, a),
        bmed = RiTa.minEditDistance(input, b);
      //console.log(a,'=',amed,'\n',b,'=',bmed);
      return amed === bmed ? Math.random() - 0.5 : amed - bmed;
    };

    dbug && console.log('\n1. Try(' + input + '): ', tmp);

    if (tmp.length) {
      med = RiTa.minEditDistance(tmp[0], input);
      dbug && console.log('Found (med=' + med + ')', tmp);

      // try for similars not in history
      result = tmp.filter(notInHistory);
      dbug && console.log('2. Filter(' + input + '): ', result);

      if (!result.length) { // no result, compact history, retry
        history.shorten(this.minHistorySize);
        result = tmp.filter(notInHistory);
        dbug && console.log('4. Compacted-filter (' + input + '): ', result);
      }
    }

    // no result, relax our med constraints until we find something
    while (!result.length && med < input.length) {
      tmp = this.rlex.similarByLetter(input, ++med, true);
      dbug && console.log('5. Relaxing(' + input + ')(' + med + ') ->', tmp);
      if (tmp.length) {
        result = tmp.filter(notInHistory);
        dbug && console.log('6. Filtered (' + input + ')(' + med + ')', result);
      }
    }

    if (!result.length) {
      // allow words of different length
      result = this.rlex.similarByLetter(input, med, false).filter(notInHistory);
      console.error('[WARN] 7. Any-length(' + input + '): ', result);
    }

    return result.length ?
      result.sort(medShuffle) : // give up, print warning, pick random
      fail(this, '8. *** fail->random(' + input + '):');
  };

}

if (typeof module != 'undefined' && module.exports) {
  module.exports.LexiconLookup = LexiconLookup;
  module.exports.Automatype = Automatype;
}
