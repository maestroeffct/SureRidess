import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import { useFormatMoney } from '@/providers/CurrencyProvider';
import {
  getMyFinanceOverview,
  type MyFinanceOverview,
  type MyFine,
  type MyDamageClaim,
  type MyDeposit,
} from '@/services/finance.service';

/**
 * My Finances — one page for anything money-related to the customer
 * that isn't the booking receipt itself:
 *   - Fines raised against them (Pay button when unpaid)
 *   - Damage claims filed against their bookings (with admin outcome)
 *   - Security deposit hold state per booking (authorized/released/captured)
 */
export function FinanceScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const fmtMoney = useFormatMoney();
  const [data, setData] = useState<MyFinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getMyFinanceOverview();
      setData(res);
    } catch (e) {
      console.warn('[Finance] load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const fmt = (amount?: number, currency?: string) =>
    fmtMoney(amount, currency ?? data?.totals.currency ?? 'NGN', { round: true });

  if (loading && !data) {
    return (
      <ScreenWrapper>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#0A6A4B" />
        </View>
      </ScreenWrapper>
    );
  }

  const totals = data?.totals;
  const fines = data?.fines ?? [];
  const damages = data?.damageClaims ?? [];
  const deposits = data?.deposits ?? [];

  return (
    <ScreenWrapper padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0A6A4B']} />
        }
      >
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Typo variant="subheading">My Finances</Typo>
        </View>

        {/* KPI strip */}
        <View style={s.kpiRow}>
          <View style={[s.kpi, { backgroundColor: '#FEF3C7' }]}>
            <Typo style={[s.kpiLabel, { color: '#92400E' }]}>Outstanding fines</Typo>
            <Typo style={[s.kpiValue, { color: '#7C2D12' }]}>
              {fmt(totals?.outstandingFines)}
            </Typo>
          </View>
          <View style={[s.kpi, { backgroundColor: '#DBEAFE' }]}>
            <Typo style={[s.kpiLabel, { color: '#1E40AF' }]}>Held on card</Typo>
            <Typo style={[s.kpiValue, { color: '#1E3A8A' }]}>
              {fmt(totals?.heldDeposit)}
            </Typo>
          </View>
        </View>

        {/* Fines section */}
        <Section title="Fines" icon="alert-circle-outline" count={fines.length} colors={colors}>
          {fines.length === 0 ? (
            <EmptyRow text="No fines. Keep it up." colors={colors} />
          ) : (
            fines.map(f => <FineRow key={f.id} fine={f} colors={colors} fmt={fmt} />)
          )}
        </Section>

        {/* Damage claims section */}
        <Section title="Damage claims" icon="construct-outline" count={damages.length} colors={colors}>
          {damages.length === 0 ? (
            <EmptyRow text="No damage claims on your bookings." colors={colors} />
          ) : (
            damages.map(d => <DamageRow key={d.id} claim={d} colors={colors} fmt={fmt} />)
          )}
        </Section>

        {/* Deposits section */}
        <Section title="Security deposits" icon="lock-closed-outline" count={deposits.length} colors={colors}>
          {deposits.length === 0 ? (
            <EmptyRow text="No active deposits." colors={colors} />
          ) : (
            deposits.map(d => (
              <DepositRow key={d.id} deposit={d} colors={colors} fmt={fmt} onOpenBooking={() =>
                navigation.navigate('CarRentalFlowNavigator' as any, {
                  screen: 'BookingDetails',
                  params: { bookingId: d.booking.id },
                })
              } />
            ))
          )}
        </Section>
      </ScrollView>
    </ScreenWrapper>
  );
}

function Section({ title, icon, count, colors, children }: any) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Icon name={icon} size={16} color="#0A6A4B" />
        <Typo style={[s.sectionTitle, { color: colors.textPrimary }]}>{title}</Typo>
        {count > 0 && (
          <View style={s.sectionCount}>
            <Typo style={s.sectionCountText}>{count}</Typo>
          </View>
        )}
      </View>
      <View>{children}</View>
    </View>
  );
}

function EmptyRow({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={s.empty}>
      <Typo style={{ color: colors.textSecondary, fontSize: 13 }}>{text}</Typo>
    </View>
  );
}

