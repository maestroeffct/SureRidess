import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Typo } from '@/components/AppText/Typo';
import { useBrowseCountry } from '@/providers/CountryProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  DEFAULT_COUNTRY,
  flagForCountry,
  forcedLanguageForCountry,
} from '@/helpers/region';

const { width: W } = Dimensions.get('window');
const GREEN = '#0A6A4B';
const GREEN_DARK = '#064030';

// Same visual language as the marketing OnboardingScreen — solid colour
// background, big centred type, prominent CTA. Runs right after signup
// (see RootNavigator), before the welcome walkthrough — the `nextScreen`
// route param says where to go once a country is picked, so this stays
// reusable rather than hardcoding one destination.
export function CountrySelectScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const nextScreen = route.params?.nextScreen ?? 'PostAuthWalkthrough';
  const { t } = useTranslation('onboarding');
  const { country: currentCountry, setCountry, markets, refreshMarkets } =
    useBrowseCountry();
  const { setCurrency } = useCurrency();
  const { setLanguage } = useLanguage();
  const [selected, setSelected] = useState<string>(currentCountry || DEFAULT_COUNTRY);

  // Pull fresh markets on mount — onboarding is exactly the moment a brand
  // new install needs the latest list, before the user makes a choice.
  useEffect(() => {
    void refreshMarkets();
  }, [refreshMarkets]);

  const finish = (code: string) => {
    setCountry(code);
    const target = markets.find(m => m.code === code);
    if (target) setCurrency(target.currency);
    // Togo (and any other Francophone market added later) overrides
    // whatever language was auto-detected — no reason to keep showing
    // English once they've told us they're renting there.
    const forcedLang = forcedLanguageForCountry(code);
    if (forcedLang) setLanguage(forcedLang);
    navigation.replace(nextScreen);
  };

  const skip = () => finish(DEFAULT_COUNTRY);

  return (
    <View style={[s.root, { backgroundColor: GREEN }]}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />
      <SafeAreaView style={s.safe}>
        <TouchableOpacity style={s.skipBtn} onPress={skip} activeOpacity={0.7}>
          <Typo style={s.skipText}>{t('countrySelect.skip')}</Typo>
        </TouchableOpacity>

        <View style={s.content}>
          <View style={s.iconWrap}>
            <Icon name="earth-outline" size={64} color="#fff" />
          </View>

          <Typo style={s.title}>{t('countrySelect.title')}</Typo>
          <Typo style={s.subtitle}>{t('countrySelect.subtitle')}</Typo>

          <View style={s.grid}>
            {markets.map(c => {
              const isSelected = selected === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[s.tile, isSelected && s.tileSelected]}
                  onPress={() => setSelected(c.code)}
                  activeOpacity={0.85}
                >
                  <Typo style={s.tileFlag}>{flagForCountry(c.code)}</Typo>
                  <Typo
                    style={[s.tileName, isSelected && s.tileNameSelected]}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Typo>
                  {isSelected ? (
                    <View style={s.tileCheck}>
                      <Icon name="checkmark" size={12} color={GREEN_DARK} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={s.bottom}>
          {/* Custom CTA — AppButton's primary variant forces white text, which
              would be invisible on this white-on-green pill. */}
          <TouchableOpacity
            style={s.cta}
            onPress={() => finish(selected)}
            activeOpacity={0.85}
          >
            <Typo style={s.ctaText}>
              {t('countrySelect.continueWith', {
                name: markets.find(m => m.code === selected)?.name ?? 'Nigeria',
              })}
            </Typo>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const TILE_GAP = 10;
const TILE_W = (W - 28 * 2 - TILE_GAP) / 2;

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    justifyContent: 'center',
  },
  tile: {
    width: TILE_W,
    height: 90,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
  },
  tileSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  tileFlag: { fontSize: 28, lineHeight: 32 },
  tileName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  tileNameSelected: {
    color: GREEN_DARK,
    fontWeight: '700',
  },
  tileCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 106, 75, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  cta: {
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  ctaText: {
    color: GREEN_DARK,
    fontSize: 16,
    fontWeight: '700',
  },
});
