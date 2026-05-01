/**
 * 8-Bit Chiptune Sound Engine
 * Inspired by Final Fantasy NES/SNES era
 * Uses Web Audio API to synthesize all sounds — no external files needed.
 */

import { EnemyType, TowerType } from './types';

type OscType = OscillatorType;

class ChiptuneEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _muted = false;
  private _volume = 0.3;

  private _escapeStreak = 0;
  private _lastEscapeTime = 0;

  /** Initialize or resume the audio context on user interaction to prevent browser blocking */
  init() {
    this.getCtx();
  }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMaster(): GainNode {
    this.getCtx();
    return this.masterGain!;
  }

  get muted() { return this._muted; }
  set muted(v: boolean) {
    this._muted = v;
    if (this.masterGain) {
      this.masterGain.gain.value = v ? 0 : this._volume;
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  // ─── Primitives ──────────────────────────────────────────

  private playTone(
    freq: number,
    duration: number,
    type: OscType = 'square',
    volume = 0.3,
    delay = 0,
    detune = 0,
  ) {
    if (this._muted) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(this.getMaster());

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  private playNoise(duration: number, volume = 0.2, delay = 0) {
    if (this._muted) return;
    const ctx = this.getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    // Bandpass for more "retro" noise
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.getMaster());

    source.start(ctx.currentTime + delay);
    source.stop(ctx.currentTime + delay + duration);
  }

  /** Filtered noise burst — for richer explosions and screeches */
  private playFilteredNoise(
    duration: number,
    volume = 0.2,
    delay = 0,
    filterFreq = 3000,
    filterType: BiquadFilterType = 'bandpass',
    filterQ = 0.5,
  ) {
    if (this._muted) return;
    const ctx = this.getCtx();
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.getMaster());
    source.start(ctx.currentTime + delay);
    source.stop(ctx.currentTime + delay + duration);
  }

  private playArpeggio(notes: number[], duration: number, type: OscType = 'square', volume = 0.2) {
    const noteLen = duration / notes.length;
    notes.forEach((freq, i) => {
      this.playTone(freq, noteLen * 1.1, type, volume, i * noteLen);
    });
  }

  // ─── Game Sound Effects ──────────────────────────────────

  /** UI button click — short blip */
  uiClick() {
    this.playTone(880, 0.06, 'square', 0.15);
  }

  /** Hover over buildable cell */
  uiHover() {
    this.playTone(660, 0.03, 'square', 0.05);
  }

  /** Tower placed — ascending two-note */
  towerPlace() {
    this.playTone(523, 0.08, 'square', 0.2);     // C5
    this.playTone(784, 0.12, 'square', 0.2, 0.08); // G5
  }

  /** Tower upgraded — ascending three-note arpeggio (FF level-up inspired) */
  towerUpgrade() {
    this.playArpeggio([523, 659, 784, 1047], 0.35, 'square', 0.25); // C5 E5 G5 C6
  }

  /** Tower sold — descending */
  towerSell() {
    this.playTone(587, 0.08, 'triangle', 0.2);
    this.playTone(392, 0.12, 'triangle', 0.2, 0.08);
  }

  // ─── Per-Tower Shooting Sounds ──────────────────────────

  /** Dispatch shooting sound by tower type */
  towerShoot(type: TowerType) {
    switch (type) {
      case 'arrow': this.shootArrow(); break;
      case 'cannon': this.shootCannon(); break;
      case 'ice': this.shootIce(); break;
      case 'lightning': this.shootLightning(); break;
    }
  }

  /** Arrow tower shoots — short high ping */
  shootArrow() {
    this.playTone(1200, 0.04, 'square', 0.08);
    this.playTone(1800, 0.03, 'square', 0.05, 0.02);
  }

  /** Cannon fires — low boom + noise */
  shootCannon() {
    this.playTone(80, 0.15, 'sawtooth', 0.15);
    this.playNoise(0.12, 0.1);
  }

  /** Ice tower — crystalline descending */
  shootIce() {
    this.playTone(1400, 0.06, 'sine', 0.1);
    this.playTone(1100, 0.06, 'sine', 0.08, 0.04);
    this.playTone(900, 0.08, 'sine', 0.06, 0.08);
  }

  /** Lightning — electric zap */
  shootLightning() {
    this.playTone(200, 0.05, 'sawtooth', 0.12);
    this.playTone(1600, 0.03, 'square', 0.1, 0.02);
    this.playNoise(0.08, 0.08, 0.01);
    this.playTone(2400, 0.04, 'square', 0.06, 0.04);
  }

  // ─── Per-Enemy Death Sounds ─────────────────────────────

  /** Dispatch death sound by enemy type */
  enemyKill(type?: EnemyType) {
    switch (type) {
      case 'scout': this.killScout(); break;
      case 'soldier': this.killSoldier(); break;
      case 'knight': this.killKnight(); break;
      case 'mage': this.killMage(); break;
      case 'ogre': this.killOgre(); break;
      case 'dragon': this.killDragon(); break;
      case 'boss': this.killBoss(); break;
      default: this.killGeneric(); break;
    }
  }

  /** Scout death — light pop (quick, disposable) */
  private killScout() {
    this.playTone(880, 0.04, 'square', 0.1);
    this.playTone(1320, 0.03, 'square', 0.06, 0.03);
  }

  /** Soldier death — crunchy burst */
  private killSoldier() {
    this.playTone(330, 0.06, 'square', 0.12);
    this.playNoise(0.06, 0.08);
    this.playTone(660, 0.05, 'square', 0.08, 0.04);
  }

  /** Knight death — metallic clang */
  private killKnight() {
    this.playTone(1200, 0.03, 'square', 0.15);
    this.playTone(2400, 0.02, 'square', 0.08, 0.01);
    this.playTone(600, 0.1, 'triangle', 0.1, 0.03);
    this.playFilteredNoise(0.08, 0.06, 0.01, 6000, 'highpass', 2);
  }

  /** Mage death — magical sparkle dissipation */
  private killMage() {
    this.playArpeggio([1047, 1319, 1568, 2093], 0.25, 'sine', 0.1);
    this.playTone(523, 0.15, 'triangle', 0.08, 0.1);
  }

  /** Ogre death — heavy thud with rumble */
  private killOgre() {
    this.playTone(60, 0.2, 'sawtooth', 0.2);
    this.playTone(45, 0.25, 'triangle', 0.15, 0.05);
    this.playNoise(0.15, 0.12);
  }

  /** Dragon death — dramatic screaming roar */
  private killDragon() {
    this.playTone(200, 0.1, 'sawtooth', 0.2);
    this.playTone(150, 0.15, 'sawtooth', 0.18, 0.05);
    this.playTone(100, 0.2, 'sawtooth', 0.15, 0.12);
    this.playFilteredNoise(0.25, 0.12, 0, 1500, 'bandpass', 3);
    this.playTone(400, 0.08, 'square', 0.1, 0.2);
    this.playTone(800, 0.06, 'square', 0.08, 0.25);
  }

  /** Boss death — epic explosion with fanfare */
  private killBoss() {
    // Huge impact
    this.playTone(40, 0.3, 'sawtooth', 0.25);
    this.playNoise(0.3, 0.15);
    this.playFilteredNoise(0.4, 0.1, 0, 800, 'lowpass', 1);
    // Triumphant mini-fanfare after the boom
    this.playArpeggio([523, 659, 784, 1047, 1319], 0.4, 'square', 0.15);
    this.playTone(262, 0.3, 'triangle', 0.12, 0.15);
  }

  /** Generic enemy death — simple pop */
  private killGeneric() {
    this.playTone(440, 0.04, 'square', 0.1);
    this.playTone(880, 0.06, 'square', 0.08, 0.03);
  }

  // ─── Enemy Escape ──────────────────────────────────────

  /** Enemy escaped — nasty dissonant screech */
  enemyEscape() {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    
    // Track streak if escapes happen within 2 seconds of each other
    if (now - this._lastEscapeTime < 2.0) {
      this._escapeStreak = Math.min(this._escapeStreak + 1, 5); // Cap at 5 for maximum horror
    } else {
      this._escapeStreak = 0;
    }
    this._lastEscapeTime = now;

    // Pitch drops lower, volume gets louder, noise lasts longer
    const pitchShift = Math.max(0.4, 1 - (this._escapeStreak * 0.15)); 
    const volMult = 1 + (this._escapeStreak * 0.25);
    const durMult = 1 + (this._escapeStreak * 0.2);

    // Harsh dissonant chord
    this.playTone(300 * pitchShift, 0.15 * durMult, 'sawtooth', 0.15 * volMult);
    this.playTone(313 * pitchShift, 0.15 * durMult, 'sawtooth', 0.12 * volMult); // Dissonant beating
    this.playTone(620 * pitchShift, 0.12 * durMult, 'square', 0.1 * volMult, 0.02);
    this.playTone(637 * pitchShift, 0.12 * durMult, 'square', 0.08 * volMult, 0.02); // More dissonance
    
    // High-pitched screech sweep
    this.playTone(2000 * pitchShift, 0.08 * durMult, 'sawtooth', 0.1 * volMult, 0.05);
    this.playTone(3000 * pitchShift, 0.06 * durMult, 'sawtooth', 0.08 * volMult, 0.08);
    this.playTone(1500 * pitchShift, 0.1 * durMult, 'sawtooth', 0.06 * volMult, 0.12);
    
    // Noise crackle
    this.playFilteredNoise(0.1 * durMult, 0.08 * volMult, 0.03, 5000 * pitchShift, 'highpass', 3);
  }

  /** Wave start — FF battle start fanfare */
  waveStart() {
    // Classic "battle begins" motif
    this.playTone(392, 0.1, 'square', 0.2);        // G4
    this.playTone(392, 0.1, 'square', 0.2, 0.12);  // G4
    this.playTone(392, 0.1, 'square', 0.2, 0.24);  // G4
    this.playTone(311, 0.3, 'square', 0.25, 0.36); // Eb4
    this.playTone(349, 0.1, 'square', 0.2, 0.7);   // F4
    this.playTone(392, 0.3, 'square', 0.25, 0.82); // G4

    // Bass line
    this.playTone(196, 0.15, 'triangle', 0.15);
    this.playTone(196, 0.15, 'triangle', 0.15, 0.36);
    this.playTone(175, 0.15, 'triangle', 0.15, 0.7);
  }

  /** Wave complete — short victory jingle */
  waveComplete() {
    // Quick ascending celebration
    this.playArpeggio([523, 659, 784, 1047], 0.4, 'square', 0.2);
    this.playTone(262, 0.4, 'triangle', 0.15); // Bass C4
  }

  /** Level victory — FF victory fanfare! */
  victory() {
    // The iconic da-da-da-daaaa da-da-da-daaa
    const t = 0.12; // note length

    // Main melody (square wave — classic chiptune lead)
    this.playTone(523, t, 'square', 0.25);           // C5
    this.playTone(523, t, 'square', 0.25, t);        // C5
    this.playTone(523, t, 'square', 0.25, t*2);      // C5
    this.playTone(523, t*3, 'square', 0.3, t*3);     // C5 (hold)
    this.playTone(415, t, 'square', 0.25, t*6);      // Ab4
    this.playTone(466, t, 'square', 0.25, t*7);      // Bb4
    this.playTone(523, t*2, 'square', 0.3, t*8);     // C5 (hold)
    this.playTone(466, t, 'square', 0.25, t*10);     // Bb4
    this.playTone(523, t*4, 'square', 0.3, t*11);    // C5 (long hold)

    // Bass (triangle wave)
    this.playTone(131, t*3, 'triangle', 0.2);        // C3
    this.playTone(131, t*3, 'triangle', 0.2, t*3);   // C3
    this.playTone(104, t*2, 'triangle', 0.2, t*6);   // Ab2
    this.playTone(117, t*2, 'triangle', 0.2, t*8);   // Bb2
    this.playTone(131, t*4, 'triangle', 0.2, t*11);  // C3

    // Harmony (pulse/square at different pitch)
    this.playTone(659, t*3, 'square', 0.12, t*3);    // E5
    this.playTone(622, t*2, 'square', 0.12, t*8);    // Eb5
    this.playTone(659, t*4, 'square', 0.12, t*11);   // E5
  }

  /** Game over — dramatic descending */
  gameOver() {
    const t = 0.2;
    this.playTone(392, t, 'square', 0.25);           // G4
    this.playTone(370, t, 'square', 0.22, t);        // F#4
    this.playTone(349, t, 'square', 0.2, t*2);       // F4
    this.playTone(330, t*2, 'square', 0.18, t*3);    // E4
    this.playTone(262, t*3, 'square', 0.25, t*5);    // C4

    // Ominous bass
    this.playTone(65, t*3, 'triangle', 0.2, t*5);    // C2
    this.playNoise(0.4, 0.05, t*5);
  }

  /** Gold earned — coin collect */
  goldEarned() {
    this.playTone(1319, 0.05, 'square', 0.08);  // E6
    this.playTone(1568, 0.08, 'square', 0.1, 0.05); // G6
  }

  /** Pause toggle */
  pauseToggle() {
    this.playTone(440, 0.08, 'triangle', 0.15);
    this.playTone(330, 0.08, 'triangle', 0.1, 0.08);
  }

  /** Speed toggle */
  speedToggle() {
    this.playTone(660, 0.05, 'square', 0.1);
    this.playTone(990, 0.05, 'square', 0.1, 0.05);
  }
}

// Singleton instance
export const soundEngine = new ChiptuneEngine();
