import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Easing,
  Platform,
  Keyboard,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  MapPin,
  Search,
  Plus,
  X,
  Check,
  House,
  Briefcase,
  Pencil
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { haptics } from '../../services/haptics';

const TYPES = [
  { key: 'Home', Icon: House },
  { key: 'Work', Icon: Briefcase },
  { key: 'Other', Icon: MapPin }
];

const typeIcon = (label) => (TYPES.find((t) => t.key === label) || TYPES[2]).Icon;

export function QuickAddressSheet({ visible, onClose, onSelectAddress }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { customer, refreshProfile } = useAuth();

  // Animation values
  const animValue = useRef(new Animated.Value(0)).current;
  const [modalRendered, setModalRendered] = useState(visible);

  const [searchQuery, setSearchQuery] = useState('');
  // Instant visual feedback state
  const defaultAddr = customer?.addresses?.find((a) => a.isDefault) || customer?.addresses?.[0];
  const [selectedId, setSelectedId] = useState(defaultAddr?._id || null);

  // Navigation loading feedback
  const [isNavigatingNew, setIsNavigatingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Sync selectedId with customer data on open
  useEffect(() => {
    if (visible) {
      const def = customer?.addresses?.find((a) => a.isDefault) || customer?.addresses?.[0];
      setSelectedId(def?._id || null);
      setSearchQuery('');
      setIsNavigatingNew(false);
      setEditingId(null);
    }
  }, [visible, customer?.addresses]);

  // Smooth slide-up & fade-in / slide-down & fade-out
  useEffect(() => {
    if (visible) {
      setModalRendered(true);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 250,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1),
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 180,
        easing: Easing.bezier(0.3, 0, 0.8, 0.15),
        useNativeDriver: true
      }).start(() => {
        setModalRendered(false);
      });
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    haptics.selection();
    Animated.timing(animValue, {
      toValue: 0,
      duration: 180,
      easing: Easing.bezier(0.3, 0, 0.8, 0.15),
      useNativeDriver: true
    }).start(() => {
      setModalRendered(false);
      onClose?.();
    });
  };

  const savedAddresses = customer?.addresses || [];

  // Filter addresses based on search query
  const filteredAddresses = useMemo(() => {
    if (!searchQuery.trim()) return savedAddresses;
    const q = searchQuery.toLowerCase().trim();
    return savedAddresses.filter((a) => {
      const matchLabel = (a.label || '').toLowerCase().includes(q);
      const matchStreet = (a.street || '').toLowerCase().includes(q);
      const matchCity = (a.city || '').toLowerCase().includes(q);
      const matchLandmark = (a.landmark || '').toLowerCase().includes(q);
      const matchZip = (a.zipCode || '').includes(q);
      return matchLabel || matchStreet || matchCity || matchLandmark || matchZip;
    });
  }, [savedAddresses, searchQuery]);

  // Instant address selection with immediate visual indicator
  const handleSelect = (addr) => {
    // 1. Immediate visual feedback & haptic click confirmation
    setSelectedId(addr._id);
    haptics.selection();

    // 2. Optimistic callback to update parent state right away
    onSelectAddress?.(addr);

    // 3. Smooth close after brief 120ms so user clearly sees their selection register
    setTimeout(() => {
      handleClose();
    }, 120);

    // 4. Background network sync (non-blocking, zero lag for the user)
    (async () => {
      try {
        if (!addr.isDefault) {
          await StorefrontAPI.setDefaultAddress(addr._id);
        }
        await refreshProfile?.();
      } catch (err) {
        console.warn('Failed to set default address:', err);
      }
    })();
  };

  // Navigate to full address page when clicking Add New Address
  const handleAddNewAddress = () => {
    if (isNavigatingNew) return;
    haptics.selection();
    setIsNavigatingNew(true);
    setTimeout(() => {
      handleClose();
      router.push('/addresses');
      setTimeout(() => {
        setIsNavigatingNew(false);
      }, 500);
    }, 140);
  };

  // Navigate to address page when clicking Edit
  const handleEditAddress = (addr) => {
    if (editingId) return;
    haptics.selection();
    setEditingId(addr._id);
    setTimeout(() => {
      handleClose();
      router.push({
        pathname: '/addresses',
        params: { editId: addr._id }
      });
      setTimeout(() => {
        setEditingId(null);
      }, 500);
    }, 140);
  };

  if (!modalRendered) return null;

  // Sheet Height calculation (comfortably reduced to ~58% of screen height)
  const sheetHeight = Math.min(
    height - insets.top - 100,
    Math.max(400, Math.round(height * 0.58))
  );

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight + 40, 0]
  });

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <Modal
      transparent
      visible={modalRendered}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Animated Dimmed & Blurred Backdrop (Matching Category Variation Overlay) */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
          pointerEvents="none"
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 55 : 35}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.62)' }]} />
        </Animated.View>

        {/* Dedicated outside tap area to close smoothly when clicking outside */}
        <Pressable
          style={styles.outsideTapArea}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss address modal by clicking outside"
        />

        {/* Sliding Bottom Sheet Container */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              height: sheetHeight,
              transform: [{ translateY }],
              paddingBottom: Math.max(insets.bottom, 16)
            }
          ]}
        >
          {/* Grabber Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handlePill} />
          </View>

          <View style={styles.contentWrap}>
            {/* Header: Clean title with no delivery ETA text */}
            <View style={styles.headerRow}>
              <View style={styles.headerIconCircle}>
                <MapPin size={20} color="#111827" strokeWidth={2.4} />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerMainTitle}>Select Delivery Location</Text>
                <Text style={styles.headerSubTitle}>
                  Choose from your saved addresses
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={20} color={colors.textPrimary} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBarContainer}>
              <Search size={18} color="#9CA3AF" strokeWidth={2.2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search saved addresses, street, area..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Add New Address Button (Navigates to Address Page with loader) */}
            <TouchableOpacity
              style={[styles.addNewBtn, isNavigatingNew && styles.addNewBtnLoading]}
              onPress={handleAddNewAddress}
              disabled={isNavigatingNew}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Add new address"
            >
              {isNavigatingNew ? (
                <View style={styles.btnLoadingRow}>
                  <ActivityIndicator size="small" color="#111827" />
                  <Text style={styles.addNewText}>Opening Address Form...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.addNewIconCircle}>
                    <Plus size={16} color="#111827" strokeWidth={3} />
                  </View>
                  <Text style={styles.addNewText}>Add New Address</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Saved Addresses Section Heading */}
            <View style={styles.listSectionHeader}>
              <Text style={styles.listSectionTitle}>SAVED ADDRESSES</Text>
              <Text style={styles.listSectionBadge}>{filteredAddresses.length}</Text>
            </View>

            {/* Scrollable Saved Addresses List */}
            <ScrollView
              style={styles.addressListScroll}
              contentContainerStyle={styles.addressListScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredAddresses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <MapPin size={32} color="#9CA3AF" strokeWidth={1.8} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {searchQuery.trim() ? 'No matching addresses' : 'No saved addresses yet'}
                  </Text>
                  <Text style={styles.emptySub}>
                    {searchQuery.trim()
                      ? 'Check for spelling or try searching another street.'
                      : 'Add an address to get quick doorstep delivery.'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptyAddBtn, isNavigatingNew && styles.emptyAddBtnLoading]}
                    onPress={handleAddNewAddress}
                    disabled={isNavigatingNew}
                    activeOpacity={0.85}
                  >
                    {isNavigatingNew ? (
                      <ActivityIndicator size="small" color="#111827" />
                    ) : (
                      <Plus size={16} color="#111827" strokeWidth={2.6} />
                    )}
                    <Text style={styles.emptyAddBtnText}>
                      {isNavigatingNew ? 'Opening Form...' : 'Add new address'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredAddresses.map((addr) => {
                  const Icon = typeIcon(addr.label);
                  const isSelected = selectedId === addr._id || (Boolean(addr.isDefault) && !selectedId);

                  return (
                    <TouchableOpacity
                      key={addr._id}
                      style={[
                        styles.addressCard,
                        isSelected && styles.addressCardSelected
                      ]}
                      onPress={() => handleSelect(addr)}
                      activeOpacity={0.82}
                    >
                      {/* Left Category Icon */}
                      <View
                        style={[
                          styles.typeIconBox,
                          isSelected && styles.typeIconBoxSelected
                        ]}
                      >
                        <Icon
                          size={19}
                          color={isSelected ? '#111827' : '#4B5563'}
                          strokeWidth={2.2}
                        />
                      </View>

                      {/* Middle Address Details */}
                      <View style={styles.addressInfoCol}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.cardLabelText}>{addr.label || 'Address'}</Text>
                          {Boolean(addr.isDefault) && (
                            <View style={styles.defaultPill}>
                              <Text style={styles.defaultPillText}>DEFAULT</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.streetText} numberOfLines={2}>
                          {addr.street}
                        </Text>

                        {Boolean(addr.landmark) && (
                          <Text style={styles.landmarkText} numberOfLines={1}>
                            Near: {addr.landmark}
                          </Text>
                        )}

                        <Text style={styles.cityZipText} numberOfLines={1}>
                          {[addr.city, addr.state].filter(Boolean).join(', ')}
                          {addr.zipCode ? ` - ${addr.zipCode}` : ''}
                        </Text>
                      </View>

                      {/* Right Instant Radio Indicator & Edit Button */}
                      <View style={styles.cardRightCol}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected
                          ]}
                        >
                          {isSelected && <Check size={14} color="#111827" strokeWidth={3.2} />}
                        </View>

                        <TouchableOpacity
                          style={styles.editIconBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEditAddress(addr);
                          }}
                          disabled={editingId === addr._id}
                          hitSlop={8}
                          accessibilityLabel={`Edit ${addr.label}`}
                        >
                          {editingId === addr._id ? (
                            <ActivityIndicator size="small" color="#6B7280" />
                          ) : (
                            <Pencil size={15} color="#6B7280" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const F = typography.family;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
  },
  outsideTapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    overflow: 'hidden',
    zIndex: 2,
    elevation: 20
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10
  },
  handlePill: {
    width: 44,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB'
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 20
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleWrap: {
    flex: 1
  },
  headerMainTitle: {
    fontSize: 17,
    fontFamily: F.bold,
    color: '#111827'
  },
  headerSubTitle: {
    fontSize: 12.5,
    fontFamily: F.regular,
    color: '#6B7280',
    marginTop: 1
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 13,
    height: 46,
    gap: 8,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
    fontFamily: F.medium,
    color: '#111827',
    paddingVertical: 0
  },
  addNewBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FEDC4A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16
  },
  addNewBtnLoading: {
    opacity: 0.92
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  addNewIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addNewText: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#111827'
  },
  listSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  listSectionTitle: {
    fontSize: 11.5,
    fontFamily: F.bold,
    color: '#9CA3AF',
    letterSpacing: 0.8
  },
  listSectionBadge: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10
  },
  addressListScroll: {
    flex: 1
  },
  addressListScrollContent: {
    paddingBottom: 24
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 13,
    marginBottom: 11,
    gap: 12
  },
  addressCardSelected: {
    borderColor: '#FEDC4A',
    backgroundColor: '#FEFCE8'
  },
  typeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  typeIconBoxSelected: {
    backgroundColor: '#FEF08A'
  },
  addressInfoCol: {
    flex: 1
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3
  },
  cardLabelText: {
    fontSize: 14.5,
    fontFamily: F.bold,
    color: '#111827'
  },
  defaultPill: {
    backgroundColor: '#FEDC4A',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5
  },
  defaultPillText: {
    fontSize: 9.5,
    fontFamily: F.bold,
    color: '#111827',
    letterSpacing: 0.3
  },
  streetText: {
    fontSize: 13,
    fontFamily: F.medium,
    color: '#374151',
    lineHeight: 18
  },
  landmarkText: {
    fontSize: 12,
    fontFamily: F.regular,
    color: '#6B7280',
    marginTop: 1
  },
  cityZipText: {
    fontSize: 12,
    fontFamily: F.regular,
    color: '#6B7280',
    marginTop: 1
  },
  cardRightCol: {
    alignItems: 'center',
    gap: 12,
    paddingLeft: 4
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  radioCircleSelected: {
    backgroundColor: '#FEDC4A',
    borderColor: '#FEDC4A'
  },
  editIconBtn: {
    padding: 4,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: F.bold,
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center'
  },
  emptySub: {
    fontSize: 12.5,
    fontFamily: F.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEDC4A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12
  },
  emptyAddBtnLoading: {
    opacity: 0.92
  },
  emptyAddBtnText: {
    fontSize: 13.5,
    fontFamily: F.bold,
    color: '#111827'
  }
});
