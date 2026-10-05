const SCENES = new Set(['welcome', 'playing', 'camp', 'result', 'end']);
const CUES = new Set(['deal', 'pocket', 'escape', 'bust', 'perfect', 'levelup', 'contract', 'equip', 'win', 'lose']);

/**
 * Small, procedural soundtrack: paper, coins, plucked strings, and a distant train.
 * Audio begins only after setEnabled(true) is called from a user gesture.
 * Await that method and report a rejected promise to the player; autoplay failures
 * are deliberately not hidden. No assets, network requests, or gameplay RNG used.
 */
export class SoundEngine {
  constructor() {
    this.enabled = false;
    this.scene = 'welcome';
    this.danger = 0;
    this.context = null;
    this.master = null;
    this.compressor = null;
    this.noise = null;
    this.voices = new Set();
    this.ambientTimer = null;
    this.ambientStep = 0;
    this.requestId = 0;
    this.destroyed = false;
    this.hidden = typeof document !== 'undefined' && document.hidden;
    this.onContextStateChange = () => {
      if (this._audible()) {
        this._fadeIn();
        this._startAmbient();
      } else {
        this._silence();
      }
    };
    this.onVisibilityChange = () => {
      this.hidden = document.hidden;
      if (this.hidden) {
        this._silence();
      } else if (this.enabled && this.context?.state === 'running') {
        this._fadeIn();
        this._startAmbient();
      }
    };
    this.onPageHide = () => {
      this.hidden = true;
      this._silence();
    };
    this.onPageShow = () => this.onVisibilityChange();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      window.addEventListener('pagehide', this.onPageHide);
      window.addEventListener('pageshow', this.onPageShow);
    }
  }

  async setEnabled(enabled) {
    if (this.destroyed) throw new Error('This sound engine has been destroyed.');
    const requestId = ++this.requestId;
    if (!enabled) {
      this.enabled = false;
      this._silence();
      return false;
    }

    this.enabled = false;
    if (!this.context) this._createContext();
    if (this.context.state !== 'running') await this.context.resume();
    if (this.requestId !== requestId || this.destroyed) return false;
    if (this.context.state !== 'running') {
      throw new Error('Sound could not start. Try the sound button again.');
    }
    this.enabled = true;
    if (!this.hidden) {
      this._fadeIn();
      this._startAmbient();
    }
    return true;
  }

  setDanger(risk) {
    this.danger = Number.isFinite(risk) ? Math.max(0, Math.min(1, risk)) : 0;
  }

  setScene(scene) {
    if (!SCENES.has(scene)) throw new RangeError(`Unknown sound scene: ${scene}`);
    if (this.scene === scene) return;
    this.scene = scene;
    this._stopAmbient();
    this._startAmbient();
  }

  /** Returns false when muted, hidden, or suspended; true when a cue is played. */
  play(kind, options = {}) {
    if (!CUES.has(kind)) throw new RangeError(`Unknown sound cue: ${kind}`);
    if (!this._audible()) return false;
    const t = this.context.currentTime + 0.012;
    const strength = Number.isFinite(options.strength)
      ? Math.max(0.1, Math.min(1, options.strength)) : 1;
    const pluck = (delay, note, duration = 0.18, volume = 0.16) => {
      this._tone(t + delay, note, duration, volume * strength, 'triangle', note * 0.997);
      this._tone(t + delay, note * 2.005, duration * 0.45, volume * strength * 0.2, 'sine');
    };
    const melody = (notes, interval, duration = 0.22, volume = 0.15) => {
      notes.forEach((note, index) => pluck(index * interval, note, duration, volume));
    };

    switch (kind) {
      case 'deal':
        this._noise(t, 0.065, 0.13 * strength, 2400, 'bandpass');
        this._noise(t + 0.035, 0.08, 0.075 * strength, 1600, 'bandpass');
        this._tone(t + 0.055, 185, 0.055, 0.12 * strength, 'sine', 110);
        break;
      case 'pocket':
        pluck(0, 880, 0.2, 0.12);
        pluck(0.065, 1318.5, 0.3, 0.09);
        this._noise(t, 0.04, 0.04 * strength, 4000, 'highpass');
        break;
      case 'escape': {
        // A few quiet counting clicks lead into the getaway phrase.
        const count = Number.isFinite(options.value)
          ? Math.max(3, Math.min(8, Math.ceil(options.value / 30))) : 5;
        for (let i = 0; i < count; i += 1) {
          this._tone(t + i * 0.045, 660 + i * 55, 0.065, 0.045 * strength, 'sine');
        }
        [196, 246.94, 293.66, 392].forEach((note, i) => pluck(0.13 + i * 0.11, note, 0.28));
        break;
      }
      case 'bust':
        // A distant two-note steam whistle, deliberately brief and subdued.
        this._tone(t, 740, 0.32, 0.08 * strength, 'sine', 415);
        this._tone(t, 880, 0.32, 0.045 * strength, 'sine', 494);
        this._noise(t + 0.02, 0.28, 0.14 * strength, 780, 'lowpass');
        this._tone(t + 0.21, 110, 0.3, 0.16 * strength, 'triangle', 65);
        break;
      case 'perfect':
        melody([196, 246.94, 293.66, 392, 493.88, 587.33], 0.085, 0.32);
        pluck(0.52, 783.99, 0.6, 0.1);
        pluck(0.52, 392, 0.65, 0.13);
        break;
      case 'levelup':
        melody([293.66, 369.99, 440, 587.33], 0.11, 0.3);
        [293.66, 440, 739.99].forEach((note) => pluck(0.48, note, 0.65, 0.085));
        break;
      case 'contract':
        melody([392, 493.88, 587.33], 0.1, 0.3, 0.13);
        pluck(0.33, 783.99, 0.4, 0.1);
        break;
      case 'equip':
        this._noise(t, 0.04, 0.08 * strength, 1900, 'bandpass');
        pluck(0.015, 220, 0.13, 0.17);
        pluck(0.1, 329.63, 0.22, 0.13);
        break;
      case 'win':
        melody([196, 246.94, 293.66, 392, 293.66, 493.88, 392], 0.12, 0.34);
        [196, 293.66, 493.88].forEach((note) => pluck(0.94, note, 0.65, 0.1));
        break;
      case 'lose':
        melody([293.66, 261.63, 220, 146.83], 0.18, 0.4, 0.13);
        break;
    }
    return true;
  }

  async destroy() {
    this.destroyed = true;
    this.enabled = false;
    this.requestId += 1;
    this._silence();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      window.removeEventListener('pagehide', this.onPageHide);
      window.removeEventListener('pageshow', this.onPageShow);
    }
    this.context?.removeEventListener('statechange', this.onContextStateChange);
    if (this.context && this.context.state !== 'closed') await this.context.close();
    this.master?.disconnect();
    this.compressor?.disconnect();
    this.noise = null;
  }

  _createContext() {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) throw new Error('This browser does not support Web Audio.');
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 5;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.18;
    this.master.connect(this.compressor);
    this.compressor.connect(this.context.destination);
    this.noise = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
    const samples = this.noise.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
    this.context.addEventListener('statechange', this.onContextStateChange);
  }

  _audible() {
    return !this.destroyed && this.enabled && !this.hidden && this.context?.state === 'running';
  }

  _fadeIn() {
    const t = this.context.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.linearRampToValueAtTime(0.3, t + 0.045);
  }

  _silence() {
    this._stopAmbient();
    if (!this.context) return;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setValueAtTime(0, this.context.currentTime);
    for (const voice of this.voices) {
      voice.source.onended = null;
      voice.source.stop();
      voice.nodes.forEach((node) => node.disconnect());
    }
    this.voices.clear();
  }

  _startAmbient() {
    if (!this._audible() || this.scene !== 'playing' || this.ambientTimer !== null) return;
    const tick = () => {
      this.ambientTimer = null;
      if (!this._audible() || this.scene !== 'playing') return;
      const t = this.context.currentTime + 0.015;
      // Sparse wheel joints and steam. Increasing risk only changes pace slightly.
      this._noise(t, 0.065, 0.065, 430, 'lowpass');
      this._noise(t + 0.12, 0.045, 0.045, 650, 'lowpass');
      this._tone(t, this.ambientStep % 2 === 0 ? 73.42 : 65.41, 0.09, 0.026, 'sine');
      this.ambientStep += 1;
      this.ambientTimer = setTimeout(tick, 950 - this.danger * 270);
    };
    this.ambientTimer = setTimeout(tick, 450);
  }

  _stopAmbient() {
    if (this.ambientTimer !== null) clearTimeout(this.ambientTimer);
    this.ambientTimer = null;
  }

  _envelope(gain, time, duration, volume) {
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  }

  _track(source, nodes, time, duration) {
    const voice = { source, nodes };
    this.voices.add(voice);
    source.onended = () => {
      nodes.forEach((node) => node.disconnect());
      this.voices.delete(voice);
    };
    source.start(time);
    source.stop(time + duration + 0.015);
  }

  _tone(time, frequency, duration, volume, type = 'sine', endFrequency = frequency) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    this._envelope(gain, time, duration, volume);
    oscillator.connect(gain);
    gain.connect(this.master);
    this._track(oscillator, [oscillator, gain], time, duration);
  }

  _noise(time, duration, volume, frequency, type) {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noise;
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 0.7;
    this._envelope(gain, time, duration, volume);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    this._track(source, [source, filter, gain], time, duration);
  }
}
