import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Platform, Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme';
import Starfield from '../../components/Starfield';
import * as API from '../../api/backend';

const { width: SW } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
// FEATURE CONFIGS — how to fetch and render each feature
// ═══════════════════════════════════════════════════════════════

const FEATURES = {
  'daily-vibe': {
    title: 'Your Vibe', titleHi: 'आपकी ऊर्जा',
    fetch: (k) => API.getDailyVibe(k),
    render: 'vibe',
  },
  'power-hours': {
    title: 'Power Hours', titleHi: 'शक्ति घंटे',
    fetch: (k) => API.getPowerHours(k),
    render: 'power_hours',
  },
  'planet-strength': {
    title: 'Planet Power', titleHi: 'ग्रह शक्ति',
    fetch: (k) => API.getPlanetStrength(k),
    render: 'planet_strength',
  },
  'festivals': {
    title: 'Festivals', titleHi: 'त्योहार',
    fetch: (k) => API.getFestivals(k),
    render: 'festivals',
  },
  'soul-profile': {
    title: 'Soul Profile', titleHi: 'आत्मा प्रोफ़ाइल',
    fetch: (k, lang) => API.getSoulProfile(k, lang),
    render: 'soul_profile',
  },
  'rare-traits': {
    title: 'Rare Traits', titleHi: 'दुर्लभ गुण',
    fetch: (k) => API.getRareTraits(k),
    render: 'rare_traits',
  },
  'cosmic-novel': {
    title: 'Your Life Story', titleHi: 'जीवन कहानी',
    fetch: (k) => API.getCosmicNovel(k),
    render: 'cosmic_novel',
  },
  'personal-deities': {
    title: 'Your Deities', titleHi: 'आपके देवता',
    fetch: (k) => API.getPersonalDeities(k),
    render: 'deities',
  },
  'danger-radar': {
    title: 'Danger Radar', titleHi: 'खतरा रडार',
    fetch: (k) => API.getDangerRadar(k),
    render: 'danger_radar',
  },
  'year-map': {
    title: 'Year Map', titleHi: 'वर्ष नक्शा',
    fetch: (k) => API.getYearMap(k, new Date().getFullYear()),
    render: 'year_map',
  },
  'gemstone-profile': {
    title: 'Gemstones', titleHi: 'रत्न',
    fetch: (k) => API.getGemstoneProfile(k),
    render: 'gemstones',
  },
  'money-calendar': {
    title: 'Money Calendar', titleHi: 'धन कैलेंडर',
    fetch: (k) => API.getMoneyCalendar(k),
    render: 'money_calendar',
  },
  'past-event': {
    title: 'Past Event', titleHi: 'पिछली घटना',
    fetch: null, // needs input
    render: 'past_event',
  },
  'what-if': {
    title: 'What If?', titleHi: 'क्या होगा?',
    fetch: null, // needs input
    render: 'what_if',
  },
  'family-karma': {
    title: 'Family Karma', titleHi: 'परिवार कर्म',
    fetch: null,
    render: 'family_karma',
'cosmic-match': {
    title: 'Cosmic Match', titleHi: 'कॉस्मिक मैच',
    fetch: null,
    render: 'cosmic_match',
  },
  'ideal-partner': {
    title: 'Ideal Partner', titleHi: 'आदर्श साथी',
    fetch: (k) => API.getIdealPartner(k),
    render: 'ideal_partner',
  },
  'match-oracle': {
    title: 'Match Oracle', titleHi: 'मैच ओरेकल',
    fetch: null,
    render: 'match_oracle',
  },
  'relationship-xray': {
    title: 'X-Ray', titleHi: 'एक्स-रे',
    fetch: null,
    render: 'relationship_xray',
  },
  'find-muhurta': {
    title: 'Best Date', titleHi: 'शुभ मुहूर्त',
    fetch: null,
    render: 'find_muhurta',
  },
    
},
  'cosmic-match': {
    title: 'Cosmic Match', titleHi: 'कॉस्मिक मैच',
    fetch: null,
    render: 'cosmic_match',
  },
  'ideal-partner': {
    title: 'Ideal Partner', titleHi: 'आदर्श साथी',
    fetch: (k) => API.getIdealPartner(k),
    render: 'ideal_partner',
  },
  'match-oracle': {
    title: 'Match Oracle', titleHi: 'मैच ओरेकल',
    fetch: null,
    render: 'match_oracle',
  },
  'relationship-xray': {
    title: 'Relationship X-Ray', titleHi: 'रिलेशनशिप एक्स-रे',
    fetch: null,
    render: 'relationship_xray',
  },
  'find-muhurta': {
    title: 'Best Date', titleHi: 'शुभ मुहूर्त',
    fetch: null,
    render: 'find_muhurta',
  },
};

// ═══════════════════════════════════════════════════════════════
// RENDERERS — template functions for each data type
// ═══════════════════════════════════════════════════════════════

const VibeRenderer = ({ data }) => (
  <View style={rs.section}>
    <Text style={rs.vibeEmoji}>{data.emoji}</Text>
    <Text style={rs.vibeTitle}>{data.vibe}</Text>
    <Text style={rs.vibeEnergy}>{data.energy_level}</Text>
    <View style={rs.divider} />
    <InfoRow label="Best for" value={data.best_for} />
    <InfoRow label="Avoid" value={data.avoid} />
    <InfoRow label="Color" value={data.color} />
    <InfoRow label="Mantra" value={data.mantra} gold />
    <View style={rs.divider} />
    <View style={rs.shiftRow}>
      <Text style={rs.shiftLabel}>Shifts in</Text>
      <Text style={rs.shiftValue}>{data.shifts_in}</Text>
    </View>
    {data.next_vibe && (
      <View style={rs.shiftRow}>
        <Text style={rs.shiftLabel}>Next vibe</Text>
        <Text style={rs.shiftValue}>{data.next_vibe.emoji} {data.next_vibe.vibe}</Text>
      </View>
    )}
    <View style={rs.divider} />
    <Text style={rs.dayNote}>{data.day_note}</Text>
  </View>
);

const PlanetStrengthRenderer = ({ data }) => (
  <View style={rs.section}>
    <Text style={rs.sectionLabel}>OVERALL: {data.overall_energy}</Text>
    <View style={rs.divider} />
    {data.planets?.map((p, i) => (
      <View key={i} style={rs.planetRow}>
        <Text style={rs.planetEmoji}>{p.emoji}</Text>
        <View style={rs.planetInfo}>
          <View style={rs.planetNameRow}>
            <Text style={rs.planetName}>{p.name}</Text>
            <Text style={[rs.planetStatus, p.status === 'PEAK' && { color: colors.gold }]}>{p.status}</Text>
          </View>
          <View style={rs.barBg}>
            <View style={[rs.barFill, { width: `${p.current_strength}%`, backgroundColor: p.status === 'PEAK' ? colors.gold : p.status === 'WEAK' ? colors.error : 'rgba(255,255,255,0.4)' }]} />
          </View>
          <Text style={rs.planetDomain}>{p.domain}</Text>
          {p.modifiers?.length > 0 && <Text style={rs.modifiers}>{p.modifiers.join(' · ')}</Text>}
        </View>
        <Text style={rs.planetPct}>{p.current_strength}%</Text>
      </View>
    ))}
  </View>
);

const SoulProfileRenderer = ({ data }) => (
  <View style={rs.section}>
    <Text style={rs.archetype}>{data.archetype}</Text>
    <Text style={rs.archetypeTrait}>{data.archetype_trait}</Text>
    <View style={rs.divider} />
    <InfoRow label="Mind" value={data.mind_style} />
    <InfoRow label="Love" value={data.love_style} />
    <InfoRow label="Drive" value={data.drive_style} />
    <InfoRow label="Purpose" value={data.purpose} />
    <View style={rs.divider} />
    <InfoRow label="Superpower" value={data.superpower} gold />
    <InfoRow label="Blind spot" value={data.blind_spot} />
    <InfoRow label="Life theme" value={data.life_theme} />
    <InfoRow label="Element" value={data.element} />
    <View style={rs.divider} />
    <PillarBar label="Dharma" value={data.dharma} strength={data.dharma_strength} />
    <PillarBar label="Karma" value={data.karma} strength={data.karma_strength} />
    <PillarBar label="Kama" value={data.kama} strength={data.kama_strength} />
    <PillarBar label="Moksha" value={data.moksha} strength={data.moksha_strength} />
  </View>
);

const RareTraitsRenderer = ({ data }) => (
  <View style={rs.section}>
    <Text style={rs.sectionLabel}>{data.count} RARE TRAITS FOUND</Text>
    <View style={rs.divider} />
    {data.traits?.map((t, i) => (
      <View key={i} style={rs.traitCard}>
        <View style={rs.traitHeader}>
          <Text style={rs.traitTitle}>{t.title}</Text>
          <View style={rs.rarityBadge}>
            <Text style={rs.rarityText}>{t.rarity}</Text>
          </View>
        </View>
        <Text style={rs.traitDesc}>{t.description}</Text>
      </View>
    ))}
  </View>
);

const CosmicNovelRenderer = ({ data }) => (
  <View style={rs.section}>
    <Text style={rs.bookTitle}>📖 {data.book_title}</Text>
    <Text style={rs.pageNum}>Page {data.current_page} of {data.total_pages}</Text>
    <View style={rs.divider} />
    {data.current_chapter && (
      <View style={rs.currentChapter}>
        <Text style={rs.chapterCurrent}>
          Chapter {data.current_chapter.number}: "{data.current_chapter.title}" {data.current_chapter.emoji}
        </Text>
        <View style={rs.progressBg}>
          <View style={[rs.progressFill, { width: `${data.current_chapter.progress_pct}%` }]} />
        </View>
        <Text style={rs.progressText}>{data.current_chapter.progress_pct}% through this chapter · {data.current_chapter.years_remaining} years left</Text>
      </View>
    )}
    {data.current_scene && (
      <View style={rs.sceneBox}>
        <Text style={rs.sceneLabel}>CURRENT SCENE</Text>
        <Text style={rs.sceneTitle}>"{data.current_scene.title}"</Text>
        <Text style={rs.sceneMood}>{data.current_scene.mood}</Text>
        <Text style={rs.sceneEnds}>Ends: {data.current_scene.ends}</Text>
      </View>
    )}
    {data.plot_twist && (
      <View style={[rs.sceneBox, { borderColor: 'rgba(212,175,55,0.2)' }]}>
        <Text style={[rs.sceneLabel, { color: colors.gold }]}>PLOT TWIST</Text>
        <Text style={rs.sceneTitle}>{data.plot_twist.description}</Text>
      </View>
    )}
    <View style={rs.divider} />
    <Text style={rs.sectionLabel}>ALL CHAPTERS</Text>
    {data.chapters?.map((ch, i) => (
      <View key={i} style={[rs.chapterRow, ch.is_current && rs.chapterRowActive]}>
        <Text style={rs.chapterEmoji}>{ch.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[rs.chapterTitle, ch.is_current && { color: colors.white }]}>
            Ch.{ch.number}: "{ch.title}"
          </Text>
          <Text style={rs.chapterAge}>Ages {ch.start_age}–{ch.end_age} · {ch.genre}</Text>
        </View>
        {ch.is_current && <Text style={rs.currentBadge}>NOW</Text>}
      </View>
    ))}
  </View>
);

const FestivalsRenderer = ({ data }) => (
  <View style={rs.section}>
    {data.upcoming?.map((f, i) => (
      <View key={i} style={rs.festCard}>
        <View style={rs.festHeader}>
          <Text style={rs.festName}>{f.name}</Text>
          <Text style={rs.festDays}>{f.days_away}d</Text>
        </View>
        <Text style={rs.festDate}>{f.date} · {f.deity}</Text>
        <Text style={rs.festAstro}>{f.astro_note}</Text>
        {f.personal_impact && (
          <View style={rs.festImpact}>
            <Text style={rs.festImpactLevel}>{f.personal_impact.emoji} {f.personal_impact.impact_level}</Text>
            <Text style={rs.festImpactNote}>{f.personal_impact.note}</Text>
            {f.personal_impact.personal_ritual ? <Text style={rs.festRitual}>{f.personal_impact.personal_ritual}</Text> : null}
          </View>
        )}
      </View>
    ))}
  </View>
);

const DeitiesRenderer = ({ data }) => (
  <View style={rs.section}>
    {data.recommendations?.map((r, i) => (
      <View key={i} style={rs.deityCard}>
        <Text style={rs.deityPriority}>{r.priority}</Text>
        <Text style={rs.deityName}>{r.deity}</Text>
        <Text style={rs.deityMantra}>{r.mantra}</Text>
        <Text style={rs.deityDay}>{r.day}</Text>
        <Text style={rs.deityReason}>{r.reason}</Text>
      </View>
    ))}
  </View>
);

