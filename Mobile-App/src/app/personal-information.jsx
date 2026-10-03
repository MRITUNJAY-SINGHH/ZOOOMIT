import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Mail, Phone, User } from 'lucide-react-native';
import { PageHeader } from '../components/PageHeader';
import { colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { StorefrontAPI } from '../services/api';
import { haptics } from '../services/haptics';

export default function PersonalInformationScreen() {
  const { customer, refreshProfile } = useAuth();
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const phone = String(customer?.phone || '').replace(/\D/g, '').slice(-10);
  const formattedPhone = phone ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : 'Not available';

  const save = async () => {
    if (!name.trim()) { setMessage('Please enter your full name.'); haptics.notificationError(); return; }
    setSaving(true); setMessage('');
    try { await StorefrontAPI.updateProfile({ name: name.trim(), email: email.trim() }); await refreshProfile(); setMessage('Your personal information has been saved.'); haptics.notificationSuccess(); }
    catch (error) { setMessage(error.response?.data?.message || 'We could not save your changes.'); haptics.notificationError(); }
    finally { setSaving(false); }
  };

  return <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}><PageHeader title="Personal Information" /><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.intro}><View style={styles.introIcon}><User size={25} color={colors.black} /></View><Text style={styles.introTitle}>Your account details</Text><Text style={styles.introText}>Keep your information current so we can deliver every order smoothly.</Text></View>{Boolean(message) && <View style={styles.notice}><Text style={styles.noticeText}>{message}</Text></View>}<Field icon={<User size={18} color={colors.textSecondary} />} label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" /><Field icon={<Mail size={18} color={colors.textSecondary} />} label="Email address" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" /><Text style={styles.label}>Registered mobile number</Text><View style={[styles.field, styles.disabledField]}><Phone size={18} color={colors.textMuted} /><Text style={styles.disabledText}>{formattedPhone}</Text><View style={styles.verified}><Check size={12} color={colors.success} strokeWidth={3} /><Text style={styles.verifiedText}>Verified</Text></View></View><Text style={styles.note}>Your mobile number is secured with OTP verification.</Text><Pressable onPress={save} disabled={saving} style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]} accessibilityRole="button" accessibilityLabel="Save personal information">{saving ? <ActivityIndicator color={colors.black} /> : <Text style={styles.saveText}>Save changes</Text>}</Pressable></ScrollView></SafeAreaView>;
}

function Field({ icon, label, ...props }) { return <><Text style={styles.label}>{label}</Text><View style={styles.field}>{icon}<TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...props} /></View></>; }
const styles = StyleSheet.create({ safeArea:{flex:1,backgroundColor:colors.background},content:{padding:spacing.xl,paddingBottom:spacing.xxl},intro:{alignItems:'center',paddingVertical:spacing.lg,marginBottom:spacing.lg,backgroundColor:colors.primarySoft,borderRadius:20,borderWidth:1,borderColor:colors.primaryLight},introIcon:{width:52,height:52,borderRadius:26,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center',marginBottom:spacing.sm},introTitle:{fontSize:18,fontFamily:typography.family.bold,color:colors.textPrimary},introText:{fontSize:13,fontFamily:typography.family.regular,color:colors.textSecondary,textAlign:'center',lineHeight:19,marginTop:5,paddingHorizontal:spacing.lg},notice:{padding:12,borderRadius:12,backgroundColor:colors.primarySoft,marginBottom:spacing.md},noticeText:{fontSize:13,fontFamily:typography.family.medium,color:colors.textPrimary},label:{fontSize:13,fontFamily:typography.family.semibold,color:colors.textSecondary,marginBottom:7,marginTop:spacing.sm},field:{height:52,borderRadius:14,borderWidth:1,borderColor:colors.border,backgroundColor:colors.white,flexDirection:'row',alignItems:'center',paddingHorizontal:14,gap:10},input:{flex:1,fontSize:15,fontFamily:typography.family.medium,color:colors.textPrimary,height:'100%'},disabledField:{backgroundColor:colors.softBackground},disabledText:{flex:1,fontSize:15,fontFamily:typography.family.medium,color:colors.textSecondary},verified:{flexDirection:'row',alignItems:'center',gap:3,backgroundColor:colors.successSubtle,paddingHorizontal:7,paddingVertical:4,borderRadius:10},verifiedText:{fontSize:10,fontFamily:typography.family.bold,color:colors.success},note:{fontSize:11,fontFamily:typography.family.regular,color:colors.textMuted,marginTop:6},saveButton:{height:54,borderRadius:16,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center',marginTop:spacing.xl},saveButtonPressed:{backgroundColor:colors.primaryDark},saveText:{fontSize:16,fontFamily:typography.family.bold,color:colors.black} });
