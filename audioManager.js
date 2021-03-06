function iMuscicaIuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// just a comment

window.AudioContext = window.AudioContext || window.webkitAudioContext;

class AudioManager{

	constructor(audioContext){
		// if(audioContext == null){
		// 	this.audioContext = new AudioContext();
		// }
		// else
		// 	this.audioContext = audioContext;		

		this.audioContext = new AudioContext();

		console.log('this.audioContext : ',this.audioContext);
		this.finalAudioOut = this.audioContext.destination;
		this.mainAudioOut = this.audioContext.createGain();
		this.dummyAudioOut = this.audioContext.createGain();
		this.mainAudioOut.connect(this.finalAudioOut);
		this.audioContext.uuid = iMuscicaIuidv4();
		this.uuid = iMuscicaIuidv4();
		this.connectedInNodes = [];

	}

	receiveAudioFromNode(audioInNode){
		audioInNode.connect(this.mainAudioOut);
		if(audioInNode.outNodes == null){
			audioInNode.outNodes = [];
		}
		audioInNode.outNodes.push(this.mainAudioOut);
		this.connectedInNodes.push(audioInNode);
	}

	printInputAudioNodes(){
		var inNodes = this.connectedInNodes.length;
		for (var i=0;i<inNodes;i++){
			console.log('In Node : ',this.connectedInNodes[i]);
		}

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



}
