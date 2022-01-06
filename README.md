# Automatype

From shadoof's [pr24](https://github.com/dhowe/Automatype/pull/24)

###Linked Automa(type) RofVN pseudocode

following on from this demograph branch of Automatype:

    prep -> if necessary work on algorithm and/or
    manual editing of the words collected from
    the def property of triggers.json in RotVH

Questions: retain capitalization for proper names and handle this in visualization?

Do We just accept that the some of the words in this ``def`` file are 'innocent' (I like this and how it will figure in the demograph visualization) and that we are making them 'guilty by association'. I say: yes, but: For all of the innocent words? Even stop words?

If common words are shared by the ``def``s of more than one triggering compound, I think we need to know which compound made it guilty by association? (see ``lookup`` below in pseudocode)
	
    demographEvent ->
      whenever the demograph encounters a word that is
      guilty or guilty by association:
	    lookup and/or associate the word with a 
	    compound from the triggers.json file by finding
	    it in the compound's def property
	    
Question: on what basis to we choose between ``simp`` and ``trad`` at this point?

	    pause demograph while:
		   RotVH visualization renders the guilty compound 
		   'transliterating' from whichever compound is 
		   currently displayed
		   
This would be a two-character process and I think it might be good to work out a way to display a number of 'innocent' but orthographically correct compounds on the way.

		 restart the (insertion, deletion, replacement)
		 transliteration process in (Automatype-)demograph
		 
	     loop back to next demographEvent