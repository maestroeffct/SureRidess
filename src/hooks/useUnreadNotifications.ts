import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchInbox } from '@/services/notification.service';
import { useAuth } from '@/providers/AuthProvider';

const POLL_INTERVAL_MS = 30_000; // 30s when foregrounded

/**
 * Returns the current unread notification count for the logged-in user.
 * Refreshes on screen focus, every 30s while foregrounded, and on app resume.
 */
export function useUnreadNotifications() {
  const { status } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (status !== 'authenticated') {
      setCount(0);
      return;
    }
    try {
      const res = await fetchInbox({ limit: 1, unreadOnly: true });
      setCount(res.unreadCount);
    } catch {
      // ignore — keep previous count
    }
  }, [status]);

  // Initial + auth-status-change fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Foreground polling
  useEffect(() => {
    if (status !== 'authenticated') return;
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status, refresh]);

  // App returning from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { count, refresh };
}
