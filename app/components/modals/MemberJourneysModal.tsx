import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Text } from "@/components/CustomText";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authenticatedFetch } from "../../../utils/auth";
import { API_BASE_URL } from "@/utils/constants";
import { CircleMember, Journey, JourneyHistoryPoint } from "../../types/models";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

const COLORS = {
    primary: "#113C9C",
    secondary: "#002B7F",
    accent: "#4ADE80",
    textMain: "#111827",
    textSub: "#6B7280",
    bgLight: "#F3F4F6",
    white: "#FFFFFF",
    error: "#EF4444",
    border: "#E5E7EB",
    tabActive: "#113C9C",
    tabInactive: "#9CA3AF",
};

type TabId = "driving" | "safety" | "member";

interface MemberJourneysModalProps {
    isOpen: boolean;
    onClose: () => void;
    circleId?: string | number;
    memberId?: string | number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isFreePlan = (plan: any): boolean => {
    if (!plan) return true;
    if (typeof plan === "string") return plan.toLowerCase() === "free";
    if (typeof plan === "object") {
        const name = plan.name || plan.Plan?.name;
        if (name) return name.toLowerCase() === "free";
    }
    return true;
};

const toRadians = (v: number) => (v * Math.PI) / 180;

const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatTimeRange = (start: string, end: string) => {
    try {
        const fmt = (d: Date) =>
            d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
        return `${fmt(new Date(start))} - ${fmt(new Date(end))}`;
    } catch { return "N/A"; }
};

const getDuration = (start: string, end: string) => {
    try {
        const diffMs = new Date(end).getTime() - new Date(start).getTime();
        if (diffMs < 0) return "0 min";
        const mins = Math.floor(diffMs / 60000);
        if (mins < 60) return `${mins} min`;
        return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
    } catch { return "N/A"; }
};

const calcStats = (history: JourneyHistoryPoint[]) => {
    let totalDist = 0, maxSpeed = 0;
    for (let i = 0; i < history.length - 1; i++) {
        const d = haversineMeters(
            history[i].latitude, history[i].longitude,
            history[i + 1].latitude, history[i + 1].longitude
        );
        totalDist += d;
        const timeDiff =
            (new Date(history[i + 1].timestamp).getTime() - new Date(history[i].timestamp).getTime()) / 3600000;
        if (timeDiff > 0) {
            const s = d / 1609.34 / timeDiff;
            if (s > maxSpeed && s < 150) maxSpeed = s;
        }
    }
    return { distanceMiles: (totalDist / 1609.34).toFixed(1), topSpeedMph: Math.round(maxSpeed) };
};

const isStationary = (history: JourneyHistoryPoint[]) => {
    if (!history || history.length < 2) return true;
    const s = history[0], e = history[history.length - 1];
    const disp = haversineMeters(
        Number(s.latitude), Number(s.longitude),
        Number(e.latitude), Number(e.longitude)
    );
    const st = calcStats(history);
    return (disp < 100 && st.topSpeedMph < 5) || parseFloat(st.distanceMiles) * 1609.34 < 150;
};

// ─── OSRM + Mapbox static map ─────────────────────────────────────────────────

const OSRM_BASE = "https://router.project-osrm.org";

const encodePolyline = (coords: { latitude: number; longitude: number }[]) => {
    let result = "", prevLat = 0, prevLng = 0;
    const enc = (val: number) => {
        let v = val < 0 ? ~(val << 1) : val << 1;
        let s = "";
        while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; }
        return s + String.fromCharCode(v + 63);
    };
    for (const { latitude, longitude } of coords) {
        const lat = Math.round(latitude * 1e5);
        const lng = Math.round(longitude * 1e5);
        result += enc(lat - prevLat) + enc(lng - prevLng);
        prevLat = lat; prevLng = lng;
    }
    return result;
};

