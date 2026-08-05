import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import type { PricingPreview } from '@/services/pricing.service';
import { useCurrency, useFormatMoney } from '@/providers/CurrencyProvider';
import { useTheme } from '@/theme/ThemeProvider';

const GREEN = '#0A6A4B';

type Props = {
  pricing: PricingPreview | null;
  loading?: boolean;
  fallbackDailyRate?: number;
  fallbackDays?: number;
  insuranceLabel?: string;
  /**
   * Used when `pricing` hasn't loaded yet. Without this, the formatter has no
   * source currency to convert from, the conversion silently no-ops, and the
   * raw amount is formatted with the user's display-currency symbol — e.g.
   * NGN 25,000 renders as "£25,000".
   */
  fallbackCurrency?: string;
};

export function PriceBreakdown({
  pricing,
  loading,
  fallbackDailyRate,
  fallbackDays,
  insuranceLabel,
  fallbackCurrency,
}: Props) {
  const { currency: userCurrency } = useCurrency();
  const fmtMoney = useFormatMoney();
  const { colors } = useTheme();
  const sourceCurrency = pricing?.currency ?? fallbackCurrency;
  const fmt = (amount?: number) => fmtMoney(amount, sourceCurrency, { round: true });
  const isConverted =
    !!sourceCurrency &&
    !!userCurrency &&
    sourceCurrency.toUpperCase() !== userCurrency.toUpperCase();

  const days = pricing?.rentalDays ?? fallbackDays ?? 0;
  const perDay = pricing?.basePrice && pricing.rentalDays
    ? Math.round(pricing.basePrice / pricing.rentalDays)
    : fallbackDailyRate;
  const basePrice = pricing?.basePrice ?? (fallbackDailyRate && days ? fallbackDailyRate * days : 0);
  const insuranceFee = pricing?.insuranceFee ?? 0;
  const addonsFee = pricing?.addonsFee ?? 0;
  const addonLines = pricing?.addonLines ?? [];
  const subtotal = pricing?.subtotal ?? basePrice + insuranceFee + addonsFee;
  const taxes = pricing?.taxes ?? [];
  const taxAmount = pricing?.taxAmount ?? 0;
  const total = pricing?.totalPrice ?? subtotal + taxAmount;
  const deposit = pricing?.depositAmount ?? 0;

  if (loading) {
    return (
      <View style={s.wrap}>
        <Typo style={s.calculating}>Calculating price…</Typo>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <Row
        label={`Car rental (${days} day${days !== 1 ? 's' : ''}${perDay ? ` × ${fmt(perDay)}` : ''})`}
        value={fmt(basePrice)}
      />

      {insuranceFee > 0 && (
        <Row
          label={insuranceLabel ? `Insurance · ${insuranceLabel}` : 'Insurance fee'}
          value={fmt(insuranceFee)}
        />
      )}

      {addonLines.map(line => (
        <Row
          key={line.addonId}
          label={
            line.quantity > 1
              ? `${line.name} × ${line.quantity}`
              : line.name
          }
          value={fmt(line.lineTotal)}
        />
      ))}

      {(insuranceFee > 0 || addonsFee > 0 || taxAmount > 0) && (
        <>
          <View style={[s.dividerLight, { backgroundColor: colors.border }]} />
          <Row label="Subtotal" value={fmt(subtotal)} muted />
        </>
      )}

      {taxes.length > 0 ? (
        taxes.map(tax => (
          <Row
            key={tax.code || tax.label}
            // Backend returns rate as a percentage already (7.5 = 7.5%), not
            // a decimal — don't multiply by 100.
            label={`${tax.label}${tax.rate ? ` (${tax.rate.toFixed(1)}%)` : ''}`}
            value={fmt(tax.amount)}
          />
        ))
      ) : taxAmount > 0 ? (
        <Row
          label={`Tax${pricing?.taxRate ? ` (${pricing.taxRate.toFixed(1)}%)` : ''}`}
          value={fmt(taxAmount)}
        />
      ) : null}

      <View style={[s.divider, { backgroundColor: colors.border }]} />

      <View style={s.totalRow}>
        <Typo style={[s.totalLabel, { color: colors.textPrimary }]}>
          Charged at checkout
        </Typo>
        <Typo style={s.totalValue}>{fmt(total)}</Typo>
      </View>

      {isConverted && sourceCurrency && (
        <View style={s.fxNote}>
          <Icon name="swap-horizontal-outline" size={12} color={colors.textSecondary} />
          <Typo style={[s.fxNoteText, { color: colors.textSecondary }]}>
            Display is approximate. You'll be charged{' '}
            <Typo style={[s.fxNoteText, { color: colors.textPrimary, fontWeight: '700' }]}>
              {fmtMoney(total, sourceCurrency, { round: true, strict: true })}
            </Typo>{' '}
            in {sourceCurrency.toUpperCase()} at checkout.
          </Typo>
        </View>
      )}

      {deposit > 0 && (
        <View
          style={[
            s.depositRow,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Icon name="lock-closed-outline" size={14} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Typo style={[s.depositLabel, { color: colors.textPrimary }]}>
              Refundable deposit (not charged)
            </Typo>
            <Typo style={[s.depositHint, { color: colors.textSecondary }]}>
              Pre-authorized on your card at pickup, then released back to you
              when the car is returned in good condition.
            </Typo>
          </View>
          <Typo style={[s.depositValue, { color: colors.textPrimary }]}>{fmt(deposit)}</Typo>
        </View>
      )}

      <View style={s.assuranceRow}>
        <Icon name="shield-checkmark" size={14} color={GREEN} />
        <Typo style={s.assuranceText}>No hidden fees — what you see is what you pay.</Typo>
      </View>
    </View>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={s.row}>
      <Typo
        style={[
          s.rowLabel,
          { color: muted ? colors.textSecondary : colors.textPrimary },
          muted && s.rowLabelMuted,
        ]}
      >
        {label}
      </Typo>
      <Typo
        style={[
          s.rowValue,
          { color: muted ? colors.textSecondary : colors.textPrimary },
        ]}
      >
        {value}
      </Typo>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingVertical: 4 },
  calculating: {
    fontSize: 13,
    paddingVertical: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLabel: { fontSize: 13, flex: 1, paddingRight: 12 },
  rowLabelMuted: { fontWeight: '600' },
  rowValue: { fontSize: 13, fontWeight: '600' },
  dividerLight: { height: 1, marginVertical: 2 },
  divider: { height: 1, marginVertical: 8 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  totalLabel: { fontSize: 15, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '800', color: GREEN },
  depositRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  depositLabel: { fontSize: 13, fontWeight: '600' },
  depositHint: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  depositValue: { fontSize: 13, fontWeight: '700' },
  fxNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  fxNoteText: { fontSize: 11, flex: 1, lineHeight: 15 },
  assuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  assuranceText: { fontSize: 11, color: GREEN, fontWeight: '500' },
});
