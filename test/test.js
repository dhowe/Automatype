var assert = require('assert');
var LexiconLookup = require('../lookup');

assert.undef = function (a) {
  assert(typeof a === 'undefined');
}

assert.setEqual = function (a, b) {
  a.sort();
  b.sort();
  return assert.deepEqual(a, b);
}

describe('LexiconLookup', function () {

  describe('#randomWord(n)', function () {
    it('should return a word of length n', function () {
      var ll = new LexiconLookup();
      for (var i = 0; i < 5; i++) {
        var word = ll.randomWord(5);
        assert.equal(5, word.length);
      }
    });
  });

  describe('#getInsertions(word)', function () {
    it('should return words with size word.length+1', function () {
      var ll = new LexiconLookup(),
        res;
      res = ll.getInsertions('flak');
      assert.setEqual([ "flank", "flask" ], res);
      res = ll.getInsertions('maze');
      assert.setEqual([ "amaze" ], res);
      res = ll.getInsertions('hype');
      assert.setEqual([], res);
    });
  });

  describe('#getDeletions(word)', function () {
    it('should return words with size word.length-1', function () {
      var ll = new LexiconLookup(),
        res;
      res = ll.getDeletions('wore');
      assert.setEqual([ "ore", "woe" ], res);
      res = ll.getDeletions('plan');
      assert.setEqual([ "pan" ], res);
      res = ll.getDeletions('cake');
      assert.setEqual([], res);
    });
  });

  describe('#getInsertion(word)', function () {
    it('should return single words with size word.length+1', function () {
      var ll = new LexiconLookup(),
        res;
      res = ll.getInsertion('flak');
      assert.equal("flank" || "flask", res);
      res = ll.getInsertion('maze');
      assert.equal("amaze", res);
      res = ll.getInsertion('hype');
      assert.undef(res);

      ll.hq.add("flank"); // with history
      for (var i = 0; i < 5; i++) {
        res = ll.getInsertion('flak');
        assert.equal("flask", res);
      }
    });
  });

  describe('#getDeletion(word)', function () {
    it('should return single words with size word.length-1', function () {
      var ll = new LexiconLookup(),
        res;
      res = ll.getDeletion('wore');
      assert.equal("ore" || "woe", res);
      res = ll.getDeletion('plan');
      assert.equal("pan", res);
      res = ll.getDeletion('cake');
      assert.undef(res);

      ll.hq.add("ore"); // with history
      for (var i = 0; i < 5; i++) {
        res = ll.getDeletion('wore');
        assert.equal("woe", res);
      }
    });
  });

  describe('#mutations(word)', function () {
    it('should return closest mutations of input word', function () {
      var ll = new LexiconLookup(),
        res;

      res = ll.mutations('virgin');
      assert.setEqual([ "margin", "violin" ], res);

      res = ll.mutations('churns');
      assert.setEqual([ 'chorus', 'church', 'mourns', 'spurns' ], res);

      ll.hq.add("margin");
      res = ll.mutations('virgin');
      assert.setEqual([ "violin" ], res);

      ll.hq.add("violin");
      res = ll.mutations('virgin');
      assert.setEqual([ 'vigil' ], res);

    });
  });

  /*describe('#mutateWord(word)', function() {
    it('should return a close mutation of input word', function() {
      var ll = new LexiconLookup(), res;

      res = ll.mutateWord('wore');
      assert.equal("ore" || "woe", res);

      res = ll.mutateWord('mien');
      assert.equal("min", res);
      res = ll.mutateWord('envy');
      assert.equal("envoy", res);
    });
  });*/
});
