/**
 * Voice gender detection and classification helper for Web Speech API
 * Includes mobile-specific heuristics (iOS Safari Siri/Aaron/Daniel and Android Google/Samsung TTS)
 */

export const FEMALE_PITCH = 1.22; // 여성 고음역 맑은 톤
export const MALE_PITCH = 0.65;   // 남성 중저음 바리톤 톤 (스마트폰 단일 음성 환경에서도 뚜렷한 남성 목소리 구현)

const FEMALE_INDICATORS = [
  'female', 'woman', 'samantha', 'victoria', 'karen', 'zira', 'jenny', 'ava', 'emma',
  'sonia', 'fiona', 'moira', 'veena', 'tessa', 'susan', 'hazel', 'catherine',
  'natural (female)', 'google us english', 'en-us-standard-c', 'en-us-standard-e',
  'en-us-wavenet-c', 'en-us-wavenet-e', 'stephanie', 'allison', 'linda', 'joanna', 'kendra',
  'siri voice 2', 'siri voice 4', '여성', '여자'
];

const MALE_INDICATORS = [
  'male', 'man', 'alex', 'daniel', 'david', 'george', 'guy', 'fred', 'tom',
  'oliver', 'arthur', 'james', 'aaron', 'gordon', 'natural (male)', 'google uk english male',
  'en-us-standard-b', 'en-us-standard-d', 'en-us-wavenet-b', 'en-us-wavenet-d',
  'brian', 'rishi', 'matthew', 'justin', 'joey',
  // Mobile OS / Android TTS / iOS Siri patterns
  'siri voice 1', 'siri voice 3', 'voice 1', 'voice 3', 'voice 5',
  '#male', 'male_1', 'male_2', 'male-local', '남성', '남자',
  'en-us-x-iom', 'en-us-x-iol', 'en-us-x-tpd', 'en-gb-x-rjs', 'en-au-x-afh'
];

export function detectVoiceGender(voice: SpeechSynthesisVoice): 'female' | 'male' | 'unknown' {
  const name = voice.name.toLowerCase();
  for (const indicator of MALE_INDICATORS) {
    if (name.includes(indicator)) return 'male';
  }
  for (const indicator of FEMALE_INDICATORS) {
    if (name.includes(indicator)) return 'female';
  }
  return 'unknown';
}

export interface DualVoiceConfig {
  mode: 'alternate' | 'single';
  femaleVoiceURI: string;
  maleVoiceURI: string;
}

export function pickBestDefaultVoices(voices: SpeechSynthesisVoice[]): {
  femaleVoice: SpeechSynthesisVoice | null;
  maleVoice: SpeechSynthesisVoice | null;
} {
  const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
  const candidatePool = englishVoices.length > 0 ? englishVoices : voices;

  let female: SpeechSynthesisVoice | null = null;
  let male: SpeechSynthesisVoice | null = null;

  // 1. Explicit search
  for (const v of candidatePool) {
    const gender = detectVoiceGender(v);
    if (gender === 'male' && !male) {
      male = v;
    } else if (gender === 'female' && !female) {
      female = v;
    }
  }

  // 2. If no male found, search if there is any other voice different from female
  if (!male && female) {
    const alternateVoice = candidatePool.find((v) => v.voiceURI !== female?.voiceURI);
    if (alternateVoice) {
      male = alternateVoice;
    }
  }

  // 3. Fallbacks if one or both genders weren't matched
  if (!female && candidatePool.length > 0) {
    female = candidatePool[0];
  }
  if (!male && candidatePool.length > 1) {
    male = candidatePool[1];
  } else if (!male && candidatePool.length > 0) {
    male = candidatePool[0];
  }

  return { femaleVoice: female, maleVoice: male };
}

