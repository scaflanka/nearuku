import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { AntDesign } from '@expo/vector-icons';

interface AppleLoginButtonProps {
  onPress: () => void;
  loading?: boolean;
  buttonType?: AppleAuthentication.AppleAuthenticationButtonType;
  buttonStyle?: AppleAuthentication.AppleAuthenticationButtonStyle;
  cornerRadius?: number;
  style?: ViewStyle;
}

const AppleLoginButton: React.FC<AppleLoginButtonProps> = ({
  onPress,
  loading = false,
  buttonType = AppleAuthentication.AppleAuthenticationButtonType.CONTINUE,
  buttonStyle = AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE,
  cornerRadius = 25,
  style,
}) => {
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, style]}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={buttonType}
          buttonStyle={buttonStyle}
          cornerRadius={cornerRadius}
          style={styles.appleButton}
          onPress={onPress}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color="#000"
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
    );
  }

  // Android Custom Button
  const isWhite = buttonStyle === AppleAuthentication.AppleAuthenticationButtonStyle.WHITE || 
                  buttonStyle === AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE;
  
  const getButtonText = () => {
    switch (buttonType) {
      case AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN:
        return 'Sign in with Apple';
      case AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP:
        return 'Sign up with Apple';
      case AppleAuthentication.AppleAuthenticationButtonType.CONTINUE:
      default:
        return 'Continue with Apple';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.androidButton,
        {
          borderRadius: cornerRadius,
          backgroundColor: isWhite ? '#FFFFFF' : '#000000',
          borderColor: buttonStyle === AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE ? '#000000' : 'transparent',
          borderWidth: buttonStyle === AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE ? 1 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={isWhite ? '#000000' : '#FFFFFF'} />
      ) : (
        <View style={styles.buttonContent}>
          <AntDesign 
            name="apple" 
            size={20} 
            color={isWhite ? '#000000' : '#FFFFFF'} 
            style={styles.icon}
          />
          <Text style={[styles.buttonText, { color: isWhite ? '#000000' : '#FFFFFF' }]}>
            {getButtonText()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    marginBottom: 12,
  },
  appleButton: {
    width: '100%',
    height: '100%',
  },
  androidButton: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
    marginTop: -2, // Adjust for icon centering
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppleLoginButton;