const DangerRadarRenderer = ({ data }) => (
  <View style={rs.section}>
    <Text style={[rs.sectionLabel, data.critical_count > 0 ? { color: colors.error } : { color: colors.success }]}>
      {data.safety_level}
    </Text>
    <View style={rs.divider} />
    {data.alerts?.length === 0 && <Text style={rs.emptyText}>No alerts — smooth sailing ahead</Text>}
    {data.alerts?.map((a, i) => (
      <View key={i} style={[rs.alertCard, a.severity === 'CRITICAL' && { borderColor: 'rgba(255,59,48,0.3)' }]}>
        <View style={rs.alertHeader}>
          <Text style={rs.alertEmoji}>{a.emoji}</Text>
          <Text style={rs.alertType}>{a.type}</Text>
          <Text style={rs.alertDays}>{a.days_until}d</Text>
        </View>
        <Text style={rs.alertDesc}>{a.description}</Text>
        <Text style={rs.alertAdvice}>{a.advice}</Text>
      </View>
    ))}
  </View>
);

const YearMapRenderer = ({ data }) => (
  <View style={rs.section}>
    <Text style={rs.yearTheme}>{data.year_theme}</Text>
    <Text style={rs.yearPeak}>Peak: {data.peak_period}</Text>
    <View style={rs.divider} />
    {data.months?.map((m, i) => (
      <View key={i} style={rs.monthRow}>
        <Text style={rs.monthName}>{m.short}</Text>
        <View style={rs.monthBarBg}>
          <View style={[rs.monthBarFill, {
            width: `${m.score}%`,
            backgroundColor: m.score >= 65 ? colors.gold : m.score >= 50 ? 'rgba(255,255,255,0.3)' : colors.error + '60',
          }]} />
        </View>
        <Text style={rs.monthScore}>{m.score}</Text>
      </View>
    ))}
    <View style={rs.divider} />
    <InfoRow label="Best month" value={data.best_month?.name} gold />
    <InfoRow label="Challenge" value={data.challenge_month?.name} />
  </View>
);

const GemstonesRenderer = ({ data }) => (
  <View style={rs.section}>
    {data.current_phase && (
      <View style={[rs.gemCard, { borderColor: data.current_phase.color + '30' }]}>
        <Text style={rs.gemStatus}>{data.current_phase.status}</Text>
        <Text style={rs.gemName}>{data.current_phase.gemstone} ({data.current_phase.gemstone_hindi})</Text>
        <Text style={rs.gemPlanet}>Planet: {data.current_phase.planet} · Until {data.current_phase.phase_ends}</Text>
        <InfoRow label="Metal" value={data.current_phase.metal} />
        <InfoRow label="Finger" value={data.current_phase.finger} />
        <InfoRow label="Day" value={data.current_phase.day} />
        <InfoRow label="Price" value={data.current_phase.price_range} />
        <Text style={rs.gemMantra}>{data.current_phase.mantra}</Text>
      </View>
    )}
    <Text style={rs.sectionLabel}>UPCOMING PHASES</Text>
    {data.upcoming_phases?.map((u, i) => (
      <View key={i} style={rs.gemUpcoming}>
        <Text style={rs.gemUpName}>{u.gemstone}</Text>
        <Text style={rs.gemUpDate}>{u.phase_starts} → {u.phase_ends}</Text>
        <Text style={rs.gemUpStatus}>{u.status}</Text>
      </View>
    ))}
    {data.weakness_remedies?.length > 0 && (
      <>
        <View style={rs.divider} />
        <Text style={rs.sectionLabel}>WEAKNESS REMEDIES</Text>
        {data.weakness_remedies.map((w, i) => (
          <View key={i} style={rs.gemWeak}>
            <Text style={rs.gemWeakName}>{w.gemstone} for {w.planet}</Text>
            <Text style={rs.gemWeakIssue}>{w.issues?.join(', ')} — {w.severity}</Text>
          </View>
        ))}
      </>
    )}
    {data.conflicts?.length > 0 && (
      <>
        <View style={rs.divider} />
        {data.conflicts.map((c, i) => (
          <Text key={i} style={rs.gemConflict}>⚠️ {c.warning}</Text>
        ))}
      </>
    )}
  </View>
);

