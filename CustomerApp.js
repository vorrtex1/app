import React, { useState, useEffect, useMemo } from 'react';
import {
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TrackingMap from './TrackingMap';
import Alert from './alert';

/* ------------------------------------------------------------------ */
/* Config + mock data (replace with API calls to your backend)         */
/* ------------------------------------------------------------------ */

const CURRENCY = '$';
const SERVICE_FEE = 0.05; // 5% platform fee

const C = {
  navy: '#17212B',
  steel: '#5B6B78',
  concrete: '#E8EAEB',
  paper: '#FFFFFF',
  hivis: '#F5C400',
  line: '#D3D7DA',
  red: '#C0392B',
  green: '#2E7D4F',
};

const TRADES = [
  { id: 'plumber', label: 'Plumber', icon: '🔧' },
  { id: 'electrician', label: 'Electrician', icon: '⚡' },
  { id: 'carpenter', label: 'Carpenter', icon: '🪚' },
  { id: 'painter', label: 'Painter', icon: '🎨' },
  { id: 'mason', label: 'Mason', icon: '🧱' },
  { id: 'welder', label: 'Welder', icon: '🔥' },
  { id: 'ac', label: 'AC repair', icon: '❄️' },
  { id: 'cleaner', label: 'Cleaner', icon: '🧹' },
  { id: 'mover', label: 'Mover', icon: '📦' },
];

const WORKERS = [
  { id: 'w1', name: 'Marcus Phillip', trade: 'plumber', rating: 4.9, jobs: 212, rate: 45, km: 1.2, verified: true },
  { id: 'w2', name: 'Anil Ramdass', trade: 'plumber', rating: 4.6, jobs: 98, rate: 35, km: 3.4, verified: true },
  { id: 'w3', name: 'Kerron Baptiste', trade: 'electrician', rating: 4.8, jobs: 164, rate: 55, km: 2.1, verified: true },
  { id: 'w4', name: 'Devon Mohammed', trade: 'electrician', rating: 4.5, jobs: 61, rate: 40, km: 0.8, verified: false },
  { id: 'w5', name: 'Richard Joseph', trade: 'carpenter', rating: 4.7, jobs: 130, rate: 50, km: 4.0, verified: true },
  { id: 'w6', name: 'Shaun Alexander', trade: 'painter', rating: 4.4, jobs: 77, rate: 30, km: 2.6, verified: true },
  { id: 'w7', name: 'Lenny Charles', trade: 'painter', rating: 4.9, jobs: 205, rate: 42, km: 5.2, verified: true },
  { id: 'w8', name: 'Winston Greaves', trade: 'mason', rating: 4.8, jobs: 143, rate: 48, km: 3.0, verified: true },
  { id: 'w9', name: 'Tyrone Ali', trade: 'welder', rating: 4.7, jobs: 89, rate: 52, km: 6.1, verified: true },
  { id: 'w10', name: 'Ravi Singh', trade: 'ac', rating: 4.9, jobs: 301, rate: 60, km: 1.9, verified: true },
  { id: 'w11', name: 'Patrice Lewis', trade: 'cleaner', rating: 4.8, jobs: 188, rate: 25, km: 1.5, verified: true },
  { id: 'w12', name: 'Gary Noel', trade: 'mover', rating: 4.6, jobs: 120, rate: 38, km: 2.8, verified: false },
];

const STATUSES = [
  'Request sent',
  'Accepted',
  'On the way',
  'Arrived',
  'Work in progress',
  'Work complete',
];

const SORTS = [
  { id: 'near', label: 'Nearest' },
  { id: 'rating', label: 'Top rated' },
  { id: 'price', label: 'Lowest rate' },
];

const money = (n) => `${CURRENCY}${n.toFixed(2)}`;
const etaMinutes = (km) => Math.max(4, Math.round(km * 4));

/* ------------------------------------------------------------------ */
/* Small shared components                                             */
/* ------------------------------------------------------------------ */

function Button({ title, onPress, variant = 'primary', disabled, style }) {
  const bg =
    variant === 'primary' ? C.navy : variant === 'accent' ? C.hivis : 'transparent';
  const color = variant === 'primary' ? C.hivis : C.navy;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : 1 },
        variant === 'ghost' && { borderWidth: 1.5, borderColor: C.navy },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

function Stars({ value, onChange, size = 18 }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} disabled={!onChange} onPress={() => onChange && onChange(n)}>
          <Text style={{ fontSize: size, color: n <= Math.round(value) ? C.hivis : C.line }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Avatar({ name, size = 48 }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: C.hivis, fontWeight: '700', fontSize: size / 2.6 }}>{initials}</Text>
    </View>
  );
}

