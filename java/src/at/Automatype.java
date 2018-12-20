package at;

import ddf.minim.*;
import processing.core.PApplet;
import rita.*;

public class Automatype extends PApplet {

	int maxWordLen = 7, minWordLen = 3;
	AudioSample bell, type;
	LexiconLookup lexLook;
	CursoredRiText word;
	WordTransformCell cell;

	public static void main(String[] args) {
		PApplet.main(new String[]{"at.Automatype"});
	}
	
	public void setup() {

		size(680, 490);

		RiText.createDefaultFont("Courier", 150);
		Minim minim = new Minim(this);
		bell = minim.loadSample("bell.wav");
		type = minim.loadSample("key.wav");

		lexLook = new LexiconLookup(this, 20);
		cell = new WordTransformCell(this, lexLook.getRandomWord(7), 0, 0, width, height, 1);
	}

	public void draw() {

		background(255);
		cell.draw(this);
	}

	public void onRiTaEvent(RiTaEvent re) {

		cell.nextEdit(lexLook);
	}

	public void playBell() {

		if (bell != null) bell.trigger();
	}

	public void playType() {

		if (type != null) type.trigger();
	}

}
