import React, { useState } from 'react';
import { StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Typo } from '@/components/AppText/Typo';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { AppLanguage } from '@/i18n';

const GREEN = '#0A6A4B';
const GREEN_DARK = '#064030';

/** Same visual language as CountrySelectScreen — sits right after the
 *  marketing Onboarding screen, before CountrySelect. Manual pick here can
 *  still be overridden by CountrySelect if the chosen country is
 *  Francophone (see forcedLanguageForCountry). */
export function LanguageSelectScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation('onboarding');
  const { language, setLanguage } = useLanguage();
  const [selected, setSelected] = useState<AppLanguage>(language);

  const options: { code: AppLanguage; label: string; flag: string }[] = [
    { code: 'en', label: t('languageSelect.english'), flag: '🇬🇧' },
    { code: 'fr', label: t('languageSelect.french'), flag: '🇫🇷' },
  ];

  const finish = () => {
    setLanguage(selected);
    navigation.replace('CountrySelect');
  };

  return (
    <View style={[s.root, { backgroundColor: GREEN }]}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />
      <SafeAreaView style={s.safe}>
        <View style={s.content}>
          <View style={s.iconWrap}>
            <Icon name="language-outline" size={64} color="#fff" />
          </View>

          <Typo style={s.title}>{t('languageSelect.title')}</Typo>
          <Typo style={s.subtitle}>{t('languageSelect.subtitle')}</Typo>

          <View style={s.grid}>
            {options.map(opt => {
              const isSelected = selected === opt.code;
              return (
                <TouchableOpacity
                  key={opt.code}
                  style={[s.tile, isSelected && s.tileSelected]}
                  onPress={() => setSelected(opt.code)}
                  activeOpacity={0.85}
                >
                  <Typo style={s.tileFlag}>{opt.flag}</Typo>
                  <Typo
                    style={[s.tileName, isSelected && s.tileNameSelected]}
                    numberOfLines={1}
                  >
                    {opt.label}
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
          <TouchableOpacity style={s.cta} onPress={finish} activeOpacity={0.85}>
            <Typo style={s.ctaText}>{t('languageSelect.continue')}</Typo>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
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
    gap: 10,
    justifyContent: 'center',
  },
  tile: {
    width: 140,
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