function FineRow({ fine, colors, fmt }: { fine: MyFine; colors: any; fmt: (a?: number, c?: string) => string }) {
  const unpaid = fine.status === 'PENDING' || fine.status === 'OVERDUE';
  const openPayment = () => {
    // Public web checkout — deep-linked via the reference. Works on
    // Nigerian test cards etc; also opens in browser if the app can't
    // handle it internally.
    const base = 'https://sureride-backend.onrender.com';
    const url = `${base.replace(/\/api$/, '')}/pay/fine/${fine.reference}`;
    Linking.openURL(url).catch(() => {});
  };
  return (
    <View style={[s.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Typo style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>
          {fine.category.replace(/_/g, ' ')} · {fmt(fine.amount, fine.currency)}
        </Typo>
        <Typo style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
          {fine.reason}
        </Typo>
        {fine.booking?.car && (
          <Typo style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
            {fine.booking.car.brand} {fine.booking.car.model} · {dayjs(fine.createdAt).format('D MMM YYYY')}
          </Typo>
        )}
      </View>
      {unpaid ? (
        <TouchableOpacity onPress={openPayment} style={s.payBtn}>
          <Typo style={s.payBtnText}>Pay</Typo>
        </TouchableOpacity>
      ) : (
        <View style={[s.pill, statusPillStyle(fine.status)]}>
          <Typo style={s.pillText}>{fine.status}</Typo>
        </View>
      )}
    </View>
  );
}

function DamageRow({ claim, colors, fmt }: { claim: MyDamageClaim; colors: any; fmt: (a?: number, c?: string) => string }) {
  return (
    <View style={[s.row, { borderBottomColor: colors.border, alignItems: 'flex-start' }]}>
      <View style={{ flex: 1 }}>
        <Typo style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>
          {claim.booking.car.brand} {claim.booking.car.model} · {fmt(claim.estimatedCost, claim.currency)}
        </Typo>
        <Typo style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
          {claim.description}
        </Typo>
        {claim.resolutionNote && (
          <Typo style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
            Admin: {claim.resolutionNote}
          </Typo>
        )}
        {claim.fine && (
          <Typo style={{ color: '#B45309', fontSize: 11, marginTop: 4, fontWeight: '600' }}>
            Fine issued · {claim.fine.status}
          </Typo>
        )}
      </View>
      <View style={[s.pill, damagePillStyle(claim.status)]}>
        <Typo style={s.pillText}>{claim.status.replace(/_/g, ' ')}</Typo>
      </View>
    </View>
  );
}

function DepositRow({ deposit, colors, fmt, onOpenBooking }: {
  deposit: MyDeposit; colors: any; fmt: (a?: number, c?: string) => string; onOpenBooking: () => void;
}) {
  const statusText = deposit.status === 'AUTHORIZED' ? 'Held on your card'
    : deposit.status === 'RELEASED' ? 'Released to your card'
    : deposit.status === 'CAPTURED' ? `Captured ${fmt(deposit.capturedAmount ?? deposit.amount, deposit.currency)}`
    : deposit.failureReason || 'Failed';
  return (
    <TouchableOpacity onPress={onOpenBooking} style={[s.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Typo style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>
          {deposit.booking.car.brand} {deposit.booking.car.model}
        </Typo>
        <Typo style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
          {fmt(deposit.amount, deposit.currency)} · {statusText}
        </Typo>
        <Typo style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
          Trip {dayjs(deposit.booking.pickupAt).format('D MMM')} – {dayjs(deposit.booking.returnAt).format('D MMM YYYY')}
        </Typo>
      </View>
      <View style={[s.pill, depositPillStyle(deposit.status)]}>
        <Typo style={s.pillText}>{deposit.status}</Typo>
      </View>
    </TouchableOpacity>
  );
}

function statusPillStyle(status: MyFine['status']) {
  if (status === 'PENDING') return { backgroundColor: '#FEF3C7' };
  if (status === 'OVERDUE') return { backgroundColor: '#FEE2E2' };
  if (status === 'PAID') return { backgroundColor: '#DCFCE7' };
  return { backgroundColor: '#E5E7EB' };
}
function damagePillStyle(status: MyDamageClaim['status']) {
  if (status === 'APPROVED' || status === 'PAID') return { backgroundColor: '#DCFCE7' };
  if (status === 'REJECTED' || status === 'CANCELLED') return { backgroundColor: '#E5E7EB' };
  return { backgroundColor: '#FEF3C7' };
}
function depositPillStyle(status: MyDeposit['status']) {
  if (status === 'RELEASED') return { backgroundColor: '#DCFCE7' };
  if (status === 'CAPTURED') return { backgroundColor: '#FEE2E2' };
  if (status === 'FAILED') return { backgroundColor: '#FEE2E2' };
  return { backgroundColor: '#DBEAFE' };
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1 },

  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  kpi: { flex: 1, padding: 14, borderRadius: 12 },
  kpiLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  kpiValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },

  section: { marginTop: 22 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  sectionCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: '#0A6A4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  empty: { paddingHorizontal: 20, paddingVertical: 20 },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { fontSize: 10, fontWeight: '800', color: '#111', letterSpacing: 0.3 },

  payBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#B45309',
  },
  payBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
