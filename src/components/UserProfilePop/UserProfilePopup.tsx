import React from 'react';
import { Modal, View, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import styles from './styles';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function UserProfilePopup({ visible, onClose }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Icon name="person-circle-outline" size={72} color={colors.textPrimary} />

          <Typo variant="subheading" style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Typo>

          <View style={styles.dobRow}>
            <Typo variant="body" style={styles.dobLabel}>
              Email:
            </Typo>

            <Typo variant="body" style={styles.dobValue}>
              {user?.email}
            </Typo>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
