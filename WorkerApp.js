import React, { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import Alert from './alert';

/* ------------------------------------------------------------------ */
/* Config + mock data                                                  */
/* ------------------------------------------------------------------ */

const CURRENCY = '$';
const REQUEST_SECONDS = 30; // time a worker has to accept a request

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
  { id: 'plumber', label: 'Plumber' },
  { id: 'electrician', label: 'Electrician' },
  { id: 'carpenter', label: 'Carpenter' },
  { id: 'painter', label: 'Painter' },
  { id: 'mason', label: 'Mason' },
  { id: 'welder', label: 'Welder' },
  { id: 'ac', label: 'AC repair' },
  { id: 'cleaner', label: 'Cleaner' },
  { id: 'mover', label: 'Mover' },
];

// Demo request generator. In production, requests arrive from your backend:
// subscribe to INSERTs on `bookings` where worker_id = this worker and status = 'requested'.
const DEMO_CUSTOMERS = [
  { name: 'Alicia R.', address: '12 Mango Lane' },
  { name: 'Jerome B.', address: '48 Station Road' },
  { name: 'Natasha K.', address: '7 Hillview Drive' },
  { name: 'Dwayne P.', address: '230 Main Street' },
];
const DEMO_NOTES = {
  plumber: 'Kitchen sink is leaking under the cabinet.',
  electrician: 'Two sockets in the living room stopped working.',
  carpenter: 'Need a door frame repaired and re-hung.',
  painter: 'Repaint one bedroom, walls and ceiling.',
  mason: 'Small section of boundary wall has cracked.',
  welder: 'Gate hinge needs welding.',
  ac: 'Unit is running but not cooling.',
  cleaner: 'Deep clean before moving in.',
  mover: 'Moving a sofa and fridge to a new flat.',
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const money = (n) => `${CURRENCY}${n.toFixed(2)}`;

function makeRequest(trade, rate) {
  const c = pick(DEMO_CUSTOMERS);
  const hours = 1 + Math.floor(Math.random() * 4);
  return {
    id: String(Date.now()),
    customer: c.name,
    address: c.address,
    notes: DEMO_NOTES[trade] || 'General repair job.',
    hours,
    km: Math.round((0.8 + Math.random() * 5) * 10) / 10,
    rate,
  };
}

// Job flow. Mirrors the booking_status enum in schema.sql.
const NEXT = {
  accepted: { label: 'Start driving', next: 'en_route' },
  en_route: { label: "I've arrived", next: 'arrived' },
  arrived: { label: 'Start work', next: 'in_progress' },
  in_progress: { label: 'Finish job', next: 'completing' },
};
const STATUS_LABEL = {
  accepted: 'Accepted',
  en_route: 'On the way',
  arrived: 'Arrived',
  in_progress: 'Work in progress',
};

/* ------------------------------------------------------------------ */
/* Backend hooks (stubs): swap these for Supabase calls                */
/* ------------------------------------------------------------------ */

async function apiSetOnline(isOnline) {
  // supabase.from('worker_profiles').update({ is_online: isOnline }).eq('id', userId)
}
async function apiPushLocation(coords) {
  // supabase.from('worker_profiles')
  //   .update({ lat: coords.latitude, lng: coords.longitude, location_updated_at: new Date() })
  //   .eq('id', userId)
}
async function apiUpdateBooking(bookingId, patch) {
  // supabase.from('bookings').update(patch).eq('id', bookingId)
  // e.g. { status: 'accepted' } | { status: 'completed', final_hours: 3 }
}

/* ------------------------------------------------------------------ */
/* Small shared components                                             */
/* ------------------------------------------------------------------ */

function Button({ title, onPress, variant = 'primary', disabled, style }) {
  const bg = variant === 'primary' ? C.navy : variant === 'accent' ? C.hivis : 'transparent';
  const color = variant === 'primary' ? C.hivis : variant === 'danger' ? C.red : C.navy;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : 1 },
        (variant === 'ghost' || variant === 'danger') && {
          borderWidth: 1.5,
          borderColor: variant === 'danger' ? C.red : C.navy,
        },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

function Stepper({ value, onChange, min, max, step = 1, suffix = '' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity onPress={() => onChange(Math.max(min, value - step))} style={styles.stepBtn}>
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>
        {value}
        {suffix}
      </Text>
      <TouchableOpacity onPress={() => onChange(Math.min(max, value + step))} style={styles.stepBtn}>
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function WorkerApp({ onSwitchRole }) {
  const [tab, setTab] = useState('jobs'); // jobs | earnings | profile
  const [online, setOnline] = useState(false);

  const [profile, setProfile] = useState({ name: 'Marcus P.', trade: 'plumber', rate: 45 });

  const [request, setRequest] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [job, setJob] = useState(null); // { ...request, status }
  const [finalHours, setFinalHours] = useState(1);
  const [sharing, setSharing] = useState('off'); // off | on | denied
  const [completed, setCompleted] = useState([]);

  // Receive a new (demo) request a few seconds after going online and being idle.
  useEffect(() => {
    if (!online || request || job) return undefined;
    const t = setTimeout(() => {
      setRequest(makeRequest(profile.trade, profile.rate));
      setSecondsLeft(REQUEST_SECONDS);
    }, 5000);
    return () => clearTimeout(t);
  }, [online, request, job, profile.trade, profile.rate]);

  // Request countdown. Expired requests disappear (backend should also expire them).
  useEffect(() => {
    if (!request) return undefined;
    if (secondsLeft <= 0) {
      setRequest(null);
      return undefined;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [request, secondsLeft]);

  // Share live location with the customer while driving to the job.
  const driving = job?.status === 'en_route';
  useEffect(() => {
    if (!driving) return undefined;
    let sub = null;
    let cancelled = false;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          if (!cancelled) setSharing('denied');
          return;
        }
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 25 },
          (pos) => apiPushLocation(pos.coords)
        );
        if (cancelled) {
          sub.remove();
          return;
        }
        setSharing('on');
      } catch (e) {
        if (!cancelled) setSharing('off');
      }
    })();
    return () => {
      cancelled = true;
      if (sub) sub.remove();
      setSharing('off');
    };
  }, [driving]);

  /* ---------- actions ---------- */

  const toggleOnline = (value) => {
    setOnline(value);
    if (!value) setRequest(null);
    apiSetOnline(value);
  };

  const acceptRequest = () => {
    apiUpdateBooking(request.id, { status: 'accepted' });
    setJob({ ...request, status: 'accepted' });
    setFinalHours(request.hours);
    setRequest(null);
  };

  const declineRequest = () => {
    apiUpdateBooking(request.id, { status: 'declined' });
    setRequest(null);
  };

  const advance = () => {
    const next = NEXT[job.status].next;
    if (next !== 'completing') apiUpdateBooking(job.id, { status: next });
    setJob({ ...job, status: next });
  };

  const cancelJob = () => {
    Alert.alert('Cancel this job?', 'The customer will be notified. Frequent cancellations lower your ranking.', [
      { text: 'Keep job', style: 'cancel' },
      {
        text: 'Cancel job',
        style: 'destructive',
        onPress: () => {
          apiUpdateBooking(job.id, { status: 'cancelled' });
          setJob(null);
        },
      },
    ]);
  };

  const completeJob = () => {
    const payout = job.rate * finalHours;
    apiUpdateBooking(job.id, { status: 'completed', final_hours: finalHours });
    setCompleted((list) => [
      { id: job.id, customer: job.customer, hours: finalHours, payout, date: new Date().toLocaleDateString() },
      ...list,
    ]);
    setJob(null);
    Alert.alert('Job complete', `You earned ${money(payout)}.`);
  };

  const openMaps = () =>
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`
    );

  /* ---------- tab content ---------- */

  const totalEarned = completed.reduce((s, j) => s + j.payout, 0);

  let content;

  if (tab === 'jobs') {
    content = (
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.onlineCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.onlineTitle}>{online ? "You're online" : "You're offline"}</Text>
            <Text style={styles.metaLight}>
              {job
                ? 'Finish your current job to go offline.'
                : online
                ? 'Customers nearby can request you.'
                : 'Go online to start receiving requests.'}
            </Text>
          </View>
          <Switch
            value={online}
            onValueChange={toggleOnline}
            disabled={!!job}
            trackColor={{ false: C.steel, true: C.hivis }}
            thumbColor={C.paper}
          />
        </View>

        {/* Incoming request */}
        {!job && request ? (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardHeading}>New request</Text>
              <Text style={[styles.timer, secondsLeft <= 10 && { color: C.red }]}>{secondsLeft}s</Text>
            </View>
            <Text style={styles.big}>{money(request.rate * request.hours)}</Text>
            <Text style={styles.meta}>
              est. {request.hours} hr at {money(request.rate)}/hr
            </Text>
            <View style={styles.divider} />
            <Text style={styles.value}>{request.customer}</Text>
            <Text style={styles.meta}>
              {request.address} · {request.km} km away
            </Text>
            <Text style={[styles.value, { marginTop: 8 }]}>{request.notes}</Text>
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <Button title="Decline" variant="ghost" onPress={declineRequest} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Accept" variant="accent" onPress={acceptRequest} style={{ flex: 1, marginLeft: 8 }} />
            </View>
          </View>
        ) : null}

        {/* Waiting state */}
        {!job && !request ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 32 }]}>
            <Text style={{ fontSize: 36 }}>{online ? '📡' : '🛑'}</Text>
            <Text style={[styles.value, { marginTop: 8, textAlign: 'center' }]}>
              {online ? 'Waiting for requests near you…' : 'No requests while offline.'}
            </Text>
          </View>
        ) : null}

        {/* Active job: in progress stages */}
        {job && job.status !== 'completing' ? (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardHeading}>Current job</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{STATUS_LABEL[job.status]}</Text>
              </View>
            </View>
            <Text style={styles.big}>{money(job.rate * job.hours)}</Text>
            <Text style={styles.meta}>
              est. {job.hours} hr at {money(job.rate)}/hr
            </Text>
            <View style={styles.divider} />
            <Text style={styles.value}>{job.customer}</Text>
            <Text style={styles.meta}>{job.address}</Text>
            <Text style={[styles.value, { marginTop: 8 }]}>{job.notes}</Text>

            {job.status === 'en_route' ? (
              <Text style={[styles.meta, { marginTop: 10, color: sharing === 'on' ? C.green : C.steel }]}>
                {sharing === 'on'
                  ? '● Sharing your live location with the customer'
                  : sharing === 'denied'
                  ? 'Location permission denied. The customer cannot see you on the map.'
                  : 'Starting location sharing…'}
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <Button title="Navigate" variant="ghost" onPress={openMaps} style={{ flex: 1, marginRight: 8 }} />
              <Button
                title="Call"
                variant="ghost"
                onPress={() => Alert.alert('Call', `Calling ${job.customer}… (connect a calling service here)`)}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
            <Button title={NEXT[job.status].label} variant="accent" onPress={advance} style={{ marginTop: 12 }} />
            {job.status === 'accepted' || job.status === 'en_route' ? (
              <Button title="Cancel job" variant="danger" onPress={cancelJob} style={{ marginTop: 12 }} />
            ) : null}
          </View>
        ) : null}

        {/* Active job: confirm hours + payout */}
        {job && job.status === 'completing' ? (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Confirm hours worked</Text>
            <Text style={[styles.meta, { marginBottom: 12 }]}>
              The customer is billed for the hours you confirm.
            </Text>
            <Stepper value={finalHours} onChange={setFinalHours} min={1} max={12} suffix=" hr" />
            <View style={styles.divider} />
            <View style={styles.rowBetween}>
              <Text style={styles.value}>Your earnings</Text>
              <Text style={styles.big}>{money(job.rate * finalHours)}</Text>
            </View>
            <Button title="Confirm and finish" variant="accent" onPress={completeJob} style={{ marginTop: 16 }} />
          </View>
        ) : null}
      </ScrollView>
    );
  } else if (tab === 'earnings') {
    content = (
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.h1}>Earnings</Text>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.big}>{money(totalEarned)}</Text>
            <Text style={styles.meta}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.big}>{completed.length}</Text>
            <Text style={styles.meta}>Jobs</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.big}>{completed.length ? money(totalEarned / completed.length) : money(0)}</Text>
            <Text style={styles.meta}>Per job</Text>
          </View>
        </View>

        {completed.length === 0 ? (
          <Text style={[styles.sub, { marginTop: 20 }]}>
            Completed jobs show up here. Go online to get your first request.
          </Text>
        ) : (
          completed.map((j) => (
            <View key={j.id} style={[styles.card, styles.rowBetween, { marginTop: 10 }]}>
              <View>
                <Text style={styles.value}>{j.customer}</Text>
                <Text style={styles.meta}>
                  {j.date} · {j.hours} hr
                </Text>
              </View>
              <Text style={styles.price}>{money(j.payout)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  } else {
    content = (
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Your profile</Text>

        <Text style={styles.label}>Name shown to customers</Text>
        <TextInput
          value={profile.name}
          onChangeText={(name) => setProfile({ ...profile, name })}
          style={styles.input}
          placeholderTextColor={C.steel}
        />

        <Text style={styles.label}>Your trade</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {TRADES.map((t) => {
            const active = profile.trade === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                disabled={!!job}
                onPress={() => setProfile({ ...profile, trade: t.id })}
                style={[styles.chip, active && styles.chipActive, !!job && { opacity: 0.5 }]}
              >
                <Text style={[styles.chipText, active && { color: C.hivis }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Hourly rate</Text>
        <Stepper
          value={profile.rate}
          onChange={(rate) => setProfile({ ...profile, rate })}
          min={10}
          max={200}
          step={5}
          suffix={` ${CURRENCY}/hr`}
        />

        <View style={[styles.card, { marginTop: 24 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardHeading}>ID verification</Text>
            <Text style={styles.meta}>
              Verified workers get a badge and more requests. Upload your ID and a trade certificate to apply.
            </Text>
          </View>
        </View>

        {onSwitchRole ? (
          <Button title="Switch role" variant="ghost" onPress={onSwitchRole} style={{ marginTop: 24 }} />
        ) : null}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <View style={styles.brandBar}>
        <Text style={styles.brand}>TradeRun Pro</Text>
        {onSwitchRole ? (
          <TouchableOpacity onPress={onSwitchRole}>
            <Text style={styles.switchText}>Switch role</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={{ flex: 1 }}>{content}</View>

      <View style={styles.tabBar}>
        {[
          { id: 'jobs', label: 'Jobs' },
          { id: 'earnings', label: 'Earnings' },
          { id: 'profile', label: 'Profile' },
        ].map((t) => (
          <TouchableOpacity key={t.id} style={styles.tabItem} onPress={() => setTab(t.id)}>
            <Text style={[styles.tabText, tab === t.id && { color: C.navy, fontWeight: '800' }]}>{t.label}</Text>
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
  h1: { fontSize: 26, fontWeight: '800', color: C.navy, marginBottom: 8 },
  sub: { fontSize: 15, color: C.steel },
  label: { fontSize: 13, fontWeight: '700', color: C.steel, marginTop: 16, marginBottom: 6 },
  value: { fontSize: 16, color: C.navy },
  meta: { fontSize: 13, color: C.steel },
  metaLight: { fontSize: 13, color: '#C7D0D6', marginTop: 2 },
  big: { fontSize: 28, fontWeight: '900', color: C.navy },
  price: { fontSize: 18, fontWeight: '800', color: C.navy },

  onlineCard: {
    backgroundColor: C.navy,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  onlineTitle: { color: C.hivis, fontSize: 20, fontWeight: '800' },

  card: {
    backgroundColor: C.paper,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 10,
  },
  cardHeading: { fontSize: 16, fontWeight: '800', color: C.navy },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 12 },
  timer: { fontSize: 18, fontWeight: '800', color: C.navy },
  pill: { backgroundColor: C.hivis, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '800', color: C.navy },

  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: {
    flex: 1,
    backgroundColor: C.paper,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: C.line,
  },

  input: {
    backgroundColor: C.paper,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: C.navy,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: C.paper,
    borderWidth: 1.5,
    borderColor: C.line,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipText: { fontSize: 13, fontWeight: '700', color: C.navy },

  button: { paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '800' },

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
  stepValue: { minWidth: 100, textAlign: 'center', fontSize: 18, fontWeight: '800', color: C.navy },

  tabBar: { flexDirection: 'row', backgroundColor: C.paper, borderTopWidth: 1, borderTopColor: C.line },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 15, color: C.steel, fontWeight: '600' },
  tabUnderline: { height: 3, width: 32, backgroundColor: C.hivis, borderRadius: 2, marginTop: 4 },
});
