import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';

type Button = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: Button[];
  onDismiss?: () => void;
};

export function AppAlert({ visible, title, message, buttons, onDismiss }: Props) {
  const { colors } = useTheme();

  const resolvedButtons: Button[] =
    buttons && buttons.length > 0
      ? buttons
      : [{ text: 'OK', onPress: onDismiss, style: 'default' }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      hardwareAccelerated
      presentationStyle="overFullScreen"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback>
            <View style={[s.card, { backgroundColor: colors.surface }]}>
              <View style={s.body}>
                <Typo style={[s.title, { color: colors.textPrimary }]}>{title}</Typo>
                {message ? (
                  <Typo style={[s.message, { color: colors.textSecondary }]}>
                    {message}
                  </Typo>
                ) : null}
              </View>

              <View style={[s.divider, { backgroundColor: colors.border }]} />

              <View style={s.btnRow}>
                {resolvedButtons.map((btn, i) => {
                  const isDestructive = btn.style === 'destructive';
                  const isCancel = btn.style === 'cancel';
                  const isLast = i === resolvedButtons.length - 1;

                  return (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <View style={[s.btnDivider, { backgroundColor: colors.border }]} />
                      )}
                      <TouchableOpacity
                        style={[s.btn, isLast && s.btnLast]}
                        onPress={() => {
                          btn.onPress?.();
                        }}
                        activeOpacity={0.65}
                      >
                        <Typo
                          style={[
                            s.btnText,
                            isDestructive && { color: '#EF4444' },
                            isCancel && { color: colors.textSecondary },
                            !isDestructive && !isCancel && { color: '#0A6A4B', fontWeight: '600' },
                          ]}
                        >
                          {btn.text}
                        </Typo>
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    height: 1,
  },
  btnRow: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLast: {},
  btnDivider: {
    width: 1,
  },
  btnText: {
    fontSize: 15,
  },
});
