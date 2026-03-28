const API_BASE_URL = 'https://api.plutto.space';

export const generateKundli = async (userData, birthData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/kundli/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userData?.name || 'User',
        date: {
          day: parseInt(birthData?.date?.day) || 1,
          month: birthData?.date?.monthIndex || 1,
          year: parseInt(birthData?.date?.year) || 2000,
        },
        time: {
          hour: parseInt(birthData?.time?.hour) || 12,
          minute: parseInt(birthData?.time?.minute) || 0,
        },
        place: {
          name: birthData?.place?.name || 'New Delhi',
          lat: birthData?.place?.lat || 28.6139,
          lng: birthData?.place?.lng || 77.2090,
        },
      }),
    });
    const data = await response.json();
    if (data.success) {
      const kundli = data.kundli || {};
      const planets = kundli.planets || {};
      const birthDate = `${birthData?.date?.year}-${String(birthData?.date?.monthIndex).padStart(2, '0')}-${String(birthData?.date?.day).padStart(2, '0')}`;
      return { 
        success: true, 
        data: {
          raw: { ...kundli, birth_details: { date: birthDate, time: `${String(birthData?.time?.hour).padStart(2, '0')}:${String(birthData?.time?.minute).padStart(2, '0')}`, latitude: birthData?.place?.lat, longitude: birthData?.place?.lng, place: birthData?.place?.name, year: parseInt(birthData?.date?.year), month: parseInt(birthData?.date?.monthIndex), day: parseInt(birthData?.date?.day), hour: parseInt(birthData?.time?.hour), minute: parseInt(birthData?.time?.minute) } },
          formatted: data.formatted,
          sun_sign: planets.Sun?.rashi_english || '',
          moon_sign: planets.Moon?.rashi_english || '',
          ascendant: kundli.ascendant?.rashi_english || '',
          nakshatra: planets.Moon?.nakshatra || '',
          current_dasha: kundli.current_dasha || {},
          planets: planets,
        }
      };
    } else {
      return { success: false, error: data.detail || 'Kundli generation failed' };
    }
  } catch (error) {
    console.error('Kundli generation error:', error);
    return { success: false, error: error.message };
  }
};

export const chatWithOracle = async (message, kundliData, conversationHistory = [], language = 'en') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        kundli_data: kundliData,
        history: conversationHistory.slice(-8),
        language,
      }),
    });
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Chat error:', error);
    return { success: false, error: error.message };
  }
};

export const transcribeAudio = async (audioUri) => {
  try {
    const formData = new FormData();
    formData.append('file', { uri: audioUri, type: 'audio/m4a', name: 'audio.m4a' });
    const response = await fetch(`${API_BASE_URL}/api/public/whisper/transcribe`, { method: 'POST', body: formData });
    const data = await response.json();
    return { success: true, transcript: data.text || data.transcript || '' };
  } catch (error) {
    console.error('Transcription error:', error);
    return { success: false, error: error.message };
  }
};

export const textToSpeech = async (text) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    if (data.audio) return { success: true, audio: data.audio, format: data.format };
    return { success: false, error: 'No audio returned' };
  } catch (error) {
    console.error('TTS error:', error);
    return { success: false, error: error.message };
  }
};

export const getDailyRitual = async (userData, kundliData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/daily-ritual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userData?.name || 'Seeker', kundli_data: kundliData }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Daily ritual error:', error);
    return { success: false, error: error.message };
  }
};

export const saveUser = async (userData, birthData, kundliData) => {
  console.log('User data to save:', { userData, birthData, kundliData });
  return { success: true };
};

export default { generateKundli, chatWithOracle, transcribeAudio, textToSpeech, getDailyRitual, saveUser };