const MoneyCalendarRenderer = ({ data }) => (
  <View style={rs.section}>
    <Text style={rs.sectionLabel}>{data.verdict}</Text>
    <View style={rs.divider} />
    <Text style={rs.sectionLabel}>BEST DAYS TO INVEST</Text>
    {data.best_invest_days?.map((d, i) => (
      <View key={i} style={rs.moneyDay}>
        <Text style={rs.moneyDayDate}>{d.date}</Text>
        <Text style={rs.moneyDayName}>{d.day}</Text>
        <Text style={rs.moneyDayScore}>💰 {d.score}/10</Text>
      </View>
    ))}
    <View style={rs.divider} />
    <Text style={rs.sectionLabel}>DANGER DAYS</Text>
    {data.danger_days?.map((d, i) => (
      <View key={i} style={rs.moneyDay}>
        <Text style={rs.moneyDayDate}>{d.date}</Text>
        <Text style={rs.moneyDayName}>{d.day}</Text>
        <Text style={[rs.moneyDayScore, { color: colors.error }]}>⚠️</Text>
      </View>
    ))}
  </View>
);

const PowerHoursRenderer = ({ data }) => (
  <View style={rs.section}>
    <Text style={rs.sectionLabel}>DAY: {data.day} · LORD: {data.day_lord}</Text>
    {data.current_hora && (
      <View style={[rs.sceneBox, { borderColor: 'rgba(212,175,55,0.3)' }]}>
        <Text style={rs.sceneLabel}>RIGHT NOW</Text>
        <Text style={rs.vibeEmoji}>{data.current_hora.emoji}</Text>
        <Text style={rs.vibeTitle}>{data.current_hora.energy}</Text>
        <Text style={rs.festAstro}>{data.current_hora.best_for}</Text>
      </View>
    )}
    <View style={rs.divider} />
    {data.all_hours?.filter(h => h.period === 'day').map((h, i) => (
      <View key={i} style={[rs.horaRow, h.is_current && rs.horaRowActive]}>
        <Text style={rs.horaTime}>{h.start}</Text>
        <Text style={rs.horaEmoji}>{h.emoji}</Text>
        <Text style={[rs.horaName, h.is_current && { color: colors.gold }]}>{h.planet}</Text>
        <View style={rs.horaDots}>
          {Array.from({ length: h.power_level }, (_, j) => (
            <View key={j} style={[rs.horaDot, h.power_level >= 8 && { backgroundColor: colors.gold }]} />
          ))}
        </View>
      </View>
    ))}
  </View>
);

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════

const InfoRow = ({ label, value, gold }) => (
  <View style={rs.infoRow}>
    <Text style={rs.infoLabel}>{label}</Text>
    <Text style={[rs.infoValue, gold && { color: colors.gold }]} numberOfLines={3}>{value}</Text>
  </View>
);

const PillarBar = ({ label, value, strength }) => (
  <View style={rs.pillarRow}>
    <Text style={rs.pillarLabel}>{label}</Text>
    <View style={rs.pillarBarBg}>
      <View style={[rs.pillarBarFill, { width: `${(strength || 0) * 100}%` }]} />
    </View>
    <Text style={rs.pillarValue}>{value}</Text>
  </View>
);

// Renderer map
const RENDERERS = {
  vibe: VibeRenderer,
  planet_strength: PlanetStrengthRenderer,
  soul_profile: SoulProfileRenderer,
  rare_traits: RareTraitsRenderer,
  cosmic_novel: CosmicNovelRenderer,
  festivals: FestivalsRenderer,
  deities: DeitiesRenderer,
  danger_radar: DangerRadarRenderer,
  year_map: YearMapRenderer,
  gemstones: GemstonesRenderer,
  money_calendar: MoneyCalendarRenderer,
  power_hours: PowerHoursRenderer,
};

// ═══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════

