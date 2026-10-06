import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Check,
  House,
  Briefcase,
  X,
  CircleCheck,
  Search,
  LocateFixed
} from 'lucide-react-native';
import { colors, typography } from '../constants/theme';
import { StorefrontAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { haptics } from '../services/haptics';

let Location = null;
try {
  // eslint-disable-next-line global-require
  Location = require('expo-location');
} catch (e) {
  Location = null;
}

const TYPES = [
  { key: 'Home', Icon: House },
  { key: 'Work', Icon: Briefcase },
  { key: 'Other', Icon: MapPin }
];

const typeIcon = (label) => (TYPES.find((t) => t.key === label) || TYPES[2]).Icon;

const EMPTY_FORM = {
  label: 'Home',
  street: '',
  landmark: '',
  city: '',
  state: '',
  zipCode: '',
  isDefault: false
};

function Field({ label, style, ...props }) {
  return (
    <View style={[styles.fieldWrap, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primaryDark}
        {...props}
      />
    </View>
  );
}

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const { refreshProfile } = useAuth();

  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [locating, setLocating] = useState(false);

  const { data: addresses, isLoading, refetch } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await StorefrontAPI.getAddresses();
      return res.data?.data || [];
    }
  });

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const goBack = () => {
    haptics.selection();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  const openAdd = () => {
    haptics.selection();
    setEditingId(null);
    setForm({ ...EMPTY_FORM, isDefault: !addresses || addresses.length === 0 });
    setFormVisible(true);
  };

  const openEdit = (addr) => {
    haptics.selection();
    setEditingId(addr._id);
    setForm({
      label: addr.label || 'Home',
      street: addr.street || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
      isDefault: Boolean(addr.isDefault)
    });
    setFormVisible(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormVisible(false);
    setEditingId(null);
  };

  const handleUseCurrentLocation = async () => {
    haptics.selection();
    if (!Location) {
      Alert.alert('Location not available', 'Run "npx expo install expo-location" in Mobile-App, then restart with "npx expo start -c".');
      return;
    }
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location access to fill your address automatically.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const results = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      });
      const p = results && results[0];
      if (!p) {
        Alert.alert('Could not find address', 'Please type your address manually.');
        return;
      }
      const street = [p.name, p.street, p.district || p.subregion].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
      setForm((prev) => ({
        ...prev,
        street: street || prev.street,
        city: p.city || p.subregion || prev.city,
        state: p.region || prev.state,
        zipCode: p.postalCode || prev.zipCode
      }));
      haptics.notificationSuccess();
    } catch (e) {
      Alert.alert('Location error', 'Could not fetch your current location. Please try again or type it manually.');
    } finally {
      setLocating(false);
    }
  };

  const reload = async () => {
    try {
      await refreshProfile?.();
    } catch (e) {}
    await refetch();
  };

  const handleSave = async () => {
    if (!form.street.trim() || !form.city.trim() || !form.zipCode.trim()) {
      Alert.alert('Required fields', 'Please fill in the street address, city and pincode.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: form.label,
        street: form.street.trim(),
        landmark: form.landmark.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipCode.trim(),
        isDefault: form.isDefault
      };
      if (editingId) await StorefrontAPI.updateAddress(editingId, payload);
      else await StorefrontAPI.addAddress(payload);
      haptics.notificationSuccess();
      await reload();
      setFormVisible(false);
      setEditingId(null);
    } catch (e) {
      Alert.alert('Could not save', e.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (addr) => {
    Alert.alert('Delete address', 'Remove this address from your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusyId(addr._id);
          try {
            await StorefrontAPI.deleteAddress(addr._id);
            await reload();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to delete address');
          } finally {
            setBusyId(null);
          }
        }
      }
    ]);
  };

  const handleSetDefault = async (addr) => {
    haptics.selection();
    setBusyId(addr._id);
    try {
      await StorefrontAPI.setDefaultAddress(addr._id);
      await reload();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update default address');
    } finally {
      setBusyId(null);
    }
  };

  const list = addresses || [];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <Pressable style={styles.searchBtn} accessibilityRole="button" accessibilityLabel="Search products" onPress={() => router.push('/(tabs)/search')}>
          <Search size={22} color="#17212B" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primaryDark} style={{ marginTop: 40 }} />
        ) : list.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <MapPin size={36} color={colors.primaryDark} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptyDesc}>Add a delivery address to get your order in minutes.</Text>
          </View>
        ) : (
          list.map((addr) => {
            const Icon = typeIcon(addr.label);
            const busy = busyId === addr._id;
            return (
              <View key={addr._id} style={[styles.card, addr.isDefault && styles.cardDefault]}>
                <View style={styles.cardTop}>
                  <View style={styles.iconTile}>
                    <Icon size={20} color={colors.secondary} strokeWidth={2.1} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.labelRow}>
                      <Text style={styles.cardLabel}>{addr.label || 'Address'}</Text>
                      {addr.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardStreet}>{addr.street}</Text>
                    {Boolean(addr.landmark) && <Text style={styles.cardMeta}>Landmark: {addr.landmark}</Text>}
                    <Text style={styles.cardMeta}>
                      {[addr.city, addr.state].filter(Boolean).join(', ')}
                      {addr.zipCode ? ` - ${addr.zipCode}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  {!addr.isDefault ? (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(addr)} disabled={busy} activeOpacity={0.7}>
                      <CircleCheck size={15} color={colors.textPrimary} />
                      <Text style={styles.actionText}>Set default</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.actionBtn}>
                      <Check size={15} color={colors.success} strokeWidth={2.6} />
                      <Text style={[styles.actionText, { color: colors.success }]}>Delivering here</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  {busy ? (
                    <ActivityIndicator size="small" color={colors.primaryDark} />
                  ) : (
                    <>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(addr)} activeOpacity={0.7}>
                        <Pencil size={15} color={colors.textPrimary} />
                        <Text style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(addr)} activeOpacity={0.7}>
                        <Trash2 size={15} color={colors.error} />
                        <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
          <Plus size={20} color={colors.secondary} strokeWidth={2.6} />
          <Text style={styles.addBtnText}>Add new address</Text>
        </TouchableOpacity>
      </View>

      {formVisible && (
        <View style={styles.formPage}>
          <SafeAreaView edges={['top', 'left', 'right']} style={styles.formTop}>
            <View style={styles.header}>
              <Pressable onPress={closeForm} style={styles.backBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
                <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
              <Text style={styles.headerTitle}>{editingId ? 'Edit address' : 'Add new address'}</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            >
              <TouchableOpacity style={styles.locateBtn} onPress={handleUseCurrentLocation} disabled={locating} activeOpacity={0.85}>
                {locating ? (
                  <ActivityIndicator size="small" color={colors.secondary} />
                ) : (
                  <LocateFixed size={20} color={colors.secondary} strokeWidth={2.4} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.locateTitle}>{locating ? 'Fetching your location...' : 'Use my current location'}</Text>
                  <Text style={styles.locateSub}>Fill the address below automatically</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Save as</Text>
              <View style={styles.typeRow}>
                {TYPES.map(({ key, Icon }) => {
                  const active = form.label === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.typePill, active && styles.typePillActive]}
                      onPress={() => setField('label', key)}
                      activeOpacity={0.8}
                    >
                      <Icon size={15} color={active ? colors.secondary : colors.textSecondary} />
                      <Text style={[styles.typeText, active && styles.typeTextActive]}>{key}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Field label="Flat / House / Street *" placeholder="e.g. Flat 402, Green Valley Apartments" value={form.street} onChangeText={(v) => setField('street', v)} />
              <Field label="Landmark (optional)" placeholder="e.g. Near City Mall" value={form.landmark} onChangeText={(v) => setField('landmark', v)} />
              <View style={styles.twoCol}>
                <Field label="City *" placeholder="City" style={{ flex: 1 }} value={form.city} onChangeText={(v) => setField('city', v)} />
                <Field label="Pincode *" placeholder="6 digits" style={{ flex: 1 }} value={form.zipCode} keyboardType="number-pad" maxLength={6} onChangeText={(v) => setField('zipCode', v)} />
              </View>
              <Field label="State" placeholder="State" value={form.state} onChangeText={(v) => setField('state', v)} />

              <TouchableOpacity style={styles.checkRow} onPress={() => setField('isDefault', !form.isDefault)} activeOpacity={0.8}>
                <View style={[styles.checkbox, form.isDefault && styles.checkboxActive]}>
                  {form.isDefault && <Check size={14} color={colors.secondary} strokeWidth={3} />}
                </View>
                <Text style={styles.checkLabel}>Make this my default address</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={[styles.footer, { position: 'relative', paddingBottom: Math.max(insets.bottom, 12) }]}>
              <TouchableOpacity style={[styles.addBtn, saving && { opacity: 0.8 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.secondary} />
                ) : (
                  <Text style={styles.addBtnText}>{editingId ? 'Update address' : 'Save address'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}

const F = typography.family;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.softBackground },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
  searchBtn: { padding: 9 },
  formPage: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.softBackground, zIndex: 20 },
  formTop: { backgroundColor: colors.white },
  locateBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primarySoft, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: 16, padding: 14, marginBottom: 18 },
  locateTitle: { fontSize: 14.5, fontFamily: F.bold, color: colors.textPrimary },
  locateSub: { fontSize: 12, fontFamily: F.regular, color: colors.textSecondary, marginTop: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: F.bold, color: '#17212B' },
  content: { padding: 16 },
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.borderLight, padding: 14, marginBottom: 12 },
  cardDefault: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  cardTop: { flexDirection: 'row', gap: 12 },
  iconTile: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardLabel: { fontSize: 15, fontFamily: F.bold, color: colors.textPrimary },
  defaultBadge: { marginLeft: 8, backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  defaultBadgeText: { fontSize: 9.5, fontFamily: F.bold, color: colors.secondary, letterSpacing: 0.4 },
  cardStreet: { fontSize: 13.5, fontFamily: F.medium, color: colors.textPrimary, lineHeight: 19 },
  cardMeta: { fontSize: 12.5, fontFamily: F.regular, color: colors.textSecondary, marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight, gap: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  actionText: { fontSize: 12.5, fontFamily: F.semibold, color: colors.textPrimary },
  emptyWrap: { alignItems: 'center', paddingTop: 90, paddingHorizontal: 30 },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontFamily: F.bold, color: colors.textPrimary, marginBottom: 6 },
  emptyDesc: { fontSize: 13, fontFamily: F.regular, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  addBtn: { height: 52, borderRadius: 16, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { fontSize: 15, fontFamily: F.bold, color: colors.secondary },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 16, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sheetTitle: { fontSize: 17, fontFamily: F.bold, color: colors.textPrimary },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.softBackground, alignItems: 'center', justifyContent: 'center' },
  typeRow: { flexDirection: 'row', gap: 8, marginTop: 6, marginBottom: 14 },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  typePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { fontSize: 13, fontFamily: F.medium, color: colors.textSecondary },
  typeTextActive: { fontFamily: F.bold, color: colors.secondary },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontFamily: F.medium, color: colors.textSecondary, marginBottom: 5 },
  fieldInput: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.softBackground, paddingHorizontal: 14, fontSize: 14, fontFamily: F.regular, color: colors.textPrimary },
  twoCol: { flexDirection: 'row', gap: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: { fontSize: 13.5, fontFamily: F.regular, color: colors.textPrimary },
  saveBtn: { height: 52, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 14, marginBottom: 4 },
  saveBtnText: { fontSize: 15, fontFamily: F.bold, color: colors.secondary }
});
