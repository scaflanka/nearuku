import React from 'react';
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@/components/CustomText";
import { useLanguage } from '../app/context/LanguageContext';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preferred Language / اللغة المفضلة</Text>
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segment, language === 'en' && styles.segmentActive]}
          onPress={() => setLanguage('en')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, language === 'en' && styles.segmentTextActive]}>
            English
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, language === 'ar' && styles.segmentActive]}
          onPress={() => setLanguage('ar')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, language === 'ar' && styles.segmentTextActive]}>
            العربية
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '500',
    marginBottom: 4,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
    width: '100%',
    maxWidth: 320,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#113C9C',
    fontWeight: '600',
  },
});
