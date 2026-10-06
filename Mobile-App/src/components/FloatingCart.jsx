import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, AccessibilityInfo, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight, Package } from 'lucide-react-native';
import { colors, typography } from '../constants/theme';
import { useCart } from '../context/CartContext';

export const cartImage = p => p?.featuredImage || p?.galleryImages?.[0] || p?.images?.[0]?.url || p?.image;
export const cartKey = i => String(i._id || `${i.product?._id || i.product}:${i.variant?._id || i.variant || 'base'}`);
export function captureCartSource(ref, product) {
  return new Promise(resolve => {
    let settled = false;
    const done = rect => { if (!settled) { settled = true; resolve({ image: cartImage(product), rect }); } };
    if (!ref?.current?.measureInWindow) { done(null); return; }
    ref.current.measureInWindow((x, y, width, height) => done(width > 0 && height > 0 ? { x, y, width, height } : null));
    setTimeout(() => done(null), 120);
  });
}
function CartThumb({ item, index, feedback, reducedMotion }) {
  const slide = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!feedback || feedback.itemKey !== cartKey(item) || reducedMotion) return;
    slide.setValue(0);
    const animation = Animated.spring(slide, { toValue: 1, damping: 20, stiffness: 210, mass: 0.7, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [feedback?.id, reducedMotion]);
  const uri = cartImage(item.variant) || cartImage(item.product);
  return <Animated.View style={[styles.thumb, { marginLeft: index ? -8 : 0, zIndex: 4 - index, opacity: slide, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }, { scale: slide.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>{uri ? <Image source={{ uri }} style={styles.photo} contentFit="contain" /> : <Package size={21} color={colors.textSecondary} />}</Animated.View>;
}
// Mount inside each browsing surface so native Modal product sheets can animate too.
export function FloatingCart({ bottom = 20, visible = true }) {
  const { cart, cartFeedback } = useCart();
  const { width } = useWindowDimensions();
  const target = useRef(null);
  const root = useRef(null);
  const seen = useRef(cartFeedback?.id);
  const mounted = useRef(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [flight, setFlight] = useState(null);
  const travel = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const line = useRef(new Animated.Value(1)).current;
  const positive = (cart?.items || []).filter(i => Number(i.qty ?? i.quantity ?? 0) > 0);
  // Count cart entries, not grams/kg as though they were numbers of products.
  const count = positive.length;
  const active = positive.find(i => cartKey(i) === cartFeedback?.itemKey);
  const thumbnails = (active ? [active, ...positive.filter(i => cartKey(i) !== cartKey(active))] : positive).slice(0, 3);
  useEffect(() => {
    mounted.current = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted.current) setReducedMotion(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { mounted.current = false; subscription.remove(); travel.stopAnimation(); pulse.stopAnimation(); line.stopAnimation(); };
  }, []);
  useEffect(() => {
    Animated.timing(appear, { toValue: visible && count ? 1 : 0, duration: reducedMotion ? 0 : 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [visible, Boolean(count), reducedMotion]);
  useEffect(() => {
    if (!visible || !count || !cartFeedback || seen.current === cartFeedback.id) return;
    seen.current = cartFeedback.id;
    const feedback = cartFeedback;
    const settle = () => {
      if (!mounted.current) return;
      setFlight(null);
      if (reducedMotion) return;
      pulse.setValue(0.97);
      line.setValue(0);
      Animated.parallel([
        Animated.spring(pulse, { toValue: 1, damping: 14, stiffness: 260, mass: 0.7, useNativeDriver: true }),
        Animated.timing(line, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ]).start();
    };
    const timer = setTimeout(() => {
      if (!mounted.current) return;
      if (reducedMotion || !feedback.rect || !feedback.image) { settle(); return; }
      root.current?.measureInWindow((rx, ry) => {
        target.current?.measureInWindow((tx, ty, tw, th) => {
          if (!mounted.current) return;
          const r = feedback.rect;
          const start = { x: r.x + r.width / 2 - rx - 25, y: r.y + r.height / 2 - ry - 25 };
          const end = { x: tx + tw / 2 - rx - 25, y: ty + th / 2 - ry - 25 };
          travel.stopAnimation(); travel.setValue(0);
          setFlight({ image: feedback.image, start, end });
          Animated.timing(travel, { toValue: 1, duration: 620, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(({ finished }) => { if (finished) settle(); });
        });
      });
    }, 40);
    return () => { clearTimeout(timer); travel.stopAnimation(); setFlight(null); };
  }, [cartFeedback?.id, visible, Boolean(count), reducedMotion]);
  if (!visible || !count) return null;
  const pillWidth = Math.min(248, width - 32);
  return <View ref={root} collapsable={false} style={styles.overlay} pointerEvents="box-none">
    <Animated.View style={[styles.position, { bottom, opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }, { scale: pulse }] }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`View cart, ${count} ${count === 1 ? 'item' : 'items'}`} onPress={() => router.push('/(tabs)/cart')} style={({ pressed }) => [styles.pill, { width: pillWidth }, pressed && { opacity: 0.92 }]}>
        <View style={styles.copy} accessible accessibilityLiveRegion="polite"><Text style={styles.title}>CART</Text><Text style={styles.count}>{count} {count === 1 ? 'ITEM' : 'ITEMS'}</Text></View>
        <View ref={target} collapsable={false} style={styles.thumbnails}>{thumbnails.map((item, index) => <CartThumb key={cartKey(item)} item={item} index={index} feedback={cartFeedback} reducedMotion={reducedMotion} />)}</View>
        <ChevronRight size={20} color={colors.textPrimary} strokeWidth={2.4} />
        <View style={styles.track}><Animated.View style={[styles.line, { transform: [{ scaleX: line }] }]} /></View>
      </Pressable>
    </Animated.View>
    {flight && <Animated.View pointerEvents="none" style={[styles.flying, { opacity: travel.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }), transform: [{ translateX: travel.interpolate({ inputRange: [0, 1], outputRange: [flight.start.x, flight.end.x] }) }, { translateY: travel.interpolate({ inputRange: [0, 0.45, 1], outputRange: [flight.start.y, Math.min(flight.start.y, flight.end.y) - 65, flight.end.y] }) }, { scale: travel.interpolate({ inputRange: [0, 1], outputRange: [1, 0.58] }) }] }]}><Image source={{ uri: flight.image }} style={styles.photo} contentFit="contain" /></Animated.View>}
  </View>;
}
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1100 },
  position: { position: 'absolute', alignSelf: 'center' },
  pill: { height: 64, borderRadius: 17, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 5, gap: 9, shadowColor: '#735B09', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 5 }, shadowRadius: 12, elevation: 8 },
  copy: { flex: 1 }, title: { fontFamily: typography.family.bold, fontSize: 16, fontWeight: '700', lineHeight: 19, color: colors.textPrimary }, count: { fontFamily: typography.family.medium, fontSize: 10, lineHeight: 15, color: '#473B14' },
  thumbnails: { flexDirection: 'row', alignItems: 'center', height: 36 }, thumb: { width: 34, height: 36, padding: 2, borderRadius: 7, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FFF8DA', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, photo: { width: '100%', height: '100%' },
  track: { position: 'absolute', bottom: 8, left: 14, right: 14, height: 3, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden' }, line: { height: 3, backgroundColor: '#FFF', borderRadius: 2 },
  flying: { position: 'absolute', left: 0, top: 0, width: 50, height: 50, padding: 4, borderRadius: 12, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 12 }
});
