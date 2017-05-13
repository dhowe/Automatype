package at;

import processing.core.PApplet;
import rita.*;

public class CursoredRiText extends RiText implements RiTaEventListener
{   
    static RiTimer blinkTimer;
  
    RiText cursor;       
    private boolean showSelectionRect;
    float cursorW, cursorH;
    int cursorIdx = 3;

    public CursoredRiText(PApplet p, String txt)
    {
      this(p, txt, p.width/2f,p.height/2f);
    }
    
    public CursoredRiText(PApplet p, String txt, float x, float y) {
      super(p, txt, x, y);
      align(CENTER);
      cursor = new RiText(p, "|");
      /*showBoundingBox(Automatype1.BORDERED);
      System.out.println("bb="+isBoundingBoxVisible());*/
      cursor.align(CENTER);
      cursorW = cursor.textWidth();
      cursorH = cursor.textHeight();
      if (blinkTimer == null) // why static? they all blink together
        blinkTimer = new RiTimer(null, .4, "blink");
      blinkTimer.addListener(this);
    } 

    public void onRiTaEvent(RiTaEvent re) {
      if (re.getName().equals("blink"))
        blinkCursor();
    }       
    
    public void blinkCursor() {
      cursor.setVisible(!cursor.isVisible());
    }
    
    public void draw() {
      super.draw();
      float bx = (float)getBoundingBox().getX();
      bx += cursorIdx * cursor.textWidth()+2;//(2?) 
      cursor.setLocation(bx, y); 
    }
    
    public void replace(char c) {  
      next();
      backspace();  
      //System.out.println("DELETED, at "+this);
      insert(c);  
      next();
      //System.out.println("INSERTED, at "+this);
    }
    
    public void insert(char c) {
      insertCharAt(cursorIdx, c); 
    }
    
    public void backspace() {
      if (cursorIdx <= 0) return;
      previous();
      removeCharAt(cursorIdx);      
    }
        
    public void next() {
      moveCursorTo(cursorIdx+1);
    }
    
    public void previous() {
      //System.out.println("previous");
       moveCursorTo(cursorIdx-1);
    }
            
    public void moveCursorTo(int idx) {
      //System.out.println("CursoredRiText.moveCursorTo("+idx+")");
      cursorIdx = PApplet.constrain(idx, 0, length());
    }

    public String toString() {
      return "Cursored"+super.toString()+" cursorIdx="+cursorIdx;
    }

    public void render() 
    {
      if (this.hidden) return;
  
      if (this.image != null)
        drawBgImage();
  
      if (text == null || text.length() == 0)
        return;
  
      if (font != null)
        _pApplet.textFont(font);    
  
      _pApplet.textAlign(textAlignment); // OPT    
      
      // translate & draw at 0,0
      _pApplet.pushMatrix();  // --------------
                        
        if (is3D()) { 
          _pApplet.scale(scaleX, scaleY, scaleZ);
          _pApplet.rotateX(rotateX);
          _pApplet.rotateY(rotateY);
          _pApplet.rotateZ(rotateZ);
          _pApplet.translate((int)x, (int)y, (int)z);
        }
        else {
          _pApplet.translate((int)x, (int)y);
          _pApplet.scale(scaleX, scaleY);
          _pApplet.rotate(rotateZ);
        }
                 
        if (boundingBoxVisible) this.drawBoundingBox();
        
        //System.out.println(fillR+","+fillG+","+fillB+","+fillA);
        _pApplet.fill(fillR, fillG, fillB, fillA); 
        if (selected)
          _pApplet.fill(sFillR, sFillG, sFillB, sFillA);
        
        if (this.fontSize > 0)       
          _pApplet.textSize(fontSize);
        
        if (is3D()) 
          _pApplet.text(text.toString(), 0, 0, 0);
        else
          _pApplet.text(text.toString(), 0, 0);
      
        if (showSelectionRect) {
          _pApplet.fill(0, 0, 200, 32);   
          _pApplet.noStroke();
          _pApplet.rect(
            (cursorIdx * cursor.textWidth()) - textWidth()/2f,
            -cursor.textHeight()*.75f, cursor.textWidth(), 
            cursor.textHeight()
          );
        }
      
      _pApplet.popMatrix();  // --------------   
    }

    public void showSelection(boolean b)
    {
      this.showSelectionRect = b;
    }

}
