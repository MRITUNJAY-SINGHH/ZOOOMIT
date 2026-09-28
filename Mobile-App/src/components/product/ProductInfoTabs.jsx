import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, typography } from '../../constants/theme';
import { haptics } from '../../services/haptics';

const TABS = [
  { id: 'highlights', label: 'Highlights' },
  { id: 'description', label: 'Description' },
  { id: 'health', label: 'Health benefits' },
  { id: 'storage', label: 'Storage' }
];

export const ProductInfoTabs = ({ product }) => {
  const [activeTab, setActiveTab] = useState('highlights');

  if (!product) return null;

  const highlights = (product.highlights && product.highlights.length > 0)
    ? product.highlights
    : [
        { key: 'Included In The Box', value: `1 x ${product.name}` },
        { key: 'Pack Size', value: product.sellingUnit || product.baseUnit || 'Standard' },
        { key: 'Packaging Type', value: 'Fresh-Seal Hygiene Pack' },
        { key: 'Special Feature', value: 'Farm Sourced & Hand-Graded' }
      ];

  const renderContent = () => {
    switch (activeTab) {
      case 'highlights':
        return (
          <View style={styles.attributesTable}>
            {highlights.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  idx < highlights.length - 1 && styles.tableRowBorder
                ]}
              >
                <Text style={styles.tableKey}>{item.key}</Text>
                <Text style={styles.tableValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        );

      case 'description':
        return (
          <View style={styles.tabTextWrap}>
            <Text style={styles.tabBodyText}>
              {product.description || 'Farm-fresh quality produce hand-selected by experts and delivered straight to your doorstep.'}
            </Text>
            {product.brand && (
              <Text style={styles.tabSubText}>Brand: {product.brand}</Text>
            )}
          </View>
        );

      case 'health':
        return (
          <View style={styles.tabTextWrap}>
            <Text style={styles.tabBodyText}>
              {product.healthBenefits || 'Rich in essential dietary fiber, natural vitamins, minerals, and protective antioxidants for active daily nourishment.'}
            </Text>
          </View>
        );

      case 'storage':
        return (
          <View style={styles.tabTextWrap}>
            <Text style={styles.tabBodyText}>
              {product.storageInfo || 'Store in a cool, well-ventilated, dry place away from direct heat and moisture.'}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Horizontal Tabs Header */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => {
                haptics.selection();
                setActiveTab(tab.id);
              }}
              style={[
                styles.tabPill,
                isActive ? styles.tabPillActive : styles.tabPillInactive
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Tab Body Box */}
      <View style={styles.tabBodyContainer}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1
  },
  tabPillInactive: {
    backgroundColor: colors.white,
    borderColor: colors.borderLight
  },
  tabPillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  tabLabelActive: {
    color: colors.white,
    fontFamily: typography.family.bold
  },
  tabBodyContainer: {
    marginTop: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14
  },
  attributesTable: {
    flexDirection: 'column'
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  tableKey: {
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textSecondary,
    flex: 1
  },
  tableValue: {
    fontSize: 13,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right'
  },
  tabTextWrap: {
    paddingVertical: 4
  },
  tabBodyText: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textPrimary,
    lineHeight: 20
  },
  tabSubText: {
    fontSize: 12,
    fontFamily: typography.family.medium,
    color: colors.textSecondary,
    marginTop: 8
  }
});
