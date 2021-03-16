
export default class AudioPlayer {
  constructor() {
    // for cross browser compatibility
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    this.__audioCtx = new AudioContext();
    this.__audioBufferSourceNode = null;
    this.__gainNode = this.__audioCtx.createGain();
    this.__gainNode.connect(this.__audioCtx.destination);
    this.__pannerNode = this.__audioCtx.createPanner();
    this.__pannerNode.connect(this.__gainNode);
    this.__pannerNode.panningModel = 'HRTF';

    this.__audioBuffer = null;
    this.__isLoaded = false;
    this.__isPlaying = false;
  }

  loadPromise(url) {
    this.__isLoaded = false;

    return fetch(url).then(
      response => response.arrayBuffer()
    ).then(
      arraybuffer => this.__audioCtx.decodeAudioData(arraybuffer)
    ).then((audioBuffer) => {
      this.audioBuffer = audioBuffer;
      this.__isLoaded = true;
      return this.__audioBuffer;
    });
  }

  startAt(audioStartOffset) {
    if (this.__isLoaded === false) {
      console.error('the audio buffer is not loaded');
      return;
    }
    if (this.__isPlaying === true) {
      this.__audioBufferSourceNode.stop();
    }
    this.__audioBufferSourceNode = this.__audioCtx.createBufferSource();
    this.__audioBufferSourceNode.buffer = this.__audioBuffer;
    this.__audioBufferSourceNode.connect(this.__pannerNode);
    this.__audioBufferSourceNode.start(0, audioStartOffset);
    this.__isPlaying = true;
  }

  stop() {
    if (this.__isPlaying === true) {
      this.__audioBufferSourceNode.stop();
      this.__audioBufferSourceNode.disconnect(this.__pannerNode);
      this.__audioBufferSourceNode = null;
      this.__isPlaying = false;
    }
  }

  set audioBuffer(audioBuffer) {
    this.__audioBuffer = audioBuffer;
    if (audioBuffer != null) {
      this.__isLoaded = true;
    }
  }

  get audioBuffer() {
    return this.__audioBuffer;
  }

  set volume(value) {
    this.__gainNode.gain.setTargetAtTime(value, this.__audioCtx.currentTime, 0.01);
  }

  get audioContext() {
    return this.__audioCtx;
  }

  get volume() {
    return this.__gainNode.gain.volume;
  }

  get isLoaded() {
    return this.__isLoaded;
  }

  get currentTime() {
    return this.__audioCtx.currentTime;
  }

  get duration() {
    return this.__audioBuffer.duration;
  }
}
