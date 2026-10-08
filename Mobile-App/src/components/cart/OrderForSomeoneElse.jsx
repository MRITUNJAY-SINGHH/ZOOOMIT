import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Gift, X, User, Phone, MapPin, ChevronRight } from 'lucide-react-native';
import { validateRecipient, toRecipientPayload } from '../../services/recipientStore';

const BRAND = '#FFC928';
const EMPTY = { name: '', phone: '', street: '', landmark: '', city: '', state: '', zipCode: '', notes: '' };

const Field = ({ label, error, children }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {Boolean(error) && <Text style={styles.fieldError}>{error}</Text>}
  </View>
);

export default function OrderForSomeoneElse({ recipient, onChange }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const set = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const openSheet = () => {
    setForm(recipient ? { ...EMPTY, ...recipient } : form);
    setErrors({});
    setSheetOpen(true);
  };

  const handleToggle = (next) => {
    if (next) openSheet();
    else {
      setSheetOpen(false);
      onChange(null);
    }
  };

  const handleSave = () => {
    const errs = validateRecipient(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onChange(toRecipientPayload(form));
    setSheetOpen(false);
  };

  const handleClose = () => setSheetOpen(false);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconTile}>
          <Gift size={18} color="#0F172A" strokeWidth={2.3} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Order for someone else</Text>
          <Text style={styles.subtitle}>Deliver this order to a friend or family member</Text>
        </View>
        <Switch
          value={Boolean(recipient)}
          onValueChange={handleToggle}
          trackColor={{ false: '#E2E8F0', true: BRAND }}
          thumbColor="#FFFFFF"
        />
      </View>

      {Boolean(recipient) && (
        <TouchableOpacity style={styles.summaryBox} onPress={openSheet} activeOpacity={0.8}>
          <View style={styles.summaryLine}>
            <User size={14} color="#475569" />
            <Text style={styles.summaryName} numberOfLines={1}>{recipient.name}</Text>
            <Phone size={13} color="#475569" style={{ marginLeft: 10 }} />
            <Text style={styles.summaryText}>{recipient.phone}</Text>
          </View>
          <View style={styles.summaryLine}>
            <MapPin size={14} color="#475569" />
            <Text style={styles.summaryText} numberOfLines={2}>
              {[recipient.street, recipient.landmark, recipient.city, recipient.zipCode].filter(Boolean).join(', ')}
            </Text>
          </View>
          <View style={styles.editRow}>
            <Text style={styles.editText}>Edit details</Text>
            <ChevronRight size={14} color="#B45309" />
          </View>
        </TouchableOpacity>
      )}

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={handleClose}>
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.dismiss} onPress={handleClose} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Recipient details</Text>
                <Text style={styles.sheetSub}>We will deliver to this person and address</Text>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={8} style={styles.closeBtn}>
                <X size={18} color="#64748B" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 440 }}>
              <Field label="Recipient name *" error={errors.name}>
                <TextInput style={[styles.input, errors.name && styles.inputError]} value={form.name} onChangeText={set('name')} placeholder="Full name" placeholderTextColor="#94A3B8" autoCapitalize="words" />
              </Field>
              <Field label="Phone number *" error={errors.phone}>
                <TextInput style={[styles.input, errors.phone && styles.inputError]} value={form.phone} onChangeText={set('phone')} placeholder="10-digit mobile number" placeholderTextColor="#94A3B8" keyboardType="phone-pad" maxLength={14} />
              </Field>
              <Field label="House no., building, street *" error={errors.street}>
                <TextInput style={[styles.input, errors.street && styles.inputError]} value={form.street} onChangeText={set('street')} placeholder="Flat / house no., building, area" placeholderTextColor="#94A3B8" />
              </Field>
              <Field label="Landmark (optional)">
                <TextInput style={styles.input} value={form.landmark} onChangeText={set('landmark')} placeholder="Near temple, mall, school..." placeholderTextColor="#94A3B8" />
              </Field>
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Field label="City *" error={errors.city}>
                    <TextInput style={[styles.input, errors.city && styles.inputError]} value={form.city} onChangeText={set('city')} placeholder="City" placeholderTextColor="#94A3B8" />
                  </Field>
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Field label="Pincode *" error={errors.zipCode}>
                    <TextInput style={[styles.input, errors.zipCode && styles.inputError]} value={form.zipCode} onChangeText={set('zipCode')} placeholder="6 digits" placeholderTextColor="#94A3B8" keyboardType="number-pad" maxLength={6} />
                  </Field>
                </View>
              </View>
              <Field label="State (optional)">
                <TextInput style={styles.input} value={form.state} onChangeText={set('state')} placeholder="State" placeholderTextColor="#94A3B8" />
              </Field>
              <Field label="Delivery notes (optional)">
                <TextInput style={[styles.input, styles.notesInput]} value={form.notes} onChangeText={set('notes')} placeholder="Gate code, call before arriving, leave at door..." placeholderTextColor="#94A3B8" multiline maxLength={250} />
              </Field>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save recipient</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginHorizontal: 0, marginTop: 0, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconTile: { width: 38, height: 38, borderRadius: 12, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: 15, fontFamily: 'Gilroy-Bold', color: '#0F172A' },
  subtitle: { fontSize: 12, fontFamily: 'Gilroy-Medium', color: '#64748B', marginTop: 2 },
  summaryBox: { marginTop: 12, backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A', padding: 12 },
  summaryLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  summaryName: { fontSize: 14, fontFamily: 'Gilroy-Bold', color: '#0F172A', marginLeft: 6, flexShrink: 1 },
  summaryText: { fontSize: 13, fontFamily: 'Gilroy-Medium', color: '#334155', marginLeft: 6, flex: 1 },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  editText: { fontSize: 12, fontFamily: 'Gilroy-Bold', color: '#B45309' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingBottom: 22, paddingTop: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginBottom: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetTitle: { fontSize: 18, fontFamily: 'Gilroy-Heavy', color: '#0F172A' },
  sheetSub: { fontSize: 12, fontFamily: 'Gilroy-Medium', color: '#64748B', marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontFamily: 'Gilroy-Bold', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontFamily: 'Gilroy-Medium', color: '#0F172A', backgroundColor: '#F8FAFC' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  notesInput: { minHeight: 64, textAlignVertical: 'top' },
  fieldError: { fontSize: 11, fontFamily: 'Gilroy-Medium', color: '#DC2626', marginTop: 4 },
  twoCol: { flexDirection: 'row' },
  saveBtn: { marginTop: 6, backgroundColor: BRAND, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontFamily: 'Gilroy-Heavy', color: '#0F172A' }
});
