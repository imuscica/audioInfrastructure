window.AudioContext = window.AudioContext || window.webkitAudioContext;

class AudioManager{

	constructor(){
		this.audioContext = new AudioContext();
		this.finalAudioOut = this.audioContext.destination;
		this.mainAudioOut = this.audioContext.createGain();
		this.dummyAudioOut = this.audioContext.createGain();
		this.mainAudioOut.connect(this.finalAudioOut);
		this.dummyAudioOut.connect(this.finalAudioOut);
	}

	receiveAudioFromNode(audioInNode){
		audioInNode.connect(this.mainAudioOut);
		console.log("audioInNode--1". audioInNode);
		if(audioInNode.outNodes == null){
			audioInNode.outNodes = [];
		}
		audioInNode.outNodes.push(this.mainAudioOut);
		console.log("audioInNode--2". audioInNode);
	}
	receiveDummyAudioFromNode(audioInNode){
		audioInNode.connect(this.dummyAudioOut);
		console.log("audioInNode--1". audioInNode);
		if(audioInNode.outNodes == null){
			audioInNode.outNodes = [];
		}
		audioInNode.outNodes.push(this.dummyAudioOut);
		console.log("audioInNode--2". audioInNode);
	}
	sendAudioToNode(audioOutNode){
		this.mainAudioOut.connect(audioOutNode);
		if(audioOutNode.inNodes == null){
			audioOutNode.inNodes = [];
		}
		audioOutNode.inNodes.push(audioOutNode);
	}
	unplugAudioNode(audioNode){
		audioNode.disconnect(this.mainAudioOut);
	}

	getCurrentTime(){
		return this.audioContext.currentTime;
	}

	playBuffer(buff){
		var source = this.audioContext.createBufferSource();
		source.buffer = buff;
		source.connect(this.mainAudioOut);
		source.start(0);
	}
	createAndGetBufferSource(buff){
		var source = this.audioContext.createBufferSource();
		source.buffer = buff;
		source.connect(this.mainAudioOut);
		return source;
	}

}