import Toast from 'react-native-toast-message';

export const showSuccess = (msg: string) => {
  console.log('[Toast][success]', msg);
  Toast.show({
    type: 'success',
    text1: msg,
  });
};

export const showError = (msg: string) => {
  console.log('[Toast][error]', msg);
  Toast.show({
    type: 'error',
    text1: msg,
  });
};

export const showNotificationToast = (
  title: string,
  body?: string,
  onPress?: () => void,
) => {
  console.log('[Toast][notification]', title, body ?? '');
  Toast.show({
    type: 'info',
    text1: title,
    text2: body,
    onPress,
    visibilityTime: 4500,
  });
};
