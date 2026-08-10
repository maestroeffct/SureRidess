import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { AppButton } from '@/components/AppButton/CustomButton';
import { AppInput } from '@/components/AppInput/Input';
import { Typo } from '@/components/AppText/Typo';

import { KYCInfoAlert } from '@/components/kyc/KYCInfoAlert/KYCInfoAlert';
import { KYCStepHeader } from '@/components/kyc/KYCStepHeader/KYCStepHeader';
import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { showError, showSuccess } from '@/helpers/toast';
import { AppSelectSheet } from '@/components/AppSelectSheet/AppSelectSheet';
import {
  fetchRegionsByState,
  fetchStatesByCountry,
} from '@/services/location-meta.service';
import { useAuth } from '@/providers/AuthProvider';
import { saveKycAddressInfo } from '@/services/kyc.service';
import styles from './styles';

export default function AddressScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const countryFromStep1 = route.params?.countryName as string | undefined;
  const countryName = countryFromStep1 || user?.nationality || user?.country || '';

  const [stateValue, setStateValue] = useState('');
  const [regionValue, setRegionValue] = useState('');
  const [homeAddress, setHomeAddress] = useState('');

  const [states, setStates] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Track failure separately so we can offer a fallback (manual entry +
  // retry) instead of leaving the user stuck on a dead dropdown.
  const [statesFailed, setStatesFailed] = useState(false);
  const [regionsFailed, setRegionsFailed] = useState(false);

  const [showStateModal, setShowStateModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  const [stateSearch, setStateSearch] = useState('');
  const [regionSearch, setRegionSearch] = useState('');

  const filteredStates = useMemo(
    () =>
      states.filter(item =>
        item.toLowerCase().includes(stateSearch.trim().toLowerCase()),
      ),
    [stateSearch, states],
  );

  const filteredRegions = useMemo(
    () =>
      regions.filter(item =>
        item.toLowerCase().includes(regionSearch.trim().toLowerCase()),
      ),
    [regionSearch, regions],
  );

  const loadStates = async () => {
    if (!countryName) {
      setStates([]);
      return;
    }
    try {
      setLoadingStates(true);
      setStatesFailed(false);
      const results = await fetchStatesByCountry(countryName);
      setStates(results);
      if (results.length === 0) {
        // API returned no states for this country — treat as a soft failure
        // so the user can type their state manually.
        setStatesFailed(true);
      }
    } catch (error) {
      setStates([]);
      setStatesFailed(true);
      if (__DEV__) {
        console.log('[KYC][Address] Failed to load states', { countryName, error });
      }
    } finally {
      setLoadingStates(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadStates();
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryName]);

  const loadRegions = async () => {
    if (!countryName || !stateValue) {
      setRegions([]);
      return;
    }
    try {
      setLoadingRegions(true);
      setRegionsFailed(false);
      const results = await fetchRegionsByState(countryName, stateValue);
      setRegions(results);
      if (results.length === 0) {
        setRegionsFailed(true);
      }
    } catch (error) {
      setRegions([]);
      setRegionsFailed(true);
      if (__DEV__) {
        console.log('[KYC][Address] Failed to load regions', {
          countryName,
          stateValue,
          error,
        });
      }
    } finally {
      setLoadingRegions(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadRegions();
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryName, stateValue]);

  const handleNext = async () => {
    if (!stateValue) {
      showError('Please select your state.');
      return;
    }

    if (!homeAddress.trim()) {
      showError('Please enter your home address.');
      return;
    }

    try {
      setSaving(true);

      await saveKycAddressInfo({
        state: stateValue,
        region: regionValue || '',
        homeAddress: homeAddress.trim(),
      });

      showSuccess('Address saved');

      // Route through the face-liveness step first — Documents is now
      // the last screen in the flow so the selfie check runs before
      // the user is asked to upload passport + ID + licence photos.
      navigation.navigate('FaceLiveness', {
        countryName,
        state: stateValue,
        region: regionValue || null,
        homeAddress: homeAddress.trim(),
      });
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper padded={false}>
      <KYCStepHeader
        step={2}
        title="Resident Address"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <KYCInfoAlert message="Provide your current residential address for verification" />

        <View style={styles.inputSpacing}>
          <AppInput
            label="Country"
            value={countryName}
            editable={false}
            placeholder="Select nationality in step 1"
          />
        </View>

        <View style={styles.inputSpacing}>
          {statesFailed && !loadingStates ? (
            <>
              <AppInput
                label="State"
                placeholder="Type your state"
                value={stateValue}
                onChangeText={setStateValue}
              />
              <TouchableOpacity
                onPress={loadStates}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}
              >
                <Icon name="refresh-outline" size={13} color={colors.primary} />
                <Typo
                  variant="caption"
                  style={{ color: colors.primary, fontWeight: '600' }}
                >
                  We couldn’t load states. Tap to retry or type yours above.
                </Typo>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (!loadingStates && states.length) {
                  setShowStateModal(true);
                }
              }}
              disabled={loadingStates || states.length === 0}
            >
              <View pointerEvents="none">
                <AppInput
                  label="State"
                  placeholder={loadingStates ? 'Loading states...' : 'Select state'}
                  value={stateValue}
                  editable={false}
                  rightIcon={
                    <Icon
                      name="chevron-down"
                      size={18}
                      color={colors.textSecondary}
                    />
                  }
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputSpacing}>
          {regionsFailed && !loadingRegions ? (
            <>
              <AppInput
                label="Region (optional)"
                placeholder="Type your region (optional)"
                value={regionValue}
                onChangeText={setRegionValue}
              />
              <TouchableOpacity
                onPress={loadRegions}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}
              >
                <Icon name="refresh-outline" size={13} color={colors.primary} />
                <Typo
                  variant="caption"
                  style={{ color: colors.primary, fontWeight: '600' }}
                >
                  We couldn’t load regions. Tap to retry or skip.
                </Typo>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (!loadingRegions && regions.length) {
                  setShowRegionModal(true);
                }
              }}
              disabled={loadingRegions || regions.length === 0}
            >
              <View pointerEvents="none">
                <AppInput
                  label="Region (optional)"
                  placeholder={
                    loadingRegions
                      ? 'Loading regions...'
                      : 'Select region (optional)'
                  }
                  value={regionValue}
                  editable={false}
                  rightIcon={
                    <Icon
                      name="chevron-down"
                      size={18}
                      color={colors.textSecondary}
                    />
                  }
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputSpacing}>
          <AppInput
            label="Home Address"
            placeholder="Enter address"
            value={homeAddress}
            onChangeText={setHomeAddress}
          />
        </View>

        <AppButton
          title="Next"
          style={styles.buttonSpacing}
          onPress={handleNext}
          loading={saving}
        />
      </ScrollView>

      <AppSelectSheet
        visible={showStateModal}
        title="Select State"
        searchPlaceholder="Search state..."
        options={filteredStates.map(s => ({ label: s, value: s }))}
        selected={stateValue}
        onClose={() => setShowStateModal(false)}
        onSelect={opt => {
          setStateValue(opt.value);
          setRegionValue('');
          setShowStateModal(false);
          setStateSearch('');
        }}
      />

      <AppSelectSheet
        visible={showRegionModal}
        title="Select Region"
        searchPlaceholder="Search region..."
        options={filteredRegions.map(r => ({ label: r, value: r }))}
        selected={regionValue}
        onClose={() => setShowRegionModal(false)}
        onSelect={opt => {
          setRegionValue(opt.value);
          setShowRegionModal(false);
          setRegionSearch('');
        }}
      />
    </ScreenWrapper>
  );
}
