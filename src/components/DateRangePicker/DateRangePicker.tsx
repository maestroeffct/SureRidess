import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Typo } from '@/components/AppText/Typo';
import Icon from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/theme/ThemeProvider';

const GREEN = '#0A6A4B';
const GREEN_LIGHT = '#DFF0E9';
const { width: SW } = Dimensions.get('window');
const CELL = Math.floor((SW - 48) / 7);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function clearTime(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function firstWeekday(y: number, m: number): number {
  return new Date(y, m, 1).getDay();
}

type TimeVal = { hour: number; minute: number };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

type TimeStepperProps = {
  label: string;
  value: TimeVal;
  onChange: (v: TimeVal) => void;
};

const TimeStepper: React.FC<TimeStepperProps> = ({ label, value, onChange }) => {
  const { mode, colors } = useTheme();
  const hh = String(value.hour).padStart(2, '0');
  const mm = String(value.minute).padStart(2, '0');
  return (
    <View style={ts.wrap}>
      <Typo style={[ts.label, { color: colors.textSecondary }]}>{label}</Typo>
      <View style={ts.row}>
        {/* hour column */}
        <View style={ts.col}>
          <TouchableOpacity
            style={[ts.arrow, { backgroundColor: mode === 'dark' ? '#0F3027' : '#F3FAF7' }]}
            onPress={() => onChange({ ...value, hour: (value.hour + 1) % 24 })}
          >
            <Icon name="chevron-up" size={16} color={GREEN} />
          </TouchableOpacity>
          <Typo style={[ts.digit, { color: colors.textPrimary }]}>{hh}</Typo>
          <TouchableOpacity
            style={[ts.arrow, { backgroundColor: mode === 'dark' ? '#0F3027' : '#F3FAF7' }]}
            onPress={() => onChange({ ...value, hour: (value.hour + 23) % 24 })}
          >
            <Icon name="chevron-down" size={16} color={GREEN} />
          </TouchableOpacity>
        </View>
        <Typo style={[ts.colon, { color: colors.textPrimary }]}>:</Typo>
        {/* minute column */}
        <View style={ts.col}>
          <TouchableOpacity
            style={[ts.arrow, { backgroundColor: mode === 'dark' ? '#0F3027' : '#F3FAF7' }]}
            onPress={() => onChange({ ...value, minute: value.minute === 45 ? 0 : value.minute + 15 })}
          >
            <Icon name="chevron-up" size={16} color={GREEN} />
          </TouchableOpacity>
          <Typo style={[ts.digit, { color: colors.textPrimary }]}>{mm}</Typo>
          <TouchableOpacity
            style={[ts.arrow, { backgroundColor: mode === 'dark' ? '#0F3027' : '#F3FAF7' }]}
            onPress={() => onChange({ ...value, minute: value.minute === 0 ? 45 : value.minute - 15 })}
          >
            <Icon name="chevron-down" size={16} color={GREEN} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const ts = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 6 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  col: { alignItems: 'center', gap: 2 },
  arrow: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  digit: {
    fontSize: 22,
    fontWeight: '700',
    width: 34,
    textAlign: 'center',
  },
  colon: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
});

export type DateRangeResult = {
  pickupDate: Date;
  returnDate: Date;
  pickupTime: TimeVal;
  returnTime: TimeVal;
};

type Props = {
  visible: boolean;
  initialPickupDate: Date;
  initialReturnDate: Date;
  initialPickupTime?: TimeVal;
  initialReturnTime?: TimeVal;
  onConfirm: (result: DateRangeResult) => void;
  onCancel: () => void;
};

export const DateRangePicker: React.FC<Props> = ({
  visible,
  initialPickupDate,
  initialReturnDate,
  initialPickupTime = { hour: 10, minute: 0 },
  initialReturnTime = { hour: 10, minute: 0 },
  onConfirm,
  onCancel,
}) => {
  const { mode, colors } = useTheme();
  const today = clearTime(new Date());

  const [activeTab, setActiveTab] = useState<'pickup' | 'dropoff'>('pickup');
  const [pickup, setPickup] = useState(clearTime(initialPickupDate));
  const [dropoff, setDropoff] = useState(clearTime(initialReturnDate));
  const [pickupTime, setPickupTime] = useState<TimeVal>(initialPickupTime);
  const [returnTime, setReturnTime] = useState<TimeVal>(initialReturnTime);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    if (visible) {
      setPickup(clearTime(initialPickupDate));
      setDropoff(clearTime(initialReturnDate));
      setPickupTime(initialPickupTime);
      setReturnTime(initialReturnTime);
      setActiveTab('pickup');
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const rentalDays = Math.max(
    1,
    Math.round((dropoff.getTime() - pickup.getTime()) / 86400000),
  );

  const handleDayPress = (y: number, m: number, d: number) => {
    const tapped = new Date(y, m, d);
    tapped.setHours(0, 0, 0, 0);
    if (tapped < today) return;

    if (activeTab === 'pickup') {
      setPickup(tapped);
      if (tapped >= dropoff) {
        const next = new Date(tapped);
        next.setDate(next.getDate() + 1);
        setDropoff(next);
      }
      setActiveTab('dropoff');
    } else {
      if (tapped < pickup) {
        setDropoff(pickup);
        setPickup(tapped);
      } else {
        setDropoff(tapped);
      }
      setActiveTab('pickup');
    }
  };

  const canPrevMonth =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const prevMonth = () => {
    if (!canPrevMonth) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Build calendar cells: null = empty leading cell
  const totalDays = daysInMonth(viewYear, viewMonth);
  const leadingBlanks = firstWeekday(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const handleConfirm = () => {
    onConfirm({ pickupDate: pickup, returnDate: dropoff, pickupTime, returnTime });
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      hardwareAccelerated
      presentationStyle="overFullScreen"
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: colors.background }]}>
          {/* ── TABS ── */}
          <View style={[s.tabs, { borderBottomColor: colors.border }]}>
            {(['pickup', 'dropoff'] as const).map(tab => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[s.tab, isActive && s.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Typo
                    style={[
                      s.tabKey,
                      { color: isActive ? GREEN : colors.textSecondary },
                    ]}
                  >
                    {tab === 'pickup' ? 'PICK-UP' : 'DROP-OFF'}
                  </Typo>
                  <Typo
                    style={[
                      s.tabDate,
                      { color: isActive ? colors.textPrimary : colors.textSecondary },
                    ]}
                  >
                    {fmtDate(tab === 'pickup' ? pickup : dropoff)}
                  </Typo>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── RENTAL DAYS ── */}
          <Typo style={[s.rentalLine, { color: colors.textSecondary }]}>
            You've chosen{' '}
            <Typo style={s.rentalCount}>
              {rentalDays} rental day{rentalDays !== 1 ? 's' : ''}
            </Typo>
          </Typo>

          {/* ── MONTH NAV ── */}
          <View style={s.monthNav}>
            <TouchableOpacity
              onPress={prevMonth}
              style={[
                s.navBtn,
                { backgroundColor: mode === 'dark' ? '#0F3027' : '#F3FAF7' },
                !canPrevMonth && {
                  backgroundColor: mode === 'dark' ? colors.surface : '#F3F4F6',
                },
              ]}
              disabled={!canPrevMonth}
            >
              <Icon
                name="chevron-back"
                size={20}
                color={canPrevMonth ? GREEN : colors.textSecondary}
              />
            </TouchableOpacity>
            <Typo style={[s.monthLabel, { color: colors.textPrimary }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Typo>
            <TouchableOpacity
              style={[
                s.navBtn,
                { backgroundColor: mode === 'dark' ? '#0F3027' : '#F3FAF7' },
              ]}
              onPress={nextMonth}
            >
              <Icon name="chevron-forward" size={20} color={GREEN} />
            </TouchableOpacity>
          </View>

          {/* ── DAY HEADERS ── */}
          <View style={s.dayRow}>
            {DAY_LABELS.map(d => (
              <Typo key={d} style={[s.dayHeader, { color: colors.textSecondary }]}>
                {d}
              </Typo>
            ))}
          </View>

          {/* ── CALENDAR GRID ── */}
          <View style={s.grid}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <View key={`b${idx}`} style={s.cell} />;
              }

              const cellDate = new Date(viewYear, viewMonth, day);
              cellDate.setHours(0, 0, 0, 0);

              const isPast = cellDate < today;
              const isPickup = isSameDay(cellDate, pickup);
              const isDropoff = isSameDay(cellDate, dropoff);
              const inRange = cellDate > pickup && cellDate < dropoff;

              return (
                <TouchableOpacity
                  key={day}
                  style={[s.cell, isPast && s.cellPast]}
                  onPress={() => !isPast && handleDayPress(viewYear, viewMonth, day)}
                  disabled={isPast}
                  activeOpacity={isPast ? 1 : 0.7}
                >
                  {/* Range background strip */}
                  {(inRange || (isPickup && !isSameDay(pickup, dropoff)) || (isDropoff && !isSameDay(pickup, dropoff))) ? (
                    <View
                      style={[
                        s.rangeBg,
                        inRange && s.rangeBgFull,
                        isPickup && !isSameDay(pickup, dropoff) && s.rangeBgRight,
                        isDropoff && !isSameDay(pickup, dropoff) && s.rangeBgLeft,
                      ]}
                    />
                  ) : null}

                  {/* Circle for selected endpoints */}
                  {(isPickup || isDropoff) ? (
                    <View style={s.circle}>
                      <Typo style={s.cellTextSelected}>{day}</Typo>
                    </View>
                  ) : (
                    <Typo
                      style={[
                        s.cellText,
                        { color: colors.textPrimary },
                        isPast && { color: colors.textSecondary, opacity: 0.5 },
                        inRange && s.cellTextRange,
                      ]}
                    >
                      {day}
                    </Typo>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── TIME PICKERS ── */}
          <View style={[s.timeSeparator, { backgroundColor: colors.border }]} />
          <View style={s.timeRow}>
            <TimeStepper
              label="PICK-UP TIME"
              value={pickupTime}
              onChange={setPickupTime}
            />
            <View style={[s.timeVertDivider, { backgroundColor: colors.border }]} />
            <TimeStepper
              label="DROP-OFF TIME"
              value={returnTime}
              onChange={setReturnTime}
            />
          </View>

          {/* ── ACTIONS ── */}
          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
              <Typo style={s.cancelText}>Cancel</Typo>
            </TouchableOpacity>
            <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm}>
              <Typo style={s.confirmText}>Confirm</Typo>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingTop: 0,
  },

  /* ── TABS ── */
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: GREEN,
  },
  tabKey: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tabDate: { fontSize: 13, fontWeight: '600', marginTop: 2 },

  /* ── RENTAL DAYS ── */
  rentalLine: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 12,
    marginBottom: 4,
  },
  rentalCount: { fontSize: 13, fontWeight: '700', color: GREEN },

  /* ── MONTH NAV ── */
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: { fontSize: 16, fontWeight: '700' },

  /* ── DAY HEADERS ── */
  dayRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  dayHeader: {
    width: CELL,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },

  /* ── GRID ── */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  cell: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellPast: { opacity: 0.3 },

  /* range strip backgrounds */
  rangeBg: {
    position: 'absolute',
    top: '15%',
    bottom: '15%',
    backgroundColor: GREEN_LIGHT,
  },
  rangeBgFull: { left: 0, right: 0 },
  rangeBgLeft: { left: 0, right: '50%' },
  rangeBgRight: { left: '50%', right: 0 },

  /* endpoint circle */
  circle: {
    width: CELL - 10,
    height: CELL - 10,
    borderRadius: (CELL - 10) / 2,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { fontSize: 14, fontWeight: '500' },
  cellTextRange: { color: GREEN, fontWeight: '600' },
  cellTextSelected: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* ── TIME PICKERS ── */
  timeSeparator: {
    height: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  timeVertDivider: { width: 1, marginHorizontal: 16 },

  /* ── ACTIONS ── */
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: GREEN, fontSize: 15, fontWeight: '700' },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
