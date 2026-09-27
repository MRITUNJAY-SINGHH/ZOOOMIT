import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Home, 
  Briefcase 
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { StorefrontAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';

export default function AddressesScreen() {
  const { refreshProfile } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [label, setLabel] = useState('Home');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Gorakhpur');
  const [state, setState] = useState('Uttar Pradesh');
  const [zipCode, setZipCode] = useState('273001');
  const [isDefault, setIsDefault] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const { data: addresses, isLoading, refetch } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await StorefrontAPI.getAddresses();
      return res.data?.data || [];
    }
  });

  const resetForm = () => {
    setStreet('');
    setLandmark('');
    setCity('Gorakhpur');
    setState('Uttar Pradesh');
    setZipCode('273001');
    setLabel('Home');
    setIsDefault(false);
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEditPress = (addr) => {
    setEditingId(addr._id);
    setLabel(addr.label || 'Home');
    setStreet(addr.street || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city || 'Gorakhpur');
    setState(addr.state || 'Uttar Pradesh');
    setZipCode(addr.zipCode || '273001');
    setIsDefault(Boolean(addr.isDefault));
    setShowAddForm(true);
  };

  const handleSaveAddress = async () => {
    if (!street.trim() || !city.trim() || !zipCode.trim()) {
      Alert.alert('Required Fields', 'Please fill in street address, city, and pincode');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        label,
        street: street.trim(),
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        isDefault
      };

      if (editingId) {
        await StorefrontAPI.updateAddress(editingId, payload);
      } else {
        await StorefrontAPI.addAddress(payload);
      }

      await refreshProfile();
      await refetch();
      resetForm();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save address');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to remove this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorefrontAPI.deleteAddress(id);
              await refreshProfile();
              await refetch();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to delete address');
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (id) => {
    try {
      await StorefrontAPI.setDefaultAddress(id);
      await refreshProfile();
      await refetch();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update default address');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing['4xl'] }}>
      {!showAddForm && (
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => {
            resetForm();
            setShowAddForm(true);
          }}
          activeOpacity={0.8}
        >
          <Plus size={20} color={colors.black} style={{ marginRight: spacing.sm }} />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      )}

      {showAddForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingId ? 'Edit Address' : 'Add New Delivery Address'}
          </Text>

          <Text style={styles.labelTitle}>Address Type:</Text>
          <View style={styles.typeRow}>
            {['Home', 'Work', 'Other'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typePill, label === type && styles.typePillActive]}
                onPress={() => setLabel(type)}
              >
                {type === 'Home' && <Home size={14} color={label === type ? colors.black : colors.textSecondary} style={{ marginRight: 4 }} />}
                {type === 'Work' && <Briefcase size={14} color={label === type ? colors.black : colors.textSecondary} style={{ marginRight: 4 }} />}
                <Text style={[styles.typePillText, label === type && styles.typePillTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <AppInput
            label="Flat / House / Street *"
            placeholder="e.g. Flat 402, Green Valley Apartments"
            value={street}
            onChangeText={setStreet}
          />

          <AppInput
            label="Landmark (Optional)"
            placeholder="e.g. Near City Mall / Water Tank"
            value={landmark}
            onChangeText={setLandmark}
          />

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <AppInput
                label="City *"
                placeholder="City"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                label="Pincode *"
                placeholder="273001"
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setIsDefault(!isDefault)}
          >
            <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
              {isDefault && <Check size={14} color={colors.black} />}
            </View>
            <Text style={styles.checkboxLabel}>Make this my default delivery address</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
            <AppButton
              title="Cancel"
              variant="secondary"
              onPress={resetForm}
              style={{ flex: 1 }}
            />
            <AppButton
              title={editingId ? 'Update' : 'Save Address'}
              onPress={handleSaveAddress}
              loading={formLoading}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Saved Addresses</Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.black} style={{ marginTop: spacing.md }} />
      ) : addresses && addresses.length > 0 ? (
        addresses.map((addr) => (
          <View key={addr._id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin size={18} color={colors.black} style={{ marginRight: 6 }} />
                <Text style={styles.addressLabel}>{addr.label}</Text>
                {addr.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <TouchableOpacity onPress={() => handleEditPress(addr)}>
                  <Edit3 size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(addr._id)}>
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.addressStreet}>{addr.street}</Text>
            {Boolean(addr.landmark) && (
              <Text style={styles.addressLandmark}>Landmark: {addr.landmark}</Text>
            )}
            <Text style={styles.addressCity}>
              {addr.city}, {addr.state} - {addr.zipCode}
            </Text>

            {!addr.isDefault && (
              <TouchableOpacity 
                style={styles.setDefaultBtn}
                onPress={() => handleSetDefault(addr._id)}
              >
                <Text style={styles.setDefaultText}>Set as Default</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No addresses saved yet. Add your first address above!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    marginBottom: spacing.xl
  },
  addBtnText: {
    fontSize: typography.size.md,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  formCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl
  },
  formTitle: {
    fontSize: typography.size.md,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  labelTitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.softBackground
  },
  typePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  typePillText: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  typePillTextActive: {
    color: colors.black,
    fontFamily: typography.family.bold
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.white
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkboxLabel: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.regular,
    color: colors.textPrimary
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  addressCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  addressLabel: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  defaultBadge: {
    backgroundColor: colors.primarySoft,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: radius.xs,
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight
  },
  defaultBadgeText: {
    fontSize: 9,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  addressStreet: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary,
    marginBottom: 2
  },
  addressLandmark: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginBottom: 2
  },
  addressCity: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textMuted
  },
  setDefaultBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start'
  },
  setDefaultText: {
    fontSize: typography.size.xs,
    color: colors.black,
    fontFamily: typography.family.bold,
    textDecorationLine: 'underline'
  },
  emptyBox: {
    padding: spacing.xxl,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.regular,
    color: colors.textMuted,
    textAlign: 'center'
  }
});
