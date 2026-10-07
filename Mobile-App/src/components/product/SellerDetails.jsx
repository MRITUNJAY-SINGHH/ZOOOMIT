import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { haptics } from '../../services/haptics';

export const SellerDetails = ({ product }) => {
  const [isSellerExpanded, setIsSellerExpanded] = useState(false);
  const [isOtherExpanded, setIsOtherExpanded] = useState(false);

  const seller = product?.sellerDetails || {
    name: 'PJIT TECHNOLOGIES PVT LTD',
    fssaiNumber: '12725052000372',
    address: 'ZOOOMIT Fulfillment Center, Sector 62, Noida, UP'
  };

  const countryOfOrigin = product?.countryOfOrigin || 'India';
  const eanCode = product?.ean || product?.barcode || '8901234567890';
  const storageDesc = product?.storageInfo || 'Store in a dry and cool conditions away from sunlight. The image(s) shown are representative of the actual product. While every effort has been made to maintain accurate and up to date product information, actual product packaging and materials may contain additional information.';

  return (
    <View style={styles.container}>
      {/* Seller Details Card */}
      <View style={styles.card}>
        <Pressable
          onPress={() => {
            haptics.selection();
            setIsSellerExpanded(!isSellerExpanded);
          }}
          style={styles.cardHeader}
          accessibilityRole="button"
          accessibilityLabel="Toggle seller details"
        >
          <Text style={styles.cardTitle}>Seller Details</Text>
          {isSellerExpanded ? (
            <ChevronUp size={18} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={18} color={colors.textSecondary} />
          )}
        </Pressable>

        <Text style={styles.infoLabel}>Seller Name:</Text>
        <Text style={styles.infoValue}>{seller.name}</Text>

        <Text style={[styles.infoLabel, { marginTop: 6 }]}>FSSAI Number:</Text>
        <Text style={styles.infoValue}>{seller.fssaiNumber}</Text>

        {isSellerExpanded && (
          <View style={styles.expandedContent}>
            {seller.address && (
              <>
                <Text style={[styles.infoLabel, { marginTop: 6 }]}>Fulfillment Address:</Text>
                <Text style={styles.infoValue}>{seller.address}</Text>
              </>
            )}
            <Text style={[styles.infoLabel, { marginTop: 6 }]}>Customer Care:</Text>
            <Text style={styles.infoValue}>support@kuiklo.com • +91 9876543210</Text>
          </View>
        )}

        <Pressable
          onPress={() => {
            haptics.selection();
            setIsSellerExpanded(!isSellerExpanded);
          }}
          style={styles.showMoreBtn}
        >
          <Text style={styles.showMoreText}>
            {isSellerExpanded ? 'Show less −' : 'Show more +'}
          </Text>
        </Pressable>
      </View>

      {/* Other Information Card */}
      <View style={[styles.card, { marginTop: 10 }]}>
        <Pressable
          onPress={() => {
            haptics.selection();
            setIsOtherExpanded(!isOtherExpanded);
          }}
          style={styles.cardHeader}
          accessibilityRole="button"
          accessibilityLabel="Toggle other information"
        >
          <Text style={styles.cardTitle}>Other Information</Text>
          {isOtherExpanded ? (
            <ChevronUp size={18} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={18} color={colors.textSecondary} />
          )}
        </Pressable>

        <Text style={styles.bodySummary} numberOfLines={isOtherExpanded ? undefined : 3}>
          Country Of Origin is {countryOfOrigin}. EAN code: {eanCode}. {storageDesc}
        </Text>

        <Pressable
          onPress={() => {
            haptics.selection();
            setIsOtherExpanded(!isOtherExpanded);
          }}
          style={styles.showMoreBtn}
        >
          <Text style={styles.showMoreText}>
            {isOtherExpanded ? 'Show less −' : 'Show more +'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: typography.family.medium,
    color: colors.textMuted
  },
  infoValue: {
    fontSize: 13,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
  },
  expandedContent: {
    marginTop: 4
  },
  bodySummary: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    lineHeight: 18
  },
  showMoreBtn: {
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  showMoreText: {
    fontSize: 12,
    fontFamily: typography.family.bold,
    color: colors.primaryDark
  }
});
