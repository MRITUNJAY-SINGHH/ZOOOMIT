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
  const slot = useRef(new Animated.Value(index * 17)).current;
  useEffect(() => {
    const animation = Animated.spring(slot, { toValue: index * 17, damping: 22, stiffness: 220, mass: 0.7, useNativeDriver: true, isInteraction: false });
    if (reducedMotion) slot.setValue(index * 17); else animation.start();
    return () => animation.stop();
  }, [index, reducedMotion]);
  useEffect(() => {
    if (reducedMotion) { slide.setValue(1); return; }
    if (!feedback || feedback.itemKey !== cartKey(item)) return;
    slide.setValue(0);
    const animation = Animated.spring(slide, { toValue: 1, damping: 24, stiffness: 190, mass: 0.8, useNativeDriver: true, isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [feedback?.id, reducedMotion]);
  const uri = cartImage(item.variant) || cartImage(item.product);
  return <Animated.View style={[styles.thumb, { position: 'absolute', left: 0, zIndex: 4 - index, opacity: slide, transform: [{ translateX: Animated.add(slot, slide.interpolate({ inputRange: [0, 1], outputRange: [16, 0] })) }, { scale: slide.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>{uri ? <Image source={{ uri }} style={styles.photo} contentFit="contain" /> : <Package size={21} color={colors.textSecondary} />}</Animated.View>;
}
// Mount inside each browsing surface so native Modal product sheets can animate too.
export function FloatingCart({ bottom = 20, visible = true, onOpenCart }) {
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
  const [rendered, setRendered] = useState(false);
  const lastItems = useRef([]);
  const positive = (cart?.items || []).filter(i => Number(i.qty ?? i.quantity ?? 0) > 0);
  // Count cart entries, not grams/kg as though they were numbers of products.
  const count = positive.length;
  if (count) lastItems.current = positive;
  const displayItems = count ? positive : lastItems.current;
  const displayCount = displayItems.length;
  const active = displayItems.find(i => cartKey(i) === cartFeedback?.itemKey);
  const thumbnails = (active ? [active, ...displayItems.filter(i => cartKey(i) !== cartKey(active))] : displayItems).slice(0, 3);
  useEffect(() => {
    mounted.current = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted.current) setReducedMotion(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { mounted.current = false; subscription.remove(); travel.stopAnimation(); pulse.stopAnimation(); line.stopAnimation(); appear.stopAnimation(); };
  }, []);
  useEffect(() => {
    const show = visible && count > 0;
    if (show) setRendered(true);
    const animation = Animated.timing(appear, { toValue: show ? 1 : 0, duration: reducedMotion ? 0 : show ? 340 : 220, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false });
    animation.start(({ finished }) => { if (finished && !show && mounted.current) setRendered(false); });
    return () => animation.stop();
  }, [visible, Boolean(count), reducedMotion]);
  useEffect(() => {
    if (!visible || !count || !cartFeedback || seen.current === cartFeedback.id) return;
    seen.current = cartFeedback.id;
    const feedback = cartFeedback;
    const settle = () => {
      if (!mounted.current) return;
      setFlight(null);
      if (reducedMotion) return;
      pulse.stopAnimation(); line.stopAnimation();
      pulse.setValue(0.985);
      line.setValue(0);
      Animated.parallel([
        Animated.spring(pulse, { toValue: 1, damping: 24, stiffness: 220, mass: 0.8, useNativeDriver: true, isInteraction: false }),
        Animated.timing(line, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false })
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
          Animated.timing(travel, { toValue: 1, duration: 560, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }).start(({ finished }) => { if (finished) settle(); });
        });
      });
    }, 40);
    return () => { clearTimeout(timer); travel.stopAnimation(); setFlight(null); };
  }, [cartFeedback?.id, visible, Boolean(count), reducedMotion]);
  if (!rendered && !(visible && count)) return null;
  const pillWidth = Math.min(216 * 0.8, width - 40);
  return <View ref={root} collapsable={false} style={styles.overlay} pointerEvents="box-none">
    <Animated.View pointerEvents={visible && count ? 'auto' : 'none'} style={[styles.position, { bottom, opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }, { scale: pulse }] }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`View cart, ${displayCount} ${displayCount === 1 ? 'item' : 'items'}`} onPress={() => { onOpenCart?.(); router.push('/(tabs)/cart'); }} style={({ pressed }) => [styles.pill, { width: pillWidth }, pressed && { opacity: 0.92 }]}>
        <View style={styles.copy} accessible accessibilityLiveRegion="polite"><Text style={styles.title}>CART</Text><Text numberOfLines={1} adjustsFontSizeToFit style={styles.count}>{displayCount} {displayCount === 1 ? 'ITEM' : 'ITEMS'}</Text></View>
        <View ref={target} collapsable={false} style={[styles.thumbnails, { width: 26 + Math.max(0, thumbnails.length - 1) * 17 }]}>{thumbnails.map((item, index) => <CartThumb key={cartKey(item)} item={item} index={index} feedback={cartFeedback} reducedMotion={reducedMotion} />)}</View>
        <ChevronRight size={18} color={colors.textPrimary} strokeWidth={2.4} />
        <View style={styles.track}><Animated.View style={[styles.line, { transform: [{ scaleX: line }] }]} /></View>
      </Pressable>
    </Animated.View>
    {flight && <Animated.View pointerEvents="none" style={[styles.flying, { opacity: travel.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }), transform: [{ translateX: travel.interpolate({ inputRange: [0, 1], outputRange: [flight.start.x, flight.end.x] }) }, { translateY: travel.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [flight.start.y, flight.start.y * 0.75 + flight.end.y * 0.25 - 49, (flight.start.y + flight.end.y) / 2 - 65, flight.start.y * 0.25 + flight.end.y * 0.75 - 49, flight.end.y] }) }, { scale: travel.interpolate({ inputRange: [0, 1], outputRange: [1, 0.58] }) }] }]}><Image source={{ uri: flight.image }} style={styles.photo} contentFit="contain" /></Animated.View>}
  </View>;
}
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1100 },
  position: { position: 'absolute', alignSelf: 'center' },
  pill: { height: 56, borderRadius: 17, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 4, gap: 5, borderWidth: 1, borderColor: '#E6BA26', shadowColor: '#735B09', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 5 }, shadowRadius: 12, elevation: 8 },
  copy: { flex: 1, minWidth: 0 }, title: { fontFamily: typography.family.bold, fontSize: 13, fontWeight: '700', lineHeight: 17, color: colors.textPrimary }, count: { fontFamily: typography.family.medium, fontSize: 10, lineHeight: 15, color: '#473B14' },
  thumbnails: { flexDirection: 'row', alignItems: 'center', height: 32 }, thumb: { width: 26, height: 30, padding: 2, borderRadius: 7, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0DA91', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, photo: { width: '100%', height: '100%' },
  track: { position: 'absolute', bottom: 6, left: 12, right: 12, height: 3, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden' }, line: { height: 3, backgroundColor: '#FFF', borderRadius: 2 },
  flying: { position: 'absolute', left: 0, top: 0, width: 50, height: 50, padding: 4, borderRadius: 12, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 12 }
});
