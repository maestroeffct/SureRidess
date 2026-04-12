import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import { removeItem, StorageKeys } from '@/helpers/storage';

const APP_VERSION = '1.0.0';

/* ─────────────────────────────────────────────── */
/*  Sub-components                                 */
/* ─────────────────────────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <Typo style={[s.sectionHeader, { color: colors.textSecondary }]}>
      {title}
    </Typo>
  );
}

function MenuRow({
  icon,
  iconBg,
  label,
  sublabel,
  onPress,
  danger,
  badge,
}: {
  icon: string;
  iconBg?: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[s.menuRow, { borderTopColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          s.menuIconWrap,
          { backgroundColor: iconBg ?? colors.background },
          danger && { backgroundColor: '#FEF2F2' },
        ]}
      >
        <Icon
          name={icon as any}
          size={18}
          color={danger ? '#EF4444' : iconBg ? '#fff' : colors.textPrimary}
        />
      </View>

      <View style={s.menuText}>
        <Typo
          style={[
            s.menuLabel,
            { color: danger ? '#EF4444' : colors.textPrimary },
          ]}
        >
          {label}
        </Typo>
        {sublabel ? (
          <Typo style={[s.menuSub, { color: colors.textSecondary }]}>
            {sublabel}
          </Typo>
        ) : null}
      </View>

      {badge ? (
        <View style={s.badge}>
          <Typo style={s.badgeText}>{badge}</Typo>
        </View>
      ) : (
        !danger && (
          <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
        )
      )}
    </TouchableOpacity>
  );
}

/* ─────────────────────────────────────────────── */
/*  Main Screen                                    */
/* ─────────────────────────────────────────────── */

export function MoreScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const handleSwitchModule = () => {
    Alert.alert(
      'Switch Module',
      'Go back to the SureRide home screen to choose a different service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            await removeItem(StorageKeys.LAST_MODULE);
            navigation.navigate('Home');
          },
        },
      ],
    );
  };

  const handleContact = () => {
    Linking.openURL('mailto:support@sureride.ng').catch(() => {});
  };

  const handleComingSoon = () => {
    Alert.alert('Coming Soon', 'This feature will be available in a future update.');
  };

  return (
    <ScreenWrapper padded={false}>
      {/* HEADER */}
      <View
        style={[
          s.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Typo style={[s.headerTitle, { color: colors.textPrimary }]}>More</Typo>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── SWITCH MODULE CARD ── */}
        <TouchableOpacity
          style={s.switchCard}
          activeOpacity={0.88}
          onPress={handleSwitchModule}
        >
          <View style={s.switchLeft}>
            <View style={s.switchIconWrap}>
              <Icon name="apps-outline" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Typo style={s.switchTitle}>Switch Module</Typo>
              <Typo style={s.switchSub}>
                Explore other SureRide services
              </Typo>
            </View>
          </View>
          <Icon name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

        {/* ── SERVICES ── */}
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <SectionHeader title="More Services" />
          <MenuRow
            icon="bicycle-outline"
            iconBg="#7C3AED"
            label="Ride Share"
            sublabel="Coming soon"
            onPress={handleComingSoon}
            badge="Soon"
          />
          <MenuRow
            icon="construct-outline"
            iconBg="#0369A1"
            label="Mobile Mechanic"
            sublabel="Coming soon"
            onPress={handleComingSoon}
            badge="Soon"
          />
          <MenuRow
            icon="alert-circle-outline"
            iconBg="#DC2626"
            label="Emergency Assistance"
            sublabel="Coming soon"
            onPress={handleComingSoon}
            badge="Soon"
          />
          <MenuRow
            icon="shield-checkmark-outline"
            iconBg="#2F6F62"
            label="Insurance"
            sublabel="Coming soon"
            onPress={handleComingSoon}
            badge="Soon"
          />
        </View>

        {/* ── HELP & SUPPORT ── */}
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <SectionHeader title="Help & Support" />
          <MenuRow
            icon="mail-outline"
            label="Contact Us"
            sublabel="support@sureride.ng"
            onPress={handleContact}
          />
          <MenuRow
            icon="help-circle-outline"
            label="FAQ"
            onPress={handleComingSoon}
          />
          <MenuRow
            icon="chatbubble-ellipses-outline"
            label="Live Chat"
            sublabel="Coming soon"
            onPress={handleComingSoon}
          />
        </View>

        {/* ── LEGAL ── */}
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <SectionHeader title="Legal" />
          <MenuRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={handleComingSoon}
          />
          <MenuRow
            icon="lock-closed-outline"
            label="Privacy Policy"
            onPress={handleComingSoon}
          />
        </View>

        {/* ── ABOUT ── */}
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <SectionHeader title="About" />
          <View style={[s.aboutRow, { borderTopColor: colors.border }]}>
            <Typo style={[s.aboutLabel, { color: colors.textSecondary }]}>
              Version
            </Typo>
            <Typo style={[s.aboutValue, { color: colors.textPrimary }]}>
              {APP_VERSION}
            </Typo>
          </View>
          <View style={[s.aboutRow, { borderTopColor: colors.border }]}>
            <Typo style={[s.aboutLabel, { color: colors.textSecondary }]}>
              App
            </Typo>
            <Typo style={[s.aboutValue, { color: colors.textPrimary }]}>
              SureRide
            </Typo>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

export default MoreScreen;

/* ─────────────────────────────────────────────── */
/*  Styles                                         */
/* ─────────────────────────────────────────────── */

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },

  /* switch module */
  switchCard: {
    margin: 16,
    backgroundColor: '#0A6A4B',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  switchIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },

  /* card */
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },

  /* menu row */
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: 1,
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  menuSub: {
    fontSize: 12,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },

  /* about rows */
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: 1,
  },
  aboutLabel: {
    fontSize: 14,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
