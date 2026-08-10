import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  type PhotoFile,
} from 'react-native-vision-camera';
import type { Asset } from 'react-native-image-picker';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { showError } from '@/helpers/toast';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
  /**
   * Fires with an Asset-shaped payload so the caller can plug it into
   * the same upload flow the existing gallery picker feeds. We keep the
   * shape identical to what `react-native-image-picker` produces so the
   * downstream form-data / upload code doesn't need to know a photo
   * was captured with the in-app camera instead.
   */
  onCapture: (asset: Asset) => void;
};

function photoToAsset(photo: PhotoFile): Asset {
  const uri =
    Platform.OS === 'ios' && !photo.path.startsWith('file://')
      ? `file://${photo.path}`
      : Platform.OS === 'android'
        ? `file://${photo.path}`
        : photo.path;
  return {
    uri,
    type: 'image/jpeg',
    fileName: `passport-${Date.now()}.jpg`,
    width: photo.width,
    height: photo.height,
  } as Asset;
}

export function PassportCameraModal({ visible, onClose, onCapture }: Props) {
  const { colors } = useTheme();
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [preview, setPreview] = useState<PhotoFile | null>(null);
  const [capturing, setCapturing] = useState(false);
  // Keep the camera stream off until the modal is actually on screen —
  // otherwise vision-camera keeps the sensor warm in the background,
  // which drains battery and trips the "camera in use" indicator.
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!visible) {
      setPreview(null);
      setIsActive(false);
      return;
    }
    (async () => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          showError('Camera permission denied');
          onClose();
          return;
        }
      }
      setIsActive(true);
    })();
  }, [visible, hasPermission, requestPermission, onClose]);

  const handleShutter = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });
      setPreview(photo);
    } catch (err: any) {
      if (__DEV__) console.log('[Passport camera] capture failed', err);
      showError(err?.message || 'Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const handleRetake = () => {
    setPreview(null);
  };

  const handleUse = () => {
    if (!preview) return;
    onCapture(photoToAsset(preview));
    setPreview(null);
    setIsActive(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            hitSlop={12}
            onPress={() => {
              setPreview(null);
              setIsActive(false);
              onClose();
            }}
          >
            <Icon name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Typo variant="subheading" color="#fff">
            Passport photo
          </Typo>
          <View style={{ width: 26 }} />
        </View>

        {/* Body */}
        {preview ? (
          <View style={styles.stage}>
            <Image
              source={{
                uri:
                  Platform.OS === 'android'
                    ? `file://${preview.path}`
                    : preview.path,
              }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
        ) : device && isActive ? (
          <View style={styles.stage}>
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={isActive}
              photo
            />
            <View style={styles.overlayHint} pointerEvents="none">
              <Typo variant="caption" color="#fff">
                Face the camera in good light. Keep your whole face in frame.
              </Typo>
            </View>
          </View>
        ) : (
          <View style={styles.stage}>
            <ActivityIndicator color="#fff" />
            <Typo variant="caption" color="#fff" style={{ marginTop: 12 }}>
              {device ? 'Preparing camera...' : 'No front-facing camera found'}
            </Typo>
          </View>
        )}

        {/* Footer / controls */}
        <View style={styles.controls}>
          {preview ? (
            <View style={styles.previewActions}>
              <AppButton
                title="Retake"
                variant="outline"
                onPress={handleRetake}
                style={{ flex: 1, marginRight: 8 }}
              />
              <AppButton
                title="Use photo"
                onPress={handleUse}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleShutter}
              disabled={!device || capturing || !isActive}
              style={[
                styles.shutter,
                { borderColor: colors.primary },
                (!device || capturing || !isActive) && { opacity: 0.5 },
              ]}
            >
              {capturing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View
                  style={[
                    styles.shutterInner,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 12,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  overlayHint: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  controls: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 76,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 58,
  },
});