const buildMapUrl = (coords: { latitude: number; longitude: number }[], osrmEncoded?: string) => {
    if (!MAPBOX_TOKEN || coords.length === 0) return null;
    const s = coords[0], e = coords[coords.length - 1];
    const startPin = `pin-s+00cc44(${s.longitude.toFixed(5)},${s.latitude.toFixed(5)})`;
    const endPin   = `pin-s+ee3333(${e.longitude.toFixed(5)},${e.latitude.toFixed(5)})`;
    const w = Math.min(Math.round(SCREEN_WIDTH), 1280);
    const h = Math.min(Math.round(SCREEN_HEIGHT * 0.25), 640);
    const base = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static`;
    const makeUrl = (poly: string) => {
        const path = `path-4+4285F4-1(${encodeURIComponent(poly)})`;
        const url = `${base}/${startPin},${endPin},${path}/auto/${w}x${h}?access_token=${MAPBOX_TOKEN}&padding=40`;
        return url.length <= 8192 ? url : null;
    };
    if (osrmEncoded) { const u = makeUrl(osrmEncoded); if (u) return u; }
    const step = Math.ceil(coords.length / 20);
    const sampled = coords.filter((_, i) => i % step === 0 || i === coords.length - 1);
    return makeUrl(encodePolyline(sampled));
};

// ─── Journey Map Preview ───────────────────────────────────────────────────────

const JourneyMapItem = React.memo(({ history }: { history: JourneyHistoryPoint[] }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imgError, setImgError] = useState(false);
    const coords = useMemo(
        () => history.map(p => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) })),
        [history]
    );

    useEffect(() => {
        let alive = true;
        if (coords.length < 2) return;
        setImageUrl(null);
        setImgError(false);
        (async () => {
            let osrmEncoded: string | undefined;
            try {
                const pts = coords.length > 25
                    ? coords.filter((_, i) => i % Math.floor(coords.length / 25) === 0 || i === coords.length - 1)
                    : coords;
                const res = await fetch(
                    `${OSRM_BASE}/route/v1/driving/${pts.map(p => `${p.longitude},${p.latitude}`).join(";")
                    }?overview=full&geometries=polyline`
                );
                const data = await res.json();
                if (res.ok && data.routes?.[0]?.geometry) osrmEncoded = data.routes[0].geometry;
            } catch {}
            if (alive) setImageUrl(buildMapUrl(coords, osrmEncoded));
        })();
        return () => { alive = false; };
    }, [coords]);

    if (coords.length < 2) return null;
    return (
        <View style={styles.mapPreview}>
            {imageUrl && !imgError ? (
                <Image
                    source={{ uri: imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    {imgError
                        ? <Ionicons name="map-outline" size={40} color="#9CA3AF" />
                        : <ActivityIndicator color={COLORS.primary} />}
                </View>
            )}
        </View>
    );
});

// ─── Journey List Item ─────────────────────────────────────────────────────────

const JourneyListItem = React.memo(({ item }: { item: Journey }) => {
    const stats = useMemo(() => calcStats(item.history || []), [item.history]);
    const isStay = isStationary(item.history || []);
    return (
        <View style={styles.journeyCard}>
            <View style={styles.journeyRow}>
                <View style={[styles.journeyIcon, isStay && { backgroundColor: COLORS.secondary }]}>
                    <Ionicons name={isStay ? "location-sharp" : "shuffle"} size={20} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.journeyTitle}>
                        {isStay ? (item.history?.[0]?.name || "Stayed at Location") : `${stats.distanceMiles} mi Trip`}
                    </Text>
                    <Text style={styles.journeyTime}>
                        {formatTimeRange(item.startTime, item.endTime)} · {getDuration(item.startTime, item.endTime)}
                    </Text>
                </View>
            </View>
            <JourneyMapItem history={item.history || []} />
            {isStay && (
                <TouchableOpacity style={styles.addPlaceBtn}>
                    <Text style={styles.addPlaceText}>Add to Places</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});

// ─── Stat SVGs ─────────────────────────────────────────────────────────────────

const SpeedometerSvg = () => (
    <Svg width="36" height="36" viewBox="40 18 36 36" fill="none">
        <Path d="M58 18C54.8403 18.0001 51.7363 18.8346 48.9999 20.4198C46.2636 22.005 43.9913 24.2849 42.4115 27.0304C40.8317 29.776 40 32.8904 40 36.0606C40 39.2309 40.8318 42.3452 42.4116 45.0908C42.6503 45.5075 43.0442 45.812 43.5067 45.9373C43.9692 46.0626 44.4623 45.9985 44.8777 45.759C45.293 45.5195 45.5965 45.1243 45.7214 44.6602C45.8463 44.1962 45.7824 43.7014 45.5437 43.2847C44.2682 41.0924 43.5973 38.599 43.5996 36.0605C43.6005 33.8448 44.1092 31.659 45.0865 29.6721C46.0638 27.6852 47.4834 25.9504 49.2357 24.6019C50.9879 23.2533 53.0258 22.3272 55.1917 21.8951C57.3576 21.463 59.5936 21.5365 61.7267 22.1099C63.8598 22.6833 65.8329 23.7413 67.4934 25.202C69.1539 26.6626 70.4573 28.4869 71.3029 30.5338C72.1485 32.5806 72.5135 34.7951 72.3699 37.0061C72.2262 39.2171 71.5776 41.3654 70.4743 43.2847C70.2353 43.6986 70.1693 44.1934 70.2924 44.6578C70.4156 45.1222 70.718 45.5185 71.1333 45.759C71.5487 45.9985 72.0418 46.0626 72.5043 45.9373C72.9668 45.812 73.3607 45.5075 73.5994 45.0908C75.1792 42.3452 76 39.2309 76 36.0606C76 32.8904 75.1683 29.776 73.5885 27.0304C72.0087 24.2849 69.7364 22.005 67.0001 20.4198C64.2637 18.8346 61.1597 18.0001 58 18ZM63.1121 28.4028L60.3221 31.1842C59.5998 30.8269 58.8052 30.6415 58 30.6424C56.932 30.6424 55.8879 30.9601 54.9998 31.5555C54.1118 32.1508 53.4196 32.997 53.0109 33.9871C52.6022 34.9771 52.4953 36.0665 52.7036 37.1175C52.912 38.1685 53.4263 39.134 54.1815 39.8917C54.9367 40.6495 55.899 41.1655 56.9465 41.3745C57.994 41.5836 59.0798 41.4763 60.0665 41.0662C61.0533 40.6561 61.8967 39.9617 62.49 39.0707C63.0834 38.1797 63.4001 37.1321 63.4001 36.0605C63.3989 35.2586 63.2141 34.4677 62.8601 33.7488L65.6502 30.9674C65.9875 30.6311 66.1763 30.1749 66.1763 29.6994C66.1763 29.2238 65.9875 28.7676 65.6502 28.4313C65.3129 28.095 64.8567 27.9062 64.3812 27.9062C63.9056 27.9062 63.4494 28.095 63.1121 28.4313V28.4028ZM58 37.8666C57.5226 37.8666 57.0647 37.6763 56.7272 37.3376C56.3896 36.9989 56.2 36.5395 56.2 36.0605C56.2 35.5815 56.3896 35.1221 56.7272 34.7834C57.0647 34.4447 57.5226 34.2544 58 34.2544C58.4697 34.2516 58.9219 34.4331 59.26 34.7601C59.5981 35.0871 59.8 35.5627 59.8 36.0605C59.8 36.5395 59.6104 36.9989 59.2728 37.3376C58.9352 37.6763 58.4774 37.8666 58 37.8666Z" fill="#FFFFFF" />
    </Svg>
);

const CarSvg = () => (
    <Svg width="36" height="36" viewBox="40 18 36 27" fill="none">
        <Path d="M70.5999 27.0001H70.0239L67.7739 21.3841C67.3721 20.3856 66.681 19.5299 65.7894 18.927C64.8978 18.324 63.8463 18.0013 62.77 18.0001H51.97C50.7195 17.9966 49.5065 18.4271 48.5381 19.2182C47.5697 20.0094 46.9059 21.1121 46.66 22.3381L45.724 27.0001H45.4C43.9678 27.0001 42.5943 27.5691 41.5816 28.5817C40.5689 29.5944 40 30.9679 40 32.4001V37.8001C40 38.2775 40.1896 38.7353 40.5272 39.0729C40.8648 39.4105 41.3226 39.6001 41.8 39.6001H43.6C43.6 41.0323 44.1689 42.4058 45.1816 43.4185C46.1943 44.4312 47.5678 45.0001 49 45.0001C50.4321 45.0001 51.8057 44.4312 52.8183 43.4185C53.831 42.4058 54.4 41.0323 54.4 39.6001H61.6C61.6 41.0323 62.1689 42.4058 63.1816 43.4185C64.1943 44.4312 65.5678 45.0001 66.9999 45.0001C68.4321 45.0001 69.8056 44.4312 70.8183 43.4185C71.831 42.4058 72.3999 41.0323 72.3999 39.6001H74.1999C74.6773 39.6001 75.1352 39.4105 75.4727 39.0729C75.8103 38.7353 75.9999 38.2775 75.9999 37.8001V32.4001C75.9999 30.9679 75.431 29.5944 74.4183 28.5817C73.4056 27.5691 72.0321 27.0001 70.5999 27.0001ZM59.8 21.6001H62.77C63.1274 21.6034 63.4758 21.7129 63.7707 21.9149C64.0656 22.1169 64.2937 22.4021 64.4259 22.7341L66.1359 27.0001H59.8V21.6001ZM50.188 23.0401C50.2721 22.6274 50.4983 22.2573 50.8272 21.9942C51.1561 21.7311 51.5669 21.5916 51.988 21.6001H56.2V27.0001H49.396L50.188 23.0401ZM72.3999 36.0001H43.6V32.4001C43.6 31.9227 43.7896 31.4649 44.1272 31.1273C44.4648 30.7898 44.9226 30.6001 45.4 30.6001H70.5999C71.0773 30.6001 71.5352 30.7898 71.8727 31.1273C72.2103 31.4649 72.3999 31.9227 72.3999 32.4001V36.0001Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="0.7" />
    </Svg>
);

const MilesSvg = () => (
    <Svg width="36" height="36" viewBox="39 15 39 34" fill="none">
        <Path d="M42.5534 24.9106V29.1617C42.5534 29.5375 42.7059 29.8979 42.9773 30.1636C43.2487 30.4294 43.6169 30.5787 44.0008 30.5787C44.3846 30.5787 44.7528 30.4294 45.0242 30.1636C45.2957 29.8979 45.4481 29.5375 45.4481 29.1617V24.9106C45.4547 24.8399 45.4547 24.7687 45.4481 24.698C46.6182 24.3684 47.6273 23.6362 48.2897 22.6361C48.9522 21.636 49.2233 20.4352 49.0533 19.2549C48.8833 18.0746 48.2836 16.9941 47.3646 16.2123C46.4455 15.4305 45.2689 15 44.0514 15C42.8339 15 41.6573 15.4305 40.7383 16.2123C39.8192 16.9941 39.2195 18.0746 39.0495 19.2549C38.8795 20.4352 39.1507 21.636 39.8131 22.6361C40.4755 23.6362 41.4846 24.3684 42.6547 24.698C42.6135 24.7653 42.5795 24.8365 42.5534 24.9106ZM44.0008 17.8255C44.5766 17.8255 45.1288 18.0494 45.5359 18.448C45.9431 18.8466 46.1718 19.3873 46.1718 19.951C46.1718 20.5166 45.9423 21.059 45.5338 21.459C45.1253 21.8589 44.5712 22.0836 43.9935 22.0836C43.4158 22.0836 42.8617 21.8589 42.4532 21.459C42.0447 21.059 41.8152 20.5166 41.8152 19.951C41.8152 19.3873 42.0439 18.8466 42.451 18.448C42.8582 18.0494 43.4104 17.8255 43.9862 17.8255H44.0008ZM78 32.7042C77.9983 31.7876 77.7364 30.8895 77.2436 30.1101C76.7508 29.3308 76.0465 28.7008 75.2092 28.2906C74.3719 27.8804 73.4347 27.7061 72.5021 27.7871C71.5695 27.8682 70.6783 28.2013 69.9279 28.7495C69.1775 29.2976 68.5974 30.0391 68.2525 30.8912C67.9076 31.7434 67.8113 32.6726 67.9745 33.5752C68.1377 34.4778 68.5539 35.3182 69.1767 36.0026C69.7994 36.6871 70.6042 37.1886 71.5012 37.4512V41.9149C71.5012 42.2907 71.6537 42.6511 71.9251 42.9169C72.1966 43.1826 72.5647 43.3319 72.9486 43.3319C73.3325 43.3319 73.7006 43.1826 73.9721 42.9169C74.2435 42.6511 74.396 42.2907 74.396 41.9149V37.4512C75.4366 37.1418 76.3483 36.5137 76.9971 35.6592C77.6458 34.8047 77.9974 33.7689 78 32.7042ZM72.9486 34.8298C72.3728 34.8298 71.8206 34.6058 71.4134 34.2072C71.0063 33.8086 70.7775 33.2679 70.7775 32.7042C70.7775 32.1405 71.0063 31.5998 71.4134 31.2012C71.8206 30.8026 72.3728 30.5787 72.9486 30.5787C73.5244 30.5787 74.0766 30.8026 74.4838 31.2012C74.8909 31.5998 75.1197 32.1405 75.1197 32.7042C75.1197 33.2679 74.8909 33.8086 74.4838 34.2072C74.0766 34.6058 73.5244 34.8298 72.9486 34.8298ZM72.9486 46.1659H64.2642C63.4965 46.1659 62.7602 45.8674 62.2173 45.3359C61.6744 44.8044 61.3695 44.0835 61.3695 43.3319V39.0808C61.3695 37.5776 60.7595 36.1359 59.6737 35.0729C58.588 34.0099 57.1154 33.4127 55.5799 33.4127H44.0008C43.6169 33.4127 43.2487 33.562 42.9773 33.8278C42.7059 34.0935 42.5534 34.4539 42.5534 34.8298C42.5534 35.2056 42.7059 35.566 42.9773 35.8317C43.2487 36.0975 43.6169 36.2468 44.0008 36.2468H55.5799C56.3476 36.2468 57.0839 36.5454 57.6268 37.0769C58.1697 37.6083 58.4747 38.3292 58.4747 39.0808V43.3319C58.4747 44.8352 59.0847 46.2769 60.1704 47.3399C61.2562 48.4028 62.7288 49 64.2642 49H72.9486C73.3325 49 73.7006 48.8507 73.9721 48.585C74.2435 48.3192 74.396 47.9588 74.396 47.583C74.396 47.2072 74.2435 46.8467 73.9721 46.581C73.7006 46.3152 73.3325 46.1659 72.9486 46.1659Z" fill="#FFFFFF" />
    </Svg>
);

// ─── Tab: Driving ──────────────────────────────────────────────────────────────

const DrivingTab = ({
    journeys,
    batchStats,
    loading,
}: {
    journeys: Journey[];
    batchStats: { totalMiles: string; totalDrives: number; topSpeed: number };
    loading: boolean;
}) => {
    const drivingJourneys = journeys.filter(j => !isStationary(j.history || []));
    const stayJourneys    = journeys.filter(j => isStationary(j.history || []));

    const statItems = [
        { label: "Top Speed",    value: `${batchStats.topSpeed} mph`, Svg: SpeedometerSvg },
        { label: "Total Drives", value: `${batchStats.totalDrives}`,  Svg: CarSvg         },
        { label: "Total Miles",  value: `${batchStats.totalMiles} mi`, Svg: MilesSvg      },
    ];

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
            {/* This Week */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>This Week</Text>
                {loading && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />}
            </View>

            <View style={styles.statsRow}>
                {statItems.map(({ label, value, Svg: S }) => (
                    <View key={label} style={styles.statCard}>
                        <View style={styles.statIconBox}><S /></View>
                        <Text style={styles.statValue}>{loading ? "—" : value}</Text>
                        <Text style={styles.statLabel}>{label}</Text>
                    </View>
                ))}
            </View>

            {/* Journey list */}
            {loading ? (
                <View style={styles.inlineCenter}>
                    <ActivityIndicator color={COLORS.primary} />
                    <Text style={[styles.emptyText, { marginTop: 8 }]}>Loading journeys…</Text>
                </View>
            ) : journeys.length === 0 ? (
                <View style={styles.inlineCenter}>
                    <Ionicons name="car-outline" size={52} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No Journeys Yet</Text>
                    <Text style={styles.emptyText}>Driving activity will appear here once detected.</Text>
                </View>
            ) : (
                <>
                    {drivingJourneys.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Drives ({drivingJourneys.length})</Text>
                            </View>
                            {drivingJourneys.map((j, i) => <JourneyListItem key={j.startTime || i} item={j} />)}
                        </>
                    )}
                    {stayJourneys.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Stops ({stayJourneys.length})</Text>
                            </View>
                            {stayJourneys.map((j, i) => <JourneyListItem key={j.startTime || i} item={j} />)}
                        </>
                    )}
                </>
            )}
        </ScrollView>
    );
};

// ─── Tab: Safety ───────────────────────────────────────────────────────────────

const SafetyTab = ({ member }: { member: CircleMember | null }) => (
    <ScrollView contentContainerStyle={[styles.inlineCenter, { paddingTop: 60 }]}>
        <View style={styles.safetyIconWrap}>
            <Ionicons name="shield-checkmark" size={56} color={COLORS.primary} />
        </View>
        <Text style={[styles.emptyTitle, { marginTop: 16 }]}>Safety Overview</Text>
        <Text style={[styles.emptyText, { marginTop: 8 }]}>
            {member?.name ? `${member.name}'s` : "Member's"} safety alerts and SOS history will appear here.
        </Text>
    </ScrollView>
);

