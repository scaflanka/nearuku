import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from './CustomText';
import { Ionicons } from '@expo/vector-icons';
import { isExpoGo } from '../utils/mapHelper';

interface MapFallbackProps {
  style?: any;
}

export const MapFallback: React.FC<MapFallbackProps> = ({ style }) => {
  const isGo = isExpoGo();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="map-outline" size={40} color="#2563EB" />
        </View>
        <Text style={styles.title}>Map Unavailable</Text>
        <Text style={styles.message}>
          {isGo
            ? "This screen uses custom Mapbox maps which are not supported inside the standard Expo Go app."
            : "Mapbox Access Token is missing or invalid. Please configure a valid public token in your environment."}
        </Text>
        {isGo ? (
          <View style={styles.guideBox}>
            <Text style={styles.guideTitle}>How to fix this:</Text>
            <Text style={styles.guideText}>
              1. Build a local development client using:
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>npx expo run:android</Text>
            </View>
            <Text style={styles.guideText}>
              2. Install the generated app on your device/emulator.
            </Text>
          </View>
        ) : (
          <View style={styles.guideBox}>
            <Text style={styles.guideTitle}>How to fix this:</Text>
            <Text style={styles.guideText}>
              Create a <Text style={{ fontWeight: 'bold' }}>.env</Text> file in your project root and add:
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>EXPO_PUBLIC_MAPBOX_TOKEN=pk.your_token</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  guideBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 6,
  },
  codeBlock: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 8,
    marginVertical: 6,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '500',
  },
});
