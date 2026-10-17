import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Volume2,
  Vibrate,
  AlertTriangle,
  Play,
  ShieldCheck
} from 'lucide-react-native';
import { typography } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const isNavigatingBack = useRef(false);

  // Debounced back navigation to prevent duplicate pop/push and looping
  const handleBack = () => {
    if (isNavigatingBack.current) return;
    isNavigatingBack.current = true;
    hapticFeedback.light?.();

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }

    setTimeout(() => {
      isNavigatingBack.current = false;
    }, 400);
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  const [masterPush, setMasterPush] = useState(true);
  const [loudAlert, setLoudAlert] = useState(true);
  const [vibrationAlert, setVibrationAlert] = useState(true);
  const [countdownWarning, setCountdownWarning] = useState(true);

  const handleTestAlert = () => {
    hapticFeedback.warning();
    Alert.alert(
      'New Order Incoming Test',
      'High-priority order alert chime triggered with continuous vibration pulse.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <ArrowLeft size={22} color="#111827" strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Master Push Switch */}
        <View style={styles.masterCard}>
          <View style={styles.masterContent}>
            <View style={styles.masterIconCircle}>
              <Bell size={22} color="#D97706" strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.masterTitle}>Push Notifications</Text>
              <Text style={styles.masterSubtitle}>
                {masterPush ? 'Enabled — Receiving live order dispatch rings' : 'Paused — You will miss new delivery requests'}
              </Text>
            </View>
          </View>
          <Switch
            value={masterPush}
            onValueChange={(val) => {
              hapticFeedback.selection();
              setMasterPush(val);
            }}
            trackColor={{ false: '#E2E8F0', true: '#FFC928' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Order Dispatch Alerts */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Order Alerts & Ringing</Text>

          <View style={styles.toggleRow}>
            <View style={[styles.rowIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Volume2 size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.toggleTitle}>High-Priority Ringtone</Text>
              <Text style={styles.toggleSubtitle}>Play loud incoming alert chime even on silent mode</Text>
            </View>
            <Switch
              value={loudAlert}
              disabled={!masterPush}
              onValueChange={(val) => {
                hapticFeedback.selection();
                setLoudAlert(val);
              }}
              trackColor={{ false: '#E2E8F0', true: '#FFC928' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={[styles.rowIconCircle, { backgroundColor: '#F1F5F9' }]}>
              <Vibrate size={18} color="#475569" />
            </View>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.toggleTitle}>Vibration Pulse</Text>
              <Text style={styles.toggleSubtitle}>Continuous haptic vibration pattern for incoming deliveries</Text>
            </View>
            <Switch
              value={vibrationAlert}
              disabled={!masterPush}
              onValueChange={(val) => {
                hapticFeedback.selection();
                setVibrationAlert(val);
              }}
              trackColor={{ false: '#E2E8F0', true: '#FFC928' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={[styles.rowIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <AlertTriangle size={18} color="#DC2626" />
            </View>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.toggleTitle}>Acceptance Timer Warning</Text>
              <Text style={styles.toggleSubtitle}>Urgent beep when 10 seconds remain to claim an order</Text>
            </View>
            <Switch
              value={countdownWarning}
              disabled={!masterPush}
              onValueChange={(val) => {
                hapticFeedback.selection();
                setCountdownWarning(val);
              }}
              trackColor={{ false: '#E2E8F0', true: '#FFC928' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Dispatch Channel Info Notice */}
        <View style={styles.infoNoticeCard}>
          <ShieldCheck size={20} color="#15803D" style={{ marginRight: 10, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoNoticeTitle}>Managed Dispatch Channel</Text>
            <Text style={styles.infoNoticeText}>
              Delivery orders are automatically routed based on your live GPS proximity when Online. Critical emergency alerts cannot be disabled.
            </Text>
          </View>
        </View>

        {/* Test Alert Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleTestAlert}
          style={styles.testBtn}
        >
          <Play size={16} color="#111827" strokeWidth={2.4} style={{ marginRight: 8 }} />
          <Text style={styles.testBtnText}>Test Order Alert Notification</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontFamily: typography.family.bold,
    fontSize: 18,
    color: '#111827'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 16,
    marginBottom: 16
  },
  masterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  masterIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  masterTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827'
  },
  masterSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16
  },
  cardHeading: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827',
    marginBottom: 14
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6
  },
  rowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  toggleTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  },
  toggleSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10
  },
  infoNoticeCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    padding: 14,
    marginBottom: 18
  },
  infoNoticeTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#15803D',
    marginBottom: 2
  },
  infoNoticeText: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#166534',
    lineHeight: 16
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC928',
    borderRadius: 14,
    height: 48
  },
  testBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  }
});
