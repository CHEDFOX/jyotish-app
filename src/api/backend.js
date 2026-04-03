const API_BASE_URL = 'https://api.plutto.space';

const _post = async (endpoint, body = {}) => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch (e) {
    console.error(`API ${endpoint}:`, e);
    return { success: false, error: e.message };
  }
};

const _get = async (endpoint) => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public${endpoint}`);
    return await r.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
};

const _bd = (kundliData) => {
  // Handle both formats: direct kundliData or nested
  if (kundliData?.raw?.birth_details) {
    return { kundli_data: kundliData };
  }
  // If kundliData IS the birth_details
  if (kundliData?.year || kundliData?.birth_details) {
    return { kundli_data: { raw: { birth_details: kundliData.birth_details || kundliData } } };
  }
  return { kundli_data: kundliData };
};
// ─── CORE ───

export const generateKundli = async (userData, birthData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/kundli/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userData?.name || 'User',
        date: { day: parseInt(birthData?.date?.day) || 1, month: birthData?.date?.monthIndex || 1, year: parseInt(birthData?.date?.year) || 2000 },
        time: { hour: parseInt(birthData?.time?.hour) || 12, minute: parseInt(birthData?.time?.minute) || 0 },
        place: { name: birthData?.place?.name || 'New Delhi', lat: birthData?.place?.lat || 28.6139, lng: birthData?.place?.lng || 77.2090 },
      }),
    });
    const data = await response.json();
    if (data.success) {
      const kundli = data.kundli || {};
      const planets = kundli.planets || {};
      const birthDate = `${birthData?.date?.year}-${String(birthData?.date?.monthIndex).padStart(2,'0')}-${String(birthData?.date?.day).padStart(2,'0')}`;
      return { success: true, data: {
        raw: { ...kundli, birth_details: { date: birthDate, time: `${String(birthData?.time?.hour).padStart(2,'0')}:${String(birthData?.time?.minute).padStart(2,'0')}`, latitude: birthData?.place?.lat, longitude: birthData?.place?.lng, place: birthData?.place?.name, year: parseInt(birthData?.date?.year), month: parseInt(birthData?.date?.monthIndex), day: parseInt(birthData?.date?.day), hour: parseInt(birthData?.time?.hour), minute: parseInt(birthData?.time?.minute) } },
        formatted: data.formatted, sun_sign: planets.Sun?.rashi_english || '', moon_sign: planets.Moon?.rashi_english || '', ascendant: kundli.ascendant?.rashi_english || '', nakshatra: planets.Moon?.nakshatra || '', current_dasha: kundli.current_dasha || {}, planets,
      }};
    }
    return { success: false, error: data.detail || 'Failed' };
  } catch (e) { return { success: false, error: e.message }; }
};

export const chatWithOracle = async (message, kundliData, history = [], language = 'en') => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, kundli_data: kundliData, history: history.slice(-8), language }) });
    return { success: true, data: await r.json() };
  } catch (e) { return { success: false, error: e.message }; }
};

export const transcribeAudio = async (audioUri) => {
  try {
    const fd = new FormData(); fd.append('file', { uri: audioUri, type: 'audio/m4a', name: 'audio.m4a' });
    const r = await fetch(`${API_BASE_URL}/api/public/whisper/transcribe`, { method: 'POST', body: fd });
    const d = await r.json(); return { success: true, transcript: d.text || d.transcript || '' };
  } catch (e) { return { success: false, error: e.message }; }
};

export const textToSpeech = async (text) => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const d = await r.json(); return d.audio ? { success: true, audio: d.audio, format: d.format } : { success: false, error: 'No audio' };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getDailyRitual = async (userData, kundliData) => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public/daily-ritual`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userData?.name || 'Seeker', kundli_data: kundliData }) });
    return await r.json();
  } catch (e) { return { success: false, error: e.message }; }
};

// ─── SHAREABLE ───
export const getSoulProfile = (k, lang = 'en') => _post('/soul-profile-v2', { ..._bd(k), language: lang });
export const getRareTraits = (k) => _post('/rare-traits', _bd(k));
export const getIdealPartner = (k, gender = 'any') => _post('/ideal-partner', { ..._bd(k), gender });
export const getDailyVibe = (k) => _post('/daily-vibe', _bd(k));
export const getYearMap = (k, year) => _post('/year-map', { ..._bd(k), year });
export const getGemstoneProfile = (k) => _post('/gemstone-profile', _bd(k));

// ─── COMPATIBILITY ───
export const getCosmicMatch = (p1, p2, type = 'marriage') => _post('/cosmic-match', { person1: p1, person2: p2, relationship_type: type });
export const getMatchOracle = (p1, p2, question, topic) => _post('/match-oracle', { person1: p1, person2: p2, question, topic });
export const getRelationshipXray = (p1, p2) => _post('/relationship-xray', { person1: p1, person2: p2 });

// ─── ENGAGEMENT ───
export const getPowerHours = (k) => _post('/power-hours', _bd(k));
export const getDangerRadar = (k, days = 90) => _post('/danger-radar', { ..._bd(k), days_ahead: days });
export const getMoneyCalendar = (k, year, month) => _post('/money-calendar', { ..._bd(k), year, month });
export const getPastEvent = (k, date, type = 'general') => _post('/past-event', { ..._bd(k), event_date: date, event_type: type });
export const getWhatIf = (k, scenario, details = {}) => _post('/what-if', { ..._bd(k), scenario, details });
export const getFamilyKarma = (k, members = []) => _post('/family-karma', { ..._bd(k), members });

// ─── UNIQUE ───
export const getCosmicNovel = (k) => _post('/cosmic-novel', _bd(k));
export const getPlanetStrength = (k) => _post('/planet-strength', _bd(k));

// ─── SPIRITUAL ───
export const getFestivals = (k, count = 5) => _post('/festivals', { ..._bd(k), count });
export const getPersonalDeities = (k) => _post('/personal-deities', _bd(k));
export const getPlanetDeity = (planet) => _get(`/planet-deity/${planet}`);

// ─── TOOLS ───
export const findMuhurta = (k, event = 'general', days = 90) => _post('/find-muhurta', { ..._bd(k), event, days });
export const getMuhurtaTopics = () => _get('/muhurta-topics');

export const saveUser = async () => ({ success: true });

export default {
  generateKundli, chatWithOracle, transcribeAudio, textToSpeech, getDailyRitual,
  getSoulProfile, getRareTraits, getIdealPartner, getDailyVibe, getYearMap, getGemstoneProfile,
  getCosmicMatch, getMatchOracle, getRelationshipXray,
  getPowerHours, getDangerRadar, getMoneyCalendar, getPastEvent, getWhatIf, getFamilyKarma,
  getCosmicNovel, getPlanetStrength,
  getFestivals, getPersonalDeities, getPlanetDeity,
  findMuhurta, getMuhurtaTopics, saveUser,
};