function Header({ title, onBack }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

function HomeScreen({ trade, setTrade, address, setAddress, notes, setNotes, onFind }) {
  const ready = trade && address.trim().length > 2;
  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>What needs fixing?</Text>
      <Text style={styles.sub}>Pick a trade and we'll find verified workers nearby.</Text>

      <View style={styles.grid}>
        {TRADES.map((t) => {
          const active = trade === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTrade(t.id)}
              style={[styles.tile, active && styles.tileActive]}
            >
              <Text style={{ fontSize: 28 }}>{t.icon}</Text>
              <Text style={[styles.tileLabel, active && { color: C.hivis }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Job address</Text>
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="Street, area"
        placeholderTextColor={C.steel}
        style={styles.input}
      />

      <Text style={styles.label}>Describe the job (optional)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. Kitchen sink is leaking under the cabinet"
        placeholderTextColor={C.steel}
        multiline
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
      />

      <Button title="Find workers" onPress={onFind} disabled={!ready} style={{ marginTop: 20 }} />
    </ScrollView>
  );
}

function WorkersScreen({ trade, onBack, onSelect }) {
  const [sort, setSort] = useState('near');
  const list = useMemo(() => {
    const items = WORKERS.filter((w) => w.trade === trade);
    return items.sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'price') return a.rate - b.rate;
      return a.km - b.km;
    });
  }, [trade, sort]);
  const tradeInfo = TRADES.find((t) => t.id === trade);

  return (
    <View style={{ flex: 1 }}>
      <Header title={`${tradeInfo.label}s nearby`} onBack={onBack} />
      <View style={styles.sortRow}>
        {SORTS.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => setSort(s.id)}
            style={[styles.chip, sort === s.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, sort === s.id && { color: C.hivis }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={list}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        ListEmptyComponent={
          <Text style={styles.sub}>No workers available for this trade right now. Try again soon.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onSelect(item)} activeOpacity={0.85}>
            <Avatar name={item.name} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>
                {item.name} {item.verified ? <Text style={{ color: C.green }}>✔</Text> : null}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Stars value={item.rating} size={14} />
                <Text style={styles.meta}>
                  {' '}
                  {item.rating} · {item.jobs} jobs
                </Text>
              </View>
              <Text style={styles.meta}>
                {item.km} km away · arrives in ~{etaMinutes(item.km)} min
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.price}>{money(item.rate)}</Text>
              <Text style={styles.meta}>per hour</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function ConfirmScreen({ worker, address, notes, hours, setHours, onBack, onConfirm }) {
  const subtotal = worker.rate * hours;
  const fee = subtotal * SERVICE_FEE;
  const total = subtotal + fee;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <Header title="Confirm booking" onBack={onBack} />
      <View style={styles.pad}>
        <View style={styles.card}>
          <Avatar name={worker.name} size={56} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.cardTitle}>{worker.name}</Text>
            <Text style={styles.meta}>
              {TRADES.find((t) => t.id === worker.trade).label} · ★ {worker.rating}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Job address</Text>
        <Text style={styles.value}>{address}</Text>
        {notes ? (
          <>
            <Text style={styles.label}>Job details</Text>
            <Text style={styles.value}>{notes}</Text>
          </>
        ) : null}

        <Text style={styles.label}>Estimated hours</Text>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => setHours(Math.max(1, hours - 1))} style={styles.stepBtn}>
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepValue}>{hours} hr</Text>
          <TouchableOpacity onPress={() => setHours(Math.min(12, hours + 1))} style={styles.stepBtn}>
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.receipt}>
          <Row left={`${money(worker.rate)} × ${hours} hr`} right={money(subtotal)} />
          <Row left="Service fee (5%)" right={money(fee)} />
          <View style={styles.divider} />
          <Row left="Estimated total" right={money(total)} bold />
        </View>
        <Text style={styles.fine}>
          Final price is based on actual time worked. Pay the worker after the job is complete.
        </Text>

        <Button title={`Book ${worker.name.split(' ')[0]}`} onPress={() => onConfirm(total)} variant="accent" />
      </View>
    </ScrollView>
  );
}

function Row({ left, right, bold }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={[styles.value, bold && { fontWeight: '800' }]}>{left}</Text>
      <Text style={[styles.value, bold && { fontWeight: '800' }]}>{right}</Text>
    </View>
  );
}

