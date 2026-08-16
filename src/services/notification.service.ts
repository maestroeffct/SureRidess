import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { api } from './api';
import { navigate } from '@/navigation/navigationRef';
import { showNotificationToast } from '@/helpers/toast';

// Must match the channel ID declared in AndroidManifest.xml + created in
// MainApplication.kt. Notifee creates it again here defensively in case the
// app is running on a fresh install where the native onCreate didn't get
// the chance to fire before the first push arrives.
// Bumped from 'sureride_default' → 'sureride_default_v2' because
// Android notification channels are IMMUTABLE once created. If a
// previous install created the channel at a lower importance
// (or a user manually lowered it), no amount of code change can
// raise it back — the OS silently keeps the old importance. Bumping
// the id creates a fresh channel that starts at HIGH importance again.
// Old channel is left in Settings; it just no longer receives anything.
const ANDROID_CHANNEL_ID = 'sureride_default_v2';
const LEGACY_CHANNEL_IDS = ['sureride_default'];

let channelEnsured = false;
async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || channelEnsured) return;
  // Best-effort cleanup of the old channel so it doesn't sit in the
  // user's settings screen forever. Notifee no-ops if it doesn't exist.
  for (const legacy of LEGACY_CHANNEL_IDS) {
    try {
      await notifee.deleteChannel(legacy);
    } catch {}
  }
  await notifee.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: 'General',
    importance: AndroidImportance.HIGH, // heads-up banner + sound
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
  });
  channelEnsured = true;
}

async function displayLocalBanner(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  imageUrl?: string,
) {
  try {
    await ensureAndroidChannel();
    await notifee.displayNotification({
      title,
      body,
      data: data
        ? Object.fromEntries(
            Object.entries(data)
              .filter(([, v]) => v != null)
              .map(([k, v]) => [k, String(v)]),
          )
        : undefined,
      android: {
        channelId: ANDROID_CHANNEL_ID,
        smallIcon: 'ic_launcher',
        color: '#0A6A4B',
        pressAction: { id: 'default' },
        importance: AndroidImportance.HIGH,
        // bigPicture = large expandable image below the text.
        // Notifee downloads the URL and caches it.
        ...(imageUrl
          ? {
              largeIcon: imageUrl,
              style: { type: 1 /* BIG_PICTURE */, picture: imageUrl } as any,
            }
          : {}),
      },
      ios: {
        // Force banner + sound when the app is in foreground. iOS suppresses
        // these by default for FCM-pushed messages.
        foregroundPresentationOptions: {
          banner: true,
          list: true,
          sound: true,
          badge: true,
        },
        ...(imageUrl
          ? {
              attachments: [{ url: imageUrl }],
            }
          : {}),
      },
    });
  } catch (err) {
    // Notifee failure shouldn't swallow the message — fall back to the
    // existing in-app toast so the user still sees something.
    console.warn('[notifee] displayNotification failed', err);
    showNotificationToast(title, body);
  }
}

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
  // Tear down any previous bindings (e.g. after a re-login). Each step is
  // guarded because a synchronous throw in any handler binding would crash
  // the app on login → the user then can't get back in to fix it.
  try {
    unsubscribeForeground?.();
    unsubscribeOpenedApp?.();
  } catch (err) {
    console.warn('[notifications] teardown failed', err);
  }

  try {
    unsubscribeForeground = messaging().onMessage(async msg => {
      try {
        const title = msg.notification?.title ?? 'Notification';
        const body = msg.notification?.body ?? '';
        const imageUrl =
          (msg.notification as any)?.imageUrl ||
          (msg.notification as any)?.android?.imageUrl ||
          (msg.data?.imageUrl as string | undefined);
        void displayLocalBanner(
          title,
          body,
          msg.data as Record<string, unknown>,
          imageUrl,
        );
      } catch (err) {
        console.warn('[notifications] onMessage handler failed', err);
      }
    });
  } catch (err) {
    console.warn('[notifications] onMessage bind failed', err);
  }

  try {
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === 1) {
        routeFromNotificationData(
          detail.notification?.data as Record<string, unknown> | undefined,
        );
      }
    });
  } catch (err) {
    console.warn('[notifications] notifee.onForegroundEvent failed', err);
  }

  try {
    unsubscribeOpenedApp = messaging().onNotificationOpenedApp(msg => {
      routeFromNotificationData(msg.data as Record<string, unknown>);
    });
  } catch (err) {
    console.warn('[notifications] onNotificationOpenedApp bind failed', err);
  }

  try {
    messaging()
      .getInitialNotification()
      .then(msg => {
        if (msg) {
          setTimeout(() => {
            routeFromNotificationData(msg.data as Record<string, unknown>);
          }, 600);
        }
      })
      .catch(() => {});
  } catch (err) {
    console.warn('[notifications] getInitialNotification failed', err);
  }
}

export function teardownNotificationHandlers() {
  unsubscribeForeground?.();
  unsubscribeOpenedApp?.();
  unsubscribeForeground = null;
  unsubscribeOpenedApp = null;
}

export async function initNotifications(): Promise<void> {
  // Each side-effect is isolated so any single failure logs a warning
  // instead of taking down the app right after login.
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  } catch (err) {
    console.warn('[notifications] permission request failed', err);
    return;
  }

  try {
    const token = await getFCMToken();
    if (token) await registerTokenWithBackend(token);
  } catch (err) {
    console.warn('[notifications] token fetch/register failed', err);
  }

  try {
    messaging().onTokenRefresh(async newToken => {
      try {
        await registerTokenWithBackend(newToken);
      } catch (err) {
        console.warn('[notifications] refresh-token register failed', err);
      }
    });
  } catch (err) {
    console.warn('[notifications] onTokenRefresh bind failed', err);
  }

  try {
    bindNotificationHandlers();
  } catch (err) {
    console.warn('[notifications] bindNotificationHandlers failed', err);
  }
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