// ─── Tab: Member ───────────────────────────────────────────────────────────────

const MemberTab = ({ member }: { member: CircleMember | null }) => {
    if (!member) return <View style={styles.inlineCenter}><ActivityIndicator color={COLORS.primary} /></View>;

    const batteryLevel = member.batteryLevel?.batteryLevel ?? null;
    const locationText =
        (member as any)?.currentLocation?.name ||
        (member as any)?.locationText ||
        "Location unknown";

    const rows = [
        { label: "Status",   value: (member as any)?.status || "Unknown",                   icon: "radio-button-on"    },
        { label: "Location", value: locationText,                                            icon: "location-outline"   },
        { label: "Battery",  value: batteryLevel !== null ? `${batteryLevel}%` : "Unknown", icon: "battery-half-outline" },
        { label: "Email",    value: member.email || "—",                                    icon: "mail-outline"       },
    ];

    return (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 40 }}>
            {rows.map(row => (
                <View key={row.label} style={styles.memberRow}>
                    <View style={styles.memberRowIcon}>
                        <Ionicons name={row.icon as any} size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.memberRowLabel}>{row.label}</Text>
                        <Text style={styles.memberRowValue} numberOfLines={1}>{row.value}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

// ─── Main Modal ────────────────────────────────────────────────────────────────

const MemberJourneysModal: React.FC<MemberJourneysModalProps> = ({
    isOpen,
    onClose,
    circleId,
    memberId,
}) => {
    const [activeTab, setActiveTab] = useState<TabId>("driving");
    const [loading, setLoading] = useState(false);
    const [memberData, setMemberData] = useState<CircleMember | null>(null);
    const [journeys, setJourneys] = useState<Journey[]>([]);
    const [batchStats, setBatchStats] = useState({ totalMiles: "0.0", totalDrives: 0, topSpeed: 0 });

    const fetchHistory = useCallback(async () => {
        if (!circleId || !memberId) return;
        setLoading(true);
        try {
            let currentPlan = null;
            try {
                const planJson = await AsyncStorage.getItem("userPlan");
                if (planJson) currentPlan = JSON.parse(planJson);
            } catch {}

            const res = await authenticatedFetch(
                `${API_BASE_URL}/circles/${circleId}/history?page=1&perPage=100`
            );
            if (!res.ok) return;
            const payload = await res.json();
            const histData = payload?.data;
            const members  = histData?.members || [];
            const creator  = histData?.creator;

            let found: any = null;
            if (creator && String(creator.id) === String(memberId)) found = creator;
            else found = members.find((m: any) => String(m.id) === String(memberId));
            if (!found) return;

            setMemberData(found);

            const now = new Date();
            const cutoff = new Date();
            if (isFreePlan(currentPlan)) {
                cutoff.setDate(now.getDate() - 1);
            } else {
                cutoff.setDate(now.getDate() - 30);
            }
            cutoff.setHours(0, 0, 0, 0);

            const filtered: Journey[] = (found.journeys || []).filter(
                (j: Journey) => new Date(j.startTime || j.endTime).getTime() >= cutoff.getTime()
            );
            setJourneys(filtered);

            let totalMeters = 0, topSpeed = 0, driveCount = 0;
            filtered.filter((j: Journey) => !isStationary(j.history || [])).forEach((j: Journey) => {
                const s = calcStats(j.history || []);
                if (s.topSpeedMph > topSpeed) topSpeed = s.topSpeedMph;
                totalMeters += parseFloat(s.distanceMiles) * 1609.34;
                driveCount++;
            });
            setBatchStats({ totalMiles: (totalMeters / 1609.34).toFixed(1), totalDrives: driveCount, topSpeed });
        } catch (e) {
            console.warn("MemberJourneysModal fetch error", e);
        } finally {
            setLoading(false);
        }
    }, [circleId, memberId]);

    useEffect(() => {
        if (isOpen) {
            setActiveTab("driving");
            setMemberData(null);
            setJourneys([]);
            setBatchStats({ totalMiles: "0.0", totalDrives: 0, topSpeed: 0 });
            fetchHistory();
        }
    }, [isOpen, fetchHistory]);

    const avatarUri = memberData?.avatar
        ? memberData.avatar.startsWith("http")
            ? memberData.avatar
            : `${API_BASE_URL}${memberData.avatar}`.replace("/api/uploads", "/uploads")
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(memberData?.name || "User")}&background=1E3A8A&color=fff`;

    const displayName = memberData?.name || "Member";
    const locationText =
        (memberData as any)?.currentLocation?.name ||
        (memberData as any)?.locationText ||
        "Location unknown";
    const batteryLevel = memberData?.batteryLevel?.batteryLevel;

    const TABS: { id: TabId; label: string; icon: string }[] = [
        { id: "driving", label: "Driving", icon: "car-outline"              },
        { id: "safety",  label: "Safety",  icon: "shield-checkmark-outline" },
        { id: "member",  label: "Member",  icon: "person-outline"           },
    ];

    return (
        <Modal visible={isOpen} animationType="slide" transparent={false} onRequestClose={onClose}>
            <SafeAreaView style={styles.screen}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.headerTitle}>{displayName}</Text>
                        <Text style={styles.headerSub}>Journey Details</Text>
                    </View>
                    <TouchableOpacity onPress={fetchHistory} style={styles.refreshBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="refresh" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* ── Profile Bar ── */}
                <View style={styles.profileBar}>
                    <View style={styles.avatarWrap}>
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        <View style={styles.onlineDot} />
                        {batteryLevel !== undefined && batteryLevel !== null && (
                            <View style={styles.batteryBadge}>
                                <Text style={styles.batteryText}>{batteryLevel}%</Text>
                            </View>
                        )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.profileName}>{displayName}</Text>
                        <Text style={styles.profileLocation} numberOfLines={1}>{locationText}</Text>
                        <Text style={styles.profileSub}>{(memberData as any)?.status || "Offline"}</Text>
                    </View>
                    <View style={styles.deviceBadge}>
                        <MaterialCommunityIcons name="cellphone" size={18} color={COLORS.white} />
                    </View>
                </View>

                {/* ── Tab Bar ── */}
                <View style={styles.tabBar}>
                    {TABS.map(tab => {
                        const active = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tabItem, active && styles.tabItemActive]}
                                onPress={() => setActiveTab(tab.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={tab.icon as any}
                                    size={18}
                                    color={active ? COLORS.tabActive : COLORS.tabInactive}
                                />
                                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Tab Content ── */}
                <View style={{ flex: 1 }}>
                    {activeTab === "driving" && (
                        <DrivingTab journeys={journeys} batchStats={batchStats} loading={loading} />
                    )}
                    {activeTab === "safety" && <SafetyTab member={memberData} />}
                    {activeTab === "member" && <MemberTab member={memberData} />}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.white },

    header: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textMain },
    headerSub: { fontSize: 12, color: COLORS.textSub },
    refreshBtn: { padding: 4 },

    profileBar: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
        backgroundColor: COLORS.bgLight,
    },
    avatarWrap: { position: "relative", marginRight: 4 },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.bgLight },
    onlineDot: {
        position: "absolute", top: 1, right: 1,
        width: 13, height: 13, borderRadius: 7,
        backgroundColor: COLORS.accent, borderWidth: 2, borderColor: COLORS.white,
    },
    batteryBadge: {
        position: "absolute", bottom: -6, left: 0, right: 0,
        backgroundColor: COLORS.white, borderRadius: 8,
        borderWidth: 1, borderColor: COLORS.border,
        alignItems: "center", paddingVertical: 1,
    },
    batteryText: { fontSize: 8, fontWeight: "700", color: COLORS.error },
    profileName: { fontSize: 16, fontWeight: "700", color: COLORS.textMain },
    profileLocation: { fontSize: 13, color: COLORS.primary, fontWeight: "500", marginTop: 2 },
    profileSub: { fontSize: 12, color: COLORS.textSub, marginTop: 1 },
    deviceBadge: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center",
    },

    tabBar: {
        flexDirection: "row",
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    tabItem: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        paddingVertical: 12, gap: 6,
        borderBottomWidth: 2, borderBottomColor: "transparent",
    },
    tabItemActive: { borderBottomColor: COLORS.tabActive },
    tabLabel: { fontSize: 13, fontWeight: "600", color: COLORS.tabInactive },
    tabLabelActive: { color: COLORS.tabActive },

    sectionHeader: {
        paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10,
        flexDirection: "row", alignItems: "center",
    },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textMain },

    statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 4 },
    statCard: {
        flex: 1, alignItems: "center", backgroundColor: COLORS.bgLight,
        borderRadius: 12, paddingVertical: 14, paddingHorizontal: 6,
    },
    statIconBox: {
        width: 64, height: 64, borderRadius: 12,
        backgroundColor: "#031C55", justifyContent: "center", alignItems: "center", marginBottom: 8,
    },
    statValue: { fontSize: 13, fontWeight: "700", color: COLORS.primary, marginBottom: 2, textAlign: "center" },
    statLabel: { fontSize: 11, fontWeight: "500", color: COLORS.textSub, textAlign: "center" },

    inlineCenter: { alignItems: "center", paddingTop: 40, paddingHorizontal: 40 },

    journeyCard: {
        marginHorizontal: 16, marginBottom: 12,
        borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
        backgroundColor: COLORS.white, overflow: "hidden",
        paddingTop: 14, paddingHorizontal: 14,
    },
    journeyRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    journeyIcon: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center", marginRight: 12,
    },
    journeyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.primary },
    journeyTime: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
    mapPreview: {
        width: "100%", height: SCREEN_HEIGHT * 0.22,
        borderRadius: 10, overflow: "hidden",
        backgroundColor: COLORS.bgLight, marginBottom: 10,
    },
    addPlaceBtn: {
        alignSelf: "flex-start", marginBottom: 10,
        backgroundColor: COLORS.secondary, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16,
    },
    addPlaceText: { color: COLORS.white, fontSize: 12, fontWeight: "600" },

    safetyIconWrap: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center",
    },

    memberRow: {
        flexDirection: "row", alignItems: "center",
        paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    memberRowIcon: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center", marginRight: 14,
    },
    memberRowLabel: { fontSize: 12, color: COLORS.textSub, marginBottom: 2 },
    memberRowValue: { fontSize: 15, fontWeight: "600", color: COLORS.textMain },

    emptyTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textMain, marginTop: 12, textAlign: "center" },
    emptyText: { fontSize: 13, color: COLORS.textSub, textAlign: "center", lineHeight: 20 },
});

export default MemberJourneysModal;
