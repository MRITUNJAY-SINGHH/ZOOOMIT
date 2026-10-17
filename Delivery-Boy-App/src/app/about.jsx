import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Polygon, Circle } from 'react-native-svg';
import {
  ArrowLeft,
  Headphones,
  Shield,
  FileText,
  ChevronRight
} from 'lucide-react-native';
import { typography } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';
import PartnerBottomBar from '../components/PartnerBottomBar';

// Original Vector Yellow Open-Box with Sparkles Illustration matching reference Screen 5
function OpenBoxIllustration() {
  return (
    <View style={styles.illustrationWrapper}>
      <Svg width={120} height={100} viewBox="0 0 120 100" fill="none">
        {/* Sparkle top left */}
        <Path
          d="M24 16 C24 20 20 24 16 24 C20 24 24 28 24 32 C24 28 28 24 32 24 C28 24 24 20 24 16 Z"
          fill="#FBBF24"
        />
        {/* Sparkle top right */}
        <Path
          d="M98 12 C98 15 95 18 92 18 C95 18 98 21 98 24 C98 21 101 18 104 18 C101 18 98 15 98 12 Z"
          fill="#F59E0B"
        />
        {/* Small sparkle dots */}
        <Circle cx="20" cy="38" r="2" fill="#FDE047" />
        <Circle cx="102" cy="34" r="2.5" fill="#FBBF24" />
        <Circle cx="18" cy="18" r="1.5" fill="#F59E0B" />

        {/* Box Inner Opening / Cavity */}
        <Polygon points="60,26 88,40 60,54 32,40" fill="#D97706" />
        <Polygon points="60,30 84,41 60,51 36,41" fill="#B45309" />

        {/* Back Open Flaps */}
        <Polygon points="32,40 60,26 62,14 30,26" fill="#FBBF24" />
        <Polygon points="60,26 88,40 90,26 58,14" fill="#FCD34D" />

        {/* Front Left Open Flap */}
        <Polygon points="32,40 60,54 58,66 26,48" fill="#FCD34D" />
        {/* Front Right Open Flap */}
        <Polygon points="60,54 88,40 94,48 62,66" fill="#FBBF24" />

        {/* Box Front Faces */}
        {/* Left Face */}
        <Polygon points="32,40 60,54 60,86 32,72" fill="#F59E0B" />
        {/* Right Face */}
        <Polygon points="60,54 88,40 88,72 60,86" fill="#FBBF24" />

        {/* Bottom subtle crease */}
        <Path d="M60 54 L60 86" stroke="#D97706" strokeWidth={1} />
      </Svg>
    </View>
  );
}

export default function AboutScreen() {
  const router = useRouter();

  const menuRows = [
    {
      id: 'contact',
      title: 'Contact Support',
      icon: Headphones,
      iconColor: '#111827',
      onPress: () => {
        hapticFeedback.light?.();
        router.push('/help-support');
      }
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: Shield,
      iconColor: '#DC2626',
      onPress: () => {
        hapticFeedback.light?.();
        router.push('/privacy-policy');
      }
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      icon: FileText,
      iconColor: '#EA580C',
      onPress: () => {
        hapticFeedback.light?.();
        router.push('/terms-conditions');
      }
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView edges={['top']} style={styles.safeAreaHeader}>
        {/* Header Bar matching reference */}
        <View style={styles.header}>
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
          <Text style={styles.headerTitle}>About ZOOOMIT</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Center Section matching reference */}
        <View style={styles.brandCenterSection}>
          <OpenBoxIllustration />

          <Text style={styles.brandTitle}>ZOOOMIT</Text>
          <Text style={styles.versionText}>App Version 1.0.0</Text>

          <Text style={styles.descriptionParagraph}>
            ZOOOMIT Delivery Partner app helps you complete delivery assignments, manage your earnings, and stay connected with our team. Our goal is to make deliveries simple, fast and reliable.
          </Text>
        </View>

        {/* 3 Menu Rows matching reference Screen 5 */}
        <View style={styles.menuCard}>
          {menuRows.map((row, index) => {
            const IconComp = row.icon;
            const isLast = index === menuRows.length - 1;

            return (
              <React.Fragment key={row.id}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={row.onPress}
                  style={styles.menuRow}
                  accessibilityRole="button"
                  accessibilityLabel={row.title}
                >
                  <IconComp size={20} color={row.iconColor} strokeWidth={2} style={styles.rowIcon} />
                  <Text style={styles.rowTitle}>{row.title}</Text>
                  <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
                </TouchableOpacity>

                {!isLast && <View style={styles.rowDivider} />}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation matching reference */}
      <PartnerBottomBar activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  safeAreaHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12
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
    fontSize: 18,
    color: '#111827'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 36
  },

  // Brand Center Section
  brandCenterSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 28
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  brandTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 24,
    color: '#111827',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  versionText: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16
  },
  descriptionParagraph: {
    fontFamily: typography.family.regular,
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320
  },

  // Menu Card
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15
  },
  rowIcon: {
    marginRight: 14
  },
  rowTitle: {
    flex: 1,
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827'
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9'
  }
});
