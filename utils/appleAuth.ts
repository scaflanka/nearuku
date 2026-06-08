import { storeTokens } from './auth';
import { API_BASE_URL } from './constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AppleAuthService - A singleton service to handle Apple Authentication
 */
const AppleAuthService = {
    /**
     * ✅ Perform Apple Sign-In
     * Handles the Apple prompt and backend verification
     * @returns {Promise<Object|null>} The authenticated user object or null if cancelled
     */
    signIn: async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            console.log('✅ Apple sign-in successful. Token obtained.');

            // Backend Verification (Secure ID Token Exchange)
            const response = await fetch(`${API_BASE_URL}/auth/apple`, {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identityToken: credential.identityToken,
                    authorizationCode: credential.authorizationCode,
                    fullName: credential.fullName,
                    email: credential.email,
                    user: credential.user,
                }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Save tokens to local storage
                await storeTokens(data.token, data.refreshToken);
                
                // Store user data if returned by backend
                if (data.user) {
                    await AsyncStorage.setItem('user', JSON.stringify(data.user));
                }
                if (data.plan !== undefined) {
                    await AsyncStorage.setItem('userPlan', data.plan ? JSON.stringify(data.plan) : 'null').catch(() => undefined);
                } else {
                    await AsyncStorage.setItem('userPlan', 'null').catch(() => undefined);
                }

                console.log('👤 User authenticated via Apple.');
                return data.user || { success: true };
            } else {
                throw new Error(data.message || 'Apple Sign In failed on server.');
            }
        } catch (error: any) {
            if (error.code === 'ERR_REQUEST_CANCELED') {
                console.log('Apple sign-in cancelled by user');
                return null;
            }
            console.error('Error during Apple login process:', error);
            throw error;
        }
    }
};

export default AppleAuthService;
