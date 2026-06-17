import { API_BASE_URL } from '@/utils/constants';
import AppleLoginButton from '@/components/AppleLoginButton';
import AppleAuthService from '@/utils/appleAuth';
import GoogleAuthService from '@/utils/googleAuth';
import { flushPendingFcmToken, persistFcmToken, registerDeviceAndGetFCMToken } from '@/utils/permissions';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, TextInput } from '@/components/CustomText';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const LogInScreen = () => {
    const params = useLocalSearchParams<{ email?: string | string[]; message?: string | string[] }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const initialEmail = useMemo(() => {
        const value = params.email;
        return Array.isArray(value) ? value[0] ?? '' : value ?? '';
    }, [params.email]);

    const initialMessage = useMemo(() => {
        const value = params.message;
        return Array.isArray(value) ? value[0] : value;
    }, [params.message]);

    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(initialMessage ?? null);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [appleAvailable, setAppleAvailable] = useState(false);

    useEffect(() => {
        if (initialEmail) {
            setEmail(initialEmail);
        }
    }, [initialEmail]);

    useEffect(() => {
        if (initialMessage) {
            setInfoMessage(initialMessage);
        }
    }, [initialMessage]);

    useEffect(() => {
        GoogleAuthService.configure();
    }, []);

    useEffect(() => {
        // Only show Apple Sign-In on iOS
        AppleAuthentication.isAvailableAsync().then((available) => {
            setAppleAvailable(available && Platform.OS === 'ios');
        });
    }, []);

    // ... existing storeTokensAndNavigate ...
    const storeTokensAndNavigate = useCallback(
        async (token: string, refreshToken?: string) => {
            await AsyncStorage.setItem('authToken', token);
            if (refreshToken) {
                await AsyncStorage.setItem('refreshToken', refreshToken);
            }

            try {
                await flushPendingFcmToken();
                const fcmToken = await registerDeviceAndGetFCMToken();
                if (fcmToken) {
                    await persistFcmToken(fcmToken);
                }
            } catch (error) {
                console.error('Error registering FCM token after login:', error);
            }

            router.replace('/screens/MapScreen');
        },
        [router],
    );

    // ... existing handleLogin ...
    const handleLogin = useCallback(async () => {
        if (!email.trim()) {
            setErrorMessage('Please enter your email.');
            return;
        }

        if (!password.trim()) {
            setErrorMessage('Please enter your password.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        setInfoMessage(null);
        setNeedsVerification(false);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                if (data.plan !== undefined) {
                    await AsyncStorage.setItem('userPlan', data.plan ? JSON.stringify(data.plan) : 'null').catch(() => undefined);
                } else {
                    await AsyncStorage.setItem('userPlan', 'null').catch(() => undefined);
                }
                if (data.user) {
                    await AsyncStorage.setItem('user', JSON.stringify(data.user)).catch(() => undefined);
                }
                await storeTokensAndNavigate(data.token, data.refreshToken);
                setPassword('');
                return;
            }

            if (response.status === 403) {
                setNeedsVerification(true);
                setInfoMessage(data.message || 'Please verify your email before logging in.');
                return;
            }

            setErrorMessage(data.message || 'Invalid credentials. Please try again.');
        } catch (error) {
            console.error('Error logging in:', error);
            setErrorMessage('Unable to contact the server. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [email, password, storeTokensAndNavigate]);

    const navigateToVerification = useCallback(() => {
        if (!email.trim()) {
            setErrorMessage('Please enter your email first.');
            return;
        }

        router.push({ pathname: '/screens/VerifyEmailScreen', params: { email } });
    }, [email, router]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const user = await GoogleAuthService.signIn();

            if (user) {
                try {
                    await flushPendingFcmToken();
                    const fcmToken = await registerDeviceAndGetFCMToken();
                    if (fcmToken) {
                        await persistFcmToken(fcmToken);
                    }
                } catch (error) {
                    console.error('Error registering FCM token after login:', error);
                }
                router.replace('/screens/MapScreen');
            }
        } catch (error: any) {
            console.error('Google login error', error);
            setErrorMessage(error.message || 'An error occurred during Google sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setAppleLoading(true);
        setErrorMessage(null);
        try {
            const user = await AppleAuthService.signIn();
            if (user) {
                try {
                    await flushPendingFcmToken();
                    const fcmToken = await registerDeviceAndGetFCMToken();
                    if (fcmToken) {
                        await persistFcmToken(fcmToken);
                    }
                } catch (error) {
                    console.error('Error registering FCM token after Apple login:', error);
                }
                router.replace('/screens/MapScreen');
            }
        } catch (error: any) {
            console.error('Apple login error', error);
            setErrorMessage(error.message || 'An error occurred during Apple sign in');
        } finally {
            setAppleLoading(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.contentContainer,
                {
                    paddingTop: insets.top > 0 ? insets.top + 12 : 24,
                    paddingBottom: 16 + insets.bottom
                }
            ]}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.header}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo/image.png')}
                        style={styles.logoImage}
                        contentFit="contain"
                    />
                </View>
                <Text style={styles.tagline}>Stay connected with your family</Text>
                <LanguageSelector />
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                    />
                </View>

                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#9CA3AF"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!loading}
                    />
                </View>

                <TouchableOpacity onPress={() => router.push('/screens/ForgotPasswordRequest')}>
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>

                {needsVerification && (
                    <TouchableOpacity onPress={navigateToVerification}>
                        <Text style={[styles.forgotPasswordText, { marginTop: -12 }]}>Verify your email</Text>
                    </TouchableOpacity>
                )}

                {(infoMessage || errorMessage) && (
                    <Text style={[styles.messageText, errorMessage ? styles.errorText : styles.infoText]}>
                        {errorMessage || infoMessage}
                    </Text>
                )}
            </View>

            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={loading || !email.trim() || !password.trim()}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.loginButtonText}>Log In</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.orContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.orText}>or</Text>
                    <View style={styles.divider} />
                </View>

                <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                    <Image
                        source={require('../../assets/images/google-logo.png')}
                        style={styles.socialIcon}
                        contentFit="contain"
                    />
                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                {appleAvailable && (
                    <AppleLoginButton
                        onPress={handleAppleLogin}
                        loading={appleLoading}
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                    />
                )}

                <TouchableOpacity onPress={() => router.push('/screens/MobileLogIn')} style={{ marginTop: 12 }}>
                    <Text style={styles.phoneSignInText}>Sign in with phone number</Text>
                </TouchableOpacity>

                <View style={styles.signUpContainer}>
                    <Text style={styles.signUpText}>Don't have an account?</Text>
                    <TouchableOpacity onPress={() => router.push('/screens/RegisterScreen')}>
                        <Text style={styles.signUpLink}>Register</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        paddingHorizontal: 24,
        flexGrow: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 8,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 4,
    },
    logoImage: {
        width: 130,
        height: 130,
    },
    tagline: {
        fontSize: 15,
        color: '#1E3A8A',
        fontWeight: '500',
    },
    formContainer: {
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        color: '#1E3A8A',
        marginBottom: 4,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
        color: '#374151',
    },
    forgotPasswordText: {
        color: '#6366F1',
        fontWeight: '500',
        marginBottom: 10,
    },
    messageText: {
        textAlign: 'center',
        marginBottom: 12,
    },
    infoText: {
        color: '#059669',
    },
    errorText: {
        color: '#DC2626',
    },
    bottomContainer: {
        marginTop: 'auto',
    },
    loginButton: {
        backgroundColor: '#113C9C',
        borderRadius: 14,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    orText: {
        marginHorizontal: 12,
        color: '#9CA3AF',
        fontSize: 14,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 25,
        paddingVertical: 10,
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    socialIcon: {
        width: 24,
        height: 24,
    },
    socialButtonText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    phoneSignInText: {
        color: '#1E40AF',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 6,
        gap: 4
    },
    signUpText: {
        color: '#6B7280',
        fontSize: 16,
    },
    signUpLink: {
        color: '#1E40AF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    appleButton: {
        width: '100%',
        height: 50,
    },
});

export default LogInScreen;