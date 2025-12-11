class SoundService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private chargeOsc: OscillatorNode | null = null;
  private chargeGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.2; 
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playHover() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    
    // Quick high-pitch blip
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playClick() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    // Punchy tech sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playSwipe() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    // Fast whoosh sound
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.2);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    whiteNoise.start();
  }

  playTransition() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    // White noise sweep
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(2000, this.ctx.currentTime + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playSuspense() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = 2.0;
    // Create a rhythmic ticking that speeds up slightly
    const count = 16;
    
    for (let i = 0; i < count; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Time between ticks gets shorter
        const t = now + (i / count) * duration; 

        osc.type = 'square';
        // Pitch rises
        osc.frequency.setValueAtTime(100 + (i * 30), t);
        
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.06);
    }
    
    // Underlying tension drone
    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    drone.type = 'sawtooth';
    drone.frequency.setValueAtTime(50, now);
    drone.frequency.linearRampToValueAtTime(100, now + duration);
    
    droneGain.gain.setValueAtTime(0.02, now);
    droneGain.gain.linearRampToValueAtTime(0, now + duration);
    
    drone.connect(droneGain);
    droneGain.connect(this.masterGain);
    drone.start(now);
    drone.stop(now + duration);
  }

  playSuccess() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    
    const now = this.ctx.currentTime;
    // Major chord arpeggio with retro synth feel
    [440, 554, 659, 880].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const startTime = now + i * 0.05;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6); // Longer tail
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  // --- NEW CHARGING AUDIO METHODS ---

  startCharge() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.chargeOsc) return; // Already charging

    this.chargeOsc = this.ctx.createOscillator();
    this.chargeGain = this.ctx.createGain();

    this.chargeOsc.type = 'sawtooth';
    // Rising pitch to build tension
    this.chargeOsc.frequency.setValueAtTime(100, this.ctx.currentTime);
    this.chargeOsc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 2.0); // 2 seconds ramp

    // Fade in
    this.chargeGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.chargeGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);

    // Filter to make it sound more "engine-like"
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(2000, this.ctx.currentTime + 2.0);

    this.chargeOsc.connect(filter);
    filter.connect(this.chargeGain);
    this.chargeGain.connect(this.masterGain);
    
    this.chargeOsc.start();
  }

  stopCharge(success: boolean = false) {
     if (this.chargeOsc && this.chargeGain && this.ctx) {
        const now = this.ctx.currentTime;
        if (success) {
            // If successful, quick pitch up zip (launch sound)
             this.chargeOsc.frequency.cancelScheduledValues(now);
             this.chargeOsc.frequency.setValueAtTime(this.chargeOsc.frequency.value, now);
             this.chargeOsc.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
             
             this.chargeGain.gain.cancelScheduledValues(now);
             this.chargeGain.gain.linearRampToValueAtTime(0, now + 0.2);
             
             this.chargeOsc.stop(now + 0.2);
        } else {
            // Power down fizzle (cancelled)
             this.chargeOsc.frequency.cancelScheduledValues(now);
             this.chargeOsc.frequency.linearRampToValueAtTime(50, now + 0.3);
             
             this.chargeGain.gain.cancelScheduledValues(now);
             this.chargeGain.gain.linearRampToValueAtTime(0, now + 0.3);
             
             this.chargeOsc.stop(now + 0.3);
        }
     }
     this.chargeOsc = null;
     this.chargeGain = null;
  }
}

export const soundManager = new SoundService();