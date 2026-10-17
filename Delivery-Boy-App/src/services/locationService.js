import * as Location from 'expo-location';
import { Linking, Platform, Alert } from 'react-native';

export const locationService = {
  /**
   * Request foreground location permission and retrieve current location
   */
  async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (e) {
      console.warn('[LocationService] Error fetching location:', e.message);
      return null;
    }
  },

  /**
   * Calculate straight-line distance (haversine formula) in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  },

  /**
   * Free navigation trigger: Opens Google Maps or Apple Maps without any paid API key
   */
  async openTurnByTurnNavigation({ latitude, longitude, label = 'Destination', address = '' }) {
    if (!latitude && !longitude && !address) {
      Alert.alert('Navigation Error', 'Destination coordinates or address not available.');
      return;
    }

    const encodedLabel = encodeURIComponent(label);
    const encodedAddress = encodeURIComponent(address);

    let url = '';

    if (Platform.OS === 'ios') {
      if (latitude && longitude) {
        url = `maps://?daddr=${latitude},${longitude}&q=${encodedLabel}`;
      } else {
        url = `maps://?daddr=${encodedAddress}`;
      }
    } else {
      // Android / Web / Default: Google Maps directions URL
      if (latitude && longitude) {
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      } else {
        url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
      }
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Universal web fallback
        const fallbackUrl = latitude && longitude
          ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
          : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
        await Linking.openURL(fallbackUrl);
      }
    } catch (e) {
      Alert.alert('Unable to Open Maps', 'Please check if Google Maps or Apple Maps is installed on your device.');
    }
  }
};
