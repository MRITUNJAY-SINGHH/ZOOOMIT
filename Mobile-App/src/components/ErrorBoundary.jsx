import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { AppButton } from './AppButton';

export class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Uncaught Error Boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <AlertCircle size={36} color={colors.error} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We encountered an unexpected issue. Please try refreshing or restarting the application.
            </Text>
            <AppButton
              title="Try Again"
              onPress={this.handleReset}
              variant="primary"
              icon={<RefreshCw size={18} color={colors.black} />}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  card: {
    backgroundColor: colors.white,
    padding: spacing.xxl,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  title: {
    fontSize: typography.size.xl,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center'
  },
  message: {
    fontSize: typography.size.md,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.md,
    marginBottom: spacing.xl
  }
});
