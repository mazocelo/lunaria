/**
 * Audio module — sons sintéticos via Web Audio API
 * Sem dependências externas ou arquivos de som.
 *
 * Uso: import { playSound } from '@/utils/audio';
 *      playSound('dice_roll');
 */

const STORAGE_KEY = 'lunaria_sound_enabled';

export type SoundName =
  | 'dice_roll'
  | 'my_turn'
  | 'combat_hit'
  | 'level_up'
  | 'notification'
  | 'heal'
  | 'death';

// Suporte legado para Safari < 14.
type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      const Ctor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

// --- Synth helpers ---

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15
): void {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08): void {
  const ctx = getCtx();
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

// --- Sound definitions ---

const SOUNDS: Record<SoundName, () => void> = {
  dice_roll: () => {
    // Rapid clicks simulating dice bouncing
    for (let i = 0; i < 6; i++) {
      setTimeout(() => playNoise(0.04, 0.1), i * 50);
    }
    setTimeout(() => playTone(800, 0.1, 'triangle', 0.12), 350);
  },

  my_turn: () => {
    // Ascending double chime
    playTone(523, 0.15, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.2, 'sine', 0.12), 120);
  },

  combat_hit: () => {
    // Impact thud
    playTone(120, 0.15, 'sawtooth', 0.1);
    playNoise(0.08, 0.12);
  },

  level_up: () => {
    // Ascending arpeggio
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'sine', 0.1), i * 100);
    });
  },

  notification: () => {
    // Soft bell
    playTone(880, 0.3, 'sine', 0.08);
    setTimeout(() => playTone(1100, 0.2, 'sine', 0.06), 150);
  },

  heal: () => {
    // Gentle ascending
    playTone(440, 0.2, 'sine', 0.08);
    setTimeout(() => playTone(554, 0.2, 'sine', 0.08), 100);
    setTimeout(() => playTone(659, 0.25, 'sine', 0.08), 200);
  },

  death: () => {
    // Descending minor
    playTone(440, 0.3, 'sawtooth', 0.06);
    setTimeout(() => playTone(370, 0.3, 'sawtooth', 0.06), 200);
    setTimeout(() => playTone(330, 0.5, 'sawtooth', 0.04), 400);
  },
};

// --- Public API ---

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    /* ignore */
  }
}

export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  return next;
}

/**
 * Play a named sound effect.
 */
export function playSound(name: SoundName): void {
  if (!isSoundEnabled()) return;
  const fn = SOUNDS[name];
  if (fn) {
    try {
      fn();
    } catch {
      /* ignore audio errors */
    }
  }
}