export default function FeatureScreen({ featureId, kundliData, language, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = FEATURES[featureId];
  const isHindi = language === 'hi';
  const title = isHindi ? (config?.titleHi || config?.title) : config?.title;

  useEffect(() => {
    if (!config?.fetch) {
      setLoading(false);
      setError('Coming soon — this feature needs additional setup');
      return;
    }
    loadData();
  }, [featureId]);

 const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('=== FEATURE DEBUG ===');
      console.log('featureId:', featureId);
      console.log('kundliData keys:', kundliData ? Object.keys(kundliData) : 'NULL');
      console.log('has raw:', !!kundliData?.raw);
      console.log('has birth_details:', !!kundliData?.raw?.birth_details);
      if (kundliData?.raw?.birth_details) {
        console.log('birth_details:', JSON.stringify(kundliData.raw.birth_details));
      }
      
      const result = await config.fetch(kundliData, language);
      console.log('API result success:', result?.success);
      console.log('API result error:', result?.error);
      console.log('API result data:', result?.data ? 'YES' : 'NO');
      
      if (result?.success && result?.data) {
        setData(result.data);
      } else {
        setError(result?.error || 'Failed to load');
      }
    } catch (e) {
      console.log('CATCH ERROR:', e.message);
      setError(e.message);
    }
    setLoading(false);
  };

  const handleShare = useCallback(async () => {
    const shareText = data?.share_text || `Check out my ${title} on Jyotish AI`;
    try {
      await Share.share({ message: shareText });
    } catch (e) {}
  }, [data, title]);

  const Renderer = RENDERERS[config?.render];

  return (
    <View style={s.container}>
      <Starfield />
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBack(); }} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>{title || 'Feature'}</Text>
        {data?.share_text && (
          <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
            <Text style={s.shareText}>Share</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.gold} size="small" />
          <Text style={s.loadingText}>Reading the stars...</Text>
        </View>
      ) : error ? (
        <View style={s.errorWrap}>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadData} style={s.retryBtn}>
            <Text style={s.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {Renderer && data ? <Renderer data={data} /> : (
            <Text style={s.fallback}>Feature coming soon</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 28, fontWeight: '200', color: 'rgba(255,255,255,0.5)' },
  title: { flex: 1, fontSize: 20, fontWeight: '200', color: colors.white, letterSpacing: 0.5, textAlign: 'center' },
  shareBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.3)' },
  shareText: { fontSize: 12, fontWeight: '400', color: colors.gold, letterSpacing: 0.5 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 40 },
  errorText: { fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)' },
  retryText: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.5)' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  fallback: { fontSize: 14, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 40 },
});