function TrackingScreen({ booking, onCancel, onFinish }) {
  const { worker, statusIdx, total, address } = booking;
  const done = statusIdx === STATUSES.length - 1;
  const canCancel = statusIdx <= 2;
  const progress = (statusIdx / (STATUSES.length - 1)) * 100;
  const remainingEta =
    statusIdx < 3 ? Math.max(1, etaMinutes(worker.km) - statusIdx * 2) : 0;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <Header title="Your booking" />
      <View style={styles.pad}>
        <TrackingMap address={address} workerKm={worker.km} statusIdx={statusIdx} />
        <Text style={styles.mapCaption}>
          {statusIdx < 3 ? `Arriving in ~${remainingEta} min` : 'Worker is at your location'}
        </Text>

        <Text style={styles.statusNow}>{STATUSES[statusIdx]}</Text>
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${progress}%` }]} />
        </View>

        {STATUSES.map((s, i) => (
          <View key={s} style={styles.stepRow}>
            <View style={[styles.dot, i <= statusIdx && { backgroundColor: C.navy }]} />
            <Text style={[styles.value, i > statusIdx && { color: C.steel }]}>{s}</Text>
          </View>
        ))}

        <View style={[styles.card, { marginTop: 20 }]}>
          <Avatar name={worker.name} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardTitle}>{worker.name}</Text>
            <Text style={styles.meta}>★ {worker.rating} · {worker.jobs} jobs</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.price}>{money(total)}</Text>
            <Text style={styles.meta}>estimate</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <Button
            title="Call"
            variant="ghost"
            style={{ flex: 1, marginRight: 8 }}
            onPress={() => Alert.alert('Call', `Calling ${worker.name}… (connect a calling service here)`)}
          />
          <Button
            title="Message"
            variant="ghost"
            style={{ flex: 1, marginLeft: 8 }}
            onPress={() => Alert.alert('Message', 'In-app chat goes here.')}
          />
        </View>

        {done ? (
          <Button title="Pay & rate" variant="accent" onPress={onFinish} style={{ marginTop: 16 }} />
        ) : canCancel ? (
          <Button
            title="Cancel booking"
            variant="ghost"
            onPress={() =>
              Alert.alert('Cancel booking?', 'The worker will be notified.', [
                { text: 'Keep booking', style: 'cancel' },
                { text: 'Cancel booking', style: 'destructive', onPress: onCancel },
              ])
            }
            style={{ marginTop: 16 }}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

function RateScreen({ booking, onSubmit }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>How did it go?</Text>
      <Text style={styles.sub}>Rate {booking.worker.name} to help other customers.</Text>
      <View style={{ alignItems: 'center', marginVertical: 20 }}>
        <Avatar name={booking.worker.name} size={72} />
        <View style={{ marginTop: 14 }}>
          <Stars value={stars} onChange={setStars} size={40} />
        </View>
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Leave a comment (optional)"
        placeholderTextColor={C.steel}
        multiline
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
      />
      <Button title="Submit rating" onPress={() => onSubmit(stars, comment)} style={{ marginTop: 20 }} />
    </ScrollView>
  );
}

function HistoryScreen({ bookings }) {
  return (
    <FlatList
      data={bookings}
      keyExtractor={(b) => b.id}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={<Text style={styles.h1}>Your bookings</Text>}
      ListEmptyComponent={
        <Text style={styles.sub}>No bookings yet. Book your first worker from the Book tab.</Text>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, { marginTop: 12 }]}>
          <Avatar name={item.worker.name} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardTitle}>{item.worker.name}</Text>
            <Text style={styles.meta}>
              {TRADES.find((t) => t.id === item.worker.trade).label} · {item.date}
            </Text>
            {item.stars ? <Stars value={item.stars} size={14} /> : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.price}>{money(item.total)}</Text>
            <Text style={[styles.meta, { color: item.cancelled ? C.red : C.green, fontWeight: '700' }]}>
              {item.cancelled ? 'Cancelled' : 'Completed'}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function CustomerApp({ onSwitchRole }) {
  const [tab, setTab] = useState('book'); // 'book' | 'trips'
  const [step, setStep] = useState('home'); // home | workers | confirm | tracking | rate

  const [trade, setTrade] = useState(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [worker, setWorker] = useState(null);
  const [hours, setHours] = useState(2);

  const [active, setActive] = useState(null); // current booking
  const [history, setHistory] = useState([]);

  // Simulates the worker progressing through the job.
  // In production this comes from your backend via WebSocket / push.
  useEffect(() => {
    if (step !== 'tracking' || !active) return undefined;
    if (active.statusIdx >= STATUSES.length - 1) return undefined;
    const t = setTimeout(
      () => setActive((a) => (a ? { ...a, statusIdx: a.statusIdx + 1 } : a)),
      4000
    );
    return () => clearTimeout(t);
  }, [step, active?.statusIdx]);

  const resetFlow = () => {
    setStep('home');
    setTrade(null);
    setAddress('');
    setNotes('');
    setWorker(null);
    setHours(2);
    setActive(null);
  };

  const confirmBooking = (total) => {
    setActive({
      id: String(Date.now()),
      worker,
      address,
      notes,
      hours,
      total,
      statusIdx: 0,
    });
    setStep('tracking');
  };

  const logBooking = (extra) => {
    setHistory((h) => [
      { ...active, date: new Date().toLocaleDateString(), ...extra },
      ...h,
    ]);
  };

  let content;
  if (tab === 'trips') {
    content = <HistoryScreen bookings={history} />;
  } else if (step === 'home') {
    content = (
      <HomeScreen
        trade={trade}
        setTrade={setTrade}
        address={address}
        setAddress={setAddress}
        notes={notes}
        setNotes={setNotes}
        onFind={() => setStep('workers')}
      />
    );
  } else if (step === 'workers') {
    content = (
      <WorkersScreen
        trade={trade}
        onBack={() => setStep('home')}
        onSelect={(w) => {
          setWorker(w);
          setStep('confirm');
        }}
      />
    );
  } else if (step === 'confirm') {
    content = (
      <ConfirmScreen
        worker={worker}
        address={address}
        notes={notes}
        hours={hours}
        setHours={setHours}
        onBack={() => setStep('workers')}
        onConfirm={confirmBooking}
      />
    );
  } else if (step === 'tracking') {
    content = (
      <TrackingScreen
        booking={active}
        onCancel={() => {
          logBooking({ cancelled: true });
          resetFlow();
        }}
        onFinish={() => setStep('rate')}
      />
    );
  } else {
    content = (
      <RateScreen
        booking={active}
        onSubmit={(stars, comment) => {
          logBooking({ stars, comment });
          resetFlow();
          Alert.alert('Thanks!', 'Your rating has been saved.');
        }}
      />
    );
  }

  const inFlow = step === 'tracking' || step === 'rate';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <View style={styles.brandBar}>
        <Text style={styles.brand}>TradeRun</Text>
        {onSwitchRole && !inFlow ? (
          <TouchableOpacity onPress={onSwitchRole}>
            <Text style={styles.switchText}>Switch role</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={{ flex: 1 }}>{content}</View>

      <View style={styles.tabBar}>
        {[
          { id: 'book', label: 'Book' },
          { id: 'trips', label: 'Bookings' },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.tabItem}
            onPress={() => {
              if (t.id === 'trips' && inFlow) {
                Alert.alert('Booking in progress', 'Finish or cancel your current booking first.');
                return;
              }
              setTab(t.id);
            }}
          >
            <Text style={[styles.tabText, tab === t.id && { color: C.navy, fontWeight: '800' }]}>
              {t.label}
            </Text>
            {tab === t.id ? <View style={styles.tabUnderline} /> : null}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.concrete,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  brandBar: {
    backgroundColor: C.navy,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { color: C.hivis, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  switchText: { color: '#C7D0D6', fontSize: 13, fontWeight: '600' },

  pad: { padding: 16 },
  h1: { fontSize: 26, fontWeight: '800', color: C.navy, marginBottom: 4 },
  sub: { fontSize: 15, color: C.steel, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: C.steel, marginTop: 16, marginBottom: 6 },
  value: { fontSize: 16, color: C.navy },
  fine: { fontSize: 12, color: C.steel, marginVertical: 12 },

  header: { paddingHorizontal: 16, paddingTop: 12 },
  backBtn: { paddingVertical: 4, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: C.steel, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: C.navy, marginTop: 4, marginBottom: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: C.paper,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: C.line,
  },
  tileActive: { backgroundColor: C.navy, borderColor: C.navy },
  tileLabel: { marginTop: 6, fontSize: 13, fontWeight: '700', color: C.navy },

  input: {
    backgroundColor: C.paper,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: C.navy,
  },

  button: { paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '800' },

  sortRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: C.paper,
    borderWidth: 1.5,
    borderColor: C.line,
    marginRight: 8,
  },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipText: { fontSize: 13, fontWeight: '700', color: C.navy },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.paper,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.line,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.navy, marginBottom: 2 },
  meta: { fontSize: 13, color: C.steel },
  price: { fontSize: 18, fontWeight: '800', color: C.navy },
  avatar: { backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },

  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.paper,
    borderWidth: 1.5,
    borderColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 24, fontWeight: '700', color: C.navy },
  stepValue: { width: 80, textAlign: 'center', fontSize: 18, fontWeight: '800', color: C.navy },

  receipt: {
    backgroundColor: C.paper,
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: C.line,
  },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 6 },

  mapBox: {
    backgroundColor: C.navy,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  mapText: { color: C.hivis, fontSize: 18, fontWeight: '800', marginTop: 8, marginBottom: 2 },
  mapCaption: { fontSize: 16, fontWeight: '800', color: C.navy, marginBottom: 14 },
  statusNow: { fontSize: 22, fontWeight: '800', color: C.navy, marginBottom: 10 },
  track: { height: 8, backgroundColor: C.line, borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  trackFill: { height: 8, backgroundColor: C.hivis },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.line, marginRight: 12 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.paper,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 15, color: C.steel, fontWeight: '600' },
  tabUnderline: { height: 3, width: 32, backgroundColor: C.hivis, borderRadius: 2, marginTop: 4 },
});
