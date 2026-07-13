/**
 * AmbientAudio - Web Audio API based ambient sound system
 * 
 * Provides immersive industrial audio feedback:
 * - VFD hum (continuous low-frequency tone proportional to output frequency)
 * - Motor startup sound (increasing pitch ramp)
 * - Machine coast-down (decreasing pitch on stop)
 * - Alarm sound on fault detection
 * - Ambient factory background (subtle white noise)
 */

class AmbientAudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private vfdOscillator: OscillatorNode | null = null;
  private vfdGain: GainNode | null = null;
  private motorOscillator: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private ambientNode: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private enabled: boolean = false;
  private currentFrequency: number = 0;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  enable() {
    this.enabled = true;
    this.getContext();
  }

  disable() {
    this.enabled = false;
    this.stopAll();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start VFD hum — continuous low-frequency tone
   * Frequency proportional to VFD output (base: 60Hz = ~120Hz tone)
   */
  startVFDHum(outputFrequency: number = 60) {
    if (!this.enabled) return;
    const ctx = this.getContext();

    if (!this.vfdOscillator) {
      this.vfdOscillator = ctx.createOscillator();
      this.vfdGain = ctx.createGain();
      this.vfdOscillator.type = "sawtooth";
      this.vfdOscillator.frequency.value = outputFrequency * 2;
      this.vfdGain!.gain.value = 0;
      this.vfdOscillator.connect(this.vfdGain!);
      this.vfdGain!.connect(this.masterGain!);
      this.vfdOscillator.start();
    }

    // Ramp up volume
    this.vfdGain!.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.5);
    this.updateVFDFrequency(outputFrequency);
  }

  /**
   * Update VFD hum frequency as motor speed changes
   */
  updateVFDFrequency(outputFrequency: number) {
    if (!this.vfdOscillator || !this.enabled) return;
    this.currentFrequency = outputFrequency;
    const ctx = this.getContext();
    // Map 0-60Hz output to 40-180Hz audio tone
    const audioFreq = 40 + (outputFrequency / 60) * 140;
    this.vfdOscillator.frequency.linearRampToValueAtTime(audioFreq, ctx.currentTime + 0.1);
    
    // Volume proportional to frequency
    if (this.vfdGain) {
      const vol = Math.min(0.12, (outputFrequency / 60) * 0.08);
      this.vfdGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.1);
    }
  }

  /**
   * Stop VFD hum — coast-down effect
   */
  stopVFDHum() {
    if (!this.vfdGain || !this.ctx) return;
    this.vfdGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
    // Clean up after fade
    setTimeout(() => {
      if (this.vfdOscillator) {
        this.vfdOscillator.stop();
        this.vfdOscillator.disconnect();
        this.vfdOscillator = null;
      }
      if (this.vfdGain) {
        this.vfdGain.disconnect();
        this.vfdGain = null;
      }
    }, 2500);
  }

  /**
   * Motor startup sound — increasing pitch ramp
   */
  playMotorStartup(accelTime: number = 10) {
    if (!this.enabled) return;
    const ctx = this.getContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 30;
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + Math.min(accelTime, 5));
    gain.gain.value = 0.06;
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + Math.min(accelTime, 5));
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + Math.min(accelTime, 5));
  }

  /**
   * Machine coast-down — decreasing pitch
   */
  playCoastDown(decelTime: number = 8) {
    if (!this.enabled) return;
    const ctx = this.getContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 180;
    osc.frequency.linearRampToValueAtTime(20, ctx.currentTime + Math.min(decelTime, 4));
    gain.gain.value = 0.05;
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + Math.min(decelTime, 4));
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + Math.min(decelTime, 4));
  }

  /**
   * Alarm sound — urgent beeping on fault
   */
  playAlarm() {
    if (!this.enabled) return;
    const ctx = this.getContext();

    // Three short beeps
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.value = 0;
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.3);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.3 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(ctx.currentTime + i * 0.3);
      osc.stop(ctx.currentTime + i * 0.3 + 0.2);
    }
  }

  /**
   * Start ambient factory background — subtle filtered noise
   */
  startAmbient() {
    if (!this.enabled) return;
    const ctx = this.getContext();

    // Create noise buffer
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    this.ambientNode = ctx.createBufferSource();
    this.ambientNode.buffer = buffer;
    this.ambientNode.loop = true;

    // Low-pass filter for rumble
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 200;

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0;
    this.ambientGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 1);

    this.ambientNode.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain!);
    this.ambientNode.start();
  }

  /**
   * Stop ambient background
   */
  stopAmbient() {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      setTimeout(() => {
        this.ambientNode?.stop();
        this.ambientNode?.disconnect();
        this.ambientNode = null;
        this.ambientGain?.disconnect();
        this.ambientGain = null;
      }, 1200);
    }
  }

  /**
   * Stop all sounds
   */
  stopAll() {
    this.stopVFDHum();
    this.stopAmbient();
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stopAll();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Singleton instance
export const ambientAudio = new AmbientAudioSystem();