const rs = StyleSheet.create({
  section: { marginTop: 8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },

  // Vibe
  vibeEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  vibeTitle: { fontSize: 24, fontWeight: '200', color: colors.white, textAlign: 'center', letterSpacing: 1 },
  vibeEnergy: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 4, letterSpacing: 0.5 },
  shiftRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  shiftLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  shiftValue: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  dayNote: { fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontStyle: 'italic' },

  // Info rows
  infoRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  infoLabel: { width: 90, fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5, textTransform: 'uppercase' },
  infoValue: { flex: 1, fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.75)', lineHeight: 20 },

  // Planet strength
  planetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  planetEmoji: { fontSize: 20, width: 32 },
  planetInfo: { flex: 1, marginLeft: 8 },
  planetNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  planetName: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.8)' },
  planetStatus: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
  barBg: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)' },
  barFill: { height: 3, borderRadius: 2 },
  planetDomain: { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 },
  modifiers: { fontSize: 10, color: colors.gold, marginTop: 2, letterSpacing: 0.3 },
  planetPct: { fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.5)', width: 40, textAlign: 'right' },

  // Soul profile
  archetype: { fontSize: 28, fontWeight: '200', color: colors.white, textAlign: 'center', letterSpacing: 2 },
  archetypeTrait: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 6, letterSpacing: 0.3 },

  // Pillar bars
  pillarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pillarLabel: { width: 60, fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 },
  pillarBarBg: { width: 60, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 8 },
  pillarBarFill: { height: 3, borderRadius: 2, backgroundColor: colors.gold },
  pillarValue: { flex: 1, fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.5)' },

  // Rare traits
  traitCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' },
  traitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  traitTitle: { fontSize: 16, fontWeight: '400', color: colors.white, flex: 1 },
  rarityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(212,175,55,0.1)', borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.2)' },
  rarityText: { fontSize: 10, fontWeight: '500', color: colors.gold, letterSpacing: 0.3 },
  traitDesc: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.55)', lineHeight: 20 },

  // Cosmic novel
  bookTitle: { fontSize: 22, fontWeight: '200', color: colors.white, textAlign: 'center', letterSpacing: 1 },
  pageNum: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 4 },
  currentChapter: { marginBottom: 16 },
  chapterCurrent: { fontSize: 15, fontWeight: '300', color: colors.gold, marginBottom: 8 },
  progressBg: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)' },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: colors.gold },
  progressText: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 },
  sceneBox: { padding: 16, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)', marginVertical: 8 },
  sceneLabel: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  sceneTitle: { fontSize: 15, fontWeight: '300', color: 'rgba(255,255,255,0.7)' },
  sceneMood: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.35)', marginTop: 4, fontStyle: 'italic' },
  sceneEnds: { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  chapterRowActive: { backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: 8, paddingHorizontal: 8, marginHorizontal: -8 },
  chapterEmoji: { fontSize: 18, width: 30 },
  chapterTitle: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.5)' },
  chapterAge: { fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 },
  currentBadge: { fontSize: 9, fontWeight: '600', color: colors.gold, letterSpacing: 1 },

  // Festivals
  festCard: { padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  festHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  festName: { fontSize: 16, fontWeight: '400', color: colors.white },
  festDays: { fontSize: 12, fontWeight: '500', color: colors.gold },
  festDate: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  festAstro: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 18 },
  festImpact: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  festImpactLevel: { fontSize: 12, fontWeight: '500', color: colors.gold },
  festImpactNote: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.45)', marginTop: 4, lineHeight: 18 },
  festRitual: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.35)', marginTop: 6, fontStyle: 'italic' },

  // Deities
  deityCard: { padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  deityPriority: { fontSize: 9, fontWeight: '600', color: colors.gold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  deityName: { fontSize: 18, fontWeight: '300', color: colors.white },
  deityMantra: { fontSize: 13, fontWeight: '300', color: 'rgba(212,175,55,0.7)', marginTop: 6, fontStyle: 'italic' },
  deityDay: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 },
  deityReason: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 18 },

  // Danger radar
  emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 20 },
  alertCard: { padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 10 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  alertEmoji: { fontSize: 16 },
  alertType: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.7)', flex: 1 },
  alertDays: { fontSize: 11, fontWeight: '500', color: colors.gold },
  alertDesc: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  alertAdvice: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.3)', marginTop: 6, fontStyle: 'italic' },

  // Year map
  yearTheme: { fontSize: 18, fontWeight: '200', color: colors.white, textAlign: 'center', letterSpacing: 0.5 },
  yearPeak: { fontSize: 12, color: colors.gold, textAlign: 'center', marginTop: 4 },
  monthRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  monthName: { width: 32, fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.4)' },
  monthBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 8 },
  monthBarFill: { height: 6, borderRadius: 3 },
  monthScore: { width: 24, fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.4)', textAlign: 'right' },

  // Gemstones
  gemCard: { padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, marginBottom: 16 },
  gemStatus: { fontSize: 10, fontWeight: '600', color: colors.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  gemName: { fontSize: 20, fontWeight: '200', color: colors.white, letterSpacing: 0.5 },
  gemPlanet: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4, marginBottom: 12 },
  gemMantra: { fontSize: 13, fontWeight: '300', color: 'rgba(212,175,55,0.6)', marginTop: 12, fontStyle: 'italic', textAlign: 'center' },
  gemUpcoming: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  gemUpName: { fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.7)', flex: 1 },
  gemUpDate: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  gemUpStatus: { fontSize: 9, fontWeight: '600', color: colors.gold, letterSpacing: 0.5, marginLeft: 8 },
  gemWeak: { paddingVertical: 8 },
  gemWeakName: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.6)' },
  gemWeakIssue: { fontSize: 11, color: 'rgba(255,59,48,0.6)', marginTop: 2 },
  gemConflict: { fontSize: 12, color: 'rgba(255,59,48,0.5)', marginTop: 8, lineHeight: 18 },

  // Money calendar
  moneyDay: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  moneyDayDate: { width: 90, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  moneyDayName: { flex: 1, fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.6)' },
  moneyDayScore: { fontSize: 12, fontWeight: '500', color: colors.gold },

  // Power hours
  horaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.03)' },
  horaRowActive: { backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 8 },
  horaTime: { width: 70, fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  horaEmoji: { fontSize: 16, width: 28 },
  horaName: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.6)', width: 70 },
  horaDots: { flexDirection: 'row', gap: 3, flex: 1 },
  horaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
});