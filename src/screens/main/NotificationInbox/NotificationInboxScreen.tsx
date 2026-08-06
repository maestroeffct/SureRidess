import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';

import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import {
  fetchInbox,
  markRead,
  markAllRead,
  deleteInboxItem,
  type InboxNotification,
} from '@/services/notification.service';
import { showError, showSuccess } from '@/helpers/toast';

// ── Per-event metadata for icon + color ─────────────────────────────────────
// These map the backend `event` string to a visual category. Unknown events
// fall back to a generic bell.

type IconName = React.ComponentProps<typeof Icon>['name'];

const EVENT_META: Record<string, { icon: IconName; color: string }> = {
  'booking.created': { icon: 'calendar-outline', color: '#0EA5E9' },
  'booking.confirmed': { icon: 'checkmark-circle-outline', color: '#22c55e' },
  'booking.cancelled': { icon: 'close-circle-outline', color: '#f97316' },
  'booking.completed': { icon: 'flag-outline', color: '#0EA5E9' },
  'payment.failed': { icon: 'card-outline', color: '#ef4444' },
  'payment.received': { icon: 'cash-outline', color: '#22c55e' },
  'kyc.submitted': { icon: 'document-text-outline', color: '#0EA5E9' },
  'kyc.approved': { icon: 'shield-checkmark-outline', color: '#22c55e' },
  'kyc.rejected': { icon: 'shield-outline', color: '#ef4444' },
  'password.reset': { icon: 'key-outline', color: '#f59e0b' },
  'user.registered': { icon: 'person-add-outline', color: '#22c55e' },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationInboxScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewItem, setPreviewItem] = useState<InboxNotification | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchInbox({ limit: 100 });
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Failed to load notifications');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleTap = useCallback(
    async (item: InboxNotification) => {
      // Open preview modal first
      setPreviewItem(item);

      // Mark read optimistically (in the background)
      if (!item.readAt) {
        setItems(prev =>
          prev.map(n =>
            n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n,
          ),
        );
        setUnreadCount(c => Math.max(0, c - 1));
        try {
          await markRead(item.id);
        } catch {
          // Roll back is overkill — refresh will reconcile
        }
      }
    },
    [],
  );

  // Decide whether the preview should show a primary action button, and what
  // label that button gets. Returns null for events without a useful target.
  const previewAction = useMemo(() => {
    if (!previewItem) return null;
    const data = previewItem.data ?? {};
    const hasBooking = typeof data.bookingId === 'string';
    const event = previewItem.event;

    if (hasBooking && event.startsWith('booking.')) {
      return { label: 'View Booking', target: 'booking' as const };
    }
    if (hasBooking && event.startsWith('payment.')) {
      return { label: 'View Booking', target: 'booking' as const };
    }

    // KYC: action depends on which side of the funnel the user is on.
    //  - submitted/in-review → nothing to do, just close
    //  - approved/verified  → start using the app
    //  - rejected           → upload again
    //  - not started        → finish verification
    if (event === 'kyc.submitted' || event === 'kyc.in_review') {
      return null; // No CTA — single "Got it" button takes over
    }
    if (event === 'kyc.approved' || event === 'kyc.verified') {
      return { label: 'Browse Cars', target: 'browse' as const };
    }
    if (event === 'kyc.rejected') {
      return { label: 'Resubmit Documents', target: 'kyc' as const };
    }
    if (event.startsWith('kyc.')) {
      // Generic fallback for unknown kyc.* events — only show CTA if we don't
      // know the user has already submitted.
      return { label: 'Verify Identity', target: 'kyc' as const };
    }
    return null;
  }, [previewItem]);

  // Action button on the preview modal — navigates to the deep-linked target
  // if the notification has one (booking, kyc, etc.). Closes the modal first.
  const handleDeepLink = useCallback(
    (item: InboxNotification) => {
      setPreviewItem(null);

      const data = item.data ?? {};
      const bookingId = typeof data.bookingId === 'string' ? data.bookingId : null;
      const nav = navigation as any;

      const target = previewAction?.target;

      if (target === 'booking' && bookingId) {
        nav.navigate('CarRentalFlowNavigator', {
          screen: 'BookingDetails',
          params: { bookingId },
        });
        return;
      }

      if (target === 'kyc') {
        nav.navigate('KYCFlow', { screen: 'KycStatus' });
        return;
      }

      if (target === 'browse') {
        // Bounce to the rental tabs so the user can start using the app.
        nav.navigate('CarRentalTabs', { screen: 'Explore' });
        return;
      }
    },
    [navigation, previewAction],
  );

  const handleMarkAll = useCallback(async () => {
    if (unreadCount === 0) return;
    try {
      await markAllRead();
      setItems(prev =>
        prev.map(n =>
          n.readAt ? n : { ...n, readAt: new Date().toISOString() },
        ),
      );
      setUnreadCount(0);
      showSuccess('All notifications marked read');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Failed');
    }
  }, [unreadCount]);

  const handleDelete = useCallback((item: InboxNotification) => {
    Alert.alert('Delete notification?', item.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteInboxItem(item.id);
            setItems(prev => prev.filter(n => n.id !== item.id));
            if (!item.readAt) setUnreadCount(c => Math.max(0, c - 1));
          } catch (e: any) {
            showError(e?.response?.data?.message || 'Failed to delete');
          }
        },
      },
    ]);
  }, []);

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Typo variant="subheading" color={colors.textPrimary}>
            Notifications
          </Typo>
          {unreadCount > 0 ? (
            <Typo variant="caption" color={colors.textSecondary}>
              {unreadCount} unread
            </Typo>
          ) : null}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAll}>
            <Typo variant="caption" color={colors.primary}>
              Mark all read
            </Typo>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Icon
            name="notifications-off-outline"
            size={44}
            color={colors.textSecondary}
          />
          <Typo variant="body" color={colors.textSecondary} style={{ marginTop: 12 }}>
            You&apos;re all caught up
          </Typo>
          <Typo
            variant="caption"
            color={colors.textSecondary}
            style={{ marginTop: 4, textAlign: 'center', maxWidth: 280 }}
          >
            Notifications about your bookings, KYC, and payments will appear here.
          </Typo>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={n => n.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => {
            const meta = EVENT_META[item.event] ?? {
              icon: 'notifications-outline',
              color: colors.primary,
            };
            const unread = !item.readAt;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleTap(item)}
                onLongPress={() => handleDelete(item)}
                style={[
                  styles.row,
                  {
                    borderBottomColor: colors.border,
                    backgroundColor: unread
                      ? meta.color + '0D' // 5% tint
                      : 'transparent',
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconBubble,
                    { backgroundColor: meta.color + '1F' },
                  ]}
                >
                  <Icon name={meta.icon} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.titleRow}>
                    <Typo
                      variant="body"
                      color={colors.textPrimary}
                      style={[styles.title, unread && styles.titleUnread]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Typo>
                    <Typo variant="caption" color={colors.textSecondary}>
                      {timeAgo(item.createdAt)}
                    </Typo>
                  </View>
                  <Typo
                    variant="caption"
                    color={colors.textSecondary}
                    numberOfLines={2}
                  >
                    {item.body}
                  </Typo>
                </View>
                {unread ? (
                  <View
                    style={[styles.unreadDot, { backgroundColor: meta.color }]}
                  />
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── PREVIEW MODAL ── */}
      <Modal
        visible={previewItem !== null}
        transparent
        animationType="fade"
        hardwareAccelerated
        presentationStyle="overFullScreen"
        onRequestClose={() => setPreviewItem(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={() => setPreviewItem(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalCard, { backgroundColor: colors.surface }]}
            onPress={e => e.stopPropagation()}
          >
            {previewItem ? (
              <>
                {/* Header — icon + close */}
                <View style={styles.modalHeader}>
                  {(() => {
                    const meta = EVENT_META[previewItem.event] ?? {
                      icon: 'notifications-outline' as IconName,
                      color: colors.primary,
                    };
                    return (
                      <View
                        style={[
                          styles.modalIconBubble,
                          { backgroundColor: meta.color + '1F' },
                        ]}
                      >
                        <Icon name={meta.icon} size={22} color={meta.color} />
                      </View>
                    );
                  })()}
                  <TouchableOpacity
                    onPress={() => setPreviewItem(null)}
                    style={styles.modalCloseBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="close" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Body */}
                <ScrollView
                  style={styles.modalBodyScroll}
                  contentContainerStyle={styles.modalBodyContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Typo
                    variant="subheading"
                    color={colors.textPrimary}
                    style={styles.modalTitle}
                  >
                    {previewItem.title}
                  </Typo>
                  <Typo
                    variant="caption"
                    color={colors.textSecondary}
                    style={styles.modalTime}
                  >
                    {timeAgo(previewItem.createdAt)}
                  </Typo>
                  <Typo
                    variant="body"
                    color={colors.textPrimary}
                    style={styles.modalBody}
                  >
                    {previewItem.body}
                  </Typo>
                </ScrollView>

                {/* Actions */}
                <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
                  {previewAction ? (
                    <>
                      <TouchableOpacity
                        style={[styles.modalBtn, styles.modalBtnSecondary, { borderColor: colors.border }]}
                        onPress={() => setPreviewItem(null)}
                      >
                        <Typo style={[styles.modalBtnText, { color: colors.textSecondary }]}>
                          Close
                        </Typo>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
                        onPress={() => handleDeepLink(previewItem)}
                      >
                        <Typo style={[styles.modalBtnText, { color: '#fff', fontWeight: '700' }]}>
                          {previewAction.label}
                        </Typo>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.primary, flex: 1 }]}
                      onPress={() => setPreviewItem(null)}
                    >
                      <Typo style={[styles.modalBtnText, { color: '#fff', fontWeight: '700' }]}>
                        Got it
                      </Typo>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  backBtn: { padding: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontSize: 14, flex: 1 },
  titleUnread: { fontWeight: '700' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },

  /* ── preview modal ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalIconBubble: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: { padding: 4 },
  modalBodyScroll: { flexShrink: 1 },
  modalBodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', lineHeight: 22 },
  modalTime: { fontSize: 12, marginBottom: 4 },
  modalBody: { fontSize: 14, lineHeight: 20 },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondary: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  modalBtnPrimary: {},
  modalBtnText: { fontSize: 14, fontWeight: '600' },
});
