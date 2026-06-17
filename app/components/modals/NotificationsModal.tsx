import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, StyleSheet, TouchableOpacity, View, Image, Animated, Dimensions, ScrollView } from "react-native";
import { Text } from "@/components/CustomText";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "@/utils/constants";
import { authenticatedFetch } from "../../../utils/auth";
import { useAlert } from "../../context/AlertContext";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { AppNotification, NotificationPagination } from "../../types/models";

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const getNotificationCategory = (type: string): 'Alerts' | 'Tips' | 'Offers' => {
    const t = type.toLowerCase();
    if (t.includes('offer') || t.includes('promo') || t.includes('discount')) return 'Offers';
    if (t.includes('tip') || t.includes('advice') || t.includes('guide')) return 'Tips';
    return 'Alerts';
};

const NotificationsModal: React.FC<NotificationsModalProps> = ({
    isOpen,
    onClose
}) => {
    const { showAlert } = useAlert();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<NotificationPagination | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState<'Alerts' | 'Tips' | 'Offers'>('Alerts');

    const scrollX = React.useRef(new Animated.Value(0)).current;
    const scrollViewRef = React.useRef<ScrollView>(null);

    useEffect(() => {
        if (isOpen) {
            setPage(1);
            fetchNotifications(1, false);
        }
    }, [isOpen]);

    const handleTabPress = (index: number) => {
        scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
        setActiveTab(['Alerts', 'Tips', 'Offers'][index] as any);
    };

    const handleScrollEnd = (e: any) => {
        const offset = e.nativeEvent.contentOffset.x;
        const index = Math.round(offset / SCREEN_WIDTH);
        setActiveTab(['Alerts', 'Tips', 'Offers'][index] as any);
    };

    const fetchNotifications = async (pageToFetch: number, append: boolean) => {
        try {
            if (!append) setLoading(true);
            else setLoadingMore(true);

            const response = await authenticatedFetch(
                `${API_BASE_URL}/notifications?page=${pageToFetch}&perPage=10`
            );

            if (response.ok) {
                const result = await response.json();
                const fetchedNotifications = result.data?.notifications || [];
                const fetchedPagination = result.data?.pagination || null;

                if (append) {
                    setNotifications(prev => {
                        const existingIds = new Set(prev.map(n => n.id));
                        const uniqueNew = fetchedNotifications.filter((n: AppNotification) => !existingIds.has(n.id));
                        return [...prev, ...uniqueNew];
                    });
                } else {
                    setNotifications(fetchedNotifications);
                }
                setPagination(fetchedPagination);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchNotifications(1, false);
    };

    const handleLoadMore = () => {
        if (!loadingMore && pagination && page < pagination.totalPages) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotifications(nextPage, true);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/notifications/${id}`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            }
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    if (!isOpen) return null;

    const filteredNotifications = notifications.filter(n => getNotificationCategory(n.type) === activeTab);

    const tabCounts = {
        Alerts: notifications.filter(n => getNotificationCategory(n.type) === 'Alerts').length,
        Tips: notifications.filter(n => getNotificationCategory(n.type) === 'Tips').length,
        Offers: notifications.filter(n => getNotificationCategory(n.type) === 'Offers').length,
    };

    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            transparent={false}
            statusBarTranslucent={true}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>

                        <TouchableOpacity 
                            onPress={onClose} 
                            style={styles.backButton}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <Ionicons name="chevron-back" size={24} color="#416FD6" />
                            <Text style={styles.backButtonText}>Inbox</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Inbox</Text>
                    </View>

                    {/* Tab Bar */}
                    <View style={styles.tabBar}>
                        {(['Alerts', 'Tips', 'Offers'] as const).map((tab, index) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
                                onPress={() => handleTabPress(index)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                        {tab}
                                    </Text>
                                    {tabCounts[tab] > 0 && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{tabCounts[tab] > 9 ? '9+' : tabCounts[tab]}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                        {/* Animated Indicator */}
                        <Animated.View 
                            style={[
                                styles.activeIndicator, 
                                { 
                                    width: (SCREEN_WIDTH - 32) / 3, 
                                    transform: [{
                                        translateX: scrollX.interpolate({
                                            inputRange: [0, SCREEN_WIDTH, SCREEN_WIDTH * 2],
                                            outputRange: [16, (SCREEN_WIDTH - 32) / 3 + 16, ((SCREEN_WIDTH - 32) / 3) * 2 + 16],
                                        })
                                    }]
                                }
                            ]} 
                        />
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#416FD6" />
                        </View>
                    ) : (
                        <Animated.ScrollView
                            ref={scrollViewRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                                { useNativeDriver: false }
                            )}
                            onMomentumScrollEnd={handleScrollEnd}
                            scrollEventThrottle={16}
                        >
                            {(['Alerts', 'Tips', 'Offers'] as const).map((tabName) => (
                                <View key={tabName} style={{ width: SCREEN_WIDTH }}>
                                    <FlatList
                                        data={notifications.filter(n => getNotificationCategory(n.type) === tabName)}
                                        keyExtractor={(item) => item.id}
                                        refreshing={refreshing}
                                        onRefresh={handleRefresh}
                                        onEndReached={handleLoadMore}
                                        onEndReachedThreshold={0.5}
                                        contentContainerStyle={styles.listContent}
                                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                                        ListEmptyComponent={() => (
                                            <View style={styles.emptyContainer}>
                                                <Ionicons name="notifications-off-outline" size={64} color="#F3F4F6" />
                                                <Text style={styles.emptyText}>No {tabName.toLowerCase()} yet</Text>
                                            </View>
                                        )}
                                        ListFooterComponent={() => (
                                            loadingMore ? (
                                                <ActivityIndicator style={{ marginVertical: 20 }} color="#416FD6" />
                                            ) : null
                                        )}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={styles.notificationItem}
                                                onPress={() => !item.read && handleMarkAsRead(item.id)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.iconContainer}>
                                                    <View style={styles.typeIconSquare}>
                                                        <Ionicons
                                                            name={getNotificationIcon(item.type)}
                                                            size={24}
                                                            color="#416FD6"
                                                        />
                                                    </View>
                                                </View>
                                                <View style={styles.notificationContent}>
                                                    <Text style={styles.notificationTitle}>
                                                        {formatType(item.type)}
                                                    </Text>
                                                    <Text style={styles.notificationMessage}>
                                                        {item.message}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                    />
                                </View>
                            ))}
                        </Animated.ScrollView>
                    )}
                </SafeAreaView>
        </Modal>
    );
};

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'location_reached': return 'location-outline';
        case 'location_left': return 'exit-outline';
        case 'low_battery': return 'battery-dead-outline';
        case 'sos_alert': return 'warning-outline';
        case 'drive_detected': return 'car-outline';
        default: return 'notifications-outline';
    }
};

const formatType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    container: { 
        flex: 1, 
        backgroundColor: "#FFFFFF",
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
        backgroundColor: '#fff',
    },
    backButton: { 
        flexDirection: "row", 
        alignItems: "center",
        marginBottom: 20,
        marginLeft: -8, // Offset chevron padding
    },
    backButtonText: { fontSize: 16, color: "#416FD6", marginLeft: 4 },
    headerTitle: { 
        color: '#031C55',
        fontFamily: 'Inter',
        fontSize: 25,
        fontWeight: '700',
        lineHeight: 29,
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    activeTabItem: {},
    tabText: {
        fontSize: 16,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#1E3A8A',
        fontWeight: '700',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#1E3A8A',
        borderRadius: 2,
    },
    badge: {
        backgroundColor: '#FFB800', // Yellow/Orange from mockup
        borderRadius: 10,
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
    },
    badgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '700',
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingBottom: 40 },
    notificationItem: {
        backgroundColor: '#fff',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 16,
    },
    typeIconSquare: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationContent: { flex: 1 },
    notificationTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E3A8A', // Deep blue for title
        marginBottom: 2,
    },
    notificationMessage: { 
        fontSize: 14, 
        color: '#416FD6', // Lighter blue for description
        lineHeight: 18,
    },
    rightIconContainer: {
        marginLeft: 12,
    },
    userAvatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E3A8A',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 16,
    },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120 },
    emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 16, fontWeight: '500' },
});

export default NotificationsModal;
