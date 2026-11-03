import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, Image, FlatList, TouchableOpacity, Alert, Linking,
  Modal, StyleSheet, Share, ScrollView, KeyboardAvoidingView, Platform,
  StatusBar as RNStatusBar, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'plots_v2';
const STATUSES = ['Available', 'Visit soon', 'Sold'];
const STATUS_COLORS = { Available: '#1B7F5A', 'Visit soon': '#C98A0B', Sold: '#B23A3A' };

export default function App() {
  const [plots, setPlots] = useState([]);
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Available');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => v && setPlots(JSON.parse(v)));
  }, []);

  const persist = async (list) => {
    setPlots(list);
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  };

  const getCoords = async () => {
    const { status: st } = await Location.requestForegroundPermissionsAsync();
    if (st !== 'granted') {
      Alert.alert('Location permission needed', 'Allow location so the plot position can be saved.');
      return null;
    }
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: p.coords.latitude, lng: p.coords.longitude };
  };

  const openDraft = (uri, coords) => {
    setName(''); setNotes(''); setStatus('Available');
    setDraft({ uri, ...coords });
  };

  const takePhoto = async () => {
    setSheet(false);
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) return Alert.alert('Camera permission needed');
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (res.canceled) return;
    setBusy(true);
    try {
      const coords = await getCoords(); // location grabbed right when photo is taken
      if (coords) openDraft(res.assets[0].uri, coords);
    } finally { setBusy(false); }
  };

  const pickPhoto = async () => {
    setSheet(false);
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, exif: true });
    if (res.canceled) return;
    const a = res.assets[0];
    const e = a.exif;
    let coords = null;
    if (e && e.GPSLatitude && e.GPSLongitude) {
      coords = {
        lat: e.GPSLatitudeRef === 'S' ? -e.GPSLatitude : e.GPSLatitude,
        lng: e.GPSLongitudeRef === 'W' ? -e.GPSLongitude : e.GPSLongitude,
      };
    } else {
      setBusy(true);
      try { coords = await getCoords(); } finally { setBusy(false); }
      if (!coords) return;
      Alert.alert('No GPS in this photo', 'Your current location was used instead.');
    }
    openDraft(a.uri, coords);
  };

  const savePlot = async () => {
    if (!name.trim()) return Alert.alert('Give the plot a name');
    const dest = FileSystem.documentDirectory + Date.now() + '.jpg';
    await FileSystem.copyAsync({ from: draft.uri, to: dest });
    await persist([
      {
        id: String(Date.now()), name: name.trim(), notes: notes.trim(),
        status, uri: dest, lat: draft.lat, lng: draft.lng,
      },
      ...plots,
    ]);
    setDraft(null);
  };

  const navigate = (p) =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`);

  const shareLoc = (p) =>
    Share.share({
      message: `${p.name}\nhttps://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`,
    });

  const cycleStatus = (p) => {
    const cur = p.status || 'Available';
    const next = STATUSES[(STATUSES.indexOf(cur) + 1) % STATUSES.length];
    persist(plots.map(x => (x.id === p.id ? { ...x, status: next } : x)));
  };

  const remove = (p) =>
    Alert.alert('Delete plot?', p.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => persist(plots.filter(x => x.id !== p.id)) },
    ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? plots.filter(p => p.name.toLowerCase().includes(q)) : plots;
  }, [plots, query]);

  const count = (st) => plots.filter(p => (p.status || 'Available') === st).length;

  const Header = (
    <View>
      <View style={s.statsRow}>
        <View style={s.stat}><Text style={s.statNum}>{plots.length}</Text><Text style={s.statLabel}>Total</Text></View>
        <View style={s.stat}><Text style={[s.statNum, { color: STATUS_COLORS.Available }]}>{count('Available')}</Text><Text style={s.statLabel}>Available</Text></View>
        <View style={s.stat}><Text style={[s.statNum, { color: STATUS_COLORS.Sold }]}>{count('Sold')}</Text><Text style={s.statLabel}>Sold</Text></View>
      </View>
      <View style={s.search}>
        <Ionicons name="search" size={18} color="#6B7A73" />
        <TextInput
          style={s.searchInput}
          placeholder="Search plots"
          placeholderTextColor="#9AA7A0"
          value={query}
          onChangeText={setQuery}
        />
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <View style={s.topBar}>
        <View>
          <Text style={s.appTitle}>PlotKeeper</Text>
          <Text style={s.appSub}>Your land catalog</Text>
        </View>
        <View style={s.logo}><Ionicons name="map" size={22} color="#fff" /></View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Ionicons name="camera-outline" size={56} color="#B5C2BB" />
            <Text style={s.emptyTitle}>{plots.length ? 'No matches' : 'No plots yet'}</Text>
            <Text style={s.emptySub}>
              {plots.length ? 'Try a different name.' : 'Tap the + button to photograph your first plot.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const st = item.status || 'Available';
          return (
            <View style={s.card}>
              <View>
                <Image source={{ uri: item.uri }} style={s.cardImg} />
                <TouchableOpacity
                  style={[s.chip, { backgroundColor: STATUS_COLORS[st] }]}
                  onPress={() => cycleStatus(item)}
                >
                  <Text style={s.chipText}>{st}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.trash} onPress={() => remove(item)}>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={s.cardBody}>
                <Text style={s.name}>{item.name}</Text>
                <View style={s.coordRow}>
                  <Ionicons name="location-outline" size={14} color="#6B7A73" />
                  <Text style={s.coords}>{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</Text>
                </View>
                {item.notes ? <Text style={s.notes}>{item.notes}</Text> : null}
                <View style={s.actions}>
                  <TouchableOpacity style={s.primary} onPress={() => navigate(item)}>
                    <Ionicons name="navigate" size={18} color="#fff" />
                    <Text style={s.primaryText}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.secondary} onPress={() => shareLoc(item)}>
                    <Ionicons name="share-social-outline" size={20} color="#1B7F5A" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={s.fab} onPress={() => setSheet(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add options sheet */}
      <Modal visible={sheet} transparent animationType="fade" onRequestClose={() => setSheet(false)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setSheet(false)}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Add a plot</Text>
            <TouchableOpacity style={s.sheetBtn} onPress={takePhoto}>
              <View style={s.sheetIcon}><Ionicons name="camera" size={22} color="#1B7F5A" /></View>
              <View>
                <Text style={s.sheetBtnTitle}>Take a photo</Text>
                <Text style={s.sheetBtnSub}>Location is saved automatically</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetBtn} onPress={pickPhoto}>
              <View style={s.sheetIcon}><Ionicons name="images" size={22} color="#1B7F5A" /></View>
              <View>
                <Text style={s.sheetBtnTitle}>Choose from gallery</Text>
                <Text style={s.sheetBtnSub}>Uses photo GPS if available</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New plot form */}
      <Modal visible={!!draft} animationType="slide" onRequestClose={() => setDraft(null)}>
        {draft && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={s.form} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <Text style={s.formTitle}>New plot</Text>
              <Image source={{ uri: draft.uri }} style={s.formImg} />
              <View style={s.locBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#1B7F5A" />
                <Text style={s.locText}>Location saved  {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}</Text>
              </View>

              <Text style={s.label}>Plot name</Text>
              <TextInput style={s.input} placeholder="e.g. Corner plot near temple road" placeholderTextColor="#9AA7A0" value={name} onChangeText={setName} />

              <Text style={s.label}>Notes (optional)</Text>
              <TextInput
                style={[s.input, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Size, owner, price, anything useful"
                placeholderTextColor="#9AA7A0"
                value={notes} onChangeText={setNotes} multiline
              />

              <Text style={s.label}>Status</Text>
              <View style={s.statusRow}>
                {STATUSES.map(st => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setStatus(st)}
                    style={[s.statusPill, status === st && { backgroundColor: STATUS_COLORS[st], borderColor: STATUS_COLORS[st] }]}
                  >
                    <Text style={[s.statusText, status === st && { color: '#fff' }]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={s.saveBtn} onPress={savePlot}>
                <Text style={s.saveText}>Save plot</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setDraft(null)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Modal>

      {busy && (
        <View style={s.busy}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={s.busyText}>Getting location...</Text>
        </View>
      )}
    </View>
  );
}

const G = '#1B7F5A';
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F5', paddingHorizontal: 16 },
  topBar: {
    paddingTop: (RNStatusBar.currentHeight || 24) + 10, paddingBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  appTitle: { fontSize: 28, fontWeight: '800', color: '#14201B' },
  appSub: { color: '#6B7A73', marginTop: 2 },
  logo: { width: 44, height: 44, borderRadius: 14, backgroundColor: G, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 22, fontWeight: '800', color: '#14201B' },
  statLabel: { color: '#6B7A73', fontSize: 12, marginTop: 2 },

  search: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 14, marginBottom: 8, elevation: 1,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: '#14201B' },

  card: { backgroundColor: '#fff', borderRadius: 18, marginTop: 14, overflow: 'hidden', elevation: 2 },
  cardImg: { width: '100%', height: 190 },
  chip: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  trash: {
    position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { padding: 14 },
  name: { fontSize: 18, fontWeight: '700', color: '#14201B' },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  coords: { color: '#6B7A73', fontSize: 13 },
  notes: { color: '#3C4A43', marginTop: 8, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primary: {
    flex: 1, flexDirection: 'row', gap: 8, backgroundColor: G, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondary: {
    width: 50, borderRadius: 12, borderWidth: 1.5, borderColor: G,
    alignItems: 'center', justifyContent: 'center',
  },

  emptyWrap: { alignItems: 'center', marginTop: 70, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#14201B', marginTop: 10 },
  emptySub: { color: '#6B7A73', textAlign: 'center', marginTop: 6 },

  fab: {
    position: 'absolute', right: 20, bottom: 28, width: 62, height: 62, borderRadius: 31,
    backgroundColor: G, alignItems: 'center', justifyContent: 'center', elevation: 6,
  },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#D5DDD9', marginBottom: 14 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10, color: '#14201B' },
  sheetBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  sheetIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#E6F3EE', alignItems: 'center', justifyContent: 'center' },
  sheetBtnTitle: { fontSize: 16, fontWeight: '700', color: '#14201B' },
  sheetBtnSub: { color: '#6B7A73', fontSize: 13, marginTop: 2 },

  form: { flex: 1, backgroundColor: '#F4F6F5', paddingHorizontal: 16 },
  formTitle: { fontSize: 26, fontWeight: '800', color: '#14201B', paddingTop: (RNStatusBar.currentHeight || 24) + 10, marginBottom: 12 },
  formImg: { width: '100%', height: 230, borderRadius: 18 },
  locBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E6F3EE',
    padding: 12, borderRadius: 12, marginTop: 12,
  },
  locText: { color: G, fontWeight: '600', fontSize: 13 },
  label: { fontWeight: '700', color: '#14201B', marginTop: 18, marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E1E8E4',
    padding: 14, fontSize: 15, color: '#14201B',
  },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusPill: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: '#D5DDD9', alignItems: 'center', backgroundColor: '#fff' },
  statusText: { fontWeight: '700', color: '#3C4A43', fontSize: 13 },
  saveBtn: { backgroundColor: G, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 26 },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: '#6B7A73', fontWeight: '600' },

  busy: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  busyText: { color: '#fff', marginTop: 10, fontWeight: '600' },
});