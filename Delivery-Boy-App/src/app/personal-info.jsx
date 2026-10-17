import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Pencil,
  Info,
  CheckCircle2,
  X
} from 'lucide-react-native';
import { typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { deliveryService } from '../services/deliveryService';
import { hapticFeedback } from '../services/haptics';
import PartnerBottomBar from '../components/PartnerBottomBar';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { partner, refreshProfile } = useAuth();

  const partnerName = partner?.name || 'Rahul Sharma';
  const partnerEmail = partner?.email || 'rahul.sharma@example.com';
  const partnerPhone = partner?.phone || '+91 98765 43210';

  const partnerInitials = partnerName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'RS';

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState(null); // 'name' | 'phone' | 'email'
  const [fieldValue, setFieldValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (field, currentValue) => {
    hapticFeedback.light?.();
    if (field === 'email') {
      Alert.alert(
        'Email Address',
        'Registered email address is verified with your company account and cannot be modified directly in the partner app. Please contact your dispatch administrator.'
      );
      return;
    }
    setEditingField(field);
    setFieldValue(currentValue);
    setEditModalVisible(true);
  };

  const handleSaveField = async () => {
    if (!fieldValue.trim()) {
      Alert.alert('Validation Error', 'Field cannot be empty.');
      return;
    }

    if (editingField === 'phone' && fieldValue.trim().length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setIsSaving(true);
      hapticFeedback.medium?.();

      const payload = {};
      if (editingField === 'name') payload.name = fieldValue.trim();
      if (editingField === 'phone') payload.phone = fieldValue.trim();

      await deliveryService.updateProfile(payload);
      await refreshProfile?.();

      hapticFeedback.success?.();
      setEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your personal information has been updated successfully.');
    } catch (err) {
      hapticFeedback.error?.();
      Alert.alert('Update Failed', err.message || 'Unable to update details. Please check your network and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD233" translucent={false} />

      {/* Warm Yellow Header Area matching reference Screen 2 */}
      <View style={styles.yellowHeaderArea}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          {/* Top Bar with Back Button and Title */}
          <View style={styles.topRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticFeedback.light?.();
                router.back();
              }}
              style={styles.backBtn}
              accessibilityLabel="Back"
              accessibilityRole="button"
            >
              <ArrowLeft size={22} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Personal Information</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Partner Identity inside Yellow Header */}
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{partnerInitials}</Text>
            </View>
            <View style={styles.identityCol}>
              <Text style={styles.partnerNameText} numberOfLines={1}>
                {partnerName}
              </Text>
              <Text style={styles.partnerRoleText}>Delivery Partner</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Full Name */}
        <View style={styles.infoCard}>
          <View style={styles.infoTextCol}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{partnerName}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOpenEdit('name', partnerName)}
            style={styles.pencilBtn}
            accessibilityLabel="Edit full name"
            accessibilityRole="button"
          >
            <Pencil size={18} color="#475569" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Card 2: Email Address */}
        <View style={styles.infoCard}>
          <View style={styles.infoTextCol}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{partnerEmail}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOpenEdit('email', partnerEmail)}
            style={styles.pencilBtn}
            accessibilityLabel="Email address info"
            accessibilityRole="button"
          >
            <Pencil size={18} color="#475569" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Card 3: Mobile Number */}
        <View style={styles.infoCard}>
          <View style={styles.infoTextCol}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{partnerPhone}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOpenEdit('phone', partnerPhone)}
            style={styles.pencilBtn}
            accessibilityLabel="Edit mobile number"
            accessibilityRole="button"
          >
            <Pencil size={18} color="#475569" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Admin Notice Box matching reference */}
        <View style={styles.adminNoticeBox}>
          <Info size={20} color="#2563EB" strokeWidth={2} style={styles.noticeIcon} />
          <Text style={styles.adminNoticeText}>
            Your work-related details such as delivery partner registration, vehicle information and documents are managed by the admin.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation matching reference */}
      <PartnerBottomBar activeTab="profile" />

      {/* Edit Field Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isSaving) setEditModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>
                Edit {editingField === 'name' ? 'Full Name' : 'Mobile Number'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setEditModalVisible(false)}
                disabled={isSaving}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>
              {editingField === 'name' ? 'Full Legal Name' : '10-Digit Mobile Number'}
            </Text>

            <TextInput
              value={fieldValue}
              onChangeText={setFieldValue}
              keyboardType={editingField === 'phone' ? 'phone-pad' : 'default'}
              autoFocus
              placeholder={editingField === 'name' ? 'Enter full name' : 'Enter mobile number'}
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setEditModalVisible(false)}
                disabled={isSaving}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveField}
                disabled={isSaving}
                style={styles.modalSaveBtn}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },

  // Warm Yellow Header Area matching reference
  yellowHeaderArea: {
    backgroundColor: '#FFD233',
    paddingHorizontal: 16,
    paddingBottom: 22
  },
  headerSafeArea: {
    paddingTop: 8
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 20,
    color: '#111827',
    letterSpacing: -0.3
  },

  // Identity Row in Yellow Header
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  avatarText: {
    fontFamily: typography.family.heavy,
    fontSize: 22,
    color: '#111827'
  },
  identityCol: {
    flex: 1,
    justifyContent: 'center'
  },
  partnerNameText: {
    fontFamily: typography.family.heavy,
    fontSize: 20,
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 2
  },
  partnerRoleText: {
    fontFamily: typography.family.medium,
    fontSize: 13.5,
    color: '#475569'
  },

  // Main scroll content
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24
  },

  // Info Cards matching reference
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12
  },
  infoTextCol: {
    flex: 1,
    marginRight: 12
  },
  infoLabel: {
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 4
  },
  infoValue: {
    fontFamily: typography.family.bold,
    fontSize: 15.5,
    color: '#111827'
  },
  pencilBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Admin Notice Box matching reference
  adminNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderRadius: 16,
    padding: 14,
    marginTop: 8
  },
  noticeIcon: {
    marginRight: 12,
    marginTop: 2
  },
  adminNoticeText: {
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    color: '#1E40AF',
    lineHeight: 18
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 20
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  modalHeaderTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 17,
    color: '#111827'
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalInputLabel: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F8F9FA',
    marginBottom: 18
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCancelText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#334155'
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalSaveText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  }
});
