var assert = require('assert');
var LexiconLookup = require('../lookup');
//var LexiconLookup = lookup.LexiconLookup;

assert.undef = function(a) {
  assert(typeof a === 'undefined');
}

describe('LexiconLookup', function() {

  describe('#randomWord(n)', function() {
    it('should return a word of length n', function() {
      var ll = new LexiconLookup();
      for (var i = 0; i < 5; i++) {
        var word = ll.randomWord(5);
        assert.equal(5, word.length);
      }
    });
  });

  describe('#getInsertions(word)', function() {
    it('should return words with size word.length+1', function() {
      var ll = new LexiconLookup(), res;
      res = ll.getInsertions('flak');
      assert.deepEqual(["flank", "flask"], res);
      res = ll.getInsertions('maze');
      assert.deepEqual(["amaze"], res);
      res = ll.getInsertions('hype');
      assert.deepEqual([], res);
    });
  });

  describe('#getDeletions(word)', function() {
    it('should return words with size word.length-1', function() {
      var ll = new LexiconLookup(), res;
      res = ll.getDeletions('wore');
      assert.deepEqual(["ore", "woe"], res);
      res = ll.getDeletions('plan');
      assert.deepEqual(["pan"], res);
      res = ll.getDeletions('cake');
      assert.deepEqual([], res);
    });
  });

  describe('#getInsertion(word)', function() {
    it('should return single words with size word.length+1', function() {
      var ll = new LexiconLookup(), res;
      res = ll.getInsertion('flak');
      assert.equal("flank" || "flask", res);
      res = ll.getInsertion('maze');
      assert.equal("amaze", res);
      res = ll.getInsertion('hype');
      assert.undef(res);
    });
  });

  describe('#getDeletion(word)', function() {
    it('should return single words with size word.length-1', function() {
      var ll = new LexiconLookup(), res;
      res = ll.getDeletion('wore');
      assert.equal("ore" || "woe", res);
      res = ll.getDeletion('plan');
      assert.equal("pan", res);
      res = ll.getDeletion('cake');
      assert.undef(res);
    });
  });

  describe('#mutateWord(word)', function() {
    it('should return single words with size word.length', function() {
      var ll = new LexiconLookup(), res;

      res = ll.mutateWord('wore');
      assert.equal("ore" || "woe", res);

      res = ll.mutateWord('mien');
      assert.equal("min", res);
      res = ll.mutateWord('envy');
      assert.equal("envoy", res);
    });
  });

  // describe('#mutations(word)', function() {
  //   it('should return single words with size word.length', function() {
  //     var ll = new LexiconLookup(), res;
  //     res = ll.mutations('wore');
  //     assert.deepEqual(["ore", "woe"], res);
  //     res = ll.mutations('plan');
  //     assert.deepEqual(["pan"], res);
  //     res = ll.mutations('cake');
  //     assert.deepEqual([], res);
  //   });
  // });
});
