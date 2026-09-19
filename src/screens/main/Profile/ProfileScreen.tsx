import React, { useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppAlert } from '@/components/AppAlert/AppAlert';
import Icon from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { AppBottomSheet } from '@/components/AppBottomSheet/AppBottomSheet';
import { useAuth } from '@/providers/AuthProvider';
import { logoutUser } from '@/services/auth.service';
import { updateProfile, updatePassword } from '@/services/user.service';
import { removeItem, StorageKeys } from '@/helpers/storage';
import { showError, showSuccess } from '@/helpers/toast';
import { useTheme } from '@/theme/ThemeProvider';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { useBrowseCountry } from '@/providers/CountryProvider';
import { AppSelectSheet } from '@/components/AppSelectSheet/AppSelectSheet';
import { SUPPORTED_CURRENCIES, symbolFor } from '@/helpers/currency';
import { flagForCountry } from '@/helpers/region';
import { CURRENT_BUILD_CODE, CURRENT_VERSION_NAME } from '@/config/appVersion';
import dayjs from 'dayjs';

/* ──────────────────────────────────────────────── */
/*  Helpers                                         */
/* ──────────────────────────────────────────────── */

function initials(first?: string | null, last?: string | null) {
  const f = (first ?? '').trim()[0] ?? '';
  const l = (last ?? '').trim()[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

function formatDate(raw?: string | null) {
  if (!raw) return '—';
  const d = dayjs(raw);
  return d.isValid() ? d.format('D MMM YYYY') : raw;
}

/* ──────────────────────────────────────────────── */
/*  Sub-components                                  */
/* ──────────────────────────────────────────────── */

function InfoRow({
  icon,
  label,
  value,
  verified,
}: {
  icon: string;
  label: string;
  value?: string | null;
  verified?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={s.infoRow}>
      <View style={s.infoIconWrap}>
        <Icon name={icon as any} size={17} color="#0A6A4B" />
      </View>
      <View style={s.infoContent}>
        <Typo style={[s.infoLabel, { color: colors.textSecondary }]}>{label}</Typo>
        <Typo style={[s.infoValue, { color: colors.textPrimary }]}>{value || '—'}</Typo>
      </View>
      {verified && (
        <Icon name="checkmark-circle" size={18} color="#22C55E" />
      )}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Typo style={s.sectionHeader}>{title}</Typo>;
}

type ColorTokens = ReturnType<typeof useTheme>['colors'];

function SectionLabel({ title, colors }: { title: string; colors: ColorTokens }) {
  return (
    <Typo style={[s.sectionLabel, { color: colors.textSecondary }]}>
      {title.toUpperCase()}
    </Typo>
  );
}

type TrailingKind = 'pencil' | 'check' | 'chevron';

// Single-line settings row used across Personal / Preferences / Support /
// Legal. Pass `onPress` to make it tappable (pencil and chevron trailing
// indicators imply tappable). `isFirst` suppresses the top border so the
// first row doesn't show a double-rule against the card edge.
function FieldRow({
  label,
  value,
  trailing,
  onPress,
  isFirst,
  verifiedColor,
}: {
  label: string;
  value?: string | null;
  trailing?: TrailingKind;
  onPress?: () => void;
  isFirst?: boolean;
  verifiedColor?: string;
}) {
  const { colors } = useTheme();
  const Component: any = onPress ? TouchableOpacity : View;
  const hasValue = !!value && value !== '';

  return (
    <Component
      style={[
        s.fieldRow,
        !isFirst && { borderTopWidth: 1, borderTopColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : undefined}
    >
      <Typo style={[s.fieldRowLabel, { color: colors.textSecondary }]}>
        {label}
      </Typo>
      <Typo
        style={[s.fieldRowValue, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {hasValue ? value : '—'}
      </Typo>
      {trailing === 'pencil' && (
        <Icon name="pencil-outline" size={15} color={colors.textSecondary} />
      )}
      {trailing === 'check' && (
        <Icon
          name="checkmark-circle"
          size={16}
          color={verifiedColor ?? '#22C55E'}
        />
      )}
      {trailing === 'chevron' && (
        <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
      )}
    </Component>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[s.actionRow, { borderTopColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          s.actionIconWrap,
          { backgroundColor: colors.background },
          danger && s.actionIconDanger,
        ]}
      >
        <Icon name={icon as any} size={17} color={danger ? '#EF4444' : colors.textPrimary} />
      </View>
      <Typo style={[s.actionLabel, { color: colors.textPrimary }, danger && { color: '#EF4444' }]}>{label}</Typo>
      {!danger && (
        <Icon name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
      )}
    </TouchableOpacity>
  );
}

/* ──────────────────────────────────────────────── */
/*  Main Screen                                     */
/* ──────────────────────────────────────────────── */

export const ProfileScreen = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigation = useNavigation<any>();
  const { preference, setPreference, colors } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation('main');

  const { currency: displayCurrency, setCurrency: setDisplayCurrency } = useCurrency();
  const {
    country: browseCountry,
    setCountry: setBrowseCountry,
    markets,
    refreshMarkets,
  } = useBrowseCountry();
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [logoutAlert, setLogoutAlert] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [appearancePickerOpen, setAppearancePickerOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [switchAlert, setSwitchAlert] = useState(false);
  const [comingSoonAlert, setComingSoonAlert] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshUser().catch(() => {}),
        refreshMarkets().catch(() => {}),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const browseCountryMeta = markets.find(m => m.code === browseCountry);
  const browseCountryFlag = flagForCountry(browseCountry);
  const currencySymbol = symbolFor(displayCurrency);

  const handleContact = () =>
    Linking.openURL('mailto:support@sureride.ng').catch(() => {});
  const handleComingSoon = () => setComingSoonAlert(true);
  const handleSwitchModule = () => setSwitchAlert(true);

  /* edit name state */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingName, setSavingName] = useState(false);

  /* change password state */
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => setLogoutAlert(true);

  const confirmLogout = async () => {
    setLogoutAlert(false);
    try {
      await removeItem(StorageKeys.LAST_MODULE);
      await logoutUser();
      logout();
    } catch {
      logout();
    }
  };

  const openEditName = () => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEditNameOpen(true);
  };

  const handleSaveName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showError(t('profileScreen.errorNameRequired'));
      return;
    }
    setSavingName(true);
    try {
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      await refreshUser();
      setEditNameOpen(false);
      showSuccess(t('profileScreen.nameUpdated'));
    } catch (e: any) {
      showError(e?.response?.data?.message ?? t('profileScreen.errorUpdateName'));
    } finally {
      setSavingName(false);
    }
  };

  const openChangePass = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePassOpen(true);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showError(t('profileScreen.errorAllFieldsRequired'));
      return;
    }
    if (newPassword.length < 6) {
      showError(t('profileScreen.errorPasswordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      showError(t('profileScreen.errorPasswordsMismatch'));
      return;
    }
    setSavingPass(true);
    try {
      await updatePassword({ oldPassword, newPassword });
      setChangePassOpen(false);
      showSuccess(t('profileScreen.passwordChanged'));
    } catch (e: any) {
      showError(e?.response?.data?.message ?? t('profileScreen.errorChangePassword'));
    } finally {
      setSavingPass(false);
    }
  };

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || t('profileScreen.userFallback');
  const kycLabel: Record<string, string> = {
    VERIFIED: t('profileScreen.kycVerified'),
    APPROVED: t('profileScreen.kycVerified'),
    PENDING_VERIFICATION: t('profileScreen.kycPendingReview'),
    PENDING: t('profileScreen.kycPendingReview'),
    REJECTED: t('profileScreen.kycRejected'),
    INCOMPLETE: t('profileScreen.kycIncomplete'),
  };
  const kycStatus = user?.profileStatus?.toUpperCase() ?? '';
  const kycColor: Record<string, string> = {
    VERIFIED: '#22C55E',
    APPROVED: '#22C55E',
    PENDING_VERIFICATION: '#F59E0B',
    PENDING: '#F59E0B',
    REJECTED: '#EF4444',
  };

  const phone =
    user?.phoneCountry && user?.phoneNumber
      ? `${user.phoneCountry} ${user.phoneNumber}`
      : user?.phone ?? null;

  return (
    <ScreenWrapper padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0A6A4B']}
          />
        }
      >

        {/* ── HEADER ── */}
        {(() => {
          const isVerified =
            kycStatus === 'VERIFIED' || kycStatus === 'APPROVED';
          const isPending =
            kycStatus === 'PENDING' || kycStatus === 'PENDING_VERIFICATION';
          const kycCanOpen = !!kycStatus && !isVerified && !isPending;
          const kycBadge = kycStatus ? (
            <View
              style={[
                s.kycBadge,
                { borderColor: kycColor[kycStatus] ?? '#9CA3AF' },
              ]}
            >
              <View
                style={[
                  s.kycDot,
                  { backgroundColor: kycColor[kycStatus] ?? '#9CA3AF' },
                ]}
              />
              <Typo
                style={[
                  s.kycText,
                  { color: kycColor[kycStatus] ?? '#9CA3AF' },
                ]}
              >
                {t('profileScreen.kycPrefix', { status: kycLabel[kycStatus] ?? kycStatus })}
              </Typo>
            </View>
          ) : null;

          return (
            <View
              style={[
                s.header,
                {
                  backgroundColor: colors.background,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View>
                <View style={s.avatarCircle}>
                  <Typo style={s.avatarText}>
                    {initials(user?.firstName, user?.lastName)}
                  </Typo>
                </View>
                <TouchableOpacity
                  style={[
                    s.avatarEditBtn,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handleComingSoon}
                  activeOpacity={0.8}
                >
                  <Icon
                    name="camera-outline"
                    size={14}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>
              <Typo style={[s.fullName, { color: colors.textPrimary }]}>
                {fullName}
              </Typo>
              <Typo
                variant="caption"
                style={[s.emailSub, { color: colors.textSecondary }]}
              >
                {user?.email}
              </Typo>
              {kycBadge ? (
                kycCanOpen ? (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate('KYCFlow', { screen: 'KycStatus' })}
                  >
                    {kycBadge}
                  </TouchableOpacity>
                ) : (
                  kycBadge
                )
              ) : null}
            </View>
          );
        })()}

        {/* ── PERSONAL ── */}
        <SectionLabel title={t('profileScreen.personal')} colors={colors} />
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FieldRow
            label={t('profileScreen.fullName')}
            value={fullName}
            trailing="pencil"
            onPress={openEditName}
            isFirst
          />
          <FieldRow
            label={t('profileScreen.email')}
            value={user?.email}
            trailing={user?.isVerified ? 'check' : undefined}
            verifiedColor="#22C55E"
          />
          <FieldRow
            label={t('profileScreen.phone')}
            value={phone}
            trailing={phone ? 'check' : undefined}
            verifiedColor="#22C55E"
          />
          <FieldRow
            label={t('profileScreen.nationality')}
            value={user?.nationality}
            trailing="pencil"
            onPress={handleComingSoon}
          />
          <FieldRow
            label={t('profileScreen.dateOfBirth')}
            value={formatDate(user?.dateOfBirth ?? user?.dob)}
          />
          <FieldRow
            label={t('profileScreen.password')}
            value="••••••••"
            trailing="pencil"
            onPress={openChangePass}
          />
        </View>

        {/* ── FINANCES ── */}
        <SectionLabel title={t('profileScreen.finances')} colors={colors} />
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FieldRow
            label={t('profileScreen.myFinances')}
            value={t('profileScreen.myFinancesValue')}
            trailing="chevron"
            onPress={() => navigation.navigate('Finance')}
            isFirst
          />
        </View>

        {/* ── PREFERENCES ── */}
        <SectionLabel title={t('profileScreen.preferences')} colors={colors} />
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FieldRow
            label={t('profileScreen.country')}
            value={`${browseCountryFlag}  ${browseCountryMeta?.name ?? browseCountry}`}
            trailing="chevron"
            onPress={() => {
              void refreshMarkets();
              setCountryPickerOpen(true);
            }}
            isFirst
          />
          <FieldRow
            label={t('profileScreen.currency')}
            value={`${currencySymbol || ''}  ${displayCurrency}`.trim()}
            trailing="chevron"
            onPress={() => setCurrencyPickerOpen(true)}
          />
          <FieldRow
            label={t('profileScreen.appearance')}
            value={
              preference === 'light'
                ? t('profileScreen.appearanceLight')
                : preference === 'dark'
                ? t('profileScreen.appearanceDark')
                : t('profileScreen.appearanceSystem')
            }
            trailing="chevron"
            onPress={() => setAppearancePickerOpen(true)}
          />
          <FieldRow
            label={t('profileScreen.language')}
            value={language === 'fr' ? 'Français' : 'English'}
            trailing="chevron"
            onPress={() => setLanguagePickerOpen(true)}
          />
          <FieldRow
            label={t('profileScreen.notifications')}
            value={t('profileScreen.notificationsOn')}
            trailing="chevron"
            onPress={handleComingSoon}
          />
        </View>

        {/* ── SUPPORT ── */}
        <SectionLabel title={t('profileScreen.support')} colors={colors} />
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FieldRow
            label={t('profileScreen.helpFaq')}
            trailing="chevron"
            onPress={handleComingSoon}
            isFirst
          />
          <FieldRow
            label={t('profileScreen.contactUs')}
            trailing="chevron"
            onPress={handleContact}
          />
          <FieldRow
            label={t('profileScreen.switchModule')}
            trailing="chevron"
            onPress={handleSwitchModule}
          />
        </View>

        {/* ── LEGAL ── */}
        <SectionLabel title={t('profileScreen.legal')} colors={colors} />
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FieldRow
            label={t('profileScreen.termsOfService')}
            trailing="chevron"
            onPress={handleComingSoon}
            isFirst
          />
          <FieldRow
            label={t('profileScreen.privacyPolicy')}
            trailing="chevron"
            onPress={handleComingSoon}
          />
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer}>
          <Typo style={[s.footerVersion, { color: colors.textSecondary }]}>
            {t('profileScreen.versionLine', { version: CURRENT_VERSION_NAME, build: CURRENT_BUILD_CODE })}
          </Typo>
          <TouchableOpacity
            style={[s.logoutBtn, { borderColor: colors.border }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Icon name="log-out-outline" size={18} color="#EF4444" />
            <Typo style={s.logoutText}>{t('profileScreen.logOut')}</Typo>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── EDIT NAME SHEET ── */}
      <AppBottomSheet
        visible={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        heightFactor={0.48}
      >
        <View style={[s.sheetInner, { backgroundColor: colors.surface }]}>
          <View style={s.sheetTitleRow}>
            <Typo style={[s.sheetTitle, { color: colors.textPrimary }]}>{t('profileScreen.editName')}</Typo>
            <TouchableOpacity onPress={() => setEditNameOpen(false)}>
              <Icon name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>{t('profileScreen.firstName')}</Typo>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder={t('profileScreen.enterFirstName')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />

          <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>{t('profileScreen.lastName')}</Typo>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder={t('profileScreen.enterLastName')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />

          <AppButton
            title={savingName ? t('profileScreen.saving') : t('profileScreen.saveChanges')}
            loading={savingName}
            onPress={handleSaveName}
          />
        </View>
      </AppBottomSheet>

      {/* ── CHANGE PASSWORD SHEET ── */}
      <AppBottomSheet
        visible={changePassOpen}
        onClose={() => setChangePassOpen(false)}
        heightFactor={0.68}
      >
        <View style={[s.sheetInner, { backgroundColor: colors.surface }]}>
          <View style={s.sheetTitleRow}>
            <Typo style={[s.sheetTitle, { color: colors.textPrimary }]}>{t('profileScreen.changePassword')}</Typo>
            <TouchableOpacity onPress={() => setChangePassOpen(false)}>
              <Icon name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>{t('profileScreen.currentPassword')}</Typo>
          <View style={s.passwordRow}>
            <TextInput
              value={oldPassword}
              onChangeText={setOldPassword}
              style={[s.input, { flex: 1, marginBottom: 0, backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('profileScreen.enterCurrentPassword')}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showOld}
            />
            <TouchableOpacity onPress={() => setShowOld(v => !v)} style={s.eyeBtn}>
              <Icon name={showOld ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>{t('profileScreen.newPassword')}</Typo>
          <View style={s.passwordRow}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              style={[s.input, { flex: 1, marginBottom: 0, backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('profileScreen.minSixChars')}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity onPress={() => setShowNew(v => !v)} style={s.eyeBtn}>
              <Icon name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>{t('profileScreen.confirmNewPassword')}</Typo>
          <View style={s.passwordRow}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={[s.input, { flex: 1, marginBottom: 0, backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('profileScreen.repeatNewPassword')}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={s.eyeBtn}>
              <Icon name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 8 }}>
            <AppButton
              title={savingPass ? t('profileScreen.updating') : t('profileScreen.updatePassword')}
              loading={savingPass}
              onPress={handleChangePassword}
            />
          </View>
        </View>
      </AppBottomSheet>

      <AppSelectSheet
        visible={currencyPickerOpen}
        title={t('profileScreen.displayCurrency')}
        searchPlaceholder={t('profileScreen.searchCurrency')}
        options={SUPPORTED_CURRENCIES.map(c => {
          const sym = symbolFor(c.code);
          return {
            label: `${sym ? `${sym}  ` : ''}${c.code} — ${c.name}`,
            value: c.code,
          };
        })}
        selected={displayCurrency}
        onClose={() => setCurrencyPickerOpen(false)}
        onSelect={opt => {
          setDisplayCurrency(String(opt.value));
          setCurrencyPickerOpen(false);
        }}
      />

      <AppSelectSheet
        visible={countryPickerOpen}
        title={t('profileScreen.browseCarsIn')}
        searchPlaceholder={t('profileScreen.searchCountry')}
        options={markets.map(c => {
          const flag = flagForCountry(c.code);
          return {
            label: `${flag ? `${flag}  ` : ''}${c.name}`,
            value: c.code,
          };
        })}
        selected={browseCountry}
        onClose={() => setCountryPickerOpen(false)}
        onSelect={opt => {
          const code = String(opt.value);
          setBrowseCountry(code);
          const target = markets.find(m => m.code === code);
          if (target) setDisplayCurrency(target.currency);
          setCountryPickerOpen(false);
        }}
      />

      <AppSelectSheet
        visible={appearancePickerOpen}
        title={t('profileScreen.appearance')}
        options={[
          { label: t('profileScreen.appearanceLight'), value: 'light' },
          { label: t('profileScreen.appearanceDark'), value: 'dark' },
          { label: t('profileScreen.matchSystem'), value: 'system' },
        ]}
        selected={preference}
        onClose={() => setAppearancePickerOpen(false)}
        onSelect={opt => {
          setPreference(opt.value as typeof preference);
          setAppearancePickerOpen(false);
        }}
      />

      <AppSelectSheet
        visible={languagePickerOpen}
        title={t('profileScreen.language')}
        options={[
          { label: 'English', value: 'en' },
          { label: 'Français', value: 'fr' },
        ]}
        selected={language}
        onClose={() => setLanguagePickerOpen(false)}
        onSelect={opt => {
          setLanguage(opt.value as typeof language);
          setLanguagePickerOpen(false);
        }}
      />

      <AppAlert
        visible={logoutAlert}
        title={t('profileScreen.logOut')}
        message={t('profileScreen.logOutConfirm')}
        buttons={[
          { text: t('profileScreen.cancel'), style: 'cancel', onPress: () => setLogoutAlert(false) },
          { text: t('profileScreen.logOut'), style: 'destructive', onPress: confirmLogout },
        ]}
        onDismiss={() => setLogoutAlert(false)}
      />

      <AppAlert
        visible={switchAlert}
        title={t('profileScreen.switchModule')}
        message={t('profileScreen.switchModuleConfirm')}
        buttons={[
          { text: t('profileScreen.cancel'), style: 'cancel', onPress: () => setSwitchAlert(false) },
          {
            text: t('profileScreen.switch'),
            style: 'default',
            onPress: async () => {
              setSwitchAlert(false);
              await removeItem(StorageKeys.LAST_MODULE);
              navigation.navigate('Home');
            },
          },
        ]}
        onDismiss={() => setSwitchAlert(false)}
      />

      <AppAlert
        visible={comingSoonAlert}
        title={t('profileScreen.comingSoon')}
        message={t('profileScreen.comingSoonMessage')}
        buttons={[
          { text: t('profileScreen.ok'), style: 'default', onPress: () => setComingSoonAlert(false) },
        ]}
        onDismiss={() => setComingSoonAlert(false)}
      />
    </ScreenWrapper>
  );
};

export default ProfileScreen;

/* ──────────────────────────────────────────────── */
/*  Styles                                          */
/* ──────────────────────────────────────────────── */

const s = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 22,
    borderBottomWidth: 1,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0A6A4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 8,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
  },
  fullName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  emailSub: {
    color: '#6B7280',
    marginTop: 2,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  kycDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  kycText: {
    fontSize: 12,
    fontWeight: '600',
  },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    gap: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    gap: 12,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconDanger: {
    backgroundColor: '#FEF2F2',
  },
  actionLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },

  /* ── sheet ── */
  sheetInner: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flex: 1,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FAFAFA',
    marginBottom: 4,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 4,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    height: 50,
    justifyContent: 'center',
  },

  themeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  themeOptionActive: {
    backgroundColor: '#0A6A4B',
    borderColor: '#0A6A4B',
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  themeLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },

  /* switch module banner */
  switchCard: {
    marginHorizontal: 16,
    marginTop: 16,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  switchSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
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

  /* ── new settings layout ── */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  fieldRowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  fieldRowValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },

  footer: {
    alignItems: 'center',
    paddingTop: 28,
    paddingHorizontal: 16,
    gap: 14,
  },
  footerVersion: {
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});
