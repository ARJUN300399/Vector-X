import { SHOT_SOUND } from '../game/constants';

function decodeAudioData(context, audioData) {
  return new Promise((resolve, reject) => {
    const result = context.decodeAudioData(audioData, resolve, reject);
    if (result?.then) result.then(resolve, reject);
  });
}

export function createShotSoundController() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let context = null;
  let soundBuffer = null;
  let loadingSound = null;

  const ensureContext = () => {
    if (!AudioContext) return null;
    if (!context) context = new AudioContext();
    return context;
  };

  const load = async () => {
    if (soundBuffer) return soundBuffer;
    if (loadingSound) return loadingSound;

    const audioContext = ensureContext();
    if (!audioContext) return null;

    loadingSound = fetch(SHOT_SOUND.url)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load shot sound: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((audioData) => decodeAudioData(audioContext, audioData))
      .then((buffer) => {
        soundBuffer = buffer;
        return soundBuffer;
      })
      .catch((error) => {
        console.warn(error);
        loadingSound = null;
        return null;
      });

    return loadingSound;
  };

  return {
    load,
    play() {
      const audioContext = ensureContext();
      if (!audioContext) return;

      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      load().then((buffer) => {
        if (!buffer || audioContext.state === 'closed') return;

        const source = audioContext.createBufferSource();
        const gain = audioContext.createGain();
        const start = Math.min(SHOT_SOUND.start, Math.max(0, buffer.duration - 0.05));
        const duration = Math.min(SHOT_SOUND.duration, buffer.duration - start);

        gain.gain.value = 0.85;
        source.buffer = buffer;
        source.connect(gain).connect(audioContext.destination);
        source.start(0, start, Math.max(0.05, duration));
      });
    },
    dispose() {
      if (context && context.state !== 'closed') {
        context.close().catch(() => {});
      }
    },
  };
}
