package at;

import java.awt.Rectangle;
import java.util.concurrent.*;

import processing.core.PApplet;
import rita.*;

class WordTransformCell
{
  static float INITIAL_KEY_PAUSE = .8f, REPLACE_PAUSE = 1.6f, SUCCESS_PAUSE = .8f; // FAST-MODE
  static final int REPLACE_ACTION = 1, DELETE_ACTION = 2, INSERT_ACTION = 3;
    
  float x, y;
  char nextChar;
  boolean readyForReplace, firstWord = true;
  int id, nextCursPos, nextAction = REPLACE_ACTION;
  RiText target, bg;
  CursoredRiText word;
  Automatype parent;
  ScheduledExecutorService threads; // static??
  ScheduledFuture scheduledFuture;

  WordTransformCell(Automatype p, String word1, Rectangle r, int id)
  {
    this(p, word1, r.x, r.y, r.width, r.height, id);
  }
  
  WordTransformCell(Automatype audioTest, String word1, float x, float y, float w, float h, int id)
  {
    //System.out.println("WordTransformCell: "+x+","+y+","+w+","+h+","+id);
    
    this.x = x;
    this.y = y;
    this.id = id;
    this.parent = audioTest;
    this.word = new CursoredRiText(audioTest, word1);
    this.word.setLocation(x + w/2, y + (h  * .6f));
    this.target = new RiText(audioTest);
    this.target.fill(0, 0, 0, 0);
    this.bg = new RiText(audioTest);
    this.bg.fill(255); // hack for bg fades
    RiTa.setCallbackTimer(parent, getTimerName(), INITIAL_KEY_PAUSE);
  }
 
  void draw(PApplet p)
  {
      float[] bgfill = bg.getColor();
      p.fill(bgfill[0], bgfill[1], bgfill[2], bgfill[3]);
      p.noStroke();
      p.rect(x, y, p.width, p.height);
  }

  void nextEdit(LexiconLookup ll)
  {
    if (target.length() < 1)
    {
      pickNextTarget(ll);
      
      // parent.onWordCompletion(target.getText());
      
      findNextEdit();
      return;
    }

    switch (nextAction)
    {
      case DELETE_ACTION:
        doInsertOrDelete(false);
        break;
      case INSERT_ACTION:
        doInsertOrDelete(true);
        break;
      default: // REPLACE
        doReplace();
    }
  }

  private void onWordCompletion()
  {
    firstWord = false;
    target.setText(""); // empty

    bg.fill(0);
    word.fill(255);
    
    parent.playBell();
    
    bg.fadeColor(255, SUCCESS_PAUSE);
    word.fadeColor(0, SUCCESS_PAUSE);
  }

  private void doInsertOrDelete(boolean isInsert)
  {
    // System.out.println("DeleteAction: curr="+word.cursorIdx+" next="+nextCursPos);
    if (nextCursPos > word.cursorIdx)
    { // forward
      word.next();
      parent.playType();
    }
    else if (nextCursPos < word.cursorIdx)
    { // back
      word.previous();
      parent.playType();
    }
    else
    { // in position
      if (isInsert)
        word.insert(nextChar);
      else
        word.backspace();

      if (word.getText().equals(target.getText()))
      {
        onWordCompletion();
      }
      else
      {
        // pause the timer
        RiTa.pauseCallbackTimer(getPApplet(), getTimerName(), REPLACE_PAUSE);
        findNextEdit(); // pause on replace
      }
    }
  }

  private void doReplace()
  {
    if (nextCursPos > word.cursorIdx + 1)
    { 
      // forward
      word.showSelection(false);
      word.next();
      parent.playType();
    }
    else if (nextCursPos < word.cursorIdx + 1)
    {
      // back
      word.showSelection(false);
      word.previous();
      if (nextCursPos != word.cursorIdx + 2) {
        parent.playType();
      }
    }
    else if (!readyForReplace) // in position
    {
      readyForReplace = true;
      word.showSelection(true);
    }
    else
    {
      readyForReplace = false;
      word.showSelection(false);
      word.replace(nextChar);

      if (word.getText().equals(target.getText()))
      {
        onWordCompletion();
      }
      else
      {
          RiTa.pauseCallbackTimer(getPApplet(), getTimerName(), REPLACE_PAUSE);
        
        findNextEdit(); // pause on replace
      }
    }
  }

