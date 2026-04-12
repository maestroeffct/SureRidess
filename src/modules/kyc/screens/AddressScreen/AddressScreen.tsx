import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { AppButton } from '@/components/AppButton/CustomButton';
import { AppInput } from '@/components/AppInput/Input';

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

  useEffect(() => {
    if (!countryName) {
      setStates([]);
      return;
    }

    let mounted = true;

    const loadStates = async () => {
      try {
        setLoadingStates(true);
        const results = await fetchStatesByCountry(countryName);
        if (!mounted) return;
        setStates(results);
      } catch (error) {
        if (mounted) {
          setStates([]);
          showError('Unable to load states for selected country.');
        }
        if (__DEV__) {
          console.log('[KYC][Address] Failed to load states', { countryName, error });
        }
      } finally {
        if (mounted) {
          setLoadingStates(false);
        }
      }
    };

    loadStates();

    return () => {
      mounted = false;
    };
  }, [countryName]);

  useEffect(() => {
    if (!countryName || !stateValue) {
      setRegions([]);
      return;
    }

    let mounted = true;

    const loadRegions = async () => {
      try {
        setLoadingRegions(true);
        const results = await fetchRegionsByState(countryName, stateValue);
        if (!mounted) return;
        setRegions(results);
      } catch (error) {
        if (mounted) {
          setRegions([]);
          showError('Unable to load regions for selected state.');
        }

        if (__DEV__) {
          console.log('[KYC][Address] Failed to load regions', {
            countryName,
            stateValue,
            error,
          });
        }
      } finally {
        if (mounted) {
          setLoadingRegions(false);
        }
      }
    };

    loadRegions();

    return () => {
      mounted = false;
    };
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

      navigation.navigate('Documents', {
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
          <AppInput
            label="State"
            placeholder={loadingStates ? 'Loading states...' : 'Select state'}
            value={stateValue}
            editable={false}
            leftIcon={
              <TouchableOpacity
                onPress={() => {
                  if (!loadingStates && states.length) {
                    setShowStateModal(true);
                  }
                }}
              >
                <Icon
                  name="chevron-down"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />
        </View>

        <View style={styles.inputSpacing}>
          <AppInput
            label="Region (optional)"
            placeholder={
              loadingRegions ? 'Loading regions...' : 'Select region (optional)'
            }
            value={regionValue}
            editable={false}
            leftIcon={
              <TouchableOpacity
                onPress={() => {
                  if (!loadingRegions && regions.length) {
                    setShowRegionModal(true);
                  }
                }}
              >
                <Icon
                  name="chevron-down"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />
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
