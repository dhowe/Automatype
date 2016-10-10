package at;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;

import processing.core.PApplet;
import rita.RiLexicon;
import rita.RiTa;
import rita.support.HistoryQueue;
import rita.support.MinEditDist;
import rita.support.RiRandomIterator;

public class LexiconLookup {
  
  static MinEditDist med = new MinEditDist();
     
  Map objectHistory;
  RiLexicon lexicon;
  int minHistorySize = 10;
  
  public LexiconLookup(PApplet p, int histSize) {  
    lexicon = new RiLexicon(p);        
    objectHistory = new HashMap();
    this.minHistorySize = histSize;
  }
 
  public String getDeletions(WordTransformCell cell)
  {
    String result = null;
    String word = cell.word.getText();    
    Set s = lexicon.singleLetterDeletes(word);
    HistoryQueue hq = getHistory(cell);
    Iterator it = new RiRandomIterator(s);
    while (it.hasNext())
    {
      String next = (String) it.next();
      if (!hq.contains(next)) {
        result = next;
        break;
      }      
    }
//System.out.println("Deletions("+word+")="+s);
    return result;
  }
  
  public String getInsertions(WordTransformCell cell)
  {
    String result = null;
    String word = cell.word.getText();    
    Set s = lexicon.singleLetterInsertions(word);
//System.out.println("Insertions("+word+")="+s);
    HistoryQueue hq = getHistory(cell);
    Iterator it = new RiRandomIterator(s);
    while (it.hasNext())
    {
      String next = (String) it.next();
      if (!hq.contains(next)) {
        result = next;
        break;
      }      
    }
    return result;
  }
  
  public String mutateWordWithTarget(WordTransformCell cell, String target) 
  {
    return mutateWord(cell.word.getText(), target, getHistory(cell));
  }
  
  public String mutateWord(WordTransformCell cell) 
  {
    return mutateWord(cell.word.getText(), getHistory(cell));
  }

  HistoryQueue getHistory(WordTransformCell cell) {
    HistoryQueue hq = (HistoryQueue)objectHistory.get(cell);
    if (hq == null) {
      hq = new HistoryQueue();
      hq.setAllowDuplicates(true);
      objectHistory.put(cell, hq);
    }
    return hq;
  }
  
  class StringCompare implements Comparator {
    private String target;
    public StringCompare(String targ) {
      this.target = targ;
    }
    public int compare(Object o1, Object o2) {
      int med1 = med.computeRaw((String)o1, target);
      int med2 = med.computeRaw((String)o2, target);      
      if (med1 == med2) return 0;
      return med1 < med2 ? -1 : 1;
    }    
  }
  
  public String mutateWord(String current, HistoryQueue history) 
  {   
    return mutateWord(current, null, history, new HashSet());
  }
  
  public String mutateWord(String current, String target, HistoryQueue history) 
  {   
    return mutateWord(current, null, history, new TreeSet(new StringCompare(target)));
  }

  public String mutateWord(String current, String target, HistoryQueue history, Set result) 
  {    
    // get some initial results 
    int med = lexicon.similarByLetter(current, result, true);    
/*    if (result instanceof SortedSet && target != null) {
      for (Iterator it = result.iterator(); it.hasNext();) {
        String s = it.next()+"";  
        System.out.println(s+" med="+LexiconLookup.med.computeRaw(s, target));        
      }
    }*/
    boolean constraintsRelaxed = false;    
    String nextWord = (result instanceof SortedSet) ?
        removeFirst(result) : removeRandom(result);
          
    // check it against the history
    W1: while (!history.isEmpty() && history.contains(nextWord)) 
    {
      if (result.size()<1) // only one result 
      {
        // pop extra words from history & retry
        if (history.size() > minHistorySize) {
          history.removeOldest();
          result.add(nextWord); // re-add & re-try
          continue W1;
        }          
        
        // relax constraints and retry
        if (!constraintsRelaxed) {
          
          constraintsRelaxed = true;            
          while (result.size() < 2) {
            relaxConstraints(current, result, ++med);  
          }
          nextWord = (result instanceof SortedSet) ?
            removeFirst(result) : removeRandom(result);          
          continue W1;
        }          
        
        // does this ever happen? yes
        System.err.println("[WARN] Found 1 result for: " + current+"->"+
          nextWord+", but its already in the history("+history.size()+"): "+history);
        
        nextWord = this.getRandomWord(current.length()); // only if PROD=true
      }
      history.removeOldest();        
      nextWord = (result instanceof SortedSet) ?
        removeFirst(result) : removeRandom(result);
    }      

    if (nextWord == null)
      throw new RuntimeException("Null word picked for: "+current); 
    
    return nextWord;    
  }

  private String removeFirst(Set result) {

    if (result == null || result.isEmpty())
      return null;
    return (String)result.iterator().next();
  }
    
  private String removeRandom(Set result) {
    String nextWord;
    nextWord = (String) RiTa.random(result);
    result.remove(nextWord);
    return nextWord;
  }


  void relaxConstraints(String current, Set result, int minMed) {
    // try some other lookups here...
//System.out.println("RELAXING CONSTRAINTS...");
    result.clear();
    while (result.size() < 1) {
      minMed = lexicon.similarByLetter(current, result, minMed, true);
//System.out.println("Trying "+current+ " w' increased med="+minMed);
      minMed++;
    }
//System.out.println("  MED("+minMed+") -> "+result);
  }

  public String getRandomWord(int len) {
    return lexicon.getRandomWord(len);
  }
  
  public String getRandomWord(int min, int max) {
    int len = min + (int) (Math.random()*(max-min));
    return getRandomWord(len);
  }
  
  public static void main2(String[] args) {
    String[] test = {"nappy", "dog", "hog", "sappi",  };
    LexiconLookup ll = new LexiconLookup(null, 10);
    Set s = new TreeSet(ll.new StringCompare("happy"));
    for (int i = 0; i < test.length; i++) {
      s.add(test[i]);
    }
    System.out.println(s);
  }
  
  public int totalCount(int minLength, int maxLength) {
    int count = 0;
    Iterator it = this.lexicon.iterator();
    while (it.hasNext()) {
      String next = (String) it.next();
      int len = next.length();
      if (len>=minLength && len<=maxLength)
        count++;
    }
    return count;
  }

    
  public static void main(String[] args) {
    
    int idx = 0;
    LexiconLookup ll = new LexiconLookup(null, 10);
    if (1==1) return;
    String start = ll.getRandomWord(6);
    System.out.println("start="+start);
    HistoryQueue hq = new HistoryQueue();
    while (++idx<20) { 
      start = ll.mutateWord(start, "though", hq);
      System.out.println(idx+") "+start+" med="+med.computeRaw(start, "though"));
    }    
  }


}// end