  private void pickNextTarget(LexiconLookup lexLook)
  {
    // String tmpHist = lexLook.getHistory(this)+"";
    String next = null;

    //if (DO_DELETIONS)
    {
      double prob = Math.max(0, word.length() - parent.minWordLen) * .1;
      if (Math.random() < prob)
        next = lexLook.getDeletions(this);
      
      if (next != null)
      {
        nextAction = DELETE_ACTION;
        // System.out.println("DELETE: next="+next+" curr="+word.cursorIdx);
      }
    }

    if (next == null)// && DO_INSERTIONS)
    {
      double prob = Math.max(0, parent.maxWordLen - word.length()) * .1;
      if (Math.random() < prob)
        next = lexLook.getInsertions(this);
      if (next != null)
      {
        nextAction = INSERT_ACTION;
      }
    }
    
    if (next == null)
    {
      nextAction = REPLACE_ACTION;
      next = lexLook.mutateWord(this);
    }

    // add to history and set target text
    lexLook.getHistory(this).add(next);
    target.setText(next);

    float pause = SUCCESS_PAUSE;
    if (firstWord)
      pause = id + .1f; // start cells staggered
    RiTa.pauseCallbackTimer(getPApplet(), getTimerName(), pause);
  
  }

  void findNextEdit()
  {
    int cursIdx = word.cursorIdx;
    if (cursIdx == word.length())
      word.moveCursorTo(0);

    String curr = word.getText();
    String next = target.getText();

    int minLength = Math.min(curr.length(), next.length());
    while (cursIdx >= minLength)
      cursIdx--;

    if (curr.length() == next.length() + 1) // delete
      positionForDelete(curr, next);
    else if (curr.length() == next.length() - 1) // insert
      positionForInsert(curr, next);
    else
      positionForReplace(cursIdx, curr, next);      // replace
  }

  private void positionForReplace(int cursIdx, String current, String next)
  {
    int numChecks = 0;
    char a = current.charAt(cursIdx);
    char b = next.charAt(cursIdx);
    while (a == b && numChecks++ <= current.length())
    {
      if (++cursIdx == current.length())
        cursIdx = 0;
      a = current.charAt(cursIdx);
      b = next.charAt(cursIdx);
    }
    nextCursPos = cursIdx + 1;
    nextChar = b;
  }

  private void positionForDelete(String current, String next)
  {
    int idx = 0;
    for (; idx < next.length(); idx++)
    {
      char a = current.charAt(idx);
      char b = next.charAt(idx);
      if (a != b)
        break;
    }
    nextCursPos = idx + 1;
    nextChar = (char) DELETE_ACTION;
  }

  private void positionForInsert(String current, String next)
  {
    int idx = 0;
    char result = '~';
    for (; idx < current.length(); idx++)
    {
      char a = current.charAt(idx);
      char b = next.charAt(idx);
      if (a != b)
      {
        result = b;
        break;
      }
    }
    if (result == '~')
    {
      System.out.println("TAKING last char!!");
      result = next.charAt(idx);
    }
    nextCursPos = idx;
    nextChar = result;
  }

  private void onNewWordTarget()
  {
    target.x = word.x;
    target.y = word.y + 60;
    target.setAlpha(0);
    float[] tcol = target.getColor();
    tcol[3] = 0; // fade-in
    target.fadeColor(tcol, SUCCESS_PAUSE);
  }

  private String getTimerName()
  {
    return "update-"+id;
  }

  private PApplet getPApplet()
  {
    return word.getPApplet();
  }


}// end
