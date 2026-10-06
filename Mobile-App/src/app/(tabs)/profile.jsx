import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  BackHandler
} from 'react-native';
import { BlurView, BlurTargetView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
  runOnJS
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Settings,
  ShoppingBag,
  MapPin,
  Heart,
  CreditCard,
  Crown,
  ChevronRight,
  User,
  Bell,
  Headphones,
  Info,
  LogOut,
  Check,
  X,
  Mail,
  Phone,
  ShieldCheck,
  FileText,
  MessageSquare,
  Star,
  ExternalLink,
  Trash2,
  AlertCircle
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { StorefrontAPI } from '../../services/api';
import { haptics } from '../../services/haptics';

export default function ProfileScreen() {
  const { customer, token, logout, refreshProfile } = useAuth();
  const pageContentRef = useRef(null);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showKuikloPlusModal, setShowKuikloPlusModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!showLogoutModal && !showDeleteModal) return;
    const backAction = () => {
      setShowLogoutModal(false);
      setShowDeleteModal(false);
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [showLogoutModal, showDeleteModal]);

  const [editName, setEditName] = useState(customer?.name || '');
  const [editEmail, setEditEmail] = useState(customer?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const rawPhone = customer?.phone ? customer.phone.toString().replace(/\D/g, '') : '';
  const formattedPhone = rawPhone.length >= 10
    ? `+91 ${rawPhone.slice(-10, -5)} ${rawPhone.slice(-5)}`
    : rawPhone ? `+91 ${rawPhone}` : '+91 99999 99999';

  const displayName = customer?.name || 'Kuiklo User 9999';

  const insets = useSafeAreaInsets();
  const COMPACT_HEADER_HEIGHT = insets.top + 56;
  const EXPANDED_BANNER_HEIGHT = insets.top + 215;
  const SCROLL_DISTANCE = EXPANDED_BANNER_HEIGHT - COMPACT_HEADER_HEIGHT;
  const HEADER_OVERLAP = 24;

  const scrollY = useSharedValue(0);
  const [isCompactVisible, setIsCompactVisible] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    }
  });

  useAnimatedReaction(
    () => scrollY.value > SCROLL_DISTANCE * 0.55,
    (visible, prev) => {
      if (visible !== prev) {
        runOnJS(setIsCompactVisible)(visible);
      }
    }
  );

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [0, -SCROLL_DISTANCE],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }]
    };
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-150, 0],
      [1.3, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [-150, 0, SCROLL_DISTANCE],
      [-20, 0, SCROLL_DISTANCE * 0.35],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.9],
      [1, 0.35],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }, { scale }]
    };
  });

  const identityAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.6],
      [1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.6],
      [0, -22],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }]
    };
  });

  const settingsBtnAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.45],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity
    };
  });

  const compactHeaderAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [SCROLL_DISTANCE * 0.55, SCROLL_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [SCROLL_DISTANCE * 0.55, SCROLL_DISTANCE],
      [-8, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }]
    };
  });

  const handleOpenEditProfile = () => {
    setEditName(customer?.name || '');
    setEditEmail(customer?.email || '');
    setEditError('');
    setEditSuccess(false);
    haptics.selection();
    router.push('/personal-information');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError('Please enter your full name');
      haptics.notificationError();
      return;
    }

    setIsSavingProfile(true);
    setEditError('');

    try {
      await StorefrontAPI.updateProfile({
        name: editName.trim(),
        email: editEmail.trim()
      });
      await refreshProfile();
      setEditSuccess(true);
      haptics.notificationSuccess();
      setTimeout(() => {
        setShowEditProfileModal(false);
        setEditSuccess(false);
      }, 700);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'Failed to update profile');
      haptics.notificationError();
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleConfirmLogout = async () => {
    haptics.impactMedium();
    setShowLogoutModal(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleOpenWhatsApp = () => {
    haptics.selection();
    Linking.openURL('https://wa.me/919876543210?text=Hello%20Kuiklo%20Support').catch(() => {});
  };

  const handleOpenEmail = () => {
    haptics.selection();
    Linking.openURL('mailto:support@kuiklo.com?subject=Kuiklo%20Support%20Request').catch(() => {});
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.guestSafeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.guestScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.guestHeaderIllustration}>
            <Image
              source={require('../../../assets/images/profile_header.jpg')}
              style={styles.guestHeroImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.guestCard}>
            <Text style={styles.guestGreeting}>Welcome to Kuiklo</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to manage your grocery orders, saved addresses, exclusive coupons, and lightning-fast delivery tracking.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.primaryCtaBtn,
                { backgroundColor: pressed ? colors.primaryDark : colors.primary }
              ]}
              onPress={() => {
                haptics.impactLight();
                router.push('/(auth)/login');
              }}
            >
              <Text style={styles.primaryCtaText}>Sign In / Continue with Mobile</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <BlurTargetView
        ref={pageContentRef}
        style={[
          styles.mainPageWrap,
          (showLogoutModal || showDeleteModal) && styles.pageContentBlurred
        ]}
      >
        
        <View style={styles.topYellowUnderlay} />

      <Animated.View
        style={[
          styles.compactHeaderBar,
          { height: COMPACT_HEADER_HEIGHT, paddingTop: insets.top },
          compactHeaderAnimatedStyle
        ]}
        pointerEvents={isCompactVisible ? 'auto' : 'none'}
      >
        <Pressable
          style={styles.compactBackBtn}
          onPress={() => {
            haptics.selection();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.4} />
        </Pressable>

        <View style={styles.compactTitleCol}>
          <Text style={styles.compactNameText} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.compactPhoneText} numberOfLines={1}>
            {formattedPhone}
          </Text>
        </View>

        <Pressable
          style={styles.compactSettingsBtn}
          onPress={handleOpenEditProfile}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Settings size={18} color={colors.textPrimary} strokeWidth={2.4} />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          styles.bannerHeaderWrap,
          { height: EXPANDED_BANNER_HEIGHT },
          headerAnimatedStyle
        ]}
        pointerEvents="box-none"
      >
        <Animated.Image
          source={require('../../../assets/images/profile_header.jpg')}
          style={[styles.bannerBgImage, imageAnimatedStyle]}
          resizeMode="cover"
        />

        <View
          style={[
            styles.bannerContentWrap,
            { paddingTop: insets.top + 8, paddingBottom: HEADER_OVERLAP + 12 }
          ]}
        >
          
          <Animated.View style={[styles.headerTopBar, settingsBtnAnimatedStyle]}>
            <View style={{ flex: 1 }} />
            <Pressable
              style={({ pressed }) => [
                styles.settingsBtn,
                { backgroundColor: pressed ? colors.primaryLight : colors.white }
              ]}
              onPress={handleOpenEditProfile}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Settings size={18} color={colors.textPrimary} strokeWidth={2.4} />
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.customerInfoOverlay, identityAnimatedStyle]}>
            <Text style={styles.greetingText}>Hello,</Text>
            <Text style={styles.customerName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.customerPhone}>
              {formattedPhone}
            </Text>
            <View style={styles.verifiedPill}>
              <View style={styles.verifiedCheckBadge}>
                <Check size={9} color={colors.white} strokeWidth={3.5} />
              </View>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.bodyScrollView}
        contentContainerStyle={[
          styles.bodyScrollContent,
          { paddingTop: EXPANDED_BANNER_HEIGHT - HEADER_OVERLAP }
        ]}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.whiteCardContainer}>
          
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon={<ShoppingBag size={22} color={colors.black} strokeWidth={2.2} />}
              label="My Orders"
              onPress={() => {
                haptics.selection();
                router.push('/(tabs)/orders');
              }}
            />
            <QuickActionButton
              icon={<MapPin size={22} color={colors.black} strokeWidth={2.2} />}
              label="Addresses"
              onPress={() => {
                haptics.selection();
                router.push('/addresses');
              }}
            />
            <QuickActionButton
              icon={<Heart size={22} color={colors.black} strokeWidth={2.2} />}
              label="Wishlist"
              onPress={() => {
                haptics.selection();
                router.push('/wishlist');
              }}
            />
            <QuickActionButton
              icon={<CreditCard size={22} color={colors.black} strokeWidth={2.2} />}
              label="Payments"
              onPress={() => {
                haptics.selection();
                setShowPaymentsModal(true);
              }}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.highlightCard,
              { backgroundColor: pressed ? '#FFF3D4' : colors.primarySoft }
            ]}
            onPress={() => {
              haptics.impactLight();
              setShowKuikloPlusModal(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Kuiklo Plus"
          >
            <View style={styles.crownCircle}>
              <Crown size={22} color="#D97706" strokeWidth={2.4} />
            </View>
            <View style={styles.highlightTextCol}>
              <Text style={styles.highlightTitle}>Kuiklo Plus</Text>
              <Text style={styles.highlightSubtitle}>
                Exclusive offers, free delivery and more
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2.2} />
          </Pressable>

          <View style={styles.menuGroupCard}>
            <MenuItemRow
              icon={<User size={20} color={colors.black} strokeWidth={2.2} />}
              title="Personal Information"
              subtitle="View and update your details"
              onPress={() => {
                haptics.selection();
                router.push('/personal-information');
              }}
            />
            <View style={styles.itemDivider} />
            <MenuItemRow
              icon={<Bell size={20} color={colors.black} strokeWidth={2.2} />}
              title="Notifications"
              subtitle="Manage your preferences"
              onPress={() => {
                haptics.selection();
                router.push('/notifications');
              }}
            />
            <View style={styles.itemDivider} />
            <MenuItemRow
              icon={<Headphones size={20} color={colors.black} strokeWidth={2.2} />}
              title="Help & Support"
              subtitle="Get support, FAQs and contact us"
              onPress={() => {
                haptics.selection();
                router.push('/help-support');
              }}
            />
            <View style={styles.itemDivider} />
            <MenuItemRow
              icon={<Info size={20} color={colors.black} strokeWidth={2.2} />}
              title="About Kuiklo"
              subtitle="App version, policies and more"
              onPress={() => {
                haptics.selection();
                router.push('/about-kuiklo');
              }}
            />
          </View>

          <View style={styles.menuGroupCard}>
            <MenuItemRow
              icon={<MessageSquare size={20} color={colors.black} strokeWidth={2.2} />}
              title="Give Feedback"
              subtitle="Share your suggestions to improve Kuiklo"
              onPress={() => {
                haptics.selection();
                setShowFeedbackModal(true);
              }}
            />
            <View style={styles.itemDivider} />
            <MenuItemRow
              icon={<ShieldCheck size={20} color={colors.black} strokeWidth={2.2} />}
              title="Privacy Policy"
              subtitle="Learn how we protect your personal data"
              onPress={() => {
                haptics.selection();
                router.push('/privacy');
              }}
            />
            <View style={styles.itemDivider} />
            <MenuItemRow
              icon={<FileText size={20} color={colors.black} strokeWidth={2.2} />}
              title="Terms & Conditions"
              subtitle="Service agreement and delivery policies"
              onPress={() => {
                haptics.selection();
                router.push('/terms');
              }}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logoutPillButton,
              { backgroundColor: pressed ? '#FEF2F2' : colors.white }
            ]}
            onPress={() => {
              haptics.impactLight();
              setShowLogoutModal(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Log Out"
          >
            <LogOut size={18} color={colors.error} strokeWidth={2.4} style={{ marginRight: 8 }} />
            <Text style={styles.logoutPillText}>Log Out</Text>
          </Pressable>

          <Pressable
            style={styles.deleteAccountRow}
            onPress={() => {
              haptics.selection();
              setShowDeleteModal(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Delete Account"
          >
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </Pressable>

          <View style={styles.footerBrandRow}>
            <Text style={styles.footerVersionText}>
              Kuiklo Grocery • Version {appVersion}
            </Text>
          </View>
        </View>
      </Animated.ScrollView>
      </BlurTargetView>

      <Modal
        visible={showEditProfileModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEditProfileModal(false)} />
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Personal Information</Text>
              <Pressable
                onPress={() => setShowEditProfileModal(false)}
                style={styles.modalCloseCircle}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>

            {Boolean(editError) && (
              <View style={styles.modalAlertError}>
                <AlertCircle size={15} color={colors.error} style={{ marginRight: 6 }} />
                <Text style={styles.modalAlertErrorText}>{editError}</Text>
              </View>
            )}

            {editSuccess && (
              <View style={styles.modalAlertSuccess}>
                <Check size={15} color={colors.success} style={{ marginRight: 6 }} />
                <Text style={styles.modalAlertSuccessText}>Profile updated successfully!</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputBox}>
                <User size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your Name"
                  placeholderTextColor={colors.textMuted}
                  style={styles.modalTextInput}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputBox}>
                <Mail size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  style={styles.modalTextInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Registered Mobile Number</Text>
              <View style={[styles.inputBox, styles.inputBoxDisabled]}>
                <Phone size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <Text style={styles.disabledInputText}>{formattedPhone}</Text>
                <View style={styles.verifiedBadgeInline}>
                  <Check size={11} color={colors.success} strokeWidth={3} />
                  <Text style={styles.verifiedInlineText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.inputNote}>Mobile number is authenticated via secure OTP</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryCtaBtn,
                { backgroundColor: pressed ? colors.primaryDark : colors.primary, marginTop: spacing.md }
              ]}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.primaryCtaText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showKuikloPlusModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowKuikloPlusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable style={styles.modalBackdrop} onPress={() => setShowKuikloPlusModal(false)} />
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Crown size={24} color="#D97706" strokeWidth={2.6} />
                <Text style={styles.modalTitle}>Kuiklo Plus Membership</Text>
              </View>
              <Pressable
                onPress={() => setShowKuikloPlusModal(false)}
                style={styles.modalCloseCircle}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>

            <Text style={styles.plusModalDesc}>
              Enjoy an elevated quick-commerce grocery experience with Kuiklo Plus benefits on every order:
            </Text>

            <View style={styles.plusPerkRow}>
              <View style={styles.plusPerkIcon}>
                <Check size={16} color={colors.success} strokeWidth={3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.plusPerkTitle}>Unlimited Free Delivery</Text>
                <Text style={styles.plusPerkSubtitle}>Zero delivery fee on all orders above ₹149</Text>
              </View>
            </View>

            <View style={styles.plusPerkRow}>
              <View style={styles.plusPerkIcon}>
                <Check size={16} color={colors.success} strokeWidth={3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.plusPerkTitle}>10–15 Min Priority Dispatch</Text>
                <Text style={styles.plusPerkSubtitle}>Skip packaging queues for instant order packing</Text>
              </View>
            </View>

            <View style={styles.plusPerkRow}>
              <View style={styles.plusPerkIcon}>
                <Check size={16} color={colors.success} strokeWidth={3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.plusPerkTitle}>VIP 24/7 Dedicated Support</Text>
                <Text style={styles.plusPerkSubtitle}>Direct access to our senior customer resolutions desk</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryCtaBtn,
                { backgroundColor: pressed ? colors.primaryDark : colors.primary, marginTop: spacing.lg }
              ]}
              onPress={() => {
                haptics.selection();
                setShowKuikloPlusModal(false);
              }}
            >
              <Text style={styles.primaryCtaText}>Got It</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showHelpModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable style={styles.modalBackdrop} onPress={() => setShowHelpModal(false)} />
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <Pressable
                onPress={() => setShowHelpModal(false)}
                style={styles.modalCloseCircle}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>

            <Text style={styles.helpIntroText}>
              We are here to help you 24/7 with your grocery orders, deliveries, and payment inquiries.
            </Text>

            <Pressable
              style={styles.supportActionRow}
              onPress={handleOpenWhatsApp}
            >
              <View style={styles.supportActionIcon}>
                <MessageSquare size={20} color={colors.success} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportActionTitle}>Chat on WhatsApp</Text>
                <Text style={styles.supportActionSubtitle}>Quick reply within 2 minutes</Text>
              </View>
              <ExternalLink size={16} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              style={styles.supportActionRow}
              onPress={handleOpenEmail}
            >
              <View style={styles.supportActionIcon}>
                <Mail size={20} color={colors.info} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportActionTitle}>Email Support</Text>
                <Text style={styles.supportActionSubtitle}>support@kuiklo.com</Text>
              </View>
              <ExternalLink size={16} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              style={styles.supportActionRow}
              onPress={() => {
                setShowHelpModal(false);
                router.push('/(tabs)/orders');
              }}
            >
              <View style={styles.supportActionIcon}>
                <ShoppingBag size={20} color={colors.textPrimary} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportActionTitle}>Order Issues & Returns</Text>
                <Text style={styles.supportActionSubtitle}>Report missing or damaged items</Text>
              </View>
              <ChevronRight size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAboutModal(false)} />
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>About Kuiklo</Text>
              <Pressable
                onPress={() => setShowAboutModal(false)}
                style={styles.modalCloseCircle}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>

            <View style={styles.aboutBrandHeader}>
              <Text style={styles.aboutBrandName}>Kuiklo Quick Commerce</Text>
              <Text style={styles.aboutVersionBadge}>v{appVersion}</Text>
            </View>
            <Text style={styles.aboutDescription}>
              Kuiklo is your neighborhood quick-commerce companion delivering farm-fresh produce, dairy, bakery, daily essentials, and household goods right to your doorstep in 10–15 minutes.
            </Text>

            <View style={styles.aboutLegalLinks}>
              <Pressable
                style={styles.aboutLinkItem}
                onPress={() => {
                  setShowAboutModal(false);
                  router.push('/privacy');
                }}
              >
                <ShieldCheck size={18} color={colors.black} style={{ marginRight: 10 }} />
                <Text style={styles.aboutLinkText}>Privacy Policy</Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </Pressable>
              <View style={styles.itemDivider} />
              <Pressable
                style={styles.aboutLinkItem}
                onPress={() => {
                  setShowAboutModal(false);
                  router.push('/terms');
                }}
              >
                <FileText size={18} color={colors.black} style={{ marginRight: 10 }} />
                <Text style={styles.aboutLinkText}>Terms & Conditions</Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryCtaBtn,
                { backgroundColor: pressed ? colors.primaryDark : colors.primary, marginTop: spacing.lg }
              ]}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.primaryCtaText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPaymentsModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowPaymentsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPaymentsModal(false)} />
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Payment Methods</Text>
              <Pressable
                onPress={() => setShowPaymentsModal(false)}
                style={styles.modalCloseCircle}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>

            <Text style={styles.helpIntroText}>
              Kuiklo supports all major secure payment gateways during checkout:
            </Text>

            <View style={styles.paymentMethodCard}>
              <Text style={styles.paymentMethodTitle}>Instant UPI</Text>
              <Text style={styles.paymentMethodDesc}>Google Pay, PhonePe, Paytm, CRED & Any UPI App</Text>
            </View>

            <View style={styles.paymentMethodCard}>
              <Text style={styles.paymentMethodTitle}>Cards & Net Banking</Text>
              <Text style={styles.paymentMethodDesc}>Visa, MasterCard, RuPay, Maestro & Net Banking</Text>
            </View>

            <View style={styles.paymentMethodCard}>
              <Text style={styles.paymentMethodTitle}>Cash on Delivery (COD)</Text>
              <Text style={styles.paymentMethodDesc}>Pay via Cash or UPI at your doorstep upon delivery</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryCtaBtn,
                { backgroundColor: pressed ? colors.primaryDark : colors.primary, marginTop: spacing.md }
              ]}
              onPress={() => setShowPaymentsModal(false)}
            >
              <Text style={styles.primaryCtaText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFavoritesModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowFavoritesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable style={styles.modalBackdrop} onPress={() => setShowFavoritesModal(false)} />
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Your Favorites</Text>
              <Pressable
                onPress={() => setShowFavoritesModal(false)}
                style={styles.modalCloseCircle}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>

            <View style={styles.favoritesEmptyWrap}>
              <Heart size={44} color={colors.primary} />
              <Text style={styles.favoritesEmptyTitle}>Save items you love</Text>
              <Text style={styles.favoritesEmptyDesc}>
                Tap the heart icon on any grocery product to quickly order your kitchen staples anytime.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryCtaBtn,
                { backgroundColor: pressed ? colors.primaryDark : colors.primary, marginTop: spacing.lg }
              ]}
              onPress={() => {
                setShowFavoritesModal(false);
                router.push('/(tabs)');
              }}
            >
              <Text style={styles.primaryCtaText}>Explore Store Catalog</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFeedbackModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable style={styles.modalBackdrop} onPress={() => setShowFeedbackModal(false)} />
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Give Feedback</Text>
              <Pressable
                onPress={() => setShowFeedbackModal(false)}
                style={styles.modalCloseCircle}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>

            {feedbackSent ? (
              <View style={styles.feedbackSuccessWrap}>
                <Check size={40} color={colors.success} />
                <Text style={styles.feedbackSuccessTitle}>Thank you for your feedback!</Text>
                <Text style={styles.feedbackSuccessDesc}>
                  Your feedback helps us make Kuiklo deliveries faster and better every day.
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryCtaBtn,
                    { backgroundColor: pressed ? colors.primaryDark : colors.primary, marginTop: spacing.md }
                  ]}
                  onPress={() => {
                    setShowFeedbackModal(false);
                    setFeedbackSent(false);
                    setFeedbackText('');
                  }}
                >
                  <Text style={styles.primaryCtaText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.helpIntroText}>How would you rate your Kuiklo experience?</Text>
                <View style={styles.starRatingRow}>
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <Pressable
                      key={starVal}
                      onPress={() => {
                        haptics.selection();
                        setFeedbackRating(starVal);
                      }}
                      style={styles.starBtn}
                    >
                      <Star
                        size={30}
                        color="#F59E0B"
                        fill={starVal <= feedbackRating ? '#F59E0B' : 'transparent'}
                        strokeWidth={2}
                      />
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  placeholder="Tell us what you loved or how we can improve..."
                  placeholderTextColor={colors.textMuted}
                  multiline={true}
                  numberOfLines={4}
                  style={styles.feedbackInput}
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryCtaBtn,
                    { backgroundColor: pressed ? colors.primaryDark : colors.primary, marginTop: spacing.md }
                  ]}
                  onPress={() => {
                    haptics.notificationSuccess();
                    setFeedbackSent(true);
                  }}
                >
                  <Text style={styles.primaryCtaText}>Submit Feedback</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.centeredDeleteOverlay}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable
            style={styles.modalBackdropBlurOverlay}
            onPress={() => setShowLogoutModal(false)}
          />
          <View style={styles.centeredDeleteCard}>
            <View style={styles.alertHeaderRow}>
              <View style={styles.alertHeaderSpacer} />
              <View style={styles.alertIconCircle}>
                <LogOut size={26} color={colors.error} strokeWidth={2.4} />
              </View>
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                style={styles.alertCloseCircle}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>
            <Text style={styles.alertTitle}>Sign Out</Text>
            <Text style={styles.alertMessage}>
              Are you sure you want to sign out of your Kuiklo account?
            </Text>
            <View style={styles.alertActionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.alertCancelBtn,
                  { backgroundColor: pressed ? colors.softBackground : colors.white }
                ]}
                onPress={() => {
                  haptics.selection();
                  setShowLogoutModal(false);
                }}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.alertConfirmBtn,
                  { backgroundColor: pressed ? '#B91C1C' : colors.error }
                ]}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.alertConfirmText}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.centeredDeleteOverlay}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable
            style={styles.modalBackdropBlurOverlay}
            onPress={() => setShowDeleteModal(false)}
          />
          <View style={styles.centeredDeleteCard}>
            <View style={styles.alertHeaderRow}>
              <View style={styles.alertHeaderSpacer} />
              <View style={[styles.alertIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Trash2 size={24} color={colors.error} strokeWidth={2.4} />
              </View>
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                style={styles.alertCloseCircle}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>
            <Text style={styles.alertTitle}>Delete Account</Text>
            <Text style={styles.alertMessage}>
              In accordance with data privacy regulations, account deletion requests are processed manually to verify ongoing deliveries and pending refunds.
            </Text>
            <Text style={[styles.alertMessage, { marginTop: 4, fontFamily: typography.family.semibold }]}> 
              Please email support@kuiklo.com from your registered email with subject "Account Deletion Request".
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.primaryCtaBtn,
                { backgroundColor: pressed ? colors.primaryDark : colors.primary, marginTop: spacing.md, width: '100%' }
              ]}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.primaryCtaText}>Understood</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function QuickActionButton({ icon, label, onPress }) {
  return (
    <View style={styles.quickActionItem}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.quickActionPressable,
          pressed && { transform: [{ scale: 0.94 }] }
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.quickActionCircle}>
          {icon}
        </View>
        <Text style={styles.quickActionLabel} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function MenuItemRow({ icon, title, subtitle, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItemRow,
        { backgroundColor: pressed ? colors.softBackground : colors.white }
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.menuIconContainer}>
        {icon}
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        {Boolean(subtitle) && (
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.white
  },
  topYellowUnderlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    backgroundColor: colors.primary
  },
  compactHeaderBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#E5A900',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    zIndex: 100
  },
  compactBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  compactTitleCol: {
    flex: 1,
    justifyContent: 'center'
  },
  compactNameText: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2
  },
  compactPhoneText: {
    fontSize: 11,
    fontFamily: typography.family.medium,
    color: colors.textPrimary,
    opacity: 0.85,
    marginTop: 1
  },
  compactSettingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10
  },
  bannerHeaderWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    overflow: 'hidden',
    zIndex: 1
  },
  bannerBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%'
  },
  bannerContentWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between'
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  customerInfoOverlay: {
    maxWidth: '75%'
  },
  greetingText: {
    fontSize: 15,
    fontFamily: typography.family.medium,
    color: colors.textPrimary,
    marginBottom: 2
  },
  customerName: {
    fontSize: 20,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 2
  },
  customerPhone: {
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textPrimary,
    opacity: 0.9,
    marginBottom: 8
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E5A900',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5
  },
  verifiedCheckBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center'
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  bodyScrollView: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 2
  },
  bodyScrollContent: {
    paddingBottom: 40
  },
  whiteCardContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.lg,
    minHeight: 800
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1
  },
  quickActionPressable: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickActionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: '#FFEAA7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  quickActionLabel: {
    fontSize: 12,
    fontFamily: typography.family.medium,
    color: colors.textPrimary,
    textAlign: 'center'
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: '#FFE8A3',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md
  },
  crownCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  highlightTextCol: {
    flex: 1
  },
  highlightTitle: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  highlightSubtitle: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  menuGroupCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.softBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  menuTextContainer: {
    flex: 1
  },
  menuItemTitle: {
    fontSize: 14,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
  },
  menuItemSubtitle: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 1
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginLeft: 64
  },
  logoutPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs
  },
  logoutPillText: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.error
  },
  deleteAccountRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm
  },
  deleteAccountText: {
    fontSize: 12,
    fontFamily: typography.family.medium,
    color: colors.textMuted,
    textDecorationLine: 'underline'
  },
  footerBrandRow: {
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingBottom: spacing.sm
  },
  footerVersionText: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: colors.textMuted
  },
  primaryCtaBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl
  },
  primaryCtaText: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  guestSafeArea: {
    flex: 1,
    backgroundColor: colors.primary
  },
  guestScrollContent: {
    flexGrow: 1,
    backgroundColor: colors.white
  },
  guestHeaderIllustration: {
    height: 240,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden'
  },
  guestHeroImage: {
    width: 180,
    height: 180,
    borderRadius: 30
  },
  guestCard: {
    padding: spacing.xl,
    alignItems: 'center'
  },
  guestGreeting: {
    fontSize: 22,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 8
  },
  guestSubtitle: {
    fontSize: 14,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.softBackground,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalAlertError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorSubtle,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.error,
    marginBottom: spacing.md
  },
  modalAlertErrorText: {
    fontSize: 12,
    fontFamily: typography.family.medium,
    color: colors.error
  },
  modalAlertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successSubtle,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.success,
    marginBottom: spacing.md
  },
  modalAlertSuccessText: {
    fontSize: 12,
    fontFamily: typography.family.medium,
    color: colors.success
  },
  inputGroup: {
    marginBottom: spacing.sm
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: typography.family.semibold,
    color: colors.textSecondary,
    marginBottom: 6
  },
  inputBox: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  inputBoxDisabled: {
    backgroundColor: colors.softBackground
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  disabledInputText: {
    flex: 1,
    fontSize: 14,
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  verifiedBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3
  },
  verifiedInlineText: {
    fontSize: 10,
    fontFamily: typography.family.bold,
    color: colors.success
  },
  inputNote: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: colors.textMuted,
    marginTop: 4
  },
  plusModalDesc: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md
  },
  plusPerkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md
  },
  plusPerkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.successSubtle,
    borderWidth: 1,
    borderColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2
  },
  plusPerkTitle: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  plusPerkSubtitle: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 1
  },
  helpIntroText: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md
  },
  supportActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.white
  },
  supportActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.softBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  supportActionTitle: {
    fontSize: 14,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
  },
  supportActionSubtitle: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 1
  },
  aboutBrandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  aboutBrandName: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  aboutVersionBadge: {
    fontSize: 12,
    fontFamily: typography.family.bold,
    color: colors.black,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  aboutDescription: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md
  },
  aboutLegalLinks: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.white
  },
  aboutLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  aboutLinkText: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  paymentMethodCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.softBackground
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  paymentMethodDesc: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  favoritesEmptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl
  },
  favoritesEmptyTitle: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 4
  },
  favoritesEmptyDesc: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280
  },
  feedbackSuccessWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl
  },
  feedbackSuccessTitle: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 4
  },
  feedbackSuccessDesc: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280
  },
  starRatingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.md
  },
  starBtn: {
    padding: 4
  },
  feedbackInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textPrimary,
    backgroundColor: colors.softBackground,
    textAlignVertical: 'top',
    height: 90
  },
  mainPageWrap: {
    flex: 1,
    backgroundColor: colors.white,
    position: 'relative'
  },
  pageContentBlurred: {
    ...Platform.select({
      web: {
        filter: 'blur(10px)',
        transform: [{ scale: 0.985 }],
        transition: 'filter 0.25s ease, transform 0.25s ease, opacity 0.25s ease',
        opacity: 0.8
      },
      ios: {
        opacity: 0.8
      },
      android: {
        opacity: 0.8
      }
    })
  },
  centeredDeleteOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(17, 24, 39, 0.32)'
  },
  centeredDeleteCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  alertHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  alertHeaderSpacer: {
    width: 32,
    height: 32
  },
  alertCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.softBackground,
    justifyContent: 'center',
    alignItems: 'center'
  },
  inScreenModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg
  },
  centeredModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg
  },
  modalBackdropBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.28)'
  },
  logoutCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  alertCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  alertIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  alertTitle: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center'
  },
  alertMessage: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg
  },
  alertActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  alertCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white
  },
  alertCancelText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  alertConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertConfirmText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.white
  },
  guestSafeArea: {
    flex: 1,
    backgroundColor: colors.white
  },
  guestScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40
  },
  guestHeaderIllustration: {
    width: '100%',
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    marginBottom: spacing.lg
  },
  guestHeroImage: {
    width: '100%',
    height: '100%'
  },
  guestCard: {
    backgroundColor: colors.softBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center'
  },
  guestGreeting: {
    fontSize: 20,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 8
  },
  guestSubtitle: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg
  }
});
