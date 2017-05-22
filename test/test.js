var assert = require('assert'),
  LexiconLookup = require('../automatype').LexiconLookup;

assert.undef = function(a) {
  assert(typeof a === 'undefined');
};

assert.equalAny = function(a, arr) {
  return arr.indexOf(a) > -1;
};

assert.setEqual = function(a, b) {
  a.sort();
  b.sort();
  return assert.deepEqual(a, b);
};

describe('HistoryQueue', function() {
  it('should provide basic fixed-sized history', function() {
    var history = new LexiconLookup().hq;
    history.add('a', 'b', 'c');
    assert.equal('a', history.oldest());
    assert.equal('c', history.newest());
    assert.equal(3, history.size());
    assert.equal(true, history.contains('a'));
    assert.equal(false, history.contains('d'));
    assert.equal('a', history.removeOldest());
    assert.equal(2, history.size());
    history.clear();
    assert.equal(0, history.size());
    history.add('a', 'b', 'c');
    assert.equal(3, history.size());
    assert.equal('a', history.oldest());
    assert.equal('c', history.newest());
    history.shorten(2);
    assert.equal(2, history.size());
    assert.equal(false, history.contains('a'));
    assert.equal(true, history.contains('b'));
    assert.equal(true, history.contains('c'));
  });
});

describe('LexiconLookup', function() {
  describe('#similarByLetter(word, minMed)', function() {
    it('should return words with med > minMed', function() {
      var ll = new LexiconLookup(), res;
      res = ll.lex.similarByLetter('mourner', 2, true);
      assert.setEqual(['journey', 'tourney', 'courier'], res);
    });
  });

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
      assert.setEqual(['flank', 'flask', 'flake', 'flaks', 'flaky'], res);
      res = ll.getInsertions('maze');
      assert.setEqual(['amaze'], res);
      res = ll.getInsertions('hype');
      assert.setEqual(['hyped', 'hyper', 'hypes'], res);
      res = ll.getInsertions('veil');
      assert.setEqual(['veils'], res);
    });
  });

  describe('#getDeletions(word)', function() {
    it('should return words with size word.length-1', function() {
      var ll = new LexiconLookup(), res;
      res = ll.getDeletions('wore');
      assert.setEqual(['ore', 'woe'], res);
      res = ll.getDeletions('plan');
      assert.setEqual(['pan'], res);
      res = ll.getDeletions('cake');
      assert.setEqual([], res);
    });
  });

  describe('#getInsertion(word)', function() {
    it('should return single words with size word.length+1', function() {

      var ll = new LexiconLookup(), res;
      res = ll.getInsertion('flak');
      assert.equal('flank' || 'flask', res);

      res = ll.getInsertion('maze');
      assert.equal('amaze', res);

      res = ll.getInsertion('hype');
      assert.equal('hyped', res);

      ll.hq.add('flank'); // with history
      for (var i = 0; i < 5; i++) {
        res = ll.getInsertion('flak');
        assert.equal('flask', res);
      }
    });
  });

  describe('#getDeletion(word)', function() {
    it('should return single word with size word.length-1', function() {
      var ll = new LexiconLookup(), res;
      res = ll.getDeletion('wore');
      assert.equal('ore' || 'woe', res);
      res = ll.getDeletion('plan');
      assert.equal('pan', res);
      res = ll.getDeletion('cake');
      assert.undef(res);

      ll.hq.add('ore'); // with history
      for (var i = 0; i < 5; i++) {
        res = ll.getDeletion('wore');
        assert.equal('woe', res);
      }
    });
  });

  describe('#mutations(word)', function() {
    it('should return closest mutations of input word', function() {
      var ll = new LexiconLookup(), res;

      res = ll.mutations('mourner', 2, true);
      assert.setEqual(['mourned'], res);

      ll.hq.add('mourned');
      res = ll.mutations('mourner', 2, true);
      assert.setEqual(['journey', 'tourney', 'courier'], res);

      res = ll.mutations('embarks');
      assert.setEqual(['embargo'], res);

      res = ll.mutations('comment');
      assert.setEqual(['commend'], res);

      res = ll.mutations('virgin');
      assert.setEqual(['margin', 'violin'], res);

      res = ll.mutations('churns');
      assert.setEqual(['chorus', 'church', 'mourns', 'spurns'], res);

      // checks in history ------------------------------
      ll.hq.add('margin');
      res = ll.mutations('virgin');
      assert.setEqual(['violin'], res);

      // checks case 5/6 ----------------------------------
      ll.hq.add('embargo');
      res = ll.mutations('embarks');
      assert.setEqual(['embassy'], res);

      // checks case 5/6 ----------------------------------
      ll.hq.add('violin');
      res = ll.mutations('virgin');
      assert.setEqual(
        [
          'airing',
          'airman',
          'biggie',
          'birdie',
          'darlin',
          'dioxin',
          'fibrin',
          'firing',
          'girlie',
          'herein',
          'heroin',
          'hiring',
          'jargon',
          'origin',
          'sprain',
          'strain',
          'tiring',
          'turgid',
          'urging',
          'vagina',
          'victim',
          'virile',
          'virtue',
          'vision',
          'wiring',
          'within'
        ],
        res
      );

      // checks case 3 ----------------------------------
      ll.hq.add('commend');
      for (var i = 0; i < 10; i++) {
        ll.hq.add(ll.randomWord(7));
      }
      res = ll.mutations('comment');
      assert.setEqual(['commend'], res);
    });
  });

  describe('#mutateWord(word)', function() {
    it('should return a close mutation of input word', function() {
      var ll = new LexiconLookup(), res;

      res = ll.mutateWord('mourner');
      assert.equalAny(['mourned'], res);

      res = ll.mutateWord('resting');
      assert.equalAny(
        ['renting', 'nesting', 'besting', 'vesting', 'testing', 'rusting'],
        res
      );

      res = ll.mutateWord('hosting');
      assert.equalAny(['costing', 'posting'], res);

      // case 2
      ll.hq.add('posting');
      res = ll.mutateWord('hosting');
      assert.equal('costing', res);

      // case 5/6
      ll.hq.add('mourned');
      res = ll.mutateWord('mourner');
      assert.equalAny(['journey', 'tourney', 'courier'], res);
    });
  });
});
