class PitchTracker{

	constructor(ctx){
		this.context = ctx;
		this.analyser = this.context.createAnalyser();
	    this.analyser.fftSize = 2048;
	    // this.analyser.connect( this.context.destination );

	    this.confidence = "vague";
	    this.confidenceValue = 0.0;
	 	this.frequency = "--";
		this.note = "-";
		this.detuneSymbol = "";
		this.detuneHz = "--";

		this.noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

		this.MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.
		this.GOOD_ENOUGH_CORRELATION = 0.9; // this is the "bar" for how close a correlation needs to be

		this.buflen = 1024;
		this.buf = new Float32Array( this.buflen );
	}

	computePitch() {
		var cycles = new Array;
		this.analyser.getFloatTimeDomainData( this.buf );
		var ac = this.autoCorrelate( this.buf, this.context.sampleRate );
		// TODO: Paint confidence meter on canvasElem here.

	 	if (ac == -1) {
	 		this.confidence = "vague";
		 	this.frequency = "--";
		 	this.confidenceValue = 0.0;
			this.note = "-";
			this.detuneSymbol = "";
			this.detuneHz = "--";
	 	} else {
		 	this.confidence = "confident";
		 	pitch = ac;
		 	this.frequency = Math.round( pitch ) ;
		 	var note =  this.noteFromPitch( pitch );
			this.note = this.noteStrings[note%12];
			var detune = this.centsOffFromPitch( pitch, note );
			if (detune == 0 ) {
				this.detuneSymbol = "";
				this.detuneHz = "--";
			} else {
				if (detune < 0)
					this.detuneSymbol = "flat";
				else
					this.detuneSymbol = "sharp";
				this.detuneHz = Math.abs( detune );
			}
		}
	}

	computePitchOfBuffer(bufIN) {
		var cycles = new Array;
		this.analyser.getFloatTimeDomainData( bufIN.getChannelData(0) );
		var ac = this.autoCorrelate( bufIN.getChannelData(0), this.context.sampleRate );
		// TODO: Paint confidence meter on canvasElem here.

	 	if (ac == -1) {
	 		this.confidence = "vague";
		 	this.frequency = "--";
			this.note = "-";
			this.detuneSymbol = "";
			this.detuneHz = "--";
	 	} else {
		 	this.confidence = "confident";
		 	var pitch = ac;
		 	this.frequency = Math.round( pitch ) ;
		 	var note =  this.noteFromPitch( pitch );
			this.note = this.noteStrings[note%12];
			var detune = this.centsOffFromPitch( pitch, note );
			if (detune == 0 ) {
				this.detuneSymbol = "";
				this.detuneHz = "--";
			} else {
				if (detune < 0)
					this.detuneSymbol = "flat";
				else
					this.detuneSymbol = "sharp";
				this.detuneHz = Math.abs( detune );
			}
		}
	}

	autoCorrelate( buf, sampleRate ) {
		var SIZE = buf.length;
		var MAX_SAMPLES = Math.floor(SIZE/2);
		var best_offset = -1;
		var best_correlation = 0;
		var rms = 0;
		var foundGoodCorrelation = false;
		var correlations = new Array(MAX_SAMPLES);

		for (var i=0;i<SIZE;i++) {
			var val = buf[i];
			rms += val*val;
		}
		rms = Math.sqrt(rms/SIZE);
		if (rms<0.01) // not enough signal
			return -1;

		var lastCorrelation=1;
		for (var offset = this.MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
			var correlation = 0;

			for (var i=0; i<MAX_SAMPLES; i++) {
				correlation += Math.abs((buf[i])-(buf[i+offset]));
			}
			correlation = 1 - (correlation/MAX_SAMPLES);
			correlations[offset] = correlation; // store it, for the tweaking we need to do below.
			if ((correlation>this.GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
				foundGoodCorrelation = true;
				if (correlation > best_correlation) {
					best_correlation = correlation;
					best_offset = offset;
				}
			} else if (foundGoodCorrelation) {
				// short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
				// Now we need to tweak the offset - by interpolating between the values to the left and right of the
				// best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
				// we need to do a curve fit on correlations[] around best_offset in order to better determine precise
				// (anti-aliased) offset.

				// we know best_offset >=1, 
				// since foundGoodCorrelation cannot go to true until the second pass (offset=1), and 
				// we can't drop into this clause until the following pass (else if).
				this.confidenceValue = Math.pow(best_correlation, 30.0);
				var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];
				return sampleRate/(best_offset+(8*shift));
			}
			lastCorrelation = correlation;
		}
		console.log("confidence in Tracker: ", this.confidenceValue);
		if (best_correlation > 0.01) {
			// console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
			return sampleRate/best_offset;
		}
		return -1;
		//	var best_frequency = sampleRate/best_offset;
	}

	noteFromPitch( frequency ) {
		var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
		return Math.round( noteNum ) + 69;
	}

	frequencyFromNoteNumber( note ) {
		return 440 * Math.pow(2,(note-69)/12);
	}

	centsOffFromPitch( frequency, note ) {
		return Math.floor( 1200 * Math.log( frequency / this.frequencyFromNoteNumber( note ))/Math.log(2) );
	}

}