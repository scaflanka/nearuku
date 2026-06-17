import { Ionicons } from "@expo/vector-icons";
import React, { memo, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/CustomText";
import Svg, { Path, Defs, ClipPath, Image as SvgImage, G } from "react-native-svg";
import HomePlaceIcon from "./icons/HomePlaceIcon";
import OfficePlaceIcon from "./icons/OfficePlaceIcon";
import SchoolPlaceIcon from "./icons/SchoolPlaceIcon";
import GymPlaceIcon from "./icons/GymPlaceIcon";

const COLORS = {
    primary: "#031C55", // Primary Dark
    primaryLight: "#416FD6",
    warning: "#FBBC05",
    danger: "#EF4444",
    white: "#FFFFFF",
    success: "#22C55E",
};

const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
};

interface MemberMarkerProps {
    memberId: string | null;
    x: number;
    y: number;
    displayName: string;
    avatarUrl?: string | null;
    speed?: number;
    isCurrentUser?: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
}

export const MemberMarker: React.FC<MemberMarkerProps> = memo(({
    x,
    y,
    displayName,
    avatarUrl,
    speed,
    isCurrentUser,
    onPress,
    onLongPress,
}) => {
    const [showSpeed, setShowSpeed] = useState(false);
    const speedKmh = Math.round((speed ?? 0));

    const renderMarkerContent = () => {
        if (isCurrentUser) {
            return (
                <View style={styles.markerContainer}>
                    <Svg width={82} height={82} viewBox="0 0 82 82" fill="none">
                        <Defs>
                            <ClipPath id="clip-user">
                                <Path d="M11 42.2698C11 57.0325 22.9675 69 37.7302 69H45.2698C59.4802 69 71 57.4802 71 43.2698V39C71 22.4315 57.5685 9 41 9C24.4315 9 11 22.4315 11 39V42.2698Z" />
                            </ClipPath>
                        </Defs>
                        <Path d="M11 42.2698C11 57.0325 22.9675 69 37.7302 69H45.2698C59.4802 69 71 57.4802 71 43.2698V39C71 22.4315 57.5685 9 41 9C24.4315 9 11 22.4315 11 39V42.2698Z" fill="#031C55" />
                        {avatarUrl && (
                            <G clipPath="url(#clip-user)">
                                <SvgImage
                                    href={avatarUrl}
                                    width={60}
                                    height={60}
                                    x={11}
                                    y={9}
                                    preserveAspectRatio="xMidYMid slice"
                                />
                            </G>
                        )}
                        <Path d="M41 10.5C56.7401 10.5 69.5 23.2599 69.5 39V43.2695C69.5 56.6515 58.6515 67.5 45.2695 67.5H37.7305C23.7962 67.5 12.5 56.2038 12.5 42.2695V39C12.5 23.2599 25.2599 10.5 41 10.5Z" stroke="#416FD6" strokeWidth={3} />
                    </Svg>
                    {!avatarUrl && (
                        <View style={[styles.overlayCenter, { height: 75 }]}>
                            <Text style={styles.initialsTextLarge}>{getInitials(displayName)}</Text>
                        </View>
                    )}
                    <View style={[styles.pointerTriangle, { borderTopColor: '#416FD6', marginTop: -14 }]} />
                </View>
            );
        }

        return (
            <View style={styles.markerContainer}>
                <Svg width={74} height={75} viewBox="0 0 74 75" fill="none">
                    <Defs>
                        <ClipPath id="clip">
                            <Path d="M11 38.8338C11 51.6282 21.3718 62 34.1662 62H40.7005C53.0162 62 63 52.0162 63 39.7005V35C63 20.6406 51.3594 9 37 9C22.6406 9 11 20.6406 11 35V38.8338Z" />
                        </ClipPath>
                    </Defs>
                    <Path d="M11 38.8338C11 51.6282 21.3718 62 34.1662 62H40.7005C53.0162 62 63 52.0162 63 39.7005V35C63 20.6406 51.3594 9 37 9C22.6406 9 11 20.6406 11 35V38.8338Z" fill="#031C55" />
                    {avatarUrl && (
                        <G clipPath="url(#clip)">
                            <SvgImage
                                href={avatarUrl}
                                width={52}
                                height={53}
                                x={11}
                                y={9}
                                preserveAspectRatio="xMidYMid slice"
                            />
                        </G>
                    )}
                    <Path d="M37 10C50.8071 10 62 21.1929 62 35V39.7002C62 51.4636 52.4636 61 40.7002 61H34.166C21.9241 60.9999 12.0001 51.0759 12 38.834V35C12 21.1929 23.1929 10 37 10Z" stroke="#FBBC05" strokeWidth={2} />
                </Svg>
                {!avatarUrl && (
                    <View style={[styles.overlayCenter, { height: 65 }]}>
                        <Text style={styles.initialsTextSmall}>{getInitials(displayName)}</Text>
                    </View>
                )}
                <View style={[styles.pointerTriangle, { borderTopColor: '#FBBC05', marginTop: -14 }]} />
            </View>
        );
    };

    return (
        <View style={[styles.markerWrapper, { left: x, top: y, zIndex: isCurrentUser ? 10 : 5 }]} pointerEvents="box-none">
            <TouchableOpacity
                activeOpacity={1}
                onLongPress={onLongPress}
                delayLongPress={200}
                onPress={() => {
                    setShowSpeed(!showSpeed);
                    if (onPress) onPress();
                }}
            >
                {showSpeed && (
                    <View style={styles.speedCalloutContainer}>
                        <View style={styles.speedCalloutContent}>
                            <Image 
                                source={require('./icons/car.png')} 
                                style={{ width: 22, height: 22, backgroundColor: 'transparent' }} 
                                resizeMode="contain"
                            />
                            <Text style={styles.speedText}>{speedKmh}km/h</Text>
                        </View>
                    </View>
                )}
                {renderMarkerContent()}
            </TouchableOpacity>
        </View>
    );
});

interface LocationMarkerProps {
    x: number;
    y: number;
    title: string;
    description?: string;
    placeType?: string | null;
    locationType?: string | null;
    isAssignedToCurrentUser?: boolean;
    onPress?: () => void;
}

export const LocationMarker: React.FC<LocationMarkerProps> = memo(({
    x,
    y,
    title,
    placeType,
    locationType,
    isAssignedToCurrentUser,
    onPress,
}) => {
    const getIconName = (type: string | null | undefined) => {
        const t = type?.toLowerCase();
        switch (t) {
            case 'home': return 'home';
            case 'office': return 'briefcase';
            case 'school': return 'school';
            case 'gym': return 'fitness';
            case 'hospital': return 'medical';
            case 'park': return 'leaf';
            case 'business': return 'business';
            default: return 'location-sharp';
        }
    };

    const iconName = getIconName(locationType || placeType);

    return (
        <View style={[styles.markerWrapper, styles.otherMarkerWrapper, { left: x, top: y, zIndex: isAssignedToCurrentUser ? 2 : 1 }]} pointerEvents="box-none">
            <TouchableOpacity onPress={onPress}>
                <View style={styles.markerContainer}>
                    <Svg width={74} height={75} viewBox="0 0 74 75" fill="none">
                        <Path d="M11 38.8338C11 51.6282 21.3718 62 34.1662 62H40.7005C53.0162 62 63 52.0162 63 39.7005V35C63 20.6406 51.3594 9 37 9C22.6406 9 11 20.6406 11 35V38.8338Z" fill="#031C55" />
                        <Path d="M37 10C50.8071 10 62 21.1929 62 35V39.7002C62 51.4636 52.4636 61 40.7002 61H34.166C21.9241 60.9999 12.0001 51.0759 12 38.834V35C12 21.1929 23.1929 10 37 10Z" stroke="#FBBC05" strokeWidth={2} />
                    </Svg>
                    <View style={[styles.overlayCenter, { height: 65 }]}>
                        {(() => {
                            const t = (locationType || placeType)?.toLowerCase();
                            switch(t) {
                                case 'home': return <HomePlaceIcon color={COLORS.warning} width={20} height={22.5} />;
                                case 'office': return <OfficePlaceIcon color={COLORS.warning} width={22.5} height={20} />;
                                case 'school': return <SchoolPlaceIcon color={COLORS.warning} width={22.5} height={16.8} />;
                                case 'gym': return <GymPlaceIcon color={COLORS.warning} width={22.5} height={21.3} />;
                                default: return <Ionicons name={iconName as any} size={20} color={COLORS.warning} />;
                            }
                        })()}
                    </View>
                    <View style={[styles.pointerTriangle, { borderTopColor: '#FBBC05', marginTop: -14 }]} />
                </View>
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    markerWrapper: {
        position: 'absolute',
        transform: [{ translateX: -41 }, { translateY: -71 }], // Default for 82x82
    },
    otherMarkerWrapper: {
        transform: [{ translateX: -37 }, { translateY: -64 }], // For 74x75
    },
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlayCenter: {
        position: 'absolute',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        top: 0,
    },
    initialsTextLarge: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    initialsTextSmall: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    pointerTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#FBBC05',
    },
    speedCalloutContainer: {
        position: 'absolute',
        top: -10,
        right: -40,
        zIndex: 50,
        width: 83,
        height: 31,
        borderRadius: 15.5,
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    speedCalloutContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 10,
        height: 33,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "rgba(0, 0, 0, 0.15)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
        width: 90,

    },
    speedEmoji: {
        fontSize: 16,
        marginRight: 4,
    },
    speedText: {
        color: '#031C55',
        fontSize: 13,
        marginHorizontal: 4,
        fontWeight: '400',
        textAlign: 'center',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        lineHeight: 16,
        },
});
