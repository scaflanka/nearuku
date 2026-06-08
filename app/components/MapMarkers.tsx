import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { memo, useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Mapbox from "@rnmapbox/maps";

const COLORS = {
    primary: "#113C9C",
    accent: "#EF4444",
    white: "#FFFFFF",
    black: "#1A1A1A",
    gray: "#6B7280",
    lightGray: "#F3F4F6",
    success: "#22C55E",
};

interface MemberMarkerProps {
    memberId: string | null;
    coordinate: { latitude: number; longitude: number; battery?: string | null };
    displayName: string;
    avatarUrl: string;
    batteryLevel: number | null;
    speed: number | null;
    isCurrentUser: boolean;
    relation?: string | null;
    onLongPress?: () => void;
    onPress?: () => void;
}

export const MemberMarker: React.FC<MemberMarkerProps> = memo(({
    memberId,
    coordinate,
    displayName,
    avatarUrl,
    batteryLevel,
    speed,
    isCurrentUser,
    relation,
    onLongPress,
    onPress,
}) => {
    const [tracksView, setTracksView] = useState(true);

    // Keep tracksViewChanges true for MemberMarkers to ensure the internal TouchableOpacity 
    // stays interactive on some platforms (like Android) where static bitmaps don't handle children touches.
    // However, if performance becomes an issue, we could toggle it on interaction.
    // For now, let's keep it true to fix the long press issue.
    useEffect(() => {
        setTracksView(true);
    }, []);

    const getBatteryIconName = (val: number | null) => {
        if (val === null) return "battery-unknown";
        if (val >= 95) return "battery";
        const levels = [90, 80, 70, 60, 50, 40, 30, 20, 10];
        for (const l of levels) { if (val >= l - 5) return `battery-${l}`; }
        return "battery-10";
    };

    const batteryValue = batteryLevel ?? 100;
    const displayBattery = `${batteryValue}%`;
    const batteryColor = batteryValue < 20 ? '#EF4444' : (batteryValue < 50 ? '#F59E0B' : '#10B981');
    const accentColor = '#416FD6'; // Primary Light
    const speedKmh = Math.round((speed ?? 0));
    const markerTitle = `${speedKmh > 0 ? `${speedKmh} kmph` : displayName}`;
    const markerRef = useRef<any>(null);

    return (
        <Mapbox.PointAnnotation
            id={`member-${memberId}`}
            coordinate={[coordinate.longitude, coordinate.latitude]}
            anchor={{ x: 0.5, y: 1 }}
            title={markerTitle}
        >
            <TouchableOpacity
                activeOpacity={0.7}
                onLongPress={onLongPress}
                delayLongPress={200}
                onPress={() => {
                    if (onPress) onPress();
                    markerRef.current?.showCallout();
                }}
            >
                <View style={styles.markerContainer}>
                    <View style={styles.avatarCircle}>
                        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                    </View>
                    <View style={styles.pointerTriangle} />
                    {/* <View style={styles.batteryBadgeContainer}>
                        <View style={styles.batteryBadgeInner}>
                            <MaterialCommunityIcons
                                name={getBatteryIconName(batteryValue) as any}
                                size={25}
                                color={batteryColor}
                                style={styles.batteryIcon}
                            />
                            <Text style={[
                                styles.batteryText,
                                {
                                    fontSize: displayBattery.length >= 4 ? 5.5 : (displayBattery.length >= 3 ? 7.5 : 9),
                                    paddingHorizontal: displayBattery.length >= 2 ? 1 : 2
                                }
                            ]}>
                                {displayBattery}
                            </Text>
                        </View>
                    </View> */}
                </View>
            </TouchableOpacity>
        </Mapbox.PointAnnotation>
    );
});

interface LocationMarkerProps {
    coordinate: { latitude: number; longitude: number };
    title: string;
    description?: string;
    radius: number;
    placeType?: string | null;
    locationType?: string | null;
    isAssignedToCurrentUser?: boolean;
    speed?: number | null;
    onPress?: () => void;
}

const ASSIGNED_LOCATION_STROKE_COLOR = "rgba(79, 53, 155, 0.6)";
const ASSIGNED_LOCATION_FILL_COLOR = "rgba(79, 53, 155, 0.18)";

export const LocationMarker: React.FC<LocationMarkerProps> = ({
    coordinate,
    title,
    description,
    radius,
    placeType,
    locationType,
    isAssignedToCurrentUser,
    speed,
    onPress,
}) => {
    const circleStrokeColor = isAssignedToCurrentUser
        ? ASSIGNED_LOCATION_STROKE_COLOR
        : "rgba(239, 68, 68, 0.6)";
    const circleFillColor = isAssignedToCurrentUser
        ? ASSIGNED_LOCATION_FILL_COLOR
        : "rgba(239, 68, 68, 0.15)";

    return (
        <>
            {/* <Circle
                center={coordinate}
                radius={radius}
                strokeColor={circleStrokeColor}
                fillColor={circleFillColor}
                strokeWidth={2}
            /> */}

            {/* Helper to pick icon based on placeType */}
            {(() => {
                const getIconName = (type?: string | null) => {
                    const normalized = type?.trim().toLowerCase();
                    switch (normalized) {
                        case 'home': return 'home';
                        case 'office': return 'briefcase';
                        case 'school': return 'school';
                        case 'gym': return 'fitness';
                        case 'hotel': return 'bed';
                        case 'ground': return 'map';
                        case 'business': return 'business';
                        case 'center': return 'location';
                        default: return 'location-sharp';

                     
                    }
                };

                const iconName = getIconName(locationType || placeType);
                const accentColor = '#113C9C'; // Location accent usually slightly different or same Primary

                return (
                    <Mapbox.PointAnnotation
                        id={`location-${coordinate.longitude}-${coordinate.latitude}`}
                        coordinate={[coordinate.longitude, coordinate.latitude]}
                        title={`${title}${speed != null && Math.round(speed) > 0 ? ` - ${Math.round(speed)} kmph` : ''}`}
                        anchor={{ x: 0.5, y: 1 }}
                        onSelected={onPress}
                    >
                        <View style={styles.markerContainer}>
                            <View style={[styles.avatarCircle, { backgroundColor: '#031C55' }]}>
                                <Ionicons
                                    name={iconName as any}
                                    size={24}
                                    color={'#416FD6'}
                                />
                            </View>
                            <View style={styles.pointerTriangle} />
                        </View>
                    </Mapbox.PointAnnotation>
                );
            })()}
        </>
    );
};

const styles = StyleSheet.create({
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: '#416FD6', // Primary Light
        backgroundColor: '#031C55', // Primary Dark
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        // Shadow for premium look
        shadowColor: "rgba(0, 0, 0, 0.10)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    pointerTriangle: {
        width: 10,
        height: 6,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#031C55', // Match fill
        marginTop: -1,
    },
    batteryBadgeContainer: {
        position: 'absolute',
        top: -6,
        right: -5,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    batteryBadgeInner: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    batteryIcon: {
        margin: 0,
        transform: [{ rotate: '90deg' }],
    },
    batteryText: {
        position: 'absolute',
        fontWeight: '900',
        color: COLORS.black,
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: 2,
    },
});

