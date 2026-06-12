import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { api } from './api';
import { navigate } from '@/navigation/navigationRef';
import { showNotificationToast } from '@/helpers/toast';

export type NotificationPayload = {
  title?: string;
  body?: string;
  data?: Record<string, string>;
};

// ── Notification Inbox types (match backend Notification model) ────────────

export type InboxNotification = {
  id: string;
  userId: string | null;
  providerId: string | null;
  event: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type InboxResponse = {
  items: InboxNotification[];
  unreadCount: number;
};

export async function fetchInbox(params?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<InboxResponse> {
  const { data } = await api.get<InboxResponse>('/notifications', {
    params: {
      limit: params?.limit,
      unreadOnly: params?.unreadOnly ? 'true' : undefined,
    },
  });
  return data;
}

export async function markRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllRead(): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>(
    '/notifications/read-all',
  );
  return data;
}

export async function deleteInboxItem(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

async function registerTokenWithBackend(token: string) {
  try {
    await api.post('/notifications/devices', {
      token,
      // Backend expects uppercase: ANDROID | IOS | WEB
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    });
  } catch {
    // Non-fatal: token will be re-registered on next launch
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function getFCMToken(): Promise<string | null> {
  try {
    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }
    const token = await messaging().getToken();
    return token;
  } catch {
    return null;
  }
}

// Keep references to the active subscriptions so we can clean up on logout.
let unsubscribeForeground: (() => void) | null = null;
let unsubscribeOpenedApp: (() => void) | null = null;

function routeFromNotificationData(data: Record<string, unknown> | undefined) {
  if (!data) {
    navigate('NotificationInbox' as never);
    return;
  }
  // Today we route everything to the inbox; deep-linking by event type can be
  // added here later (e.g. bookingId -> BookingDetails screen).
  navigate('NotificationInbox' as never);
}

function bindNotificationHandlers() {
  // Tear down any previous bindings (e.g. after a re-login)
  unsubscribeForeground?.();
  unsubscribeOpenedApp?.();

  // Foreground: show a toast (OS does NOT show a banner when app is foreground)
  unsubscribeForeground = messaging().onMessage(async msg => {
    const title = msg.notification?.title ?? 'Notification';
    const body = msg.notification?.body ?? '';
    showNotificationToast(title, body, () =>
      routeFromNotificationData(msg.data as Record<string, unknown>),
    );
  });

  // Tapped from system tray while app was backgrounded
  unsubscribeOpenedApp = messaging().onNotificationOpenedApp(msg => {
    routeFromNotificationData(msg.data as Record<string, unknown>);
  });

  // App was launched from a cold start by tapping a notification
  messaging()
    .getInitialNotification()
    .then(msg => {
      if (msg) {
        // Delay slightly so the nav tree mounts before we navigate
        setTimeout(() => {
          routeFromNotificationData(msg.data as Record<string, unknown>);
        }, 600);
      }
    })
    .catch(() => {});
}

export function teardownNotificationHandlers() {
  unsubscribeForeground?.();
  unsubscribeOpenedApp?.();
  unsubscribeForeground = null;
  unsubscribeOpenedApp = null;
}

export async function initNotifications(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const token = await getFCMToken();
  if (token) {
    await registerTokenWithBackend(token);
  }

  // Refresh token when it rotates
  messaging().onTokenRefresh(async newToken => {
    await registerTokenWithBackend(newToken);
  });

  // Wire foreground + cold-start handlers
  bindNotificationHandlers();
}

export function onForegroundMessage(
  handler: (message: FirebaseMessagingTypes.RemoteMessage) => void,
) {
  return messaging().onMessage(handler);
}

export function onNotificationOpenedApp(
  handler: (message: FirebaseMessagingTypes.RemoteMessage) => void,
) {
  return messaging().onNotificationOpenedApp(handler);
}

export async function getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
  return messaging().getInitialNotification();
}

// Must be called outside React context (top-level index.js) for background messages
export function setBackgroundMessageHandler() {
  messaging().setBackgroundMessageHandler(async _message => {
    // Background messages are shown automatically by the OS
    // Add any silent data processing here if needed
  });
}
