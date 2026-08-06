import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import SignatureCanvas, { SignatureViewRef } from 'react-native-signature-canvas';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import { showError, showSuccess } from '@/helpers/toast';
import {
  submitHandoverSignature,
  type HandoverType,
} from '@/services/handover.service';

type RouteParams = {
  bookingId: string;
  type: HandoverType;
  carName?: string;
};

const HandoverSignScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const { bookingId, type, carName } = route.params || ({} as RouteParams);

  const sigRef = useRef<SignatureViewRef>(null);
  const [saving, setSaving] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);

  // react-native-signature-canvas runs a WebView with a canvas inside.
  // `getData` triggers onOK with the PNG data URI (webStyle below wires
  // the "confirm" button to fire that flow). We piggy-back on the same
  // callback to send the upload from a single place.
  const handleSignatureOk = useCallback(
    async (dataUri: string) => {
      if (!dataUri) {
        showError('Please draw your signature before saving');
        return;
      }
      if (!bookingId || !type) {
        showError('Missing booking info');
        return;
      }
      try {
        setSaving(true);
        await submitHandoverSignature(bookingId, type, dataUri);
        showSuccess('Signature saved. Thank you.');
        navigation.goBack();
      } catch (err: any) {
        const message =
          err?.response?.data?.message ??
          err?.message ??
          'Could not save your signature. Try again.';
        // Offer a retry rather than dumping the user back into the form
        // with no context — helps on flaky connections at pickup.
        Alert.alert('Upload failed', message, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
            onPress: () => sigRef.current?.readSignature(),
          },
        ]);
      } finally {
        setSaving(false);
      }
    },
    [bookingId, type, navigation],
  );

  const handleClear = () => {
    sigRef.current?.clearSignature();
    setHasStroke(false);
  };

  const handleConfirm = () => {
    if (!hasStroke) {
      showError('Please draw your signature before saving');
      return;
    }
    // Ask the canvas for the PNG data URI — resolves via onOK.
    sigRef.current?.readSignature();
  };

  // Overrides the default web-canvas UI so we can drive it from native
  // buttons below. The pen colour is kept dark for scan legibility.
  const webStyle = `
    .m-signature-pad--footer { display: none; margin: 0; }
    .m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: 1px dashed #cbd5e1; border-radius: 12px; }
    body, html { background: transparent; }
  `;

  const typeLabel = type === 'PICKUP' ? 'Pick-up' : 'Return';
  const typeColor = type === 'PICKUP' ? '#22C55E' : '#F97316';

  return (
    <ScreenWrapper padded={false}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Icon name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Typo variant="subheading">Sign inspection</Typo>

        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Typo style={[styles.carName, { color: colors.textPrimary }]}>
            {carName || 'Vehicle'}
          </Typo>
          <View style={[styles.badge, { backgroundColor: `${typeColor}20` }]}>
            <Typo style={[styles.badgeText, { color: typeColor }]}>
              {typeLabel}
            </Typo>
          </View>
        </View>

        <Typo style={[styles.explainer, { color: colors.textSecondary }]}>
          The rental host has completed the inspection. By signing below you
          agree the vehicle condition is as recorded.
        </Typo>

        <View style={styles.canvasWrap}>
          <SignatureCanvas
            ref={sigRef}
            onOK={handleSignatureOk}
            onEmpty={() => showError('Please draw your signature before saving')}
            onBegin={() => setHasStroke(true)}
            onClear={() => setHasStroke(false)}
            webStyle={webStyle}
            descriptionText=""
            imageType="image/png"
            backgroundColor="rgba(255,255,255,0)"
            penColor="#0F172A"
          />

          <View style={styles.signatureLine} />
          <Typo style={[styles.signHint, { color: colors.textSecondary }]}>
            Sign inside the box above
          </Typo>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={handleClear}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Icon name="refresh-outline" size={18} color={colors.textPrimary} />
            <Typo style={{ color: colors.textPrimary, fontWeight: '600' }}>
              Clear
            </Typo>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: '#0A6A4B', opacity: saving ? 0.7 : 1 },
            ]}
            onPress={handleConfirm}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="checkmark-circle" size={18} color="#fff" />
                <Typo style={{ color: '#fff', fontWeight: '700' }}>
                  Save signature
                </Typo>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  carName: {
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  explainer: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  canvasWrap: {
    flex: 1,
    minHeight: 260,
    marginBottom: 12,
  },
  signatureLine: {
    height: 1,
    backgroundColor: '#94a3b8',
    marginTop: 8,
    marginHorizontal: 24,
  },
  signHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 24,
  },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtn: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default HandoverSignScreen;
