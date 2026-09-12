import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import { 
  User, 
  MapPin, 
  Bell, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  ShoppingBag,
  ShieldCheck
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AppButton } from '../../components/AppButton';

export default function ProfileScreen() {
  const { customer, token, logout } = useAuth();

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <User size={48} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Welcome to Kuiklo</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to manage your addresses, view order history, and access quick customer support.
          </Text>
          <AppButton
            title="Sign In / Register"
            onPress={() => router.push('/(auth)/login')}
            size="lg"
            style={{ width: '100%' }}
          />
        </View>
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Kuiklo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {customer?.name ? customer.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{customer?.name || 'Kuiklo Customer'}</Text>
        <Text style={styles.phone}>{customer?.phone}</Text>
        {Boolean(customer?.email) && (
          <Text style={styles.email}>{customer?.email}</Text>
        )}
      </View>

      {/* Customer Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statNumber}>{customer?.totalOrders || 0}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statNumber}>₹{customer?.totalSpent || 0}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
      </View>

      {/* Account Navigation Options */}
      <View style={styles.menuSection}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/addresses')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <MapPin size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Saved Addresses</Text>
            <Text style={styles.menuSubtitle}>Manage delivery addresses & defaults</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/orders')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <ShoppingBag size={20} color={colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>My Orders</Text>
            <Text style={styles.menuSubtitle}>Track orders and view invoices</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <Bell size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Notifications</Text>
            <Text style={styles.menuSubtitle}>Order updates and promotional offers</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/orders')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <HelpCircle size={20} color={colors.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Help & Support</Text>
            <Text style={styles.menuSubtitle}>Report damaged or missing items</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout Action */}
      <View style={styles.logoutSection}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={20} color={colors.error} style={{ marginRight: spacing.sm }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Version Info */}
      <View style={styles.footer}>
        <ShieldCheck size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
        <Text style={styles.versionText}>Kuiklo Grocery App • v1.0.0 (Production Ready)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl']
  },
  guestIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  guestTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  guestSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.md,
    marginBottom: spacing['2xl'],
    maxWidth: 300
  },
  header: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  avatarText: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: '#ffffff'
  },
  name: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: 2
  },
  phone: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  email: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  statCol: {
    flex: 1,
    alignItems: 'center'
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border
  },
  statNumber: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  menuSection: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md
  },
  menuTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary
  },
  menuSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  logoutSection: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border
  },
  logoutText: {
    color: colors.error,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl']
  },
  versionText: {
    fontSize: typography.size.xs,
    color: colors.textMuted
  }
});
