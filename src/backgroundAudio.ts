/**
 * Standard HTML <audio> background keeper, TTS audio stream URL builder,
 * and MediaSession controller for mobile screen-off & background app playback.
 * Uses zero Web Audio API — strictly standard HTMLAudioElement + navigator.mediaSession.
 */

// 1-second silent WAV 44.1kHz mono Base64 data URI
export const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/';

let backgroundAudioElement: HTMLAudioElement | null = null;

export function attachBackgroundAudioElement(element: HTMLAudioElement | null): void {
  if (!element) return;
  element.loop = true;
  element.volume = 0.01; // minimal non-zero volume to avoid OS mute suspension
  element.setAttribute('playsinline', 'true');
  element.setAttribute('webkit-playsinline', 'true');
  if (!element.src) {
    element.src = SILENT_WAV_BASE64;
  }
  backgroundAudioElement = element;
}

export function initBackgroundAudio(): HTMLAudioElement | null {
  if (!backgroundAudioElement && typeof window !== 'undefined') {
    const audio = new Audio(SILENT_WAV_BASE64);
    audio.loop = true;
    audio.volume = 0.01;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    backgroundAudioElement = audio;
  }
  return backgroundAudioElement;
}

export async function startBackgroundAudio(): Promise<boolean> {
  try {
    const audio = initBackgroundAudio();
    if (!audio) return false;
    if (audio.paused) {
      await audio.play();
    }
    return true;
  } catch (err) {
    console.warn('Background audio auto-start restricted, waiting for user gesture:', err);
    return false;
  }
}

export function pauseBackgroundAudio(): void {
  if (backgroundAudioElement && !backgroundAudioElement.paused) {
    backgroundAudioElement.pause();
  }
}

export function stopBackgroundAudio(): void {
  if (backgroundAudioElement) {
    backgroundAudioElement.pause();
    try {
      backgroundAudioElement.currentTime = 0;
    } catch {
      // ignore if audio metadata not loaded yet
    }
  }
}

/**
 * Splits long English sentences into <= 180 character chunks along word boundaries
 * so HTML <audio> TTS endpoints never reject or truncate long sentences.
 */
export function splitTextForAudioTts(text: string, maxLen = 180): string[] {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (!cleaned) return [];
  if (cleaned.length <= maxLen) return [cleaned];

  const words = cleaned.split(' ');
  const chunks: string[] = [];
  let current = '';

  for (const word of words) {
    if (word.length > maxLen) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      for (let i = 0; i < word.length; i += maxLen) {
        chunks.push(word.slice(i, i + maxLen));
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxLen) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = word;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

/**
 * Builds standard MP3/audio stream URLs across 3 fallback tiers for HTML <audio> playback.
 */
export function buildAudioTtsUrl(chunk: string, lang = 'en-US', tier = 0): string {
  const encoded = encodeURIComponent(chunk);
  const normalizedLang = (lang || 'en-US').replace('_', '-');

  if (tier === 0) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(normalizedLang)}&client=tw-ob&q=${encoded}`;
  }
  if (tier === 1) {
    return `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(normalizedLang)}&client=gtx&q=${encoded}`;
  }
  return `https://dict.youdao.com/dictvoice?audio=${encoded}&type=2`;
}

export interface MediaSessionControls {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function setMediaSessionPlaybackState(state: 'none' | 'paused' | 'playing'): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    // ignore unsupported playbackState assignment
  }
}

function safeSetActionHandler(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // ignore individual unsupported MediaSessionAction on older mobile browsers
  }
}

export function updateMediaSessionState(
  title: string,
  artist: string,
  album: string,
  controls?: MediaSessionControls,
  playbackState?: 'none' | 'paused' | 'playing'
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || '영어 문장 반복 청취',
      artist: artist || 'RepeatEcho',
      album: album || '반복 섀도잉 학습'
    });
  } catch (err) {
    console.warn('MediaSession metadata error:', err);
  }

  if (playbackState) {
    setMediaSessionPlaybackState(playbackState);
  }

  if (controls) {
    if (controls.onPlay) safeSetActionHandler('play', controls.onPlay);
    if (controls.onPause) safeSetActionHandler('pause', controls.onPause);
    if (controls.onStop) safeSetActionHandler('stop', controls.onStop);
    if (controls.onPrevious) safeSetActionHandler('previoustrack', controls.onPrevious);
    if (controls.onNext) safeSetActionHandler('nexttrack', controls.onNext);
  }
}
