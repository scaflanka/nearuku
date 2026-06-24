import AsyncStorage from "@react-native-async-storage/async-storage";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
// import * as TaskManager from "expo-task-manager"; // Removed
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { Text, TextInput } from '@/components/CustomText';

import Mapbox from "@rnmapbox/maps";
import { canRenderMapbox, getMapboxToken } from "../../utils/mapHelper";
import { MapFallback } from "../../components/MapFallback";

if (canRenderMapbox()) {
  Mapbox.setAccessToken(getMapboxToken());
}
const turfCircle = require('@turf/circle').default;
const { point } = require('@turf/helpers');

const MapboxCircle = ({ center, radius, strokeColor, fillColor, strokeWidth, idKey }: any) => {
    if (!center || !radius) return null;
    const centerPt = point([center.longitude, center.latitude]);
    const circleGeojson = turfCircle(centerPt, radius / 1000, { steps: 64, units: 'kilometers' });
    const circleId = idKey || `${center.latitude}-${center.longitude}`;
    return (
        <Mapbox.ShapeSource id={`circle-source-${circleId}`} shape={circleGeojson as any}>
            <Mapbox.FillLayer id={`circle-fill-${circleId}`} style={{ fillColor: fillColor || 'rgba(0,0,0,0)' }} />
            <Mapbox.LineLayer id={`circle-line-${circleId}`} style={{ lineColor: strokeColor || 'black', lineWidth: strokeWidth || 1 }} />
        </Mapbox.ShapeSource>
    );
};

import { useSmoothSpeed } from "../../hooks/useSmoothSpeed";
import { isBackgroundLocationRunning, LAST_FOREGROUND_HEARTBEAT, startBackgroundLocation, stopBackgroundLocation } from "../../services/BackgroundLocationService";
import SocketService from "../../services/SocketService";
import { useAlert } from "../context/AlertContext";
import { useSpeed } from "../context/SpeedContext";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Svg, {
  G,
  Mask,
  Path,
  Rect,
  Circle as SvgCircle
} from "react-native-svg";


import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Components & Utils ---
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { NotificationToast } from "../../components/NotificationToast";
import { NotificationItem, NotificationService } from "../../services/NotificationService";
import { authenticatedFetch, logout, storeTokens, updateUserProfile } from "../../utils/auth";
import {
  readBatteryLevel,
  sendBatteryLevel,
  sendBatteryLevelValue,
  sendLowBatteryAlert,
  watchBatteryLevel
} from "../../utils/battery";
import { API_BASE_URL } from "../../utils/constants";
import { pickContact } from "../../utils/contacts";
import { formatToSLTime } from "../../utils/dateHelpers";
import { storeLastKnownLocation } from "../../utils/locationCache";
import { setNotificationReceptionEnabled } from "../../utils/notificationListeners";
import { requestNotificationPermissions } from "../../utils/permissions";
import NotificationIcon from "../components/icons/NotificationIcon";
import ChatIcon from "../components/icons/ChatIcon";
import MapLayersIcon from "../components/icons/MapLayersIcon";
import StartupLoading from "../components/StartupLoading";

// --- Custom Modals ---

import {
  AssignedLocationDetails,
  AssignedLocationRecord,
  BatteryLevelInfo,
  CircleData,
  CircleMember,
  Journey,
  JourneyHistoryPoint,
  LocationHistoryEntry,
  LocationHistoryFilterKey,
  LocationPoint,
  MemberLocationOption,
  UserLocation,
} from "../types/models";
// --- Custom Modals ---
import { LocationMarker as XYLocationMarker, MemberMarker as XYMemberMarker } from "../components/XYMapMarkers";
import DrivingIcon from "../components/icons/DrivingIcon";
import SteeringWheelIcon from "../components/icons/SteeringWheelIcon";
import AddMemberIcon from "../components/icons/AddMemberIcon";
import BuildingIcon from "../components/icons/BuildingIcon";
import MapIcon from "../components/icons/MapIcon";
import MembershipIcon from "../components/icons/MembershipIcon";
import SafetyIcon from "../components/icons/SafetyIcon";
import UsersIcon from "../components/icons/UsersIcon";
import PlacesIcon from "../components/icons/PlacesIcon";
import BluetoothTabIcon from "../components/icons/BluetoothTabIcon";
import BluetoothIcon2 from "../components/icons/BluetoothIcon2";
import AccountModal from "../components/modals/AccountModal";
import AddPeopleModal from "../components/modals/AddPeopleModal";
import AddPlaceModal from "../components/modals/AddPlaceModal";
import CircleManagementModal from "../components/modals/CircleManagementModal";
import CirclesModal from "../components/modals/CirclesModal";
import DriveDetectionModal from "../components/modals/DriveDetectionModal";
import EditCircleNameModal from "../components/modals/EditCircleNameModal";
import LocationSharingModal from "../components/modals/LocationSharingModal";
import MyRoleModal from "../components/modals/MyRoleModal";
import NotificationsModal from "../components/modals/NotificationsModal";
import SettingsModal from "../components/modals/SettingsModal";
import SmartNotificationModal from "../components/modals/SmartNotificationModal";
import SosModal from "../components/modals/SosModal";
import CrashDetectionIcon from "../components/icons/CrashDetectionIcon";
import { CreateCircleModal, JoinCircleModal } from "./CreateJoinModals";



// const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
// --- Modal Components ---

// --- SVG Icons ---
const CheckInIcon = () => (
  <Svg width="42" height="42" viewBox="0 0 42 42" fill="none">
    <Rect width="42" height="42" rx="21" fill="#C6D8FF" />
    <Path
      d="M21 10.7998C25.5553 10.7998 29.2002 14.3754 29.2002 18.75C29.2002 20.7603 28.6077 22.6503 27.5127 24.3701L27.5117 24.3711C26.9272 25.2923 26.2467 26.1543 25.5342 27.0527C24.8306 27.94 24.0944 28.8648 23.4521 29.8662C22.8217 30.8443 22.3677 31.754 21.9004 32.7754C21.8049 32.9718 21.707 33.2182 21.6318 33.3955C21.547 33.5957 21.4696 33.7629 21.3848 33.9004C21.2211 34.1656 21.1149 34.2002 21 34.2002C20.8851 34.2002 20.7789 34.1656 20.6152 33.9004C20.5304 33.7629 20.453 33.5957 20.3682 33.3955C20.3306 33.3069 20.2869 33.2011 20.2412 33.0928L20.0996 32.7754C19.6323 31.754 19.1783 30.8443 18.5479 29.8662C17.9056 28.8648 17.1694 27.94 16.4658 27.0527C15.7533 26.1543 15.0728 25.2923 14.4883 24.3711L14.4873 24.3701C13.3923 22.6503 12.7998 20.7603 12.7998 18.75C12.7998 14.3754 16.4447 10.7998 21 10.7998Z"
      stroke="#113C9C"
      strokeWidth="1.6"
    />
    <Path
      d="M21 24V16M17 20H25"
      stroke="#113C9C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);


const SosIcon = () => (
  <Svg width="42" height="42" viewBox="0 0 42 42" fill="none">
    <Rect width="42" height="42" rx="21" fill="#FB3748" />
    <Path d="M21.8182 28H20.1818C19.5818 28 19.0909 28.4909 19.0909 29.0909V32.3636C19.0909 32.9636 19.5818 33.4545 20.1818 33.4545H21.8182C22.4182 33.4545 22.9091 32.9636 22.9091 32.3636V29.0909C22.9091 28.4909 22.4182 28 21.8182 28ZM21.8182 32.3636H20.1818V29.0909H21.8182V32.3636ZM15 32.3636H17.1818V31.2727H16.0909C15.4909 31.2727 15 30.7818 15 30.1818V29.0909C15 28.4909 15.4909 28 16.0909 28H18.2727V29.0909H16.0909V30.1818H17.1818C17.7818 30.1818 18.2727 30.6727 18.2727 31.2727V32.3636C18.2727 32.9636 17.7818 33.4545 17.1818 33.4545H15V32.3636ZM23.7273 32.3636H25.9091V31.2727H24.8182C24.2182 31.2727 23.7273 30.7818 23.7273 30.1818V29.0909C23.7273 28.4909 24.2182 28 24.8182 28H27V29.0909H24.8182V30.1818H25.9091C26.5091 30.1818 27 30.6727 27 31.2727V32.3636C27 32.9636 26.5091 33.4545 25.9091 33.4545H23.7273V32.3636Z" fill="white" />
    <Path d="M22.45 25.475C22.0667 25.8583 21.5917 26.05 21.025 26.05C20.4583 26.05 19.9833 25.8583 19.6 25.475L11.575 17.45C11.1917 17.0667 11 16.5917 11 16.025C11 15.4583 11.1917 14.9833 11.575 14.6L19.6 6.575C19.9833 6.1917 20.4583 6 21.025 6C21.5917 6 22.0667 6.1917 22.45 6.575L30.475 14.6C30.8583 14.9833 31.05 15.4583 31.05 16.025C31.05 16.5917 30.8583 17.0667 30.475 17.45L22.45 25.475ZM21.025 24.05L29.05 16.025L21.025 8L13 16.025L21.025 24.05ZM20.025 17.025H22.025V11.025H20.025V17.025ZM21.025 20.025C21.3083 20.025 21.546 19.929 21.738 19.737C21.9293 19.5457 22.025 19.3083 22.025 19.025C22.025 18.7417 21.9293 18.504 21.738 18.312C21.546 18.1207 21.3083 18.025 21.025 18.025C20.7417 18.025 20.5043 18.1207 20.313 18.312C20.121 18.504 20.025 18.7417 20.025 19.025C20.025 19.3083 20.121 19.5457 20.313 19.737C20.5043 19.929 20.7417 20.025 21.025 20.025Z" fill="white" />
  </Svg>
);

const MyLocationIcon = () => (
  <Svg width="21" height="21" viewBox="0 0 21 21" fill="none">
    <Path d="M1.75 10.5C1.75 15.3325 5.66751 19.25 10.5 19.25V17.7188C6.51319 17.7188 3.28125 14.4868 3.28125 10.5H1.75ZM10.5 19.25C15.3325 19.25 19.25 15.3325 19.25 10.5H17.7188C17.7188 14.4868 14.4868 17.7188 10.5 17.7188V19.25ZM19.25 10.5C19.25 5.66751 15.3325 1.75 10.5 1.75V3.28125C14.4868 3.28125 17.7188 6.51319 17.7188 10.5H19.25ZM10.5 1.75C5.66751 1.75 1.75 5.66751 1.75 10.5H3.28125C3.28125 6.51319 6.51319 3.28125 10.5 3.28125V1.75Z" fill="#113C9C" />
    <Path d="M18.7022 10.6124H20.5H18.7022ZM10.3876 18.7022V20.5V18.7022ZM0.5 10.6124H2.29775H0.5ZM10.3876 0.5V2.29775V0.5Z" fill="#113C9C" />
    <Path d="M18.7022 10.6124H20.5M10.3876 18.7022V20.5M0.5 10.6124H2.29775M10.3876 0.5V2.29775" stroke="#113C9C" strokeLinecap="round" />
    <Mask id="path-4-inside-1_288_236" fill="white">
      <Path d="M15.5 10.5C15.5 13.2614 13.2614 15.5 10.5 15.5V13.6579C12.2441 13.6579 13.6579 12.2441 13.6579 10.5H15.5ZM10.5 15.5C7.73858 15.5 5.5 13.2614 5.5 10.5H7.34211C7.34211 12.2441 8.75595 13.6579 10.5 13.6579V15.5ZM5.5 10.5C5.5 7.73858 7.73858 5.5 10.5 5.5V7.34211C8.75595 7.34211 7.34211 8.75595 7.34211 10.5H5.5ZM10.5 5.5C13.2614 5.5 15.5 7.73858 15.5 10.5H13.6579C13.6579 8.75595 12.2441 7.34211 10.5 7.34211V5.5Z" />
    </Mask>
    <Path d="M15.5 10.5C15.5 13.2614 13.2614 15.5 10.5 15.5V13.6579C12.2441 13.6579 13.6579 12.2441 13.6579 10.5H15.5ZM10.5 15.5C7.73858 15.5 5.5 13.2614 5.5 10.5H7.34211C7.34211 12.2441 8.75595 13.6579 10.5 13.6579V15.5ZM5.5 10.5C5.5 7.73858 7.73858 5.5 10.5 5.5V7.34211C8.75595 7.34211 7.34211 8.75595 7.34211 10.5H5.5ZM10.5 5.5C13.2614 5.5 15.5 7.73858 15.5 10.5H13.6579C13.6579 8.75595 12.2441 7.34211 10.5 7.34211V5.5Z" fill="#113C9C" />
    <Path d="M10.5 15.5H12.5V13.6579H10.5H8.5V15.5H10.5ZM13.6579 10.5V12.5H15.5V10.5V8.5H13.6579V10.5ZM5.5 10.5V12.5H7.34211V10.5V8.5H5.5V10.5ZM10.5 5.5H8.5V7.34211H10.5H12.5V5.5H10.5ZM15.5 10.5H11.5C11.5 11.0523 11.0523 11.5 10.5 11.5V15.5V19.5C15.4706 19.5 19.5 15.4706 19.5 10.5H15.5ZM10.5 13.6579V17.6579C14.4532 17.6579 17.6579 14.4532 17.6579 10.5H13.6579H9.6579C9.6579 10.0349 10.0349 9.6579 10.5 9.6579V13.6579ZM10.5 15.5V11.5C9.94772 11.5 9.5 11.0523 9.5 10.5H5.5H1.5C1.5 15.4706 5.52944 19.5 10.5 19.5V15.5ZM7.34211 10.5H3.34211C3.34211 14.4532 6.54681 17.6579 10.5 17.6579V13.6579V9.6579C10.9651 9.6579 11.3421 10.0349 11.3421 10.5H7.34211ZM5.5 10.5H9.5C9.5 9.94772 9.94772 9.5 10.5 9.5V5.5V1.5C5.52944 1.5 1.5 5.52944 1.5 10.5H5.5ZM10.5 7.34211V3.34211C6.54681 3.34211 3.34211 6.54681 3.34211 10.5H7.34211H11.3421C11.3421 10.9651 10.9651 11.3421 10.5 11.3421V7.34211ZM10.5 5.5V9.5C11.0523 9.5 11.5 9.94772 11.5 10.5H15.5H19.5C19.5 5.52944 15.4706 1.5 10.5 1.5V5.5ZM13.6579 10.5H17.6579C17.6579 6.54681 14.4532 3.34211 10.5 3.34211V7.34211V11.3421C10.0349 11.3421 9.6579 10.9651 9.6579 10.5H13.6579Z" fill="#113C9C" mask="url(#path-4-inside-1_288_236)" />
  </Svg>
);

const SettingsIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <Path
      d="M20.7223 8.09799L18.6951 7.42226L19.6497 5.51307C19.7464 5.31323 19.7788 5.08829 19.7423 4.86927C19.7058 4.65026 19.6022 4.44798 19.4459 4.29033L17.1613 2.00573C17.0028 1.84708 16.7986 1.7421 16.5773 1.70554C16.3561 1.66899 16.1289 1.7027 15.9278 1.80194L14.0186 2.75654L13.3429 0.729358C13.2715 0.518052 13.1361 0.334247 12.9554 0.203524C12.7747 0.0728 12.5577 0.00166 12.3347 3.57548e-06H9.11694C8.89208 -0.000576864 8.67272 0.0695271 8.48987 0.200407C8.30703 0.331286 8.16994 0.516321 8.09799 0.729358L7.42226 2.75654L5.51307 1.80194C5.31323 1.70517 5.08829 1.6728 4.86927 1.70931C4.65026 1.74581 4.44798 1.84938 4.29033 2.00573L2.00573 4.29033C1.84708 4.44881 1.7421 4.65305 1.70554 4.8743C1.66899 5.09555 1.7027 5.32269 1.80194 5.52379L2.75654 7.43299L0.729358 8.10871C0.518052 8.18008 0.334247 8.31554 0.203524 8.49624C0.0728 8.67695 0.00166 8.89391 3.57548e-06 9.11694V12.3347C-0.000576864 12.5595 0.0695271 12.7789 0.200407 12.9617C0.331286 13.1446 0.516321 13.2817 0.729358 13.3536L2.75654 14.0294L1.80194 15.9385C1.70517 16.1384 1.6728 16.3633 1.70931 16.5823C1.74581 16.8014 1.84938 17.0036 2.00573 17.1613L4.29033 19.4459C4.44881 19.6045 4.65305 19.7095 4.8743 19.7461C5.09555 19.7826 5.32269 19.7489 5.52379 19.6497L7.43299 18.6951L8.10871 20.7223C8.18067 20.9353 8.31775 21.1203 8.5006 21.2512C8.68345 21.3821 8.9028 21.4522 9.12766 21.4516H12.3454C12.5703 21.4522 12.7896 21.3821 12.9725 21.2512C13.1553 21.1203 13.2924 20.9353 13.3644 20.7223L14.0401 18.6951L15.9493 19.6497C16.1478 19.744 16.3706 19.775 16.5874 19.7386C16.8041 19.7021 17.0045 19.6 17.1613 19.4459L19.4459 17.1613C19.6045 17.0028 19.7095 16.7986 19.7461 16.5773C19.7826 16.3561 19.7489 16.1289 19.6497 15.9278L18.6951 14.0186L20.7223 13.3429C20.9336 13.2715 21.1174 13.1361 21.2481 12.9554C21.3788 12.7747 21.45 12.5577 21.4516 12.3347V9.11694C21.4522 8.89208 21.3821 8.67272 21.2512 8.48987C21.1203 8.30703 20.9353 8.16994 20.7223 8.09799ZM19.3064 11.5624L18.0194 11.9915C17.7234 12.0875 17.4518 12.2467 17.2236 12.4581C16.9953 12.6696 16.8157 12.9281 16.6974 13.2159C16.579 13.5036 16.5246 13.8137 16.5381 14.1246C16.5515 14.4354 16.6324 14.7397 16.7752 15.0161L17.3865 16.2389L16.2067 17.4187L15.0161 16.7752C14.7411 16.6381 14.4398 16.5618 14.1327 16.5513C13.8255 16.5408 13.5197 16.5965 13.236 16.7144C12.9522 16.8324 12.6971 17.01 12.488 17.2351C12.2788 17.4603 12.1205 17.7277 12.0236 18.0194L11.5946 19.3064H9.88919L9.46016 18.0194C9.36416 17.7234 9.20492 17.4518 8.99348 17.2236C8.78205 16.9953 8.52348 16.8157 8.23573 16.6974C7.94797 16.579 7.6379 16.5246 7.32704 16.5381C7.01618 16.5515 6.71196 16.6324 6.43549 16.7752L5.21274 17.3865L4.03291 16.2067L4.67645 15.0161C4.81921 14.7397 4.90011 14.4354 4.91354 14.1246C4.92698 13.8137 4.87263 13.5036 4.75426 13.2159C4.63589 12.9281 4.45634 12.6696 4.22806 12.4581C3.99978 12.2467 3.72823 12.0875 3.43226 11.9915L2.14516 11.5624V9.88919L3.43226 9.46016C3.72823 9.36416 3.99978 9.20492 4.22806 8.99348C4.45634 8.78205 4.63589 8.52348 4.75426 8.23573C4.87263 7.94797 4.92698 7.6379 4.91354 7.32704C4.90011 7.01618 4.81921 6.71196 4.67645 6.43549L4.06508 5.24492L5.24492 4.06508L6.43549 4.67645C6.71196 4.81921 7.01618 4.90011 7.32704 4.91354C7.6379 4.92698 7.94797 4.87263 8.23573 4.75426C8.52348 4.63589 8.78205 4.45634 8.99348 4.22806C9.20492 3.99978 9.36416 3.72823 9.46016 3.43226L9.88919 2.14516H11.5624L11.9915 3.43226C12.0875 3.72823 12.2467 3.99978 12.4581 4.22806C12.6696 4.45634 12.9281 4.63589 13.2159 4.75426C13.5036 4.87263 13.8137 4.92698 14.1246 4.91354C14.4354 4.90011 14.7397 4.81921 15.0161 4.67645L16.2389 4.06508L17.4187 5.24492L16.7752 6.43549C16.6381 6.71054 16.5618 7.01183 16.5513 7.31896C16.5408 7.62608 16.5965 7.93187 16.7144 8.21563C16.8324 8.49938 17.01 8.75448 17.2351 8.96364C17.4603 9.17281 17.7277 9.33116 18.0194 9.42798L19.3064 9.85702V11.5624ZM10.7258 6.43549C9.87726 6.43549 9.04777 6.68711 8.34223 7.15854C7.63669 7.62996 7.08679 8.30002 6.76207 9.08397C6.43734 9.86792 6.35238 10.7306 6.51792 11.5628C6.68347 12.395 7.09208 13.1595 7.69209 13.7595C8.2921 14.3595 9.05657 14.7681 9.88881 14.9337C10.721 15.0992 11.5837 15.0143 12.3676 14.6895C13.1516 14.3648 13.8217 13.8149 14.2931 13.1094C14.7645 12.4038 15.0161 11.5744 15.0161 10.7258C15.0161 9.58794 14.5641 8.49668 13.7595 7.69209C12.9549 6.8875 11.8637 6.43549 10.7258 6.43549ZM10.7258 12.871C10.3015 12.871 9.88679 12.7452 9.53402 12.5094C9.18125 12.2737 8.9063 11.9387 8.74394 11.5467C8.58157 11.1547 8.53909 10.7234 8.62186 10.3073C8.70464 9.89119 8.90894 9.50896 9.20895 9.20895C9.50896 8.90894 9.89119 8.70464 10.3073 8.62186C10.7234 8.53909 11.1547 8.58157 11.5467 8.74394C11.9387 8.9063 12.2737 9.18125 12.5094 9.53402C12.7452 9.88679 12.871 10.3015 12.871 10.7258C12.871 11.2947 12.645 11.8404 12.2427 12.2427C11.8404 12.645 11.2947 12.871 10.7258 12.871Z"
      fill="#113C9C"
    />
  </Svg>
);







// --- Enums & Types for Circle Notifications ---
export enum NotificationType {
  LOCATION_REACHED = "location_reached", // Location arrived
  LOCATION_LEFT = "location_left", // Departed from location
  INVITE = "invite",
  MEMBERSHIP_ACCEPTED = "membership_accepted", // Join
  MEMBERSHIP_REJECTED = "membership_rejected",
  MEMBER_REMOVED = "member_removed", // Remove
  ROLE_UPDATED = "role_updated", // Change user role
  NICKNAME_UPDATED = "nickname_updated",
  LOCATION_ADDED = "location_added", // Location add to circle
  LOCATION_REMOVED = "location_removed", // Location remove from circle
  LOCATION_ASSIGNED = "location_assigned", // Assign location
  LOCATION_UNASSIGNED = "location_unassigned", // Unassign location
  CRASH_DETECTED = "crash_detected", // App crash
  SOS_ALERT = "sos_alert",
  LOW_BATTERY = "low_battery",
}

export enum NotificationRecipientType {
  ALL_MEMBERS = "all_members",
  CREATOR_AND_ADMINS = "creator_and_admins",
  TRIGGERING_USER_ONLY = "triggering_user_only",
  NONE = "none",
}

export interface CircleNotificationSettings {
  [key: string]: NotificationRecipientType;
}


// Helper: split array into chunks of 2
function splitIntoJourneys(history: LocationHistoryEntry[]): LocationHistoryEntry[][] {
  const journeys: LocationHistoryEntry[][] = [];
  for (let i = 0; i < history.length; i += 2) {
    journeys.push(history.slice(i, i + 2));
  }
  return journeys;
}





// --- Constants ---
const { height: WINDOW_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const SCREEN_HEIGHT = Dimensions.get("screen").height;
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 24;
const TOP_HEADER_HEIGHT = 60;
const TAB_BAR_HEIGHT = 85;
const HANDLE_HEIGHT = 30;

// Drawer height stops
const FULL_HEIGHT = SCREEN_HEIGHT; 
const MAX_HEIGHT = WINDOW_HEIGHT * (2 / 3);
const MIN_HEIGHT = TAB_BAR_HEIGHT + HANDLE_HEIGHT;
const MID_HEIGHT = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) / 2;
const INITIAL_SHEET_HEIGHT = MID_HEIGHT;

const COLORS = {
  primary: "#113C9C",
  accent: "#EF4444",
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  success: "#22C55E",
};

const STORAGE_KEYS = {
  lastSelectedCircleId: "mapScreen:lastSelectedCircleId",
  locationSharingEnabled: "user_location_sharing_enabled",
  notificationsEnabled: "user_notifications_enabled",
  mapStyle: "user_map_style",
  circles: "mapScreen:circlesCache",
};

const BACKGROUND_LOCATION_TASK_NAME = "circle-location-background-task";
const LAST_POSTED_LOCATION_STORAGE_KEY = "mapScreen:lastPostedPerCircle";
const isNativePlatform = Platform.OS === "ios" || Platform.OS === "android";
const CIRCLE_LOCATIONS_CACHE_KEY = "mapScreen:circleLocationsCache";
const LOCATION_PRESENCE_STORAGE_KEY = "mapScreen:locationPresenceCache";
const DEFAULT_LOCATION_RADIUS_METERS = 20;
const ASSIGNED_LOCATION_STROKE_COLOR = "rgba(79, 53, 155, 0.6)";
const ASSIGNED_LOCATION_FILL_COLOR = "rgba(79, 53, 155, 0.18)";
const USER_ACCURACY_STROKE_COLOR = "rgba(79, 70, 229, 0.35)";
const USER_ACCURACY_FILL_COLOR = "rgba(129, 140, 248, 0.14)";
const MAX_USER_ACCURACY_RADIUS = 250;
const MIN_CIRCLE_REFRESH_INTERVAL_MS = 4000;
const MIN_ASSIGNED_REFRESH_INTERVAL_MS = 4000;
const MIN_MEMBER_REFRESH_INTERVAL_MS = 3000;
const WEBP_MIME_TYPE = "image/webp";
const BATTERY_SYNC_MIN_INTERVAL_MS = 5 * 60 * 1000;
const LOW_BATTERY_THRESHOLD = 20;
const LOCATION_HISTORY_LIMIT = 100; // Limit for history items per fetch

// Google Maps API Key directly from app.json/config or hardcoded if necessary for reliability in this context
// In a real app, use Constants.expoConfig or similar, but for immediate stability we use the key found in app.json.
// Google Maps API Key removed as we migrated to OSM/Nominatim/OSRM.
// If needed for other features, add back here.
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";




const parseBooleanPreference = (value: string | null | undefined, fallback: boolean): boolean => {
  if (value === null || value === undefined) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
};

const ensureWebpFileName = (name: string): string => {
  const trimmed = name ? name.trim() : "";
  if (!trimmed) {
    return `avatar_${Date.now()}.webp`;
  }
  const normalized = trimmed.replace(/\s+/g, "_");
  const dotIndex = normalized.lastIndexOf(".");
  const base = dotIndex >= 0 ? normalized.slice(0, dotIndex) : normalized;
  return `${base}.webp`;
};

const isWebpResource = (uri: string, mimeType?: string | null): boolean => {
  const loweredMime = mimeType?.toLowerCase() ?? null;
  if (loweredMime && (loweredMime === WEBP_MIME_TYPE || loweredMime.endsWith("+webp"))) {
    return true;
  }
  const normalizedUri = uri?.toLowerCase?.() ?? "";
  if (!normalizedUri) {
    return false;
  }
  const [pathWithoutQuery] = normalizedUri.split("?");
  return pathWithoutQuery.endsWith(".webp");
};

const prepareImageAsWebp = async (uri: string, name: string, mimeType: string): Promise<PickedImage> => {
  const targetName = ensureWebpFileName(name);

  if (isWebpResource(uri, mimeType)) {
    return {
      uri,
      name: targetName,
      type: WEBP_MIME_TYPE,
    };
  }

  const manipulated = await manipulateAsync(
    uri,
    [],
    {
      compress: 0.9,
      format: SaveFormat.WEBP,
    }
  );

  return {
    uri: manipulated.uri,
    name: targetName,
    type: WEBP_MIME_TYPE,
  };
};

const normalizeIdentifier = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolveFullAvatarUrl = (raw: any): string | null => {
  if (!raw) return null;
  let url = typeof raw === 'string' ? raw : extractAvatarUrl(raw);
  if (typeof url !== 'string' || url.trim().length === 0) return null;

  let cleaned = url.trim();
  if (cleaned.startsWith("/")) {
    cleaned = `${API_BASE_URL}${cleaned}`;
  }
  return cleaned.replace("/api/uploads", "/uploads");
};

const resolveMembershipLocationId = (member: CircleMember | null | undefined): string | null => {
  if (!member) return null;
  const membership = (member as any)?.Membership ?? {};

  const locIdCandidates = [
    membership.locationId,
    membership.LocationId,
    membership.location_id,
    membership.specialLocationId,
    membership.assignedLocationId,
    (member as any).locationId,
    (member as any).LocationId,
  ];

  for (const candidate of locIdCandidates) {
    const normalized = normalizeIdentifier(candidate);
    if (normalized) return normalized;
  }
  return null;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calcJourneyStats = (history: JourneyHistoryPoint[]) => {
    let totalDist = 0, maxSpeed = 0;
    for (let i = 0; i < history.length - 1; i++) {
        const d = haversineDistanceMeters(
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

const isJourneyStationary = (history: JourneyHistoryPoint[]) => {
    if (!history || history.length < 2) return true;
    const s = history[0], e = history[history.length - 1];
    const disp = haversineDistanceMeters(
        Number(s.latitude), Number(s.longitude),
        Number(e.latitude), Number(e.longitude)
    );
    const st = calcJourneyStats(history);
    return (disp < 100 && st.topSpeedMph < 5) || parseFloat(st.distanceMiles) * 1609.34 < 150;
};

const formatJourneyTimeRange = (start: string, end: string) => {
    try {
        const fmt = (d: Date) =>
            d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
        return `${fmt(new Date(start))} - ${fmt(new Date(end))}`;
    } catch { return "N/A"; }
};

const getJourneyDuration = (start: string, end: string) => {
    try {
        const diffMs = new Date(end).getTime() - new Date(start).getTime();
        if (diffMs < 0) return "0 min";
        const mins = Math.floor(diffMs / 60000);
        if (mins < 60) return `${mins} min`;
        return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
    } catch { return "N/A"; }
};

const OSRM_BASE_URL = "https://router.project-osrm.org";

const encodeJourneyPolyline = (coords: { latitude: number; longitude: number }[]) => {
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

const buildJourneyMapUrl = (coords: { latitude: number; longitude: number }[], osrmEncoded?: string) => {
    const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
    if (!token || coords.length === 0) return null;
    const s = coords[0], e = coords[coords.length - 1];
    const startPin = `pin-s+00cc44(${s.longitude.toFixed(5)},${s.latitude.toFixed(5)})`;
    const endPin   = `pin-s+ee3333(${e.longitude.toFixed(5)},${e.latitude.toFixed(5)})`;
    const w = Math.min(Math.round(SCREEN_WIDTH), 1280);
    const h = Math.min(Math.round(SCREEN_HEIGHT * 0.25), 640);
    const base = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static`;
    const makeUrl = (poly: string) => {
        const path = `path-4+4285F4-1(${encodeURIComponent(poly)})`;
        const url = `${base}/${startPin},${endPin},${path}/auto/${w}x${h}?access_token=${token}&padding=40`;
        return url.length <= 8192 ? url : null;
    };
    if (osrmEncoded) { const u = makeUrl(osrmEncoded); if (u) return u; }
    const step = Math.ceil(coords.length / 20);
    const sampled = coords.filter((_, i) => i % step === 0 || i === coords.length - 1);
    return makeUrl(encodeJourneyPolyline(sampled));
};

type StoredLocationSnapshot = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

type PickedImage = {
  uri: string;
  name: string;
  type: string;
};

const readLastPostedLocationMap = async (): Promise<Record<string, StoredLocationSnapshot>> => {
  try {
    const raw = await AsyncStorage.getItem(LAST_POSTED_LOCATION_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, StoredLocationSnapshot>;
    }
  } catch (error) {
    console.warn("Failed to read cached location updates", error);
  }

  return {};
};

const writeLastPostedLocationMap = async (map: Record<string, StoredLocationSnapshot>) => {
  const mapKeys = Object.keys(map);
  if (!mapKeys.length) {
    await AsyncStorage.removeItem(LAST_POSTED_LOCATION_STORAGE_KEY).catch(() => undefined);
    return;
  }

  await AsyncStorage.setItem(LAST_POSTED_LOCATION_STORAGE_KEY, JSON.stringify(map)).catch(() => undefined);
};

const getLastPostedLocationForCircle = async (circleId: string): Promise<StoredLocationSnapshot | null> => {
  const map = await readLastPostedLocationMap();
  return map[circleId] ?? null;
};

const setLastPostedLocationForCircle = async (
  circleId: string,
  coords: { latitude: number; longitude: number }
) => {
  const map = await readLastPostedLocationMap();
  map[circleId] = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    timestamp: Date.now(),
  };
  await writeLastPostedLocationMap(map);
};



const handleCreateCircleAction = async (name: string, relationship?: string): Promise<any> => {
  const body: any = {
    name: name.trim(),
    location: { latitude: 0, longitude: 0, name: "Default" },
  };

  if (relationship) {
    body.relationship = relationship;
  }

  const response = await authenticatedFetch(`${API_BASE_URL}/circles`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create circle");
  }

  return await response.json();
};

const handleUpdateCircleNameAction = async (circleId: any, name: string): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/circles/${circleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update circle name");
  }
};

const handleJoinCircleAction = async (pin: string): Promise<any> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/circles/join-by-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ code: pin.toUpperCase().trim() }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Invalid or expired code.");
  }

  return await response.json();
};

const removeLastPostedLocationForCircle = async (circleId: string) => {
  const map = await readLastPostedLocationMap();
  if (map[circleId]) {
    delete map[circleId];
    await writeLastPostedLocationMap(map);
  }
};

const clearAllPostedLocations = async (): Promise<void> => {
  await AsyncStorage.removeItem(LAST_POSTED_LOCATION_STORAGE_KEY).catch(() => undefined);
};


const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const getLocationNameFromOSM = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}`;

    // Add 5s timeout to prevent stalling the reporter
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NearuApp/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(id);
    const data = await response.json();

    if (data && data.display_name) {
      return data.display_name;
    } else {
      console.warn("Nominatim reverse geocoding returned no display_name");
      return "Unknown Location";
    }
  } catch (error) {
    console.warn("Error fetching location name from OSM:", error);
    return "Unknown Location";
  }
};

interface LocationUpdatePayload {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  status?: string;
  userId?: string | null;
  battery?: string | null;
  name?: string | null;
}

const maybePostCircleLocationUpdate = async (
  circleIdLike: unknown,
  coords: LocationUpdatePayload,
  force: boolean = false
): Promise<{ success: boolean; name: string | null; data?: any[] | null }> => {
  const circleId = normalizeIdentifier(circleIdLike);
  if (!circleId) {
    return { success: false, name: null };
  }

  const { latitude, longitude } = coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { success: false, name: null };
  }

  // Removed distance filter to ensure strict 30s frequency

  // Check location sharing preference
  const sharingEnabled = await AsyncStorage.getItem(STORAGE_KEYS.locationSharingEnabled);
  if (sharingEnabled !== null && sharingEnabled !== "true") {
    console.log("Location sharing is disabled, skipping update.");
    return { success: false, name: null };
  }

  // Throttle updates to prevent duplicate calls (8-second window for 10s interval)
  const lastPosted = await getLastPostedLocationForCircle(circleId);
  if (!force && lastPosted && Date.now() - lastPosted.timestamp < 8000) {
    console.log("Throttled: Skipping location update.");
    // Return mock success so the caller thinks it went through and won't aggressively retry
    return { success: true, name: "Throttled" };
  }

  // Set the "last posted" timestamp IMMEDIATELY to prevent overlapping calls from passing the check
  await setLastPostedLocationForCircle(circleId, { latitude, longitude });

  // Allow 'active' and 'inactive' (iOS partially covered).
  // Background updates should be handled solely by BackgroundLocationService.ts
  // if (AppState.currentState === 'background') {
  //   return { success: false, name: "Background" };
  // }

  // OPTIMIZATION: Cache location names to prevent Nominatim rate-limiting/delays
  let realLocationName = "Unknown Location";
  try {
    const lastGeoStr = await AsyncStorage.getItem(`last_geocoded_name_${circleId}`);
    const lastGeoLat = await AsyncStorage.getItem(`last_geocoded_lat_${circleId}`);
    const lastGeoLng = await AsyncStorage.getItem(`last_geocoded_lng_${circleId}`);

    let shouldFetch = true;
    if (lastGeoStr && lastGeoLat && lastGeoLng) {
      const gLat = parseFloat(lastGeoLat);
      const gLng = parseFloat(lastGeoLng);
      if (Math.abs(latitude - gLat) < 0.0005 && Math.abs(longitude - gLng) < 0.0005) {
        shouldFetch = false;
        realLocationName = lastGeoStr;
      }
    }

    if (shouldFetch) {
      realLocationName = await getLocationNameFromOSM(latitude, longitude);
      await AsyncStorage.setItem(`last_geocoded_name_${circleId}`, realLocationName);
      await AsyncStorage.setItem(`last_geocoded_lat_${circleId}`, latitude.toString());
      await AsyncStorage.setItem(`last_geocoded_lng_${circleId}`, longitude.toString());
    }
  } catch (e) {
    console.warn("Geocode cache error", e);
  }

  // Check drive detection setting
  const isDriveDetectionEnabled = (await AsyncStorage.getItem("user_drive_detection_enabled")) === "true";

  const requestData = {
    latitude,
    longitude,
    name: coords.name || realLocationName,
    speed: coords.speed !== null && coords.speed !== undefined ? String(coords.speed) : "0",
    userId: coords.userId,
    battery: coords.battery,
    run: coords.status || 'foreground',
    time: formatToSLTime(new Date()),
  };

  const response = await authenticatedFetch(`${API_BASE_URL}/profile/circles/${circleId}/live-location`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(requestData),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message ?? "Failed to post location update.");
  }

  // Use new Connection Socket
  // await SocketService.emitLocationUpdate(circleId, requestData);


  // Alert.alert(
  //   "Location Update Successful",
  //   `Data Sent:\n${JSON.stringify(requestData, null, 2)}`
  // );

  // Since we use the REST API response, we return the payload data
  return { success: true, name: realLocationName, data: payload.data || null };
};

// Background task registration moved to services/BackgroundLocationService.ts
// const registerBackgroundLocationTask = ... removed



type CachedCircleLocation = {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  name?: string;
  metadata?: Record<string, unknown> | null;
};

type CachedCircleLocationMap = Record<string, CachedCircleLocation[]>;
type LocationPresenceMap = Record<string, Record<string, boolean>>;

const coerceFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const extractRadiusFromMetadata = (metadata: LocationPoint["metadata"] | null | undefined): number | null => {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const metadataRecord = metadata as Record<string, unknown>;
  const candidates: unknown[] = [
    metadataRecord.radius,
    metadataRecord.Radius,
    (metadataRecord as any)?.geofenceRadius,
    (metadataRecord as any)?.geofence_radius,
    (metadataRecord as any)?.geofence?.radius,
  ];

  for (const candidate of candidates) {
    const numeric = coerceFiniteNumber(candidate);
    if (numeric !== null) {
      return numeric;
    }
    if (candidate && typeof candidate === "object") {
      const nestedRadius = coerceFiniteNumber((candidate as any)?.radius);
      if (nestedRadius !== null) {
        return nestedRadius;
      }
    }
  }

  return null;
};

const getRadiusForLocation = (
  location: LocationPoint,
  fallbackRadius: number = DEFAULT_LOCATION_RADIUS_METERS
): number => {
  const directRadius = coerceFiniteNumber((location as any)?.radius);
  if (directRadius !== null) {
    return directRadius;
  }

  const metadataRadius = extractRadiusFromMetadata(location.metadata);
  if (metadataRadius !== null) {
    return metadataRadius;
  }

  return fallbackRadius;
};

const sanitizeLocationForCache = (
  location: LocationPoint,
  fallbackRadius: number = DEFAULT_LOCATION_RADIUS_METERS
): CachedCircleLocation | null => {
  const id = normalizeIdentifier(location.id);
  if (!id) {
    return null;
  }

  if (!isValidCoordinate(location.latitude, location.longitude)) {
    return null;
  }

  const radius = getRadiusForLocation(location, fallbackRadius);
  const name =
    typeof location.name === "string" && location.name.trim().length > 0
      ? location.name.trim()
      : undefined;

  return {
    id,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    radius,
    name,
    metadata: location.metadata && typeof location.metadata === "object" ? { ...location.metadata } : null,
  };
};

const getPlaceTypeIcon = (type?: string | null) => {
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

const readCircleLocationsCache = async (): Promise<CachedCircleLocationMap> => {
  try {
    const raw = await AsyncStorage.getItem(CIRCLE_LOCATIONS_CACHE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as CachedCircleLocationMap;
    }
  } catch (error) {
    console.warn("Failed to read circle locations cache", error);
  }
  return {};
};

const writeCircleLocationsCache = async (map: CachedCircleLocationMap): Promise<void> => {
  const hasEntries = Object.values(map).some((locations) => locations.length > 0);
  if (!hasEntries) {
    await AsyncStorage.removeItem(CIRCLE_LOCATIONS_CACHE_KEY).catch(() => undefined);
    return;
  }

  await AsyncStorage.setItem(CIRCLE_LOCATIONS_CACHE_KEY, JSON.stringify(map)).catch(() => undefined);
};

const readCachedCircleLocations = async (circleId: string): Promise<CachedCircleLocation[]> => {
  const map = await readCircleLocationsCache();
  return map[circleId] ?? [];
};

const cacheCircleLocations = async (
  circleId: string,
  locations: LocationPoint[],
  fallbackRadius: number = DEFAULT_LOCATION_RADIUS_METERS
): Promise<CachedCircleLocation[]> => {
  const sanitized = locations
    .map((location) => sanitizeLocationForCache(location, fallbackRadius))
    .filter((location): location is CachedCircleLocation => location !== null);

  const map = await readCircleLocationsCache();
  if (sanitized.length > 0) {
    map[circleId] = sanitized;
  } else {
    delete map[circleId];
  }

  await writeCircleLocationsCache(map);
  return sanitized;
};

const removeCachedCircleLocations = async (circleId: string): Promise<void> => {
  const map = await readCircleLocationsCache();
  if (!map[circleId]) {
    return;
  }

  delete map[circleId];
  await writeCircleLocationsCache(map);
};

const clearCircleLocationsCache = async (): Promise<void> => {
  await AsyncStorage.removeItem(CIRCLE_LOCATIONS_CACHE_KEY).catch(() => undefined);
};

const readLocationPresenceMap = async (): Promise<LocationPresenceMap> => {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_PRESENCE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as LocationPresenceMap;
    }
  } catch (error) {
    console.warn("Failed to read location presence map", error);
  }
  return {};
};

const writeLocationPresenceMap = async (map: LocationPresenceMap): Promise<void> => {
  const hasEntries = Object.values(map).some((circle) => Object.keys(circle).length > 0);
  if (!hasEntries) {
    await AsyncStorage.removeItem(LOCATION_PRESENCE_STORAGE_KEY).catch(() => undefined);
    return;
  }

  await AsyncStorage.setItem(LOCATION_PRESENCE_STORAGE_KEY, JSON.stringify(map)).catch(() => undefined);
};

const clearLocationPresenceMap = async (): Promise<void> => {
  await AsyncStorage.removeItem(LOCATION_PRESENCE_STORAGE_KEY).catch(() => undefined);
};


const markCircleLocationReached = async (
  circleId: string,
  locationId: string,
  coords: LocationUpdatePayload
): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/circles/${circleId}/mark-location-reached`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      locationId,
      latitude: coords.latitude,
      longitude: coords.longitude,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message ?? "Failed to notify members that the location was reached.");
  }
};

const markCircleLocationLeft = async (circleId: string, locationId: string): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/circles/${circleId}/mark-location-left`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      locationId,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message ?? "Failed to notify members that the location was left.");
  }
};

type PresenceSnapshot = Record<string, boolean>;

interface PresenceTransitions {
  validIds: Set<string>;
  entered: CachedCircleLocation[];
  exited: CachedCircleLocation[];
}

const computePresenceTransitions = (
  locations: CachedCircleLocation[],
  coords: LocationUpdatePayload,
  snapshot: PresenceSnapshot
): PresenceTransitions => {
  const validIds = new Set<string>();
  const entered: CachedCircleLocation[] = [];
  const exited: CachedCircleLocation[] = [];

  for (const location of locations) {
    validIds.add(location.id);

    const distance = haversineDistanceMeters(
      coords.latitude,
      coords.longitude,
      location.latitude,
      location.longitude
    );

    const isInside = distance <= location.radius;
    const previouslyInside = snapshot[location.id] ?? false;

    if (isInside && !previouslyInside) {
      entered.push(location);
    } else if (!isInside && previouslyInside) {
      exited.push(location);
    }
  }

  return {
    validIds,
    entered,
    exited,
  };
};

const prunePresenceSnapshot = (snapshot: PresenceSnapshot, validIds: Set<string>): boolean => {
  let changed = false;
  for (const locationId of Object.keys(snapshot)) {
    if (!validIds.has(locationId)) {
      delete snapshot[locationId];
      changed = true;
    }
  }
  return changed;
};

const notifyLocationEntries = async (
  circleId: string,
  entered: CachedCircleLocation[],
  coords: LocationUpdatePayload,
  snapshot: PresenceSnapshot
): Promise<CachedCircleLocation[]> => {
  const processed: CachedCircleLocation[] = [];
  for (const location of entered) {
    try {
      // Check metadata for arrival notification toggle
      const notifyArrival = location.metadata?.notifyOnArrival !== false;

      if (notifyArrival) {
        await markCircleLocationReached(circleId, location.id, coords);
      } else {
        console.log(`Skipping arrival alert for ${location.name || location.id} (disabled in metadata)`);
      }

      snapshot[location.id] = true;
      processed.push(location);
    } catch (error) {
      console.warn("Failed to mark location reached", error);
    }
  }
  return processed;
};

const notifyLocationExits = async (
  circleId: string,
  exited: CachedCircleLocation[],
  snapshot: PresenceSnapshot
): Promise<boolean> => {
  let changed = false;
  for (const location of exited) {
    try {
      // Check metadata for departure notification toggle
      const notifyDeparture = location.metadata?.notifyOnDeparture !== false;

      if (notifyDeparture) {
        await markCircleLocationLeft(circleId, location.id);
      } else {
        console.log(`Skipping departure alert for ${location.name || location.id} (disabled in metadata)`);
      }

      snapshot[location.id] = false;
      changed = true;
    } catch (error) {
      console.warn("Failed to mark location left", error);
    }
  }
  return changed;
};

const handleLocationPresence = async (
  circleId: string,
  coords: LocationUpdatePayload,
  candidateLocations?: LocationPoint[]
): Promise<CachedCircleLocation[]> => {
  let locations: CachedCircleLocation[] = [];

  if (candidateLocations?.length) {
    locations = candidateLocations
      .map((loc) => sanitizeLocationForCache(loc))
      .filter((loc): loc is CachedCircleLocation => loc !== null);
  }

  if (!locations.length) {
    locations = await readCachedCircleLocations(circleId);
  }

  if (!locations.length) {
    return [];
  }

  const presenceMap = await readLocationPresenceMap();
  const circlePresenceSnapshot: PresenceSnapshot = { ...presenceMap[circleId] };

  const { validIds, entered, exited } = computePresenceTransitions(locations, coords, circlePresenceSnapshot);

  let hasChanges = prunePresenceSnapshot(circlePresenceSnapshot, validIds);
  const processedEntries = await notifyLocationEntries(circleId, entered, coords, circlePresenceSnapshot);
  const entriesChanged = processedEntries.length > 0;
  const exitsChanged = await notifyLocationExits(circleId, exited, circlePresenceSnapshot);

  hasChanges = hasChanges || entriesChanged || exitsChanged;

  if (hasChanges) {
    const cleanedEntries = Object.fromEntries(
      Object.entries(circlePresenceSnapshot).filter(([, inside]) => inside)
    );

    if (Object.keys(cleanedEntries).length > 0) {
      presenceMap[circleId] = cleanedEntries;
    } else {
      delete presenceMap[circleId];
    }

    await writeLocationPresenceMap(presenceMap);
  }
  return processedEntries;
};

const processCircleLocationUpdate = async (
  circleIdLike: unknown,
  coords: LocationUpdatePayload,
  candidateLocations?: LocationPoint[],
  options?: { onLocationsArrived?: (arrived: CachedCircleLocation[]) => void }
): Promise<{ success: boolean; name: string | null }> => {
  const circleId = normalizeIdentifier(circleIdLike);
  if (!circleId) {
    return { success: false, name: null };
  }

  let arrivedLocations: CachedCircleLocation[] = [];
  try {
    arrivedLocations = await handleLocationPresence(circleId, coords, candidateLocations);
  } catch (error) {
    console.warn("Location presence handling failed", error);
  }

  if (arrivedLocations.length && options?.onLocationsArrived) {
    try {
      options.onLocationsArrived(arrivedLocations);
    } catch (callbackError) {
      console.warn("onLocationsArrived handler failed", callbackError);
    }
  }

  // --- Journey Logic ---
  // const now = Date.now();
  // const LAST_UPDATE_TIME_KEY = `journey_last_update_time_${circleId}`;

  // try {
  //   const lastUpdateStr = await AsyncStorage.getItem(LAST_UPDATE_TIME_KEY);
  //   const lastUpdateTime = lastUpdateStr ? parseInt(lastUpdateStr, 10) : 0;

  //   // 5 minutes = 5 * 60 * 1000 ms = 300000 ms
  //   if (lastUpdateTime > 0 && (now - lastUpdateTime) > 300000) {
  //     // It's been more than 5 mins since last update.
  //     // 1. Send "Journey End" for the PREVIOUS location (last known)
  //     const previousLoc = await getLastPostedLocationForCircle(circleId);
  //     if (previousLoc) {
  //       if (previousLoc) {
  //         await maybePostCircleLocationUpdate(circleId, {
  //           latitude: previousLoc.latitude,
  //           longitude: previousLoc.longitude,
  //           // Force journey_end status
  //           status: "journey_end",
  //           speed: 0
  //         });
  //       }

  //       // 2. Send "Journey Start" for CURRENT location
  //       await maybePostCircleLocationUpdate(circleId, { ...coords, status: "journey_start", speed: coords.speed ?? 0 });
  //     }

  //     await AsyncStorage.setItem(LAST_UPDATE_TIME_KEY, now.toString());
  //   }
  // } catch (jError) {
  //   console.warn("Journey logic failed", jError);
  // }
  // ---------------------

  return maybePostCircleLocationUpdate(circleId, coords);
};

const LOCATION_HISTORY_FILTERS: { key: LocationHistoryFilterKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "custom", label: "Custom" },
];

const DEFAULT_MEMBER_AVATAR = "https://i.pravatar.cc/120?u=";

const AVATAR_FIELD_KEYS = [
  "avatar",
  "Avatar",
  "profileImage",
  "profile_image",
  "profileImageUrl",
  "profile_image_url",
  "profileImageURL",
  "profilePicture",
  "profile_picture",
  "profilePic",
  "profile_pic",
  "photo",
  "photoUrl",
  "photo_url",
  "photoURL",
  "picture",
  "image",
  "imageUrl",
  "image_url",
  "imageURL",
];

const extractAvatarUrl = (source: any, visited = new WeakSet<object>()): string | null => {
  if (!source) {
    return null;
  }

  if (typeof source === "string") {
    const trimmed = source.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof source !== "object") {
    return null;
  }

  if (visited.has(source)) {
    return null;
  }
  visited.add(source);

  if (Array.isArray(source)) {
    for (const item of source) {
      const resolved = extractAvatarUrl(item, visited);
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }

  const extractFromObject = (value: unknown): string | null => {
    if (!value) {
      return null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === "object") {
      const nested = value as Record<string, unknown>;
      const nestedKeys = ["url", "uri", "href", "source", "path"];
      for (const key of nestedKeys) {
        if (key in nested) {
          const resolved = extractFromObject(nested[key]);
          if (resolved) {
            return resolved;
          }
        }
      }
    }
    return null;
  };

  for (const key of AVATAR_FIELD_KEYS) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const resolved = extractFromObject((source as Record<string, unknown>)[key]);
      if (resolved) {
        return resolved;
      }
    }
  }

  const relatedObjects = [
    (source as Record<string, unknown>).profile,
    (source as Record<string, unknown>).user,
    (source as Record<string, unknown>).data,
    (source as Record<string, unknown>).attributes,
  ];

  for (const candidate of relatedObjects) {
    if (candidate && typeof candidate === "object") {
      const resolved = extractAvatarUrl(candidate, visited);
      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
};

const toDateAtMidnight = (date: Date): Date => {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const toDateAtEndOfDay = (date: Date): Date => {
  const clone = new Date(date);
  clone.setHours(23, 59, 59, 999);
  return clone;
};

const startOfWeekLocal = (date: Date): Date => {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = (day === 0 ? 6 : day - 1); // start week on Monday
  clone.setDate(clone.getDate() - diff);
  return toDateAtMidnight(clone);
};

const startOfMonthLocal = (date: Date): Date => {
  const clone = new Date(date.getFullYear(), date.getMonth(), 1);
  return toDateAtMidnight(clone);
};

const parseDateInput = (value: string): Date | null => {
  if (!value) {
    return null;
  }
  const parts = value.trim().split("-");
  if (parts.length !== 3) {
    return null;
  }
  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const result = new Date(year, month - 1, day);
  if (Number.isNaN(result.getTime())) {
    return null;
  }
  return result;
};

const calculateHeadingDegrees = (
  from: { latitude: number; longitude: number } | null,
  to: { latitude: number; longitude: number } | null
): number => {
  if (!from || !to) {
    return 0;
  }
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLon = ((to.longitude - from.longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  const bearing = Math.atan2(y, x);
  const bearingDeg = (bearing * 180) / Math.PI;
  return (bearingDeg + 360) % 360;
};

// --- Helpers ---
const extractBatteryLevelInfo = (candidate: unknown): BatteryLevelInfo | null => {
  if (candidate === null || candidate === undefined) {
    return null;
  }

  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    const clamped = Math.max(0, Math.min(100, candidate));
    return {
      batteryLevel: clamped,
      deviceId: null,
      updatedAt: null,
    };
  }

  if (typeof candidate === "string") {
    const trimmed = candidate.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(0, Math.min(100, parsed));
      return {
        batteryLevel: clamped,
        deviceId: null,
        updatedAt: null,
      };
    }
    try {
      const parsedJson = JSON.parse(trimmed);
      if (parsedJson && typeof parsedJson === "object") {
        return extractBatteryLevelInfo(parsedJson);
      }
    } catch {
      // ignore non-JSON strings
    }
    return null;
  }

  if (typeof candidate !== "object") {
    return null;
  }

  const record = candidate as Record<string, unknown>;

  const numericKeys = [
    "level",
    "batteryLevel",
    "battery_level",
    "percentage",
    "percent",
    "value",
    "charge",
    "battery",
    "current",
  ];

  for (const key of numericKeys) {
    if (!(key in record)) {
      continue;
    }
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      const clamped = Math.max(0, Math.min(100, value));
      const deviceId =
        asNonEmptyString(record.deviceId) ??
        asNonEmptyString(record.device_id) ??
        asNonEmptyString(record.device) ??
        asNonEmptyString(record.deviceName) ??
        asNonEmptyString(record.device_name) ??
        null;
      const updatedAt =
        asNonEmptyString(record.updatedAt) ??
        asNonEmptyString(record.updated_at) ??
        asNonEmptyString(record.timestamp) ??
        asNonEmptyString(record.updated) ??
        asNonEmptyString(record.lastUpdated) ??
        asNonEmptyString(record.last_updated) ??
        null;
      return {
        batteryLevel: clamped,
        deviceId,
        updatedAt,
      };
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        const parsed = Number(trimmed);
        if (Number.isFinite(parsed)) {
          const clamped = Math.max(0, Math.min(100, parsed));
          const deviceId =
            asNonEmptyString(record.deviceId) ??
            asNonEmptyString(record.device_id) ??
            asNonEmptyString(record.device) ??
            asNonEmptyString(record.deviceName) ??
            asNonEmptyString(record.device_name) ??
            null;
          const updatedAt =
            asNonEmptyString(record.updatedAt) ??
            asNonEmptyString(record.updated_at) ??
            asNonEmptyString(record.timestamp) ??
            asNonEmptyString(record.updated) ??
            asNonEmptyString(record.lastUpdated) ??
            asNonEmptyString(record.last_updated) ??
            null;
          return {
            batteryLevel: clamped,
            deviceId,
            updatedAt,
          };
        }
      }
    }
    if (value && typeof value === "object") {
      const nested = extractBatteryLevelInfo(value);
      if (nested) {
        return nested;
      }
    }
  }

  const nestedKeys = [
    "batteryLevel",
    "battery_level",
    "data",
    "payload",
    "info",
    "latest",
    "details",
  ];

  for (const key of nestedKeys) {
    const nestedCandidate = record[key];
    if (nestedCandidate && typeof nestedCandidate === "object" && nestedCandidate !== record) {
      const nested = extractBatteryLevelInfo(nestedCandidate);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};
const extractCircleMembers = (circle: any): CircleMember[] => {
  if (!circle) {
    console.log("extractCircleMembers: No circle data provided");
    return [];
  }

  console.log("extractCircleMembers: Processing circle:", circle.id, circle.name);
  console.log("extractCircleMembers: Full circle object keys:", Object.keys(circle));

  // Check data.members[] first as this is where the API puts member data
  const candidateLists = [
    circle?.data?.members,      // PRIORITY: API returns members here
    circle?.data?.Members,
    circle?.members,
    circle?.Members,
    circle?.users,
    circle?.Users,
    circle?.param?.users,
    circle?.data?.users,
  ];

  console.log("extractCircleMembers: Checking candidate member lists...");
  candidateLists.forEach((list, index) => {
    if (Array.isArray(list)) {
      console.log(`extractCircleMembers: ✅ Found member list at index ${index} with ${list.length} members`);
      console.log(`extractCircleMembers: First member sample:`, list[0]);
    }
  });

  let rawMembers = candidateLists.find((value) => Array.isArray(value)) ?? [];

  if (!Array.isArray(rawMembers)) rawMembers = [];

  console.log(`extractCircleMembers: Initial rawMembers count: ${rawMembers.length}`);

  // --- FIX: Explicitly check for creator and add if missing ---
  const creator = circle?.creator ?? circle?.Creator ?? circle?.data?.creator;
  if (creator && typeof creator === "object") {
    console.log("extractCircleMembers: Found creator:", {
      id: creator.id,
      name: creator.name,
      hasLiveLocation: !!creator.liveLocation,
      hasBatteryLevel: !!creator.batteryLevel,
      liveLocation: creator.liveLocation,
      batteryLevel: creator.batteryLevel
    });

    const creatorId = creator.id ?? creator.userId ?? creator.UserId;
    if (creatorId) {
      const exists = rawMembers.some((m: any) => (m.id ?? m.userId) === creatorId);
      if (!exists) {
        console.log("extractCircleMembers: Adding creator to members list");
        // Normalize creator to look like a member
        const normalizedCreator = {
          ...creator,
          // Ensure liveLocation is preserved
          liveLocation: creator.liveLocation ?? creator.currentLocation ?? creator.location,
          // Ensure batteryLevel is preserved
          batteryLevel: creator.batteryLevel,
          // Creator typically has 'admin' or 'creator' role implicitly,
          // but we can mock a Membership object if missing
          Membership: creator.Membership ?? {
            role: creator.role ?? "creator",
            status: creator.status ?? "accepted",
            nickname: creator.name ?? creator.email,
          },
        };
        rawMembers = [normalizedCreator, ...rawMembers];
        console.log("extractCircleMembers: Creator added successfully");
      } else {
        console.log("extractCircleMembers: Creator already exists in members list");
      }
    } else {
      console.log("extractCircleMembers: Creator has no valid ID");
    }
  } else {
    console.log("extractCircleMembers: No creator found in circle data");
  }
  // ------------------------------------------------------------

  console.log(`extractCircleMembers: Total rawMembers before mapping: ${rawMembers.length}`);

  return rawMembers
    .filter(Boolean)
    .map((member: any, index: number) => {
      const memberId = member?.id ?? member?.userId ?? member?.UserId ?? undefined;
      const memberName = member?.name ?? member?.Name ?? "Unknown";

      console.log(`extractCircleMembers: Processing member ${index + 1}/${rawMembers.length}:`, {
        id: memberId,
        name: memberName,
        hasLiveLocation: !!member?.liveLocation,
        hasBatteryLevel: !!member?.batteryLevel,
        liveLocation: member?.liveLocation,
        batteryLevel: member?.batteryLevel,
        memberKeys: Object.keys(member || {})
      });

      // Log the full member object for the first member to see structure
      if (index === 0) {
        console.log("extractCircleMembers: Full first member object:", JSON.stringify(member, null, 2));
      }

      return {
        id: memberId,
        name: memberName,
        email: member?.email ?? member?.Email,

        // Avatar Fix: Use centralized resolver
        avatar: resolveFullAvatarUrl(member?.profileLink ?? member?.avatar ?? member?.Membership),

        // Battery Fix: Check nested object property first
        batteryLevel: (() => {
          // Debug Log
          if (member?.batteryLevel) {
            console.log(`[BatteryDebug] ${memberName}:`, JSON.stringify(member.batteryLevel));
          }

          let result = extractBatteryLevelInfo(member?.batteryLevel);

          if (!result) {
            result = extractBatteryLevelInfo(member?.latestBatteryLevel) ??
              extractBatteryLevelInfo(member?.Membership?.batteryLevel) ??
              null;
          }

          console.log(`[ExtractedResult] ${memberName}:`, JSON.stringify(result));
          return result;
        })(),

        currentLocation:
          member?.liveLocation ??
          member?.currentLocation ??
          member?.current_location ??
          member?.latestLocation ??
          member?.latest_location ??
          member?.lastLocation ??
          member?.last_location ??
          member?.lastKnownLocation ??
          member?.location ??
          null,

        Membership: member?.Membership ?? member?.membership ?? undefined,

        locationHistory: member?.todayLocationHistory ?? member?.locationHistory ?? [],
        journeys: member?.journeys ?? [],
      };
    });
};
const parseAssignedLocationsList = (payload: any): any[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }
  if (payload && Array.isArray(payload.assignedLocations)) {
    return payload.assignedLocations;
  }
  return [];
};

const buildAssignedLocationRecord = (item: any): { circleId: string; record: AssignedLocationRecord } | null => {
  if (!item) {
    return null;
  }

  const circleId = normalizeIdentifier(item.circleId ?? item.CircleId ?? item.circle_id);
  if (!circleId) {
    return null;
  }

  const locationId = normalizeIdentifier(item.locationId ?? item.LocationId ?? item.location_id ?? item.location?.id);

  const locationCandidate: Record<string, unknown> =
    item.location && typeof item.location === "object" ? { ...item.location } : {};

  if (locationCandidate.id === undefined) {
    locationCandidate.id = item.location?.id ?? item.locationId ?? item.location_id;
  }

  const latFallback = typeof item.latitude === "number" ? item.latitude : item.lat;
  const lngFallback = typeof item.longitude === "number" ? item.longitude : item.lng;

  if (locationCandidate.latitude === undefined) {
    locationCandidate.latitude = item.location?.latitude ?? (locationCandidate as any).lat ?? latFallback;
  }

  if (locationCandidate.longitude === undefined) {
    locationCandidate.longitude = item.location?.longitude ?? (locationCandidate as any).lng ?? lngFallback;
  }

  if (locationCandidate.name === undefined) {
    locationCandidate.name = item.location?.name ?? item.name;
  }

  if (locationCandidate.metadata === undefined) {
    locationCandidate.metadata = item.location?.metadata ?? item.metadata;
  }

  const formattedFallback =
    item.location?.formattedAddress ?? item.location?.formatted_address ?? item.formattedAddress;
  if ((locationCandidate as any).formattedAddress === undefined && formattedFallback !== undefined) {
    (locationCandidate as any).formattedAddress = formattedFallback;
  }

  if ((locationCandidate as any).address === undefined && item.location?.address) {
    (locationCandidate as any).address = item.location.address;
  }

  const locationPoint = normalizeLocationPoint(locationCandidate);
  const assignmentId =
    normalizeIdentifier(item.id ?? item.assignmentId ?? item.assignment_id) ?? `${circleId}:${locationId ?? "pending"}`;

  let normalizedMetadata: Record<string, unknown> | null = null;
  if (item.metadata && typeof item.metadata === "object") {
    normalizedMetadata = { ...item.metadata };
  } else if (item.location?.metadata && typeof item.location.metadata === "object") {
    normalizedMetadata = { ...item.location.metadata };
  }

  const latitudeValue = typeof item.latitude === "number" ? item.latitude : undefined;
  const longitudeValue = typeof item.longitude === "number" ? item.longitude : undefined;

  return {
    circleId,
    record: {
      assignmentId,
      circleId,
      locationId,
      locationPoint,
      latitude: latitudeValue,
      longitude: longitudeValue,
      metadata: normalizedMetadata,
      raw: item,
    },
  };
};

const normalizeLocationPoint = (loc: any): LocationPoint | null => {
  const latitudeCandidate = loc?.latitude ?? loc?.lat ?? loc?.Latitude ?? loc?.Lat;
  const longitudeCandidate = loc?.longitude ?? loc?.lng ?? loc?.lon ?? loc?.Longitude ?? loc?.Lon;
  const latitude = typeof latitudeCandidate === "string" ? Number(latitudeCandidate) : latitudeCandidate;
  const longitude = typeof longitudeCandidate === "string" ? Number(longitudeCandidate) : longitudeCandidate;

  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  let metadata: LocationPoint["metadata"] | undefined;
  if (loc?.metadata) {
    if (typeof loc.metadata === "object") {
      metadata = { ...loc.metadata };
    } else if (typeof loc.metadata === "string" && loc.metadata.trim().length > 0) {
      try {
        const parsed = JSON.parse(loc.metadata);
        if (parsed && typeof parsed === "object") {
          metadata = parsed;
        }
      } catch (e) {
        console.warn("Failed to parse location metadata string", e);
      }
    }
  }

  const mergeMetadata = (updates: Partial<NonNullable<LocationPoint["metadata"]>>) => {
    metadata = { ...(metadata ?? {}), ...updates };
  };

  const inferredAddress = loc?.address ?? loc?.Address ?? loc?.formattedAddress ?? loc?.formatted_address;
  if (typeof inferredAddress === "string" && inferredAddress.trim().length > 0) {
    mergeMetadata({
      address: metadata?.address ?? inferredAddress.trim(),
      formattedAddress: metadata?.formattedAddress ?? inferredAddress.trim(),
    });
  }

  if (loc?.radius !== undefined && loc?.radius !== null) {
    const numericRadius = Number(loc.radius);
    if (Number.isFinite(numericRadius) && (metadata?.radius === undefined || metadata?.radius === null)) {
      mergeMetadata({ radius: numericRadius });
    }
  }

  const rawId = loc?.id ?? loc?.locationId ?? loc?.LocationId;
  let resolvedId: number | string | undefined;

  if (typeof rawId === "string") {
    resolvedId = rawId.trim().length > 0 ? rawId.trim() : undefined;
  } else if (typeof rawId === "number" && Number.isFinite(rawId)) {
    resolvedId = rawId;
  }

  return {
    id: resolvedId,
    latitude,
    longitude,
    name: typeof loc?.name === "string" && loc.name.trim().length > 0 ? loc.name : loc?.label ?? undefined,
    metadata,
  };
};

const extractCircleLocations = (circle: any): LocationPoint[] => {
  if (!circle) return [];
  const rawLocations =
    circle?.Locations ??
    circle?.locations ??
    circle?.SavedLocations ??
    circle?.savedLocations ??
    circle?.locationList ??
    [];

  if (!Array.isArray(rawLocations)) return [];
  return rawLocations
    .map((loc) => normalizeLocationPoint(loc))
    .filter((loc): loc is LocationPoint => loc !== null);
};

type LocationLike = Record<string, unknown>;

const COORDINATE_FIELD_PAIRS: [string, string][] = [
  ["latitude", "longitude"],
  ["lat", "lng"],
  ["lat", "lon"],
  ["Latitude", "Longitude"],
  ["Lat", "Long"],
  ["LATITUDE", "LONGITUDE"],
  ["LAT", "LON"],
];

const ACCURACY_FIELD_KEYS = ["accuracy", "horizontalAccuracy", "accuracyMeters", "accuracy_meters", "precision"];
const HEADING_FIELD_KEYS = ["heading", "bearing", "course"];
const LOCATION_COLLECTION_KEYS = [
  "memberLocations",
  "member_locations",
  "memberLocation",
  "member_location",
  "userLocations",
  "user_locations",
  "usersLocations",
  "users_locations",
  "currentMemberLocations",
  "current_member_locations",
  "currentLocations",
  "current_locations",
  "latestLocations",
  "latest_locations",
  "liveLocations",
  "live_locations",
  "Locations",
  "locations",
  "locationUpdates",
  "location_updates",
];

const LOCATION_OWNER_ID_KEYS = [
  "userId",
  "user_id",
  "userID",
  "memberId",
  "member_id",
  "memberID",
  "profileId",
  "profile_id",
  "personId",
  "person_id",
  "accountId",
  "account_id",
  "ownerId",
  "owner_id",
  "deviceUserId",
  "device_user_id",
];

const nestedCoordinateKeys = ["coords", "coordinate", "position", "location", "geo", "point"];

const extractCoordinatesFromCandidate = (candidate: unknown, visited = new WeakSet<object>()): UserLocation | null => {
  if (!candidate) {
    return null;
  }

  if (typeof candidate === "string") {
    const trimmed = candidate.trim();
    if (!trimmed) {
      return null;
    }
    try {
      const parsed = JSON.parse(trimmed);
      return extractCoordinatesFromCandidate(parsed, visited);
    } catch {
      return null;
    }
  }

  if (typeof candidate !== "object") {
    return null;
  }

  if (visited.has(candidate as object)) {
    return null;
  }
  visited.add(candidate as object);

  if (Array.isArray(candidate)) {
    for (const item of candidate) {
      const extracted = extractCoordinatesFromCandidate(item, visited);
      if (extracted) {
        return extracted;
      }
    }
    return null;
  }

  const obj = candidate as LocationLike;

  for (const [latKey, lonKey] of COORDINATE_FIELD_PAIRS) {
    const latCandidate = obj[latKey];
    const lonCandidate = obj[lonKey];
    const latitude = coerceFiniteNumber(latCandidate);
    const longitude = coerceFiniteNumber(lonCandidate);
    if (latitude !== null && longitude !== null) {
      let accuracy: number | null = null;
      for (const key of ACCURACY_FIELD_KEYS) {
        const val = coerceFiniteNumber(obj[key]);
        if (val !== null) {
          accuracy = val;
          break;
        }
      }

      let heading: number | undefined;
      for (const key of HEADING_FIELD_KEYS) {
        const val = coerceFiniteNumber(obj[key]);
        if (val !== null) {
          heading = val;
          break;
        }
      }

      return {
        latitude,
        longitude,
        accuracy,
        heading,
        battery: asNonEmptyString(obj.battery) ?? (obj.batteryLevel !== undefined ? String(obj.batteryLevel) : undefined),
        updatedAt: asNonEmptyString(obj.updatedAt) ?? asNonEmptyString(obj.timestamp) ?? asNonEmptyString(obj.updated) ?? asNonEmptyString(obj.created_at) ?? asNonEmptyString(obj.createdAt),
      };
    }
  }

  for (const key of nestedCoordinateKeys) {
    const nested = obj[key];
    if (nested && typeof nested === "object") {
      const extracted = extractCoordinatesFromCandidate(nested, visited);
      if (extracted) {
        return extracted;
      }
    }
  }

  return null;
};

const gatherLocationEntries = (circlePayload: any): unknown[] => {
  if (!circlePayload || typeof circlePayload !== "object") {
    return [];
  }

  const entries: unknown[] = [];

  for (const key of LOCATION_COLLECTION_KEYS) {
    const value = (circlePayload as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      entries.push(...value);
    }
  }

  const nestedCandidates = [
    (circlePayload as Record<string, unknown>)?.data,
    (circlePayload as Record<string, unknown>)?.payload,
    (circlePayload as Record<string, unknown>)?.details,
  ];

  for (const candidate of nestedCandidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }
    for (const key of LOCATION_COLLECTION_KEYS) {
      const nestedValue = (candidate as Record<string, unknown>)[key];
      if (Array.isArray(nestedValue)) {
        entries.push(...nestedValue);
      }
    }
  }

  return entries;
};

const buildMemberNameLookup = (members: CircleMember[]): Map<string, string> => {
  const map = new Map<string, string>();
  members.forEach((member) => {
    const memberId = resolveMemberId(member);
    if (!memberId) {
      return;
    }
    const names = [
      member?.Membership?.nickname,
      member?.name,
      member?.email,
    ];
    names
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .forEach((value) => {
        map.set(value.trim().toLowerCase(), memberId);
      });
  });
  return map;
};

const resolveLocationOwnerId = (
  location: Record<string, unknown>,
  members: CircleMember[],
  nameLookup: Map<string, string>
): string | null => {
  for (const key of LOCATION_OWNER_ID_KEYS) {
    const ownerCandidate = location[key];
    const normalized = normalizeIdentifier(ownerCandidate);
    if (normalized) {
      return normalized;
    }
  }

  const nestedOwnerCandidates = [
    (location.user as Record<string, unknown> | undefined)?.id,
    (location.member as Record<string, unknown> | undefined)?.id,
    (location.profile as Record<string, unknown> | undefined)?.id,
    (location.owner as Record<string, unknown> | undefined)?.id,
    (location.device as Record<string, unknown> | undefined)?.userId,
  ];

  for (const candidate of nestedOwnerCandidates) {
    const normalized = normalizeIdentifier(candidate);
    if (normalized) {
      return normalized;
    }
  }

  if (location.metadata && typeof location.metadata === "object") {
    const metadataRecord = location.metadata as Record<string, unknown>;
    for (const key of LOCATION_OWNER_ID_KEYS) {
      const normalized = normalizeIdentifier(metadataRecord[key]);
      if (normalized) {
        return normalized;
      }
    }
    if (metadataRecord.user && typeof metadataRecord.user === "object") {
      const nestedUserId = normalizeIdentifier((metadataRecord.user as Record<string, unknown>).id);
      if (nestedUserId) {
        return nestedUserId;
      }
    }
  }

  const possibleNameKeys = ["name", "label", "title", "nickname"];
  for (const key of possibleNameKeys) {
    const value = location[key];
    if (typeof value === "string" && value.trim().length > 0) {
      const normalized = nameLookup.get(value.trim().toLowerCase());
      if (normalized) {
        return normalized;
      }
    }
  }

  // Fallback: Check if the location's own ID matches a member ID (or normalized member ID)
  // This helps if the API returns a list of locations where the 'id' IS the userId
  if (location.id) {
    const candidateId = normalizeIdentifier(location.id);
    if (candidateId) {
      // Check if this ID exists in our members list
      // We can check if it's in the nameLookup values (which are member IDs)
      // keys -> names, values -> member IDs.
      // But nameLookup is a Map<Name, MemberId>. 
      // We need to check if 'candidateId' is a valid MemberId.
      // We can iterate members or build a Set. 
      // Since we have 'members' array here:
      const match = members.find(m => resolveMemberId(m) === candidateId);
      if (match) {
        return candidateId;
      }
    }
  }

  return null;
};

const extractLocationFromMemberRecord = (member: CircleMember): UserLocation | null => {
  const membership = (member as any)?.Membership ?? {};
  const candidates: unknown[] = [
    (member as any)?.latestLocation,
    (member as any)?.latest_location,
    (member as any)?.lastLocation,
    (member as any)?.last_location,
    (member as any)?.lastKnownLocation,
    (member as any)?.last_known_location,
    (member as any)?.currentLocation,
    (member as any)?.current_location,
    (member as any)?.liveLocation,
    (member as any)?.live_location,
    (member as any)?.location,
    (member as any)?.Location,
    membership?.latestLocation,
    membership?.latest_location,
    membership?.lastLocation,
    membership?.last_location,
    membership?.lastKnownLocation,
    membership?.last_known_location,
    membership?.currentLocation,
    membership?.current_location,
    membership?.location,
    membership?.Location,
    // Add batteryLevel as a candidate, sometimes APIs mix them or user said "battery level"
    (member as any)?.batteryLevel,
    (member as any)?.battery_level,
  ];

  const locationArrays: unknown[] = [
    (member as any)?.locations,
    membership?.locations,
    membership?.locationHistory,
    (member as any)?.locationHistory,
  ];

  for (const arr of locationArrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      candidates.push(arr[0]);
    }
  }

  const metadataCandidates: unknown[] = [];
  if ((member as any)?.metadata && typeof (member as any).metadata === "string") {
    metadataCandidates.push((member as any).metadata);
  }
  if (membership?.metadata) {
    metadataCandidates.push(membership.metadata);
  }

  candidates.push(...metadataCandidates);

  for (const candidate of candidates) {
    const extracted = extractCoordinatesFromCandidate(candidate);
    if (extracted) {
      return extracted;
    }
  }

  return null;
};

const buildMemberLocationMap = (circlePayload: any, members: CircleMember[]): Record<string, UserLocation> => {
  const map: Record<string, UserLocation> = {};
  if (!members.length) {
    console.log("buildMemberLocationMap: No members provided");
    return map;
  }

  console.log("buildMemberLocationMap: Processing", members.length, "members");
  const nameLookup = buildMemberNameLookup(members);
  const rawLocations = gatherLocationEntries(circlePayload);
  console.log("buildMemberLocationMap: Found", rawLocations.length, "raw location entries");

  for (const raw of rawLocations) {
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const ownerId = resolveLocationOwnerId(raw as Record<string, unknown>, members, nameLookup);
    if (!ownerId) {
      console.log("buildMemberLocationMap: Could not resolve owner for location:", raw);
      continue;
    }
    const coords = extractCoordinatesFromCandidate(raw);
    if (!coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
      console.log("buildMemberLocationMap: Invalid coords for owner", ownerId, ":", coords);
      continue;
    }
    console.log("buildMemberLocationMap: Adding location for", ownerId, ":", coords);
    map[ownerId] = coords;
  }

  members.forEach((member) => {
    const memberId = resolveMemberId(member);
    if (!memberId) {
      return;
    }
    const directLocation = extractLocationFromMemberRecord(member);
    if (directLocation && Number.isFinite(directLocation.latitude) && Number.isFinite(directLocation.longitude)) {
      console.log("buildMemberLocationMap: Adding direct location for", memberId, ":", directLocation);
      map[memberId] = directLocation;
    } else {
      console.log("buildMemberLocationMap: No valid direct location for", memberId);
    }
  });

  console.log("buildMemberLocationMap: Final map has", Object.keys(map).length, "locations");
  return map;
};

type MapStyle = 'standard' | 'satellite' | 'hybrid' | 'terrain' | 'street';

const isValidCoordinate = (lat: number, lon: number) => {
  return typeof lat === "number" && typeof lon === "number" && !isNaN(lat) && !isNaN(lon);
};

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
];

const RELATION_OPTIONS = [
  { value: "Mom", label: "Mom" },
  { value: "Dad", label: "Dad" },
  { value: "Son/ Daughter/Child", label: "Son/ Daughter/Child" },
  { value: "Grandparent", label: "Grandparent" },
  { value: "Partner/Spouse", label: "Partner/Spouse" },
  { value: "Friend", label: "Friend" },
  { value: "Other", label: "Other" },
];

const normalizeRole = (role?: string | null) => {
  if (typeof role !== "string") return null;
  const trimmed = role.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

const formatRoleLabel = (role: string | null) => {
  if (!role) return "Member";
  if (role === "creator") return "Creator";
  if (role === "admin") return "Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const resolveMemberId = (member: CircleMember | null | undefined) => {
  if (!member) {
    return null;
  }

  const membershipRecord = ((member as any)?.Membership ?? {}) as Record<string, unknown>;
  const primaryCandidates: unknown[] = [
    (member as any)?.id,
    (member as any)?.userId,
    (member as any)?.UserId,
    (member as any)?.user_id,
    (member as any)?.memberId,
    (member as any)?.member_id,
    (member as any)?.profileId,
    (member as any)?.profile_id,
    (member as any)?._id,
    (member as any)?.uuid,
    membershipRecord.id,
    membershipRecord.userId,
    membershipRecord.user_id,
    membershipRecord.memberId,
    membershipRecord.member_id,
    membershipRecord.profileId,
    membershipRecord.profile_id,
    (member as any)?.user?.id,
    (member as any)?.user?.userId,
    (member as any)?.user?.user_id,
    (member as any)?.user?._id,
    (member as any)?.user?.uuid,
    (member as any)?.account?.id,
    (member as any)?.Account?.id,
    (member as any)?.person?.id,
    (member as any)?.Person?.id,
  ];

  for (const candidate of primaryCandidates) {
    const normalized = normalizeIdentifier(candidate);
    if (normalized) {
      return normalized;
    }
  }

  const fallbackEmail = asNonEmptyString((member as any)?.email ?? (member as any)?.Email);
  if (fallbackEmail) {
    return fallbackEmail.toLowerCase();
  }

  return null;
};




const isFreePlan = (plan: any): boolean => {
  if (!plan) return true;
  if (typeof plan === 'string') {
    return plan.toLowerCase() === 'free';
  }
  if (typeof plan === 'object') {
    const name = plan.name || plan.Plan?.name;
    if (name) {
      return name.toLowerCase() === 'free';
    }
  }
  return true;
};

const JourneyMapPreview = React.memo(({ history }: { history: JourneyHistoryPoint[] }) => {
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);
    const [imgError, setImgError] = React.useState(false);
    const coords = React.useMemo(
        () => history.map(p => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) })),
        [history]
    );

    React.useEffect(() => {
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
                    `${OSRM_BASE_URL}/route/v1/driving/${pts.map(p => `${p.longitude},${p.latitude}`).join(";")
                    }?overview=full&geometries=polyline`
                );
                const data = await res.json();
                if (res.ok && data.routes?.[0]?.geometry) osrmEncoded = data.routes[0].geometry;
            } catch {}
            if (alive) setImageUrl(buildJourneyMapUrl(coords, osrmEncoded));
        })();
        return () => { alive = false; };
    }, [coords]);

    if (coords.length < 2) return null;
    return (
        <View style={{ width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', marginTop: 10, backgroundColor: '#F3F4F6' }}>
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
                        : <ActivityIndicator color="#113C9C" />}
                </View>
            )}
        </View>
    );
});

// =======================================================
// MAP SCREEN COMPONENT
// =======================================================
const MapScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadingCircles, setLoadingCircles] = useState(false);
  const loadingCirclesRef = useRef(false);
  const lastCircleFetchTimestampRef = useRef(0);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const locationRef = useRef<UserLocation | null>(null);
  const locationWatchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Startup Loading State
  const [startupStatus, setStartupStatus] = useState<string | null>("Starting up...");
  const [startupProgress, setStartupProgress] = useState(0);

  const [circles, setCircles] = useState<CircleData[]>([]);
  const circlesRef = useRef<CircleData[]>([]); // Ref to avoid stale closures in selection logic

  const [selectedCircle, setSelectedCircle] = useState<CircleData | null>(null);
  const selectedCircleRef = useRef<CircleData | null>(null);
  const activeCircleIdRef = useRef<string | null>(null);
  const [selectedCircleMembers, setSelectedCircleMembers] = useState<CircleMember[]>([]);
  const [memberLocations, setMemberLocations] = useState<Record<string, UserLocation>>({});
  const [memberAvatarUrls, setMemberAvatarUrls] = useState<Record<string, string | null>>({});
  const [activeTab, setActiveTab] = useState("Location");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [userPlan, setUserPlan] = useState<any>(null);

  const mapRef = useRef<Mapbox.MapView | null>(null);
  const cameraRef = useRef<Mapbox.Camera | null>(null);
  const locationHistoryMapRef = useRef<Mapbox.MapView | null>(null);
  const locationHistoryCameraRef = useRef<Mapbox.Camera | null>(null);

  const hasZoomedToUserRef = useRef(false);
  const isInitialCircleSelectRef = useRef(true);
  const [isFollowingUser, setIsFollowingUser] = useState(true);

  // Reset the tracking refs when the map screen comes into focus
  useFocusEffect(
    useCallback(() => {
      hasZoomedToUserRef.current = false;
      isInitialCircleSelectRef.current = true;
      setIsFollowingUser(true);
    }, [])
  );

  // Automatically zoom into user's location with a proper street-level zoom once loaded
  // (Migrated to native Mapbox.UserLocation's onUpdate below to prevent race conditions on startup)
  // useEffect(() => {
  //   if (!loading && location && !hasZoomedToUserRef.current && cameraRef.current) {
  //     hasZoomedToUserRef.current = true;
  //     console.log("Automatically zooming in to user's location:", location.latitude, location.longitude);
  //     cameraRef.current.setCamera({
  //       centerCoordinate: [location.longitude, location.latitude],
  //       zoomLevel: 17.5, // 75% close-up zoom (street names are fully readable and clear)
  //       animationDuration: 1500,
  //     });
  //   }
  // }, [location, loading]);
  const insets = useSafeAreaInsets();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(null);
  const [currentUserBatteryLevel, setCurrentUserBatteryLevel] = useState<BatteryLevelInfo | null>(null);
  const [memberRemovalLoadingId, setMemberRemovalLoadingId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);
  const lastSeenNotificationIdRef = useRef<string | null>(null);

  // --- Dynamic Heights based on Safe Area ---
  const CURRENT_STATUS_BAR_HEIGHT = StatusBar.currentHeight || insets.top || 24;
  const MAP_FULL_HEIGHT = SCREEN_HEIGHT - CURRENT_STATUS_BAR_HEIGHT; // Stops at status bar (map)

  const [isLeavingCircle, setIsLeavingCircle] = useState(false);
  const [isDeletingCircle, setIsDeletingCircle] = useState(false);
  const [assignedLocationsByCircle, setAssignedLocationsByCircle] = useState<Record<string, AssignedLocationRecord>>({});
  const [loadingAssignedLocations, setLoadingAssignedLocations] = useState(false);
  const loadingAssignedLocationsRef = useRef(false);
  const lastAssignedFetchTimestampRef = useRef(0);
  const fetchCircleMembersInFlightRef = useRef(new Set<string>());
  const memberFetchTimestampsRef = useRef<Record<string, number>>({});
  const { showAlert } = useAlert();
  useEffect(() => {
    if (activeTab !== "Location") {
      // Snap to full page height when switching to non-map tabs
      Animated.spring(sheetHeight, {
        toValue: FULL_HEIGHT,
        useNativeDriver: false,
        bounciness: 4,
        speed: 12
      }).start();
      setIsExpanded(true);
    }
  }, [activeTab, FULL_HEIGHT]);

  const [activeSection, setActiveSection] = useState<'members' | 'place' | 'key' | 'bluetooth'>('members');
  const [selectedDrivingMemberId, setSelectedDrivingMemberId] = useState<string | "all">("all");
  const [drivingJourneyCache, setDrivingJourneyCache] = useState<Record<string, Journey[]>>({});
  const [drivingBatchStatsCache, setDrivingBatchStatsCache] = useState<Record<string, { totalMiles: string; totalDrives: number; topSpeed: number }>>({});
  const [drivingLoading, setDrivingLoading] = useState(false);
  const [drivingDataLoaded, setDrivingDataLoaded] = useState<string | null>(null);
  const [profileNameInput, setProfileNameInput] = useState("");
  const [profileMetadataInput, setProfileMetadataInput] = useState("");
  const [profileAvatarOriginal, setProfileAvatarOriginal] = useState<string | null>(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState<string | null>(null);
  const [profileAvatarUpload, setProfileAvatarUpload] = useState<PickedImage | null>(null);
  const [isPickingProfileImage, setIsPickingProfileImage] = useState(false);
  const [profileModalError, setProfileModalError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [isCirclesModalOpen, setIsCirclesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isDriveDetectionModalOpen, setIsDriveDetectionModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isLocationSharingModalOpen, setIsLocationSharingModalOpen] = useState(false);
  const [isCircleManagementModalOpen, setIsCircleManagementModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isAddPeopleModalOpen, setIsAddPeopleModalOpen] = useState(false);
  const [isSmartNotificationModalOpen, setIsSmartNotificationModalOpen] = useState(false);
  const [isPickingContact, setIsPickingContact] = useState(false);

  // Add Place Modal State
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
  const [addPlaceMode, setAddPlaceMode] = useState<'create' | 'edit'>('create');
  const [editingLocation, setEditingLocation] = useState<LocationPoint | null>(null);


  const [isMyRoleModalOpen, setIsMyRoleModalOpen] = useState(false);

  const [driveDetectionEnabled, setDriveDetectionEnabled] = useState(false);
  const [coordinateAlert, setCoordinateAlert] = useState<{
    visible: boolean;
    lat: number;
    lng: number;
    speed: number | null;
    accuracy: number | null;
    name: string | null;
  }>({
    visible: false,
    lat: 0,
    lng: 0,
    speed: null,
    accuracy: null,
    name: null,
  });

  const { currentSpeed, setCurrentSpeed } = useSpeed();

  const rawSpeedKmh = useMemo(() => {
    if (currentSpeed !== null && currentSpeed !== undefined) {
      return Math.round(Math.max(0, Number(currentSpeed)));
    }
    if (!currentUserId || !memberLocations[currentUserId]) return 0;
    const s = memberLocations[currentUserId].speed;
    return s !== undefined && s !== null ? Math.round(Math.max(0, Number(s))) : 0;
  }, [currentSpeed, currentUserId, memberLocations]);

  const speedKmh = useSmoothSpeed(rawSpeedKmh);

  // Circles Modal Share State


  // Existing state...
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isUpdatingLocationSharing, setIsUpdatingLocationSharing] = useState(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [locationHistoryLoading, setLocationHistoryLoading] = useState(false);
  const [locationHistory, setLocationHistory] = useState<LocationHistoryEntry[]>([]);
  const [locationHistoryError, setLocationHistoryError] = useState<string | null>(null);
  const [locationHistoryActiveFilter, setLocationHistoryActiveFilter] = useState<LocationHistoryFilterKey>("today");
  const [locationHistoryCustomStart, setLocationHistoryCustomStart] = useState("");
  const [locationHistoryCustomEnd, setLocationHistoryCustomEnd] = useState("");
  const [showLocationHistoryCustomStartPicker, setShowLocationHistoryCustomStartPicker] = useState(false);
  const [showLocationHistoryCustomEndPicker, setShowLocationHistoryCustomEndPicker] = useState(false);
  const [shouldRenderLocationHistoryMap, setShouldRenderLocationHistoryMap] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedMemberLocationId, setSelectedMemberLocationId] = useState<string | null>(null);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [memberBeingEdited, setMemberBeingEdited] = useState<CircleMember | null>(null);
  const [editedMemberRole, setEditedMemberRole] = useState("member");
  const [editedMemberNickname, setEditedMemberNickname] = useState("");
  const [editedMemberRelation, setEditedMemberRelation] = useState("Other");
  const [isSavingMemberChanges, setIsSavingMemberChanges] = useState(false);
  const [memberModalError, setMemberModalError] = useState<string | null>(null);
  const [mapLayerStyle, setMapLayerStyle] = useState<MapStyle>('standard');
  const [isMapStyleModalOpen, setIsMapStyleModalOpen] = useState(false);
  const [isCirclesSelectionModalOpen, setIsCirclesSelectionModalOpen] = useState(false);
  const [isLocationHistoryModalVisible, setIsLocationHistoryModalVisible] = useState(false);
  const [iscirclesSelectionOpenAtShare, setCirclesSelectionOpenAtShare] = useState(false);
  const [isCreateCircleModalOpen, setIsCreateCircleModalOpen] = useState(false);
  const [isJoinCircleModalOpen, setIsJoinCircleModalOpen] = useState(false);
  const [isEditCircleNameModalOpen, setIsEditCircleNameModalOpen] = useState(false);
  const [favoriteMemberIds, setFavoriteMemberIds] = useState<string[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<[string, string][]>([]);



  const [debugSocketData, setDebugSocketData] = useState<any>(null);
  const [showDebugAlert, setShowDebugAlert] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Never");

  // Stored User Data (from Auth)
  const [storedUser, setStoredUser] = useState<any>(null);

  const handleCustomStartChange = (event: any, selectedDate?: Date) => {
    setShowLocationHistoryCustomStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setLocationHistoryCustomStart(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleCustomEndChange = (event: any, selectedDate?: Date) => {
    setShowLocationHistoryCustomEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setLocationHistoryCustomEnd(selectedDate.toISOString().split('T')[0]);
    }
  };

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          setStoredUser(JSON.parse(userJson));
        }
        const planJson = await AsyncStorage.getItem("userPlan");
        if (planJson) {
          setUserPlan(JSON.parse(planJson));
        }
      } catch (e) {
        console.log("Failed to load stored user or plan", e);
      }
    };
    loadStoredUser();
  }, []);

  useEffect(() => {
    const loadDriveDetectionSetting = async () => {
      try {
        const val = await AsyncStorage.getItem("user_drive_detection_enabled");
        setDriveDetectionEnabled(val === "true");
      } catch (e) {
        console.warn("Failed to load drive detection setting", e);
      }
    };
    loadDriveDetectionSetting();
  }, []);

  // Favorite Members Persistence
  useEffect(() => {
    const loadFavorites = async () => {
      if (!selectedCircle?.id) return;
      try {
        const storedFavorites = await AsyncStorage.getItem(`favorite_members_${selectedCircle.id}`);
        if (storedFavorites) {
          setFavoriteMemberIds(JSON.parse(storedFavorites));
        } else {
          setFavoriteMemberIds([]);
        }
      } catch (e) {
        console.warn("Failed to load favorite members", e);
      }
    };
    loadFavorites();
  }, [selectedCircle?.id]);

  const toggleFavorite = async (memberId: string) => {
    if (!selectedCircle?.id) return;
    try {
      const isAlreadyFav = favoriteMemberIds.includes(memberId);
      let newFavorites;
      if (isAlreadyFav) {
        newFavorites = favoriteMemberIds.filter(id => id !== memberId);
      } else {
        newFavorites = [...favoriteMemberIds, memberId];
      }
      setFavoriteMemberIds(newFavorites);
      await AsyncStorage.setItem(`favorite_members_${selectedCircle.id}`, JSON.stringify(newFavorites));
    } catch (e) {
      console.warn("Failed to update favorite members", e);
    }
  };

  // Handle Background Location Service lifecycle
  useEffect(() => {
    // 1. Initial start if enabled
    if (locationSharingEnabled && activeCircleIdRef.current) {
      startBackgroundLocation().catch(e => console.warn("Initial BG start failed", e));
    }

    // 2. Add AppState listener to ensure service is running when leaving focus
    const subscription = AppState.addEventListener("change", async (nextAppState: AppStateStatus) => {
      console.log("AppState changed to", nextAppState);
      if (nextAppState === "background" || nextAppState === "inactive") {
        // Defensive check: only start if it's still background and sharing is on
        const current = AppState.currentState;
        if (locationSharingEnabled && activeCircleIdRef.current && (current === 'background' || current === 'inactive')) {
          await startBackgroundLocation();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [locationSharingEnabled]);

  // Handle explicit toggle of location sharing
  useEffect(() => {
    if (!locationSharingEnabled) {
      stopBackgroundLocation().catch(e => console.warn("Failed to stop BG location", e));
    } else if (locationSharingEnabled && (AppState.currentState === 'background' || AppState.currentState === 'inactive')) {
      // Also ensure it starts if enabled remotely or via state while in background (rare case)
      startBackgroundLocation().catch(e => console.warn("Remote BG start failed", e));
    }
  }, [locationSharingEnabled]);

  // --- Method A Foreground Location & Speed Tracking (Migrated to Mapbox.UserLocation onUpdate) ---
  // useEffect(() => {
  //   let subscription: Location.LocationSubscription | null = null;
  // 
  //   const startWatching = async () => {
  //     const { status } = await Location.requestForegroundPermissionsAsync();
  //     if (status !== 'granted') return;
  // 
  //     subscription = await Location.watchPositionAsync(
  //       {
  //         accuracy: Location.Accuracy.BestForNavigation,
  //         timeInterval: 1000,
  //         distanceInterval: 1,
  //       },
  //       (loc) => {
  //         const { latitude, longitude, speed, accuracy, heading } = loc.coords;
  //         
  //         const nextLocation: UserLocation = {
  //           latitude,
  //           longitude,
  //           heading: heading ?? undefined,
  //           accuracy: Number.isFinite(accuracy) ? accuracy ?? null : null,
  //         };
  // 
  //         // Update local state
  //         setLocation(nextLocation);
  //         locationRef.current = nextLocation;
  // 
  //         // Update speed (Method A way: converted to km/h)
  //         const kmh = speed !== null ? Math.max(0, speed * 3.6) : 0;
  //         setCurrentSpeed(kmh);
  // 
  //         // Sync with backend if in a circle
  //         if (activeCircleIdRef.current) {
  //            maybePostCircleLocationUpdate(activeCircleIdRef.current, {
  //               latitude,
  //               longitude,
  //               accuracy: accuracy ?? null,
  //               speed: speed ?? null,
  //               userId: currentUserId,
  //               battery: currentUserBatteryLevel ? `${currentUserBatteryLevel.batteryLevel}%` : undefined,
  //            }).then(result => {
  //               if (result.success && result.data) {
  //                  handleLiveStatusUpdate(result.data);
  //               }
  //            }).catch(err => console.warn("Foreground sync failed", err));
  //         }
  //       }
  //     );
  //   };
  // 
  //   startWatching();
  // 
  //   return () => {
  //     if (subscription) {
  //       subscription.remove();
  //       subscription = null;
  //     }
  //   };
  // }, [currentUserId, currentUserBatteryLevel]);


  // Socket Debug Listener
  /*
  useEffect(() => {
    SocketService.setDebugCallback((event, data) => {
      setDebugSocketData({ event, data, timestamp: new Date().toLocaleTimeString() });
      if (event === 'send_location') {
        setLastSyncTime(new Date().toLocaleTimeString());
      }
      setShowDebugAlert(true);
    });
    return () => SocketService.setDebugCallback(null);
  }, []);
  */

  // --- Journeys Modal State ---
  // const [isMemberJourneysModalVisible, setIsMemberJourneysModalVisible] = useState(false);
  // const [memberJourneysData, setMemberJourneysData] = useState<CircleMember | null>(null);

  const fetchDrivingData = useCallback(async (forceRefresh = false) => {
    if (!selectedCircle?.id) return;
    const circleKey = String(selectedCircle.id);
    if (!forceRefresh && drivingDataLoaded === circleKey) return;
    setDrivingLoading(true);
    try {
      let currentPlan = null;
      try {
        const planJson = await AsyncStorage.getItem("userPlan");
        if (planJson) currentPlan = JSON.parse(planJson);
      } catch {}

      const res = await authenticatedFetch(
        `${API_BASE_URL}/circles/${circleKey}/history?page=1&perPage=100`
      );
      if (!res.ok) return;
      const payload = await res.json();
      const histData = payload?.data;
      const members: any[] = histData?.members || [];
      const creator: any = histData?.creator;
      const allPeople = creator ? [creator, ...members] : members;

      const now = new Date();
      const cutoff = new Date();
      if (isFreePlan(currentPlan)) {
        cutoff.setDate(now.getDate() - 1);
      } else {
        cutoff.setDate(now.getDate() - 30);
      }
      cutoff.setHours(0, 0, 0, 0);

      const newCache: Record<string, Journey[]> = {};
      const newStatsCache: Record<string, { totalMiles: string; totalDrives: number; topSpeed: number }> = {};

      for (const person of allPeople) {
        const pid = String(person.id);
        const filtered: Journey[] = (person.journeys || []).filter(
          (j: Journey) => new Date(j.startTime || j.endTime).getTime() >= cutoff.getTime()
        );
        newCache[pid] = filtered;

        let totalMeters = 0, topSpeed = 0, driveCount = 0;
        filtered.filter((j: Journey) => !isJourneyStationary(j.history || [])).forEach((j: Journey) => {
          const s = calcJourneyStats(j.history || []);
          if (s.topSpeedMph > topSpeed) topSpeed = s.topSpeedMph;
          totalMeters += parseFloat(s.distanceMiles) * 1609.34;
          driveCount++;
        });
        newStatsCache[pid] = { totalMiles: (totalMeters / 1609.34).toFixed(1), totalDrives: driveCount, topSpeed };
      }

      setDrivingJourneyCache(newCache);
      setDrivingBatchStatsCache(newStatsCache);
      setDrivingDataLoaded(circleKey);
    } catch (e) {
      console.warn("fetchDrivingData error", e);
    } finally {
      setDrivingLoading(false);
    }
  }, [selectedCircle?.id, drivingDataLoaded]);

  useEffect(() => {
    if (activeTab === "Driving") {
      fetchDrivingData();
    }
  }, [activeTab, fetchDrivingData]);

  useEffect(() => {
    setDrivingDataLoaded(null);
    setDrivingJourneyCache({});
    setDrivingBatchStatsCache({});
  }, [selectedCircle?.id]);

  // --- Derived State (Moved up) ---
  const circleCreatorId = useMemo(() => {
    const creatorIdRaw = selectedCircle?.creatorId;
    if (creatorIdRaw === undefined || creatorIdRaw === null) {
      return null;
    }
    return String(creatorIdRaw);
  }, [selectedCircle]);

  const isCircleCreator = useMemo(() => {
    if (!currentUserId || !circleCreatorId) {
      return false;
    }
    return currentUserId === circleCreatorId;
  }, [circleCreatorId, currentUserId]);

  const currentMembership = useMemo(() => {
    if (!currentUserId) return null;
    return (
      selectedCircleMembers.find((member) => resolveMemberId(member) === currentUserId) ?? null
    );
  }, [currentUserId, selectedCircleMembers]);

  const currentMembershipRole = useMemo(() => {
    if (isCircleCreator) return "creator";
    return normalizeRole(currentMembership?.Membership?.role) ?? null;
  }, [currentMembership, isCircleCreator]);

  const canManageLocations = useMemo(() => {
    return isCircleCreator || currentMembershipRole === "admin";
  }, [currentMembershipRole, isCircleCreator]);

  const handleOpenNotificationsModal = useCallback(() => {
    setIsNotificationsModalOpen(true);
  }, []);

  const handleOpenAccountModal = useCallback(() => {
    setIsAccountModalOpen(true);
  }, []);

  const handleOpenSmartNotificationsModal = useCallback(() => {
    setIsSmartNotificationModalOpen(true);
  }, []);

  const handleOpenCircleNotificationSettings = useCallback(() => {
    if (!selectedCircle) return;

    // Permission check: Creator or Admin
    const myMemberRecord = selectedCircleMembers.find(m => resolveMemberId(m) === currentUserId);
    const role = normalizeRole((myMemberRecord?.Membership as any)?.role);
    const isCreator = selectedCircle.creatorId === currentUserId;
    const isAdmin = role === "admin";

    if (!isCreator && !isAdmin) {
      showAlert({ title: "Permission Denied", message: "Only circle creators and admins can update notification settings.", type: 'warning' });
      return;
    }

    // Load settings from circle data
    const settings = (selectedCircle as any).notificationSettings || {};
    router.push({ pathname: '/screens/CircleNotificationSettingsScreen', params: { circleId: selectedCircle.id, initialSettings: JSON.stringify(settings) } } as any);
  }, [currentUserId, selectedCircle, selectedCircleMembers, showAlert]);



  const batteryLevelRef = useRef<number | null>(null);
  const lastBatterySyncRef = useRef<number>(0);
  const lowBatteryAlertSentRef = useRef(false);

  const postBatteryLevel = useCallback((level: number, force = false) => {
    const now = Date.now();
    if (!force && lastBatterySyncRef.current > 0) {
      const elapsed = now - lastBatterySyncRef.current;
      if (elapsed < BATTERY_SYNC_MIN_INTERVAL_MS) {
        return;
      }
    }

    lastBatterySyncRef.current = now;
    void sendBatteryLevelValue(level);
  }, []);

  const handleLowBatteryAlert = useCallback((level: number) => {
    if (level <= LOW_BATTERY_THRESHOLD) {
      if (lowBatteryAlertSentRef.current) {
        return;
      }

      lowBatteryAlertSentRef.current = true;
      void sendLowBatteryAlert(level, LOW_BATTERY_THRESHOLD).catch((error) => {
        console.warn("Failed to send low battery alert", error);
        lowBatteryAlertSentRef.current = false;
      });
    } else if (lowBatteryAlertSentRef.current) {
      lowBatteryAlertSentRef.current = false;
    }
  }, []);

  const handleOpenSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(true);
  }, []);

  const handleOpenLocationSharingModal = useCallback(() => {
    setIsLocationSharingModalOpen(true);
  }, []);

  const handleOpenCircleManagementModal = useCallback(() => {
    setIsCircleManagementModalOpen(true);
  }, []);

  const handleAddEmergencyContact = async () => {
    setIsPickingContact(true);
    try {
      const contact = await pickContact();
      if (contact) {
        // Store as an array [name, number] as requested
        setEmergencyContacts(prev => [...prev, [contact.name, contact.phone]]);
      }
    } finally {
      setIsPickingContact(false);
    }
  };

  const handleOpenCreateCircleModal = useCallback(() => {
    setIsSettingsModalOpen(false);
    if (isFreePlan(userPlan) && circles.length >= 1) {
      showAlert({
        title: "Subscription Required",
        message: "Free plan users can only create one circle. Please subscribe to our Premium plan for unlimited circles.",
        type: 'warning',
      });
      return;
    }
    setIsCreateCircleModalOpen(true);
  }, [userPlan, circles, showAlert]);

  const handleOpenAddPeopleModal = useCallback(() => {
    if (!selectedCircle) {
      showAlert({ title: "Error", message: "No circle selected.", type: 'error' });
      return;
    }
    setIsAddPeopleModalOpen(true);
  }, [selectedCircle, showAlert]);

  const handleToggleLocationSharing = useCallback(async (nextValue: boolean) => {
    if (isUpdatingLocationSharing || nextValue === locationSharingEnabled) {
      return;
    }

    setIsUpdatingLocationSharing(true);

    try {
      if (nextValue) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          showAlert({
            title: "Permission needed",
            message: "Allow location access in your device settings to share your location with the circle.",
            type: 'warning'
          });
          return;
        }

        if (isNativePlatform) {
          try {
            const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
            if (backgroundPermission.status !== "granted") {
              showAlert({
                title: "Background access limited",
                message: "We'll share your location while the app is open. Enable background access in system settings for continuous updates.",
                type: 'info'
              });
            }
          } catch (backgroundError) {
            console.warn("Failed to request background location permission", backgroundError);
          }
        }

        if (!locationRef.current) {
          try {
            const latest = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const refreshedLocation: UserLocation = {
              latitude: latest.coords.latitude,
              longitude: latest.coords.longitude,
              heading: latest.coords.heading ?? undefined,
              accuracy: latest.coords.accuracy ?? null,
            };
            setLocation(refreshedLocation);
            locationRef.current = refreshedLocation;
          } catch (refreshError) {
            console.warn("Failed to refresh location after enabling sharing", refreshError);
          }
        }
        if (isNativePlatform) {
          try {
            await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.High,
              timeInterval: 30000,
              foregroundService: {
                notificationTitle: "Location Sharing Active",
                notificationBody: "Sharing your live location with your circle.",
                notificationColor: "#4F359B",
              },
            });
          } catch (startError) {
            console.warn("Failed to start background location updates", startError);
            showAlert({ title: "Background Error", message: "Could not start background location tracking.", type: 'error' });
          }
        }
      } else if (isNativePlatform) {
        try {
          const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
          if (hasStarted) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
          }
        } catch (stopError) {
          console.warn("Failed to stop background location updates when disabling sharing", stopError);
        }
      }

      setLocationSharingEnabled(nextValue);

      await AsyncStorage.setItem(
        STORAGE_KEYS.locationSharingEnabled,
        nextValue ? "true" : "false"
      ).catch(() => undefined);

      if (!nextValue) {
        await clearAllPostedLocations().catch(() => undefined);
      } else if (selectedCircle?.id) {
        const circleId = normalizeIdentifier(selectedCircle.id);
        const latestLocation = locationRef.current;
        if (circleId && latestLocation) {
          void maybePostCircleLocationUpdate(circleId, {
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            accuracy: latestLocation.accuracy ?? null,
          }).catch((error) => {
            console.warn("Immediate location post failed after enabling sharing", error);
          });
        }
      }
    } catch (error) {
      console.warn("Failed to update location sharing preference", error);
      showAlert({
        title: "Location sharing",
        message: "We couldn't update your location sharing preference. Please try again.",
        type: 'error'
      });
    } finally {
      setIsUpdatingLocationSharing(false);
    }
  }, [isUpdatingLocationSharing, locationSharingEnabled, selectedCircle, showAlert]);

  const handleToggleNotifications = useCallback(async (nextValue: boolean) => {
    if (isUpdatingNotifications || nextValue === notificationsEnabled) {
      return;
    }

    setIsUpdatingNotifications(true);

    try {
      if (nextValue) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          showAlert({
            title: "Permission needed",
            message: "Enable notifications in your device settings to receive circle alerts.",
            type: 'warning'
          });
          return;
        }
      }

      await setNotificationReceptionEnabled(nextValue);
      setNotificationsEnabled(nextValue);

      await AsyncStorage.setItem(
        STORAGE_KEYS.notificationsEnabled,
        nextValue ? "true" : "false"
      ).catch(() => undefined);
    } catch (error) {
      console.warn("Failed to update notification preference", error);
      showAlert({
        title: "Notifications",
        message: "We couldn't update your notification preference. Please try again.",
        type: 'error'
      });
    } finally {
      setIsUpdatingNotifications(false);
    }
  }, [isUpdatingNotifications, notificationsEnabled, showAlert]);

  useEffect(() => {
    let cancelled = false;

    const hydrateSettings = async () => {
      try {
        const [storedLocationSharing, storedNotifications] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.locationSharingEnabled),
          AsyncStorage.getItem(STORAGE_KEYS.notificationsEnabled),
        ]);

        if (cancelled) {
          return;
        }

        const initialLocationSharing = parseBooleanPreference(storedLocationSharing, true);
        setLocationSharingEnabled(initialLocationSharing);

        if (!initialLocationSharing && isNativePlatform) {
          try {
            const hasStarted = await isBackgroundLocationRunning();
            if (hasStarted) {
              await stopBackgroundLocation();
            }
          } catch (stopError) {
            console.warn("Failed to stop location updates during settings hydration", stopError);
          }
        }

        const initialNotifications = parseBooleanPreference(storedNotifications, true);
        setNotificationsEnabled(initialNotifications);
        await setNotificationReceptionEnabled(initialNotifications);
        if (initialNotifications) {
          await requestNotificationPermissions();
        }

        const storedMapStyle = await AsyncStorage.getItem(STORAGE_KEYS.mapStyle);
        if (storedMapStyle && ['standard', 'satellite', 'hybrid', 'terrain'].includes(storedMapStyle)) {
          setMapLayerStyle(storedMapStyle as MapStyle);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to hydrate settings preferences", error);
        }
      }
    };

    void hydrateSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync sheet height with active tab
  useEffect(() => {
    if (activeTab === "Location") {
      snapTo(INITIAL_SHEET_HEIGHT);
      setIsExpanded(INITIAL_SHEET_HEIGHT > MID_HEIGHT);
    } else {
      snapTo(FULL_HEIGHT);
      setIsExpanded(true);
    }
  }, [activeTab]);

  useEffect(() => {
    locationRef.current = location;

    if (!location) {
      return;
    }

    void storeLastKnownLocation({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }, [location]);

  useEffect(() => {
    let cancelled = false;

    const syncInitialBattery = async () => {
      const level = await readBatteryLevel();
      if (cancelled || level === null) {
        return;
      }

      batteryLevelRef.current = level;
      postBatteryLevel(level, true);
      handleLowBatteryAlert(level);
    };

    void syncInitialBattery();

    const unsubscribe = watchBatteryLevel((level) => {
      if (cancelled) {
        return;
      }

      const previousLevel = batteryLevelRef.current;
      batteryLevelRef.current = level;

      const shouldForce = previousLevel === null || Math.abs(level - (previousLevel ?? level)) >= 1;
      postBatteryLevel(level, shouldForce);
      handleLowBatteryAlert(level);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [handleLowBatteryAlert, postBatteryLevel]);

  useEffect(() => {
    selectedCircleRef.current = selectedCircle;
  }, [selectedCircle]);

  // --- Animation State (Pan Responder, SnapTo) ---
  const sheetHeight = useRef(new Animated.Value(INITIAL_SHEET_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(INITIAL_SHEET_HEIGHT > MID_HEIGHT);
  const dragStartHeightRef = useRef(INITIAL_SHEET_HEIGHT);

  // --- Floating button animation values ---
  // leftButtons: CheckIn + SOS (slide down / fade out when drawer > threshold)
  const leftButtonsAnim = useRef(new Animated.Value(1)).current;  // 1=visible, 0=hidden
  // mapLayerButton: also hide with leftButtons
  const mapLayerAnim = useRef(new Animated.Value(1)).current;
  // myLocationButton: slide right and hide when drawer > threshold
  const myLocationAnim = useRef(new Animated.Value(0)).current;   // 0=left(visible), 1=right(hidden)
  // headerAnim: settings, circle selector, notification (slide up when drawer reaches top)
  const headerAnim = useRef(new Animated.Value(1)).current;       // 1=visible, 0=hidden(up)
  // chatAnim: chat button (slide left when drawer reaches top)
  const chatAnim = useRef(new Animated.Value(1)).current;         // 1=visible, 0=hidden(left)

  // track whether buttons are currently hidden
  const [buttonsHidden, setButtonsHidden] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);

  // Poll for notifications
  useEffect(() => {
    let interval: any;
    const pollNotifications = async () => {
      try {
        const response = await NotificationService.fetchNotifications(1, 1);
        const latest = response.notifications[0];
        // Only show toast if it's a new, unread notification and newer than what we've seen
        if (latest && !latest.read && latest.id !== lastSeenNotificationIdRef.current) {
          lastSeenNotificationIdRef.current = latest.id;
          setToastNotification(latest);
        }
      } catch (e) {
        // ignore error during poll
      }
    };

    // Initial fetch
    pollNotifications();
    interval = setInterval(pollNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const handleLiveStatusUpdate = useCallback((liveData: any[]) => {
    if (!Array.isArray(liveData)) return;

    const currentLoc = locationRef.current;

    // 1. Update Member Locations - skip coords if 'same'
    setMemberLocations(prev => {
      const next = { ...prev };
      let anyChanged = false;
      liveData.forEach(m => {
        const mid = String(m.id);
        const existing = prev[mid];

        // If same, we keep existing lat/lng but might still update speed/battery
        let latitude = m.locationChange === 'same' && existing ? existing.latitude : m.latitude;
        let longitude = m.locationChange === 'same' && existing ? existing.longitude : m.longitude;
        let speed = m.speed;

        // Force current user data to be read from local sensors rather than the network payload
        if (mid === currentUserId && currentLoc) {
            latitude = currentLoc.latitude;
            longitude = currentLoc.longitude;
            speed = currentSpeed;
        }

        if (
          !existing ||
          existing.latitude !== latitude ||
          existing.longitude !== longitude ||
          existing.speed !== speed ||
          existing.battery !== m.battery
        ) {
          next[mid] = {
            latitude,
            longitude,
            heading: undefined,
            accuracy: null,
            speed: speed,
            battery: m.battery,
          };
          anyChanged = true;
        }
      });
      return anyChanged ? next : prev;
    });

    // 2. Update Avatar URLs if changed
    setMemberAvatarUrls(prev => {
      const next = { ...prev };
      let anyChanged = false;
      liveData.forEach(m => {
        const mid = String(m.id);
        if (m.avatar && prev[mid] !== m.avatar) {
          next[mid] = m.avatar;
          anyChanged = true;
        }
      });
      return anyChanged ? next : prev;
    });

    // 3. Update Member Data if changed & Sort
    setSelectedCircleMembers(prev => {
      const nextMembers = [...prev];
      let anyChanged = false;

      liveData.forEach(update => {
        const mid = String(update.id);
        const index = nextMembers.findIndex(m => resolveMemberId(m) === mid);

        if (index !== -1) {
          const member = nextMembers[index];
          const hasInfoChanged =
            member.name !== update.name ||
            member.avatar !== update.avatar ||
            (member as any).status !== update.status ||
            (member as any).locationText !== update.locationText ||
            (member as any).battery !== update.battery ||
            (member as any).speed !== update.speed ||
            (member as any).role !== update.role ||
            (member as any).isTracker !== update.isTracker ||
            (member as any).isMe !== update.isMe;

          if (hasInfoChanged) {
            anyChanged = true;
            nextMembers[index] = {
              ...member,
              name: update.name,
              avatar: update.avatar,
              status: update.status,
              locationText: update.locationText,
              lastSeen: update.lastSeen,
              isMe: update.isMe,
              role: update.role,
              isTracker: update.isTracker,
              battery: update.battery,
              speed: update.speed,
            } as any;
          }
        } else {
          // Member not found in state, add it
          anyChanged = true;
          nextMembers.push({
            id: update.id,
            name: update.name,
            avatar: update.avatar,
            status: update.status,
            locationText: update.locationText,
            lastSeen: update.lastSeen,
            isMe: update.isMe,
            role: update.role,
            isTracker: update.isTracker,
            battery: update.battery,
            speed: update.speed,
          } as any);
        }
      });

      if (!anyChanged) {
        // Enforce sort if it's the first time we see isMe
        const isSorted = nextMembers.length > 0 && ((nextMembers[0] as any).isMe || resolveMemberId(nextMembers[0]) === currentUserId);
        if (isSorted) return prev;
      }

      // Sort: isMe first, then name
      return nextMembers.sort((a, b) => {
        const aId = resolveMemberId(a);
        const bId = resolveMemberId(b);
        const aMe = (a as any).isMe || aId === currentUserId;
        const bMe = (b as any).isMe || bId === currentUserId;
        if (aMe && !bMe) return -1;
        if (!aMe && bMe) return 1;
        const aName = a.name || "";
        const bName = b.name || "";
        return aName.localeCompare(bName);
      });
    });
  }, [currentUserId]);

  const fetchCircleLiveStatus = useCallback(async (circleId: number | string | undefined) => {
    if (!circleId) return;
    const circleIdParam = String(circleId);
    const lastLoc = locationRef.current;
    if (!lastLoc) return;

    try {
      // Use maybePostCircleLocationUpdate with force=true to bypass throttle and get fresh data
      const result = await maybePostCircleLocationUpdate(circleIdParam, {
        latitude: lastLoc.latitude,
        longitude: lastLoc.longitude,
        speed: currentSpeed,
      }, true);

      if (result.success && result.data) {
        handleLiveStatusUpdate(result.data);
      }
    } catch (e) {
      console.warn("Failed to fetch circle live status:", e);
    }
  }, [handleLiveStatusUpdate, currentSpeed]);

  // Poll for circle live status every 5 minutes - Disabled periodic polling as per user request
  // useEffect(() => {
  //   let interval: any;
  //   const runPoll = () => {
  //     const cid = selectedCircleRef.current?.id;
  //     if (cid) {
  //       fetchCircleLiveStatus(cid);
  //     }
  //   };
  //
  //   runPoll();
  //   interval = setInterval(runPoll, 5000); // 5 seconds
  //   return () => clearInterval(interval);
  // }, [fetchCircleLiveStatus]);

  // Helper to animate floating buttons in or out
  const animateButtons = (hide: boolean) => {
    const toLeft = hide ? 0 : 1;   // leftButtons: 0=hidden, 1=shown
    const toRight = hide ? 1 : 0;  // myLocation: 0=shown, 1=hidden-right
    Animated.parallel([
      Animated.timing(leftButtonsAnim, { toValue: toLeft, duration: 220, useNativeDriver: true }),
      Animated.timing(mapLayerAnim, { toValue: toLeft, duration: 220, useNativeDriver: true }),
      Animated.timing(myLocationAnim, { toValue: toRight, duration: 220, useNativeDriver: true }),
    ]).start();
    setButtonsHidden(hide);
  };

  const animateHeader = (hide: boolean) => {
    const toVal = hide ? 0 : 1; // 0=hidden, 1=shown
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: toVal, duration: 250, useNativeDriver: true }),
      Animated.timing(chatAnim, { toValue: toVal, duration: 250, useNativeDriver: true }),
    ]).start();
    setHeaderHidden(hide);
  };



  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true, // Enable for all to allow "pull to map" from pages
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (activeTab === "Location") {
          return Math.abs(gestureState.dy) > 10;
        }
        // For other tabs (pages), only enable responder when dragging DOWN significantly
        return gestureState.dy > 10;
      },
      onPanResponderGrant: () => {
        sheetHeight.stopAnimation((value) => {
          dragStartHeightRef.current = value ?? INITIAL_SHEET_HEIGHT;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        let newHeight = dragStartHeightRef.current - gestureState.dy;
        const currentLimit = activeTab === "Location" ? MAP_FULL_HEIGHT : FULL_HEIGHT;

        if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;
        if (newHeight > currentLimit) newHeight = currentLimit;

        sheetHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentLimit = activeTab === "Location" ? MAP_FULL_HEIGHT : FULL_HEIGHT;
        const finalHeight = Math.min(
          Math.max(dragStartHeightRef.current - gestureState.dy, MIN_HEIGHT),
          currentLimit
        );

        // Velocity check or significant distance check
        const isSwipeUp = gestureState.dy < -50;
        const isSwipeDown = gestureState.dy > 50;

        let target = finalHeight;

        if (isSwipeUp) {
          // Swipe Up: move to next stop
          if (dragStartHeightRef.current < MID_HEIGHT) {
            target = MID_HEIGHT;
          } else if (dragStartHeightRef.current < MAX_HEIGHT) {
            target = MAX_HEIGHT;
          } else {
            target = currentLimit;
          }
        } else if (isSwipeDown) {
          // Swipe Down: move to prev stop
          if (dragStartHeightRef.current > MAX_HEIGHT) {
            target = MAX_HEIGHT;
          } else if (dragStartHeightRef.current > MID_HEIGHT) {
            target = MID_HEIGHT;
          } else {
            target = MIN_HEIGHT;
          }
        } else {
          // Snap to closest of 4 stops
          const distMin = Math.abs(finalHeight - MIN_HEIGHT);
          const distMid = Math.abs(finalHeight - MID_HEIGHT);
          const distMax = Math.abs(finalHeight - MAX_HEIGHT);
          const distFull = Math.abs(finalHeight - FULL_HEIGHT);

          const minDist = Math.min(distMin, distMid, distMax, distFull);
          if (minDist === distFull) target = FULL_HEIGHT;
          else if (minDist === distMax) target = MAX_HEIGHT;
          else if (minDist === distMid) target = MID_HEIGHT;
          else target = MIN_HEIGHT;
        }

        snapTo(target);
        setIsExpanded(target > MIN_HEIGHT);


      },
    })
  ).current;

  const snapTo = (targetHeight: number) => {
    dragStartHeightRef.current = targetHeight;
    
    // If we are on a non-Location tab and the user pulls down below MAP_FULL_HEIGHT - 20, switch back to Location
    if (activeTab !== "Location" && targetHeight < MAP_FULL_HEIGHT - 20) {
      setActiveTab("Location");
    }

    Animated.spring(sheetHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12
    }).start();
  };

  // --- Scroll / Section Tracking ---
  const sheetScrollRef = useRef<ScrollView | null>(null);
  const sectionPositions = useRef<Record<string, number>>({}).current;

  const scrollToSection = (key: string) => {
    const y = sectionPositions[key];
    if (y === undefined) return;
    const performScroll = () => {
      sheetScrollRef.current?.scrollTo({ y: Math.max(y - 10, 0), animated: true });
    };
    if (!isExpanded) {
      setIsExpanded(true);
      snapTo(MAX_HEIGHT);
      setTimeout(performScroll, 280);
    } else {
      performScroll();
    }
  };

  // --- CORE LOGIC: Fetch Members and their data from circle ---
  const fetchCircleMembers = useCallback(async (circleId: number | string | undefined) => {
    if (circleId === undefined || circleId === null) return;
    const circleIdParam = typeof circleId === "string" ? circleId : String(circleId);

    if (fetchCircleMembersInFlightRef.current.has(circleIdParam)) {
      return;
    }

    const lastFetch = memberFetchTimestampsRef.current[circleIdParam];
    if (lastFetch && Date.now() - lastFetch < MIN_MEMBER_REFRESH_INTERVAL_MS) {
      return;
    }

    fetchCircleMembersInFlightRef.current.add(circleIdParam);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/circles/${circleIdParam}`, {
        headers: { accept: "application/json" },
      });

      const payload = await response.json().catch(() => ({}));
      console.log("DEBUG: GET /api/circles/{id} payload:", JSON.stringify(payload, null, 2));

      // Log specifically the members array
      if (payload?.data?.members) {
        console.log("DEBUG: data.members array found with", payload.data.members.length, "members");
        console.log("DEBUG: First member:", JSON.stringify(payload.data.members[0], null, 2));
      } else {
        console.log("DEBUG: ⚠️ No data.members array in response!");
      }

      if (!response.ok) {
        console.warn("Failed to load circle members", payload?.message);
        return;
      }

      const circlePayload =
        payload?.data?.circle ??
        payload?.circle ??
        payload?.data ??
        payload;

      const normalizedLocations = extractCircleLocations(circlePayload);
      const normalizedCircle = {
        ...circlePayload,
        Locations: normalizedLocations,
      } as CircleData;

      const members = extractCircleMembers(normalizedCircle);
      console.log("fetchCircleMembers members extracted:", members.length, members.map(m => ({ id: m.id, avatar: m.avatar })));

      setSelectedCircleMembers(members);

      const avatarMap = members.reduce<Record<string, string | null>>((acc, member) => {
        const memberId = resolveMemberId(member);
        if (!memberId) {
          return acc;
        }
        // Use direct avatar property from CircleMember if available, otherwise try extraction
        const avatar = member.avatar ?? extractAvatarUrl(member) ?? extractAvatarUrl(member?.Membership) ?? null;
        acc[memberId] = avatar;
        return acc;
      }, {});



      const locationMap = buildMemberLocationMap(circlePayload, members);
      console.log("fetchCircleMembers locationMap built:", JSON.stringify(locationMap, null, 2));
      console.log("fetchCircleMembers locationMap keys:", Object.keys(locationMap));
      console.log("fetchCircleMembers locationMap count:", Object.keys(locationMap).length);

      setMemberAvatarUrls(avatarMap);
      setMemberLocations(locationMap);
      console.log("fetchCircleMembers setMemberLocations called with", Object.keys(locationMap).length, "locations");

      if (currentUserId) {
        const selfMember = members.find((member) => resolveMemberId(member) === currentUserId);
        const avatarFromMembers = extractAvatarUrl(selfMember) ?? extractAvatarUrl(selfMember?.Membership);
        if (avatarFromMembers) {
          setCurrentUserAvatarUrl(avatarFromMembers);
        }
        if (selfMember?.batteryLevel) {
          setCurrentUserBatteryLevel(selfMember.batteryLevel);
        }
      }

      // Update the full object if we got more details
      setSelectedCircle((prev) => {
        if (prev && String(prev.id) === circleIdParam) {
          return {
            ...prev,
            ...normalizedCircle,
            Locations: normalizedLocations,
          } as CircleData;
        }
        return prev;
      });
    } catch (error) {
      console.error("Failed to fetch circle members", error);
    } finally {
      fetchCircleMembersInFlightRef.current.delete(circleIdParam);
      memberFetchTimestampsRef.current[circleIdParam] = Date.now();
    }
  }, [currentUserId]);


  // --- CORE LOGIC: Select Circle ---
  const selectCircle = useCallback(
    async (circleId: number | string | null, circleList?: CircleData[]) => {
      if (circleId === null) {
        const previousCircleId = normalizeIdentifier(selectedCircleRef.current?.id);
        if (previousCircleId) {
          await removeCachedCircleLocations(previousCircleId);
          await removeLastPostedLocationForCircle(previousCircleId);
        }
        setSelectedCircle(null);
        setSelectedCircleMembers([]);
        setMemberAvatarUrls({});
        setMemberLocations({});
        await AsyncStorage.removeItem(STORAGE_KEYS.lastSelectedCircleId).catch(() => undefined);
        return;
      }

      const sourceList = circleList ?? circlesRef.current;
      if (!sourceList.length) return;

      const targetId = String(circleId);
      const found = sourceList.find((c) => String(c.id) === targetId);
      if (!found) return;

      const normalizedLocations = extractCircleLocations(found);
      const normalizedCircle: CircleData = {
        ...found,
        Locations: normalizedLocations,
      };

      setSelectedCircle(normalizedCircle);
      const currentMembers = extractCircleMembers(normalizedCircle);
      console.log("selectCircle members extracted:", currentMembers.length, currentMembers.map(m => ({ id: m.id, avatar: m.avatar })));

      setSelectedCircleMembers(currentMembers);

      const avatarMap = currentMembers.reduce<Record<string, string | null>>((acc, member) => {
        const memberId = resolveMemberId(member);
        if (!memberId) {
          return acc;
        }
        // Explicitly check member.avatar which we know is populated
        const avatar = member.avatar ?? extractAvatarUrl(member) ?? extractAvatarUrl(member?.Membership) ?? null;
        acc[memberId] = avatar;
        return acc;
      }, {});

      console.log("selectCircle avatarMap:", JSON.stringify(avatarMap, null, 2));

      const locationMap = buildMemberLocationMap(found, currentMembers);
      const hasMemberLocations = Object.keys(locationMap).length > 0;

      setMemberAvatarUrls(avatarMap);
      setMemberLocations(locationMap);

      if (currentUserId) {
        const selfMember = currentMembers.find((member) => resolveMemberId(member) === currentUserId);
        const avatarFromMembers = extractAvatarUrl(selfMember);
        if (avatarFromMembers) {
          setCurrentUserAvatarUrl(avatarFromMembers);
        }
        if (selfMember?.batteryLevel) {
          setCurrentUserBatteryLevel(selfMember.batteryLevel);
        }
      }

      // Always fetch fresh member data to ensure we have the latest locations
      // This fixes an issue where the initial list might lack current locations
      fetchCircleMembers(found.id);
      fetchCircleLiveStatus(found.id);

      await AsyncStorage.setItem(STORAGE_KEYS.lastSelectedCircleId, String(found.id)).catch(() => undefined);


      // Fit Map to Circle Content (Skipped on initial load to prioritize logged-in user zoom)
      if (normalizedLocations.length > 0 && mapRef.current) {
        if (isInitialCircleSelectRef.current) {
          isInitialCircleSelectRef.current = false;
          console.log("[MapScreen] Skipping fitBounds for initial load to focus on logged-in user location");
        } else {
          const coords = normalizedLocations
            .filter((l) => isValidCoordinate(l.latitude, l.longitude))
            .map((l) => ({ latitude: l.latitude, longitude: l.longitude }));

          // Include user location in bounds if available
          const latestLocation = locationRef.current;
          if (latestLocation) {
            coords.push({ latitude: latestLocation.latitude, longitude: latestLocation.longitude });
          }

          if (coords.length > 0) {
            setTimeout(() => {
              cameraRef.current?.fitBounds(
                [Math.max(...coords.map(c => c.longitude)), Math.max(...coords.map(c => c.latitude))],
                [Math.min(...coords.map(c => c.longitude)), Math.min(...coords.map(c => c.latitude))],
                [100, 50, Number(MIN_HEIGHT) + 100, 50],
                500
              );
            }, 500);
          }
        }
      }
    },
    [currentUserId, fetchCircleMembers, fetchCircleLiveStatus]
  );

  const fetchCircleLocations = useCallback(async (circleId: number | string | undefined) => {
    if (!circleId) return;
    const cid = String(circleId);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/circles/${cid}/locations`, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) return;

      const payload = await response.json();
      const locations = payload?.data || payload?.locations || [];

      setSelectedCircle(prev => {
        if (prev && String(prev.id) === cid) {
          return { ...prev, Locations: locations };
        }
        return prev;
      });
    } catch (e) {
      console.warn("Failed to fetch circle locations:", e);
    }
  }, []);

  const handleSelectCircle = useCallback(
    (circleId: number | string, circleList?: CircleData[]) => {
      selectCircle(circleId, circleList);
    },
    [selectCircle]
  );

  // --- CORE LOGIC: Fetch Current User Profile ---
  const fetchCurrentUserProfile = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/profile`, {
        method: "GET",
        headers: { accept: "application/json" },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.warn("Failed to fetch current user profile", payload?.message);
        return;
      }

      const userPayload =
        payload?.data?.user ??
        payload?.user ??
        payload?.data ??
        payload;

      const userIdCandidate =
        userPayload?.id ??
        userPayload?._id ??
        userPayload?.userId ??
        userPayload?.uuid ??
        null;

      const normalizedUserId =
        userIdCandidate !== undefined && userIdCandidate !== null
          ? String(userIdCandidate)
          : currentUserId;

      if (userPayload) {
        // Update storedUser to keep local state in sync with backend truth
        const mergedUser = { ...storedUser, ...userPayload };
        setStoredUser(mergedUser);
        await AsyncStorage.setItem("user", JSON.stringify(mergedUser)).catch(() => undefined);
      }

      const planPayload =
        payload?.data?.plan ??
        payload?.plan ??
        payload?.data?.Plan ??
        payload?.Plan ??
        null;
      
      setUserPlan(planPayload);
      await AsyncStorage.setItem("userPlan", planPayload ? JSON.stringify(planPayload) : 'null').catch(() => undefined);

      if (normalizedUserId && normalizedUserId !== currentUserId) {
        setCurrentUserId(normalizedUserId);
      }

      const avatarFromProfile = extractAvatarUrl(userPayload);
      if (avatarFromProfile) {
        setCurrentUserAvatarUrl(avatarFromProfile);
        setProfileAvatarOriginal((prev) => prev ?? avatarFromProfile);
        setProfileAvatarPreview((prev) => prev ?? avatarFromProfile);

        if (normalizedUserId) {
          setMemberAvatarUrls((prev) => {
            if (prev[normalizedUserId] === avatarFromProfile) {
              return prev;
            }
            return { ...prev, [normalizedUserId]: avatarFromProfile };
          });
        }
      }

      if (userPayload?.batteryLevel) {
        const extracted = extractBatteryLevelInfo(userPayload.batteryLevel);
        setCurrentUserBatteryLevel(extracted);
      } else {
        setCurrentUserBatteryLevel(null);
      }

      if (normalizedUserId) {
        const possibleLocation = extractCoordinatesFromCandidate(userPayload);
        if (
          possibleLocation &&
          Number.isFinite(possibleLocation.latitude) &&
          Number.isFinite(possibleLocation.longitude)
        ) {
          setMemberLocations((prev) => {
            const existing = prev[normalizedUserId];
            if (
              existing &&
              existing.latitude === possibleLocation.latitude &&
              existing.longitude === possibleLocation.longitude &&
              existing.accuracy === possibleLocation.accuracy
            ) {
              return prev;
            }
            return { ...prev, [normalizedUserId]: possibleLocation };
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch current user profile", error);
    }
  }, [currentUserId, storedUser]);

  const loadAssignedLocations = useCallback(async (force: boolean = false) => {
    if (loadingAssignedLocationsRef.current) {
      return;
    }

    if (!force) {
      const elapsed = Date.now() - lastAssignedFetchTimestampRef.current;
      if (elapsed < MIN_ASSIGNED_REFRESH_INTERVAL_MS) {
        return;
      }
    }

    loadingAssignedLocationsRef.current = true;
    setLoadingAssignedLocations(true);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/profile/assigned-locations`, {
        method: "GET",
        headers: { accept: "application/json" },
      });

      if (response.status === 401) {
        console.log("Assigned locations request unauthorized - redirecting to login");
        await logout();
        router.replace("/screens/LogInScreen" as any);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.warn("Failed to fetch assigned locations", payload?.message);
        return;
      }

      const rawList = parseAssignedLocationsList(payload);

      if (!rawList.length) {
        setAssignedLocationsByCircle({});
        return;
      }

      const map: Record<string, AssignedLocationRecord> = {};
      for (const item of rawList) {
        const normalized = buildAssignedLocationRecord(item);
        if (!normalized) {
          continue;
        }
        map[normalized.circleId] = normalized.record;
      }

      setAssignedLocationsByCircle(map);
    } catch (error) {
      console.warn("Failed to load assigned locations", error);
    } finally {
      loadingAssignedLocationsRef.current = false;
      setLoadingAssignedLocations(false);
      lastAssignedFetchTimestampRef.current = Date.now();
    }
  }, []);

  // --- CORE LOGIC: Load Circles (Robust Version) ---
  const loadCircles = useCallback(async (force: boolean = false) => {
    if (loadingCirclesRef.current) {
      return;
    }

    if (!force) {
      const elapsed = Date.now() - lastCircleFetchTimestampRef.current;
      if (elapsed < MIN_CIRCLE_REFRESH_INTERVAL_MS) {
        return;
      }
    }

    try {
      loadingCirclesRef.current = true;
      setLoadingCircles(true);
      console.log("Fetching circles from:", `${API_BASE_URL}/circles`);

      const res = await authenticatedFetch(`${API_BASE_URL}/circles`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      console.log("Fetch circles response status:", res.status);

      if (res.status === 401) {
        console.log("Unauthorized access - redirecting to login");
        loadingCirclesRef.current = false;
        setLoadingCircles(false);
        await logout();
        return router.replace("/screens/LogInScreen" as any);
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Could not read error body");
        console.error("Failed to fetch circles. Status:", res.status, "Body:", errorText);
        showAlert({ title: "Fetch Error", message: `Failed to load circles (Status: ${res.status}). ${errorText.substring(0, 100)}`, type: 'error' });
        return;
      }

      const data = await res.json();
      console.log("Circles data received:", JSON.stringify(data));

      // Handle various response structures
      let list: CircleData[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data && data.data && Array.isArray(data.data.circles)) {
        list = data.data.circles;
      } else if (data && Array.isArray(data.circles)) {
        list = data.circles;
      } else if (data && data.data && Array.isArray(data.data.data)) {
        list = data.data.data;
      }

      setCircles(list);
      // Cache the circles list for faster subsequent loads
      await AsyncStorage.setItem(STORAGE_KEYS.circles, JSON.stringify(list)).catch(() => undefined);

      if (list.length === 0) {
        await selectCircle(null, []);
        return;
      }

      // Restore last selected circle or default to first
      try {
        const storedCircleId = await AsyncStorage.getItem(STORAGE_KEYS.lastSelectedCircleId);
        if (storedCircleId) {
          const matchingByString = list.find((c) => String(c.id) === storedCircleId);
          if (matchingByString) {
            await selectCircle(matchingByString.id, list);
            return;
          }

          const parsed = Number(storedCircleId);
          if (Number.isFinite(parsed)) {
            const matchingByNumber = list.find((c) => Number(c.id) === parsed);
            if (matchingByNumber) {
              await selectCircle(matchingByNumber.id, list);
              return;
            }
          }
        }

        await selectCircle(list[0].id, list);
      } catch (storageError) {
        console.warn("Failed to restore last selected circle", storageError);
      }
    } catch (e) {
      console.error("Network or Logic Error in loadCircles:", e);
      showAlert({ title: "Connection Error", message: "Please check your internet connection.", type: 'error' });
    } finally {
      loadingCirclesRef.current = false;
      setLoadingCircles(false);
      lastCircleFetchTimestampRef.current = Date.now();
    }
  }, [selectCircle, showAlert]);

  const requestCirclesRefresh = useCallback(() => {
    void loadCircles(true);
  }, [loadCircles]);


  const handleSaveProfile = useCallback(async () => {
    if (isSavingProfile) return;

    // Basic Validation
    if (!profileNameInput.trim()) {
      setProfileModalError("Name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);
    setProfileModalError(null);

    try {
      // 1. Prepare Metadata
      let metadata: Record<string, any> | undefined;
      if (profileMetadataInput.trim()) {
        try {
          metadata = JSON.parse(profileMetadataInput);
        } catch {
          // If simple string or invalid JSON, treat as a single 'bio' field or similar
          metadata = { bio: profileMetadataInput };
        }
      }

      // 2. Call API
      const result = await updateUserProfile({
        name: profileNameInput.trim(),
        metadata,
        email: storedUser?.email,
        phoneNumber: storedUser?.phoneNumber,
        profileImage: profileAvatarUpload ? {
          uri: profileAvatarUpload.uri,
          name: profileAvatarUpload.name,
          type: profileAvatarUpload.type // We rely on prepareImageAsWebp setting this to image/webp
        } : undefined
      });

      console.log("Profile update result:", JSON.stringify(result, null, 2));

      // 3. Update Local Storage & State with Robust Parsing
      // Handle various response structures: { data: { user: ... } } or { user: ... } or { data: ... }
      const updatedUser =
        result?.data?.user ??
        result?.user ??
        result?.data ??
        result;

      if (updatedUser) {
        // Merge with existing stored user to preserve any missing fields
        const mergedUser = { ...storedUser, ...updatedUser };
        console.log("Merging user:", JSON.stringify(mergedUser, null, 2));
        setStoredUser(mergedUser);
        await AsyncStorage.setItem("user", JSON.stringify(mergedUser));

        // Update current avatar URL if changed
        const newAvatar = extractAvatarUrl(updatedUser);
        if (newAvatar) {
          setCurrentUserAvatarUrl(newAvatar);
          // If we uploaded a new image, clear the upload state
          if (profileAvatarUpload) {
            setProfileAvatarOriginal(newAvatar);
            setProfileAvatarUpload(null);
          }
        }
      }

      // 4. Close Modal / Feedback
      // We don't necessarily close the modal on save ("Edit" flow often keeps it open),
      // but we can show a toast or just success state.
      // Alert.alert("Success", "Profile updated successfully.");

      // Refresh circles content to show new name/avatar immediately
      // We do a "soft" refresh by triggering a fetch if possible
      void loadCircles(true); // force refresh

    } catch (error: any) {
      console.error("Profile save failed", error);
      setProfileModalError(error.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }, [isSavingProfile, profileNameInput, profileMetadataInput, profileAvatarUpload, storedUser, loadCircles]);

  // --- EFFECTS ---

  // 1. Sync Ref
  useEffect(() => {
    circlesRef.current = circles;
  }, [circles]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    setSelectedCircleMembers((prevMembers) => {
      let changed = false;
      const updated = prevMembers.map((member) => {
        if (resolveMemberId(member) === currentUserId) {
          const storedName = (storedUser as any)?.name;
          const currentAvatar = currentUserAvatarUrl;

          let memberUpdated = false;
          const updatedMember = { ...member };

          if (storedName && member.name !== storedName) {
            updatedMember.name = storedName;
            memberUpdated = true;
          }

          if (currentAvatar && member.avatar !== currentAvatar) {
            updatedMember.avatar = currentAvatar;
            memberUpdated = true;
          }

          if (memberUpdated) {
            changed = true;
            return updatedMember;
          }
        }
        return member;
      });

      return changed ? updated : prevMembers;
    });
  }, [currentUserAvatarUrl, currentUserId, storedUser]);

  useEffect(() => {
    if (!currentUserId || !currentUserAvatarUrl) {
      return;
    }

    setMemberAvatarUrls((prev) => {
      if (prev[currentUserId] === currentUserAvatarUrl) {
        return prev;
      }
      return { ...prev, [currentUserId]: currentUserAvatarUrl };
    });
  }, [currentUserAvatarUrl, currentUserId]);

  useEffect(() => {
    fetchCurrentUserProfile();
  }, [fetchCurrentUserProfile]);

  // 2. Initial Data Load (Location + Circles) - Optimized startup
  useEffect(() => {
    const runStartupSequence = async () => {
      try {
        setStartupStatus("Starting up...");
        setStartupProgress(0.05);

        // --- STEP 0: Load Cached Data IMMEDIATELY ---
        // This makes the app feel instant by showing last known state while network fetches happen
        const [cachedUser, cachedCircles, cachedCircleId] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem(STORAGE_KEYS.circles),
          AsyncStorage.getItem(STORAGE_KEYS.lastSelectedCircleId),
        ]);

        if (cachedUser) {
          try {
            const user = JSON.parse(cachedUser);
            setStoredUser(user);
            const mid = normalizeIdentifier(user.id || user.userId);
            if (mid) setCurrentUserId(mid);
          } catch (e) { }
        }

        if (cachedCircles) {
          try {
            const list = JSON.parse(cachedCircles);
            setCircles(list);
            // If we have a cached circle ID, select it immediately from the cached list
            if (cachedCircleId) {
              const found = list.find((c: any) => String(c.id) === cachedCircleId);
              if (found) {
                // Partial select (enough to render map/members from cache)
                const normalizedLocations = extractCircleLocations(found);
                setSelectedCircle({ ...found, Locations: normalizedLocations });
                const members = extractCircleMembers(found);
                setSelectedCircleMembers(members);
                const locMap = buildMemberLocationMap(found, members);
                setMemberLocations(locMap);
              }
            }
          } catch (e) { }
        }

        // --- STEP 1: Quick Location (Last Known) ---
        setStartupStatus("Checking permissions...");
        const { status } = await Location.requestForegroundPermissionsAsync();
        setStartupProgress(0.15);

        if (status === "granted") {
          try {
            setStartupStatus("Getting location...");
            // Use getLastKnownPositionAsync for immediate feedback
            const lastPos = await Location.getLastKnownPositionAsync();
            if (lastPos) {
              setLocation({
                latitude: lastPos.coords.latitude,
                longitude: lastPos.coords.longitude,
                heading: lastPos.coords.heading || 0,
                accuracy: lastPos.coords.accuracy ?? null,
              });
            }

            // Still trigger a fresh position fetch but don't block heavily if we have lastPos
            const posPromise = Location.getCurrentPositionAsync({ 
                accuracy: Location.Accuracy.Balanced,
            });
            
            // If we didn't have a last pos, we MUST wait. If we did, we can wait a bit less.
            const pos = await (lastPos 
                ? Promise.race([posPromise, new Promise<null>(r => setTimeout(() => r(null), 2000))])
                : posPromise);

            if (pos) {
              setLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                heading: pos.coords.heading || 0,
                accuracy: pos.coords.accuracy ?? null,
              });
            }
            setStartupProgress(0.3);
          } catch (e) {
            console.warn("Failed to get initial location during startup", e);
          }
        } else {
          setStartupProgress(0.3);
        }

        // Step 2: Parallel data fetching
        setStartupStatus("Loading your data...");

        const wrapProgress = async <T,>(promise: Promise<T>, increment: number): Promise<T> => {
          const result = await promise;
          setStartupProgress(prev => Math.min(0.95, prev + increment));
          return result;
        };

        // We run these in parallel. Since we have cached data, the UI is already partly populated.
        await Promise.all([
          wrapProgress(sendBatteryLevel().catch(e => console.warn("Failed to sync battery", e)), 0.15),
          wrapProgress(fetchCurrentUserProfile().catch(e => console.warn("Failed to fetch profile", e)), 0.15),
          wrapProgress(loadCircles().catch(e => console.warn("Failed to load circles", e)), 0.2),
          wrapProgress(loadAssignedLocations().catch(e => console.warn("Failed to load assignments", e)), 0.15)
        ]);

        setStartupStatus("Ready");
        setStartupProgress(1.0);
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        console.warn("Startup sequence error:", e);
        await loadCircles().catch(() => { });
        setStartupProgress(1.0);
      } finally {
        setLoading(false);
        setStartupStatus(null);
      }
    };

    runStartupSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // 3. Focus Effect (Refresh when screen comes into focus)
  useFocusEffect(
    useCallback(() => {
      const refreshSettings = async () => {
        try {
          const [storedLocationSharing, storedNotifications, storedDriveDetection] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.locationSharingEnabled),
            AsyncStorage.getItem(STORAGE_KEYS.notificationsEnabled),
            AsyncStorage.getItem("user_drive_detection_enabled"),
          ]);

          const initialLocationSharing = parseBooleanPreference(storedLocationSharing, true);
          const initialNotifications = parseBooleanPreference(storedNotifications, true);
          const initialDriveDetection = parseBooleanPreference(storedDriveDetection, false);

          setLocationSharingEnabled(initialLocationSharing);
          setNotificationsEnabled(initialNotifications);
          setDriveDetectionEnabled(initialDriveDetection);

          // Apply notification reception state
          await setNotificationReceptionEnabled(initialNotifications);
        } catch (e) {
          console.warn("Failed to refresh settings on focus", e);
        }
      };

      if (!loading) {
        loadCircles();
        loadAssignedLocations();
        refreshSettings();
      }
    }, [loading, loadCircles, loadAssignedLocations]) // Safe dependencies
  );

  useFocusEffect(
    useCallback(() => {
      const checkSelectedCircle = async () => {
        try {
          const storedId = await AsyncStorage.getItem(STORAGE_KEYS.lastSelectedCircleId);
          if (storedId && circlesRef.current.length > 0) {
            const found = circlesRef.current.find(c => String(c.id) === storedId);
            if (found && String(found.id) !== String(selectedCircleRef.current?.id)) {
              selectCircle(found.id);
            }
          }
        } catch (e) {
          console.warn("Failed to sync selected circle", e);
        }
        // Refresh circles list whenever we focus, to pick up new circles or name changes
        loadCircles(true);
      };

      checkSelectedCircle();
    }, [loadCircles, selectCircle])
  );
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleKeyboardShow = (event: any) => {
      setKeyboardHeight(event?.endCoordinates?.height ?? 0);
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showListener = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideListener = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Consolidated background/foreground heartbeat and location reporting logic
  useEffect(() => {
    let heartbeatInterval: any;

    const sendHeartbeat = async () => {
      try {
        // Local heartbeat for background task hand-off
        await AsyncStorage.setItem(LAST_FOREGROUND_HEARTBEAT, Date.now().toString());

        // Socket heartbeat for server-side status (Online/Offline)
        if (activeCircleIdRef.current) {
          SocketService.heartbeat(activeCircleIdRef.current, currentUserId);
        }
      } catch (e) {
        // Silent fail
      }
    };

    // Send immediate heartbeat on mount
    void sendHeartbeat();

    // Send heartbeat every 15 seconds (slightly less frequent than location to save battery but enough to stay Online)
    heartbeatInterval = setInterval(sendHeartbeat, 15000);

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [currentUserId]);

  useEffect(() => {
    let cancelled = false;

    const ensureForegroundWatch = async () => {
      try {
        let status = (await Location.getForegroundPermissionsAsync()).status;
        if (status !== "granted") {
          status = (await Location.requestForegroundPermissionsAsync()).status;
        }

        if (status !== "granted") {
          return;
        }

        try {
          locationWatchSubscriptionRef.current?.remove();
        } catch (cleanupError) {
          console.warn("Failed to remove existing location subscription", cleanupError);
        }

        // We now use Mapbox.UserLocation onUpdate instead of Expo Location for the foreground.
        console.log("Foreground location watching handled by Mapbox.UserLocation");
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to start foreground location watcher", error);
        }
      }
    };

    void ensureForegroundWatch();

    return () => {
      cancelled = true;
      if (locationWatchSubscriptionRef.current) {
        try {
          locationWatchSubscriptionRef.current.remove();
        } catch (error) {
          console.warn("Failed to remove location watcher", error);
        }
        locationWatchSubscriptionRef.current = null;
      }
    };
  }, []); // Remove dependency on driveDetectionEnabled to keep it fixed

  useEffect(() => {
    const cid = selectedCircle?.id ? String(selectedCircle.id) : null;
    activeCircleIdRef.current = cid;
    if (cid) {
      void AsyncStorage.setItem("mapScreen:lastSelectedCircleId", cid);
      // Join socket room
      SocketService.joinCircle(cid);
    }
  }, [selectedCircle]);

  // Socket Real-time Listener
  useEffect(() => {
    const handleSync = (data: any) => {
      console.log("[MapScreen] Received circle_data_sync via socket:", data?.length, "members");
      if (Array.isArray(data)) {
        handleLiveStatusUpdate(data);
      }
    };

    SocketService.on('circle_data_sync', handleSync);

    return () => {
      SocketService.off('circle_data_sync', handleSync);
    };
  }, [handleLiveStatusUpdate]);

  // 4. Update members when selection changes
  useEffect(() => {
    if (!selectedCircle) {
      setSelectedCircleMembers([]);
      return;
    }

    const members = extractCircleMembers(selectedCircle);
    setSelectedCircleMembers(members);

    if (!members.length) {
      fetchCircleMembers(selectedCircle.id);
    }
  }, [selectedCircle, fetchCircleMembers]);



  useEffect(() => {
    if (!isNativePlatform) {
      return;
    }

    let cancelled = false;

    const manageBackgroundLocationUpdates = async () => {
      try {
        if (!locationSharingEnabled || !selectedCircle) {
          const hasStarted = await isBackgroundLocationRunning();
          if (hasStarted) {
            await stopBackgroundLocation();
          }
          return;
        }

        // Check Permissions
        const foregroundPermissions = await Location.getForegroundPermissionsAsync();
        let foregroundStatus = foregroundPermissions.status;
        if (foregroundStatus !== "granted") {
          const request = await Location.requestForegroundPermissionsAsync();
          foregroundStatus = request.status;
          if (foregroundStatus !== "granted") {
            return;
          }
        }

        const backgroundPermissions = await Location.getBackgroundPermissionsAsync();
        let backgroundStatus = backgroundPermissions.status;
        if (backgroundStatus !== "granted") {
          const request = await Location.requestBackgroundPermissionsAsync();
          backgroundStatus = request.status;
          if (backgroundStatus !== "granted") {
            return;
          }
        }

        const hasStarted = await isBackgroundLocationRunning();
        if (!hasStarted) {
          await startBackgroundLocation();
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Background location setup failed", error);
        }
      }
    };

    void manageBackgroundLocationUpdates();

    return () => {
      cancelled = true;
    };
  }, [locationSharingEnabled, selectedCircle]);

  const circleMembersById = useMemo(() => {
    const map = new Map<string, CircleMember>();
    selectedCircleMembers.forEach((member) => {
      const memberId = resolveMemberId(member);
      if (memberId) {
        map.set(memberId, member);
      }
    });
    return map;
  }, [selectedCircleMembers]);

  const currentLocations = useMemo(() => extractCircleLocations(selectedCircle), [selectedCircle]);

  useEffect(() => {
    const circleId = normalizeIdentifier(selectedCircle?.id);
    if (!circleId) {
      return;
    }

    void cacheCircleLocations(circleId, currentLocations);
  }, [currentLocations, selectedCircle]);

  const locationOptions = useMemo<MemberLocationOption[]>(() => {
    return currentLocations
      .map((loc, index) => {
        const id = normalizeIdentifier(loc.id);
        if (!id) {
          return null;
        }

        let metadataAddress: string | undefined;
        if (loc.metadata && typeof loc.metadata === "object") {
          const addressValue = (loc.metadata as any).address;
          const formattedValue = (loc.metadata as any).formattedAddress;
          if (typeof addressValue === "string" && addressValue.trim().length > 0) {
            metadataAddress = addressValue.trim();
          } else if (typeof formattedValue === "string" && formattedValue.trim().length > 0) {
            metadataAddress = formattedValue.trim();
          }
        }

        const label =
          loc.name && loc.name.trim().length > 0
            ? loc.name.trim()
            : metadataAddress ?? `Place ${index + 1}`;
        const subtitle = metadataAddress ?? "Location Label";

        return {
          id,
          label,
          subtitle,
        };
      })
      .filter((item): item is MemberLocationOption => item !== null);
  }, [currentLocations]);

  const assignedLocationLabel = useMemo(() => {
    if (!selectedMemberLocationId) {
      return "None";
    }
    const match = locationOptions.find((option) => option.id === selectedMemberLocationId);
    return match?.label ?? "Unknown place";
  }, [locationOptions, selectedMemberLocationId]);

  const selectedLocationExists = useMemo(() => {
    if (!selectedMemberLocationId) {
      return true;
    }
    return locationOptions.some((option) => option.id === selectedMemberLocationId);
  }, [locationOptions, selectedMemberLocationId]);

  const currentCircleId = useMemo(() => normalizeIdentifier(selectedCircle?.id), [selectedCircle]);

  const currentAssignedEntry = useMemo(() => {
    if (!currentCircleId) {
      return null;
    }
    return assignedLocationsByCircle[currentCircleId] ?? null;
  }, [assignedLocationsByCircle, currentCircleId]);

  const currentUserAssignedLocationId = useMemo(() => {
    if (!currentAssignedEntry) {
      return null;
    }

    return (
      normalizeIdentifier(
        currentAssignedEntry.locationId ??
        currentAssignedEntry.locationPoint?.id ??
        currentAssignedEntry.raw?.location?.id ??
        currentAssignedEntry.raw?.locationId ??
        currentAssignedEntry.raw?.location_id
      ) ?? null
    );
  }, [currentAssignedEntry]);

  const handleLocationArrivalAlerts = useCallback((arrived: CachedCircleLocation[]) => {
    if (!notificationsEnabled) {
      return;
    }

    if (!arrived || arrived.length === 0) {
      return;
    }

    const assignedLocationId = currentUserAssignedLocationId;

    arrived.forEach((location) => {
      const normalizedId = normalizeIdentifier(location.id);
      const isAssignedLocation = assignedLocationId !== null && normalizedId === assignedLocationId;

      let label: string | undefined;
      if (typeof location.name === "string" && location.name.trim().length > 0) {
        label = location.name.trim();
      } else if (location.metadata && typeof location.metadata === "object") {
        const metadataRecord = location.metadata as Record<string, unknown>;
        const addressValue = metadataRecord.address;
        const formattedValue = metadataRecord.formattedAddress ?? (metadataRecord as any)?.formatted_address;
        if (typeof addressValue === "string" && addressValue.trim().length > 0) {
          label = addressValue.trim();
        } else if (typeof formattedValue === "string" && formattedValue.trim().length > 0) {
          label = formattedValue.trim();
        }
      }

      if (!label) {
        label = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
      }

      const title = isAssignedLocation ? "Assigned place reached" : "Circle place reached";
      const message = isAssignedLocation
        ? `You arrived at your assigned place${label ? `: ${label}` : ""}. We're notifying everyone in the circle.`
        : `You arrived at ${label}. We're notifying everyone in the circle.`;

      console.log({ title, message, type: 'info' });


      // showAlert({ title, message, type: 'info' });
    });
  }, [currentUserAssignedLocationId, notificationsEnabled, showAlert]);



  const assignedLocationDetails = useMemo<AssignedLocationDetails | null>(() => {
    if (!currentAssignedEntry) {
      return null;
    }

    const candidateId = currentUserAssignedLocationId;
    const matchingSavedLocation = candidateId
      ? currentLocations.find((loc) => normalizeIdentifier(loc.id) === candidateId)
      : undefined;

    const getMetadataAddress = (loc: LocationPoint | null | undefined) => {
      if (!loc?.metadata || typeof loc.metadata !== "object") {
        return undefined;
      }
      const meta = loc.metadata as Record<string, unknown>;
      const addressValue = meta.address;
      const formattedValue = meta.formattedAddress ?? (meta as any)?.formatted_address;
      if (typeof addressValue === "string" && addressValue.trim().length > 0) {
        return addressValue.trim();
      }
      if (typeof formattedValue === "string" && String(formattedValue).trim().length > 0) {
        return String(formattedValue).trim();
      }
      return undefined;
    };

    let label = "Assigned location";
    let subtitle: string | undefined;
    let coordinates: { latitude: number; longitude: number } | undefined;

    if (matchingSavedLocation) {
      label =
        (typeof matchingSavedLocation.name === "string" && matchingSavedLocation.name.trim().length > 0)
          ? matchingSavedLocation.name.trim()
          : getMetadataAddress(matchingSavedLocation) ?? label;
      coordinates = {
        latitude: matchingSavedLocation.latitude,
        longitude: matchingSavedLocation.longitude,
      };
      const savedSubtitle = getMetadataAddress(matchingSavedLocation);
      subtitle = savedSubtitle ?? `${matchingSavedLocation.latitude.toFixed(4)}, ${matchingSavedLocation.longitude.toFixed(4)}`;
    } else if (currentAssignedEntry.locationPoint) {
      const loc = currentAssignedEntry.locationPoint;
      label =
        (typeof loc.name === "string" && loc.name.trim().length > 0)
          ? loc.name.trim()
          : getMetadataAddress(loc) ?? label;
      coordinates = { latitude: loc.latitude, longitude: loc.longitude };
      const locationSubtitle = getMetadataAddress(loc);
      subtitle = locationSubtitle ?? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
    } else if (
      typeof currentAssignedEntry.latitude === "number" &&
      typeof currentAssignedEntry.longitude === "number"
    ) {
      coordinates = {
        latitude: currentAssignedEntry.latitude,
        longitude: currentAssignedEntry.longitude,
      };
      subtitle = `${currentAssignedEntry.latitude.toFixed(4)}, ${currentAssignedEntry.longitude.toFixed(4)}`;
    }

    return {
      label,
      subtitle,
      coordinates,
    };
  }, [currentAssignedEntry, currentLocations, currentUserAssignedLocationId]);

  const fallbackAssignedMarker = useMemo(() => {
    if (!currentAssignedEntry) {
      return null;
    }

    if (currentUserAssignedLocationId) {
      const existsInSaved = currentLocations.some(
        (loc) => normalizeIdentifier(loc.id) === currentUserAssignedLocationId
      );
      if (existsInSaved) {
        return null;
      }
    }

    if (currentAssignedEntry.locationPoint) {
      const { latitude, longitude } = currentAssignedEntry.locationPoint;
      if (isValidCoordinate(latitude, longitude)) {
        return {
          latitude,
          longitude,
          title: assignedLocationDetails?.label ??
            (typeof currentAssignedEntry.locationPoint.name === "string" && currentAssignedEntry.locationPoint.name.trim().length > 0
              ? currentAssignedEntry.locationPoint.name.trim()
              : "Assigned location"),
          subtitle: assignedLocationDetails?.subtitle,
          radius: getRadiusForLocation(currentAssignedEntry.locationPoint),
        };
      }
    }

    if (
      typeof currentAssignedEntry.latitude === "number" &&
      typeof currentAssignedEntry.longitude === "number" &&
      isValidCoordinate(currentAssignedEntry.latitude, currentAssignedEntry.longitude)
    ) {
      return {
        latitude: currentAssignedEntry.latitude,
        longitude: currentAssignedEntry.longitude,
        title: assignedLocationDetails?.label ?? "Assigned location",
        subtitle: assignedLocationDetails?.subtitle,
        radius: DEFAULT_LOCATION_RADIUS_METERS,
      };
    }

    return null;
  }, [assignedLocationDetails, currentAssignedEntry, currentLocations, currentUserAssignedLocationId]);

    const handleFocusAssignedLocation = useCallback(() => {
    if (!assignedLocationDetails?.coordinates) {
      return;
    }

    const { latitude, longitude } = assignedLocationDetails.coordinates;
    cameraRef.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      zoomLevel: 14,
      animationDuration: 1500
    });
    setIsExpanded(true);
  }, [assignedLocationDetails, mapRef, setIsExpanded]);


  // ==========================================
  // X/Y PROJECTION STATE & LOGIC
  // ==========================================
  const [memberProjectedCoords, setMemberProjectedCoords] = useState<Record<string, { x: number; y: number }>>({});
  const [locationProjectedCoords, setLocationProjectedCoords] = useState<Record<string, { x: number; y: number }>>({});
  const [fallbackProjectedCoord, setFallbackProjectedCoord] = useState<{ x: number; y: number } | null>(null);

  const syncMarkerPositions = useCallback(async () => {
    if (!mapRef.current) {
      console.log("[XY] Skip: mapRef null");
      return;
    }

    try {
      const newMemberCoords: Record<string, { x: number; y: number }> = {};

      // Merge current user's live location with circle members
      const allMemberSpots = { ...memberLocations };
      if (currentUserId && location) {
        allMemberSpots[currentUserId] = location;
      }

      // 1. Project Members
      const memberPairs = Object.entries(allMemberSpots);
      const memberPromises = memberPairs.map(async ([mid, coords]) => {
        if (isValidCoordinate(coords.latitude, coords.longitude)) {
          const pointArr = await (mapRef.current as any).getPointInView([coords.longitude, coords.latitude]);
          const point = { x: pointArr[0], y: pointArr[1] };
          if (point && typeof point.x === 'number' && typeof point.y === 'number') {
            newMemberCoords[mid] = point;
          }
        }
      });

      // 2. Project Locations
      const newLocationCoords: Record<string, { x: number; y: number }> = {};
      const locationPromises = currentLocations.map(async (loc, index) => {
        if (isValidCoordinate(loc.latitude, loc.longitude)) {
          const pointArr = await (mapRef.current as any).getPointInView([loc.longitude, loc.latitude]);
          const point = { x: pointArr[0], y: pointArr[1] };
          const key = loc.id ? String(loc.id) : `loc-${index}`;
          if (point && typeof point.x === 'number' && typeof point.y === 'number') {
            newLocationCoords[key] = point;
          }
        }
      });

      // 3. Project Fallback Marker
      let newFallbackCoord = null;
      if (fallbackAssignedMarker && isValidCoordinate(fallbackAssignedMarker.latitude, fallbackAssignedMarker.longitude)) {
        const pointArr = await (mapRef.current as any).getPointInView([fallbackAssignedMarker.longitude, fallbackAssignedMarker.latitude]);
        newFallbackCoord = { x: pointArr[0], y: pointArr[1] };
      }

      await Promise.all([...memberPromises, ...locationPromises]);

      setMemberProjectedCoords(newMemberCoords);
      setLocationProjectedCoords(newLocationCoords);
      setFallbackProjectedCoord(newFallbackCoord);

      console.log(`[XY] Projected ${Object.keys(newMemberCoords).length} members:`, JSON.stringify(newMemberCoords));
    } catch (e) {
      console.error("[XY] Sync Error:", e);
    }
  }, [memberLocations, currentLocations, fallbackAssignedMarker, currentUserId, location, mapRef]);

  // Run projection when data changes
  useEffect(() => {
    syncMarkerPositions();
  }, [syncMarkerPositions]);

  const {
    filteredDescending: locationHistoryFilteredDescending,
    polylineCoordinates: locationHistoryPolylineCoordinates,
    arrowMarkers: locationHistoryArrowMarkers,
    filterError: locationHistoryFilterError,
  } = useMemo(() => {
    if (!locationHistory.length) {
      return {
        filteredChronological: [],
        filteredDescending: [],
        polylineCoordinates: [] as { latitude: number; longitude: number }[],
        arrowMarkers: [] as { id: string; latitude: number; longitude: number; rotation: number }[],
        filterError: null as string | null,
      };
    }

    const sortedChronological = [...locationHistory].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return aTime - bTime;
    });

    const now = new Date();
    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;
    let filterError: string | null = null;

    let activeFilter = locationHistoryActiveFilter;
    if (isFreePlan(userPlan) && activeFilter !== "today" && activeFilter !== "yesterday") {
      activeFilter = "today";
    }

    switch (activeFilter) {
      case "today": {
        rangeStart = toDateAtMidnight(now);
        rangeEnd = toDateAtEndOfDay(now);
        break;
      }
      case "yesterday": {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        rangeStart = toDateAtMidnight(yesterday);
        rangeEnd = toDateAtEndOfDay(yesterday);
        break;
      }
      case "this_week": {
        rangeStart = startOfWeekLocal(now);
        rangeEnd = toDateAtEndOfDay(now);
        break;
      }
      case "this_month": {
        rangeStart = startOfMonthLocal(now);
        rangeEnd = toDateAtEndOfDay(now);
        break;
      }
      case "custom": {
        const parsedStart = parseDateInput(locationHistoryCustomStart);
        const parsedEnd = parseDateInput(locationHistoryCustomEnd);
        if (!parsedStart || !parsedEnd) {
          filterError = "Enter valid dates in YYYY-MM-DD format.";
        } else if (parsedStart > parsedEnd) {
          filterError = "Start date must be before end date.";
        } else {
          rangeStart = toDateAtMidnight(parsedStart);
          rangeEnd = toDateAtEndOfDay(parsedEnd);
        }
        break;
      }
      default:
        rangeStart = null;
        rangeEnd = null;
        break;
    }

    const filteredChronological = sortedChronological.filter((entry) => {
      const entryDate = new Date(entry.createdAt);
      if (Number.isNaN(entryDate.getTime())) {
        return false;
      }
      if (rangeStart && entryDate < rangeStart) {
        return false;
      }
      if (rangeEnd && entryDate > rangeEnd) {
        return false;
      }
      return true;
    });

    const filteredDescending = [...filteredChronological].reverse();

    const polylineCoordinates = filteredChronological
      .map((entry) => {
        if (!Number.isFinite(entry.latitude) || !Number.isFinite(entry.longitude)) {
          return null;
        }
        return { latitude: entry.latitude, longitude: entry.longitude };
      })
      .filter((coord): coord is { latitude: number; longitude: number } => coord !== null);

    const arrowMarkers: { id: string; latitude: number; longitude: number; rotation: number }[] = [];
    if (filteredChronological.length >= 2) {
      for (let i = 1; i < filteredChronological.length; i += 1) {
        const prev = filteredChronological[i - 1];
        const curr = filteredChronological[i];
        if (!Number.isFinite(prev.latitude) || !Number.isFinite(prev.longitude)) {
          continue;
        }
        if (!Number.isFinite(curr.latitude) || !Number.isFinite(curr.longitude)) {
          continue;
        }
        const midpoint = {
          latitude: prev.latitude + (curr.latitude - prev.latitude) * 0.5,
          longitude: prev.longitude + (curr.longitude - prev.longitude) * 0.5,
        };
        arrowMarkers.push({
          id: `${prev.id}-${curr.id}`,
          latitude: midpoint.latitude,
          longitude: midpoint.longitude,
          rotation: calculateHeadingDegrees(prev, curr),
        });
      }
    }

    return {
      filteredChronological,
      filteredDescending,
      polylineCoordinates,
      arrowMarkers,
      filterError,
    };
  }, [
    locationHistory,
    locationHistoryActiveFilter,
    locationHistoryCustomEnd,
    locationHistoryCustomStart,
    userPlan,
  ]);

  const locationHistoryMapInitialRegion = useMemo(() => {
    if (!locationHistoryPolylineCoordinates.length) {
      return null;
    }

    const latitudes = locationHistoryPolylineCoordinates.map((coord) => coord.latitude);
    const longitudes = locationHistoryPolylineCoordinates.map((coord) => coord.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLon + maxLon) / 2;
    const latitudeDelta = Math.max((maxLat - minLat) * 1.2, 0.01);
    const longitudeDelta = Math.max((maxLon - minLon) * 1.2, 0.01);

    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }, [locationHistoryPolylineCoordinates]);

  const batteryLevelPercent = useMemo(() => {
    if (currentUserBatteryLevel?.batteryLevel === undefined || currentUserBatteryLevel?.batteryLevel === null) {
      return null;
    }
    const numeric = Number(currentUserBatteryLevel.batteryLevel);
    if (!Number.isFinite(numeric)) {
      return null;
    }
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }, [currentUserBatteryLevel]);

  const batteryUpdatedAtLabel = useMemo(() => {
    const timestamp = currentUserBatteryLevel?.updatedAt;
    if (!timestamp) {
      return null;
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return formatToSLTime(date);
  }, [currentUserBatteryLevel]);

  useEffect(() => {
    if (!isLocationHistoryModalVisible) {
      setShouldRenderLocationHistoryMap(false);
      return;
    }

    const timeout = setTimeout(() => {
      setShouldRenderLocationHistoryMap(true);
    }, 120);

    return () => {
      clearTimeout(timeout);
    };
  }, [isLocationHistoryModalVisible]);

  useEffect(() => {
    if (!shouldRenderLocationHistoryMap) { // Changed from isLocationHistoryModalVisible
      return;
    }
    if (locationHistoryPolylineCoordinates.length < 2) {
      return;
    }
    if (!locationHistoryMapRef.current) {
      return;
    }
    const uniqueCoords = locationHistoryPolylineCoordinates.filter((coord, index, array) => {
      if (index === 0) {
        return true;
      }
      const prev = array[index - 1];
      return coord.latitude !== prev.latitude || coord.longitude !== prev.longitude;
    });
    if (!uniqueCoords.length) {
      return;
    }
    const timer = setTimeout(() => {
      locationHistoryCameraRef.current?.fitBounds(
        [Math.max(...uniqueCoords.map(c => c.longitude)), Math.max(...uniqueCoords.map(c => c.latitude))],
        [Math.min(...uniqueCoords.map(c => c.longitude)), Math.min(...uniqueCoords.map(c => c.latitude))],
        40,
        800
      );
    }, 350);
    return () => {
      clearTimeout(timer);
    };
  }, [shouldRenderLocationHistoryMap, locationHistoryPolylineCoordinates]); // Changed from isLocationHistoryModalVisible

  const canEditMemberRole = useCallback(
    (member: CircleMember) => {
      if (!member) return false;
      const memberId = resolveMemberId(member);
      if (!memberId) return false;
      if (memberId === currentUserId) return false; // Cannot edit own role

      const memberRole = normalizeRole(member.Membership?.role);

      if (isCircleCreator) {
        // Creator can change anyone who is an admin or member
        return memberRole === "admin" || memberRole === "member";
      }

      if (currentMembershipRole === "admin") {
        // Admins can change anyone who is an admin or member
        return memberRole === "admin" || memberRole === "member";
      }

      return false;
    },
    [currentMembershipRole, currentUserId, isCircleCreator]
  );

  const canEditMemberNickname = useCallback(
    (member: CircleMember) => {
      if (!member) return false;
      const memberId = resolveMemberId(member);
      if (!memberId) return false;
      if (memberId === currentUserId) return true; // Can always edit own nickname

      const memberRole = normalizeRole(member.Membership?.role);

      if (isCircleCreator) {
        // Creator can edit nicknames for admins and members
        return memberRole === "admin" || memberRole === "member";
      }

      if (currentMembershipRole === "admin") {
        // Admins can edit nicknames for other admins and members
        return memberRole === "admin" || memberRole === "member";
      }

      return false;
    },
    [currentMembershipRole, currentUserId, isCircleCreator]
  );

  const canRemoveMember = useCallback(
    (member: CircleMember) => {
      if (!member || !selectedCircle) return false;
      const memberId = resolveMemberId(member);
      if (!memberId || memberId === currentUserId) return false;
      const memberRole = normalizeRole(member.Membership?.role);

      if (isCircleCreator) {
        // creator can change and edit admins and members
        return memberRole === "admin" || memberRole === "member";
      }

      if (currentMembershipRole === "admin") {
        // Admins can change creator and Members Details
        return memberRole === "creator" || memberRole === "member";
      }

      return false;
    },
    [currentMembershipRole, currentUserId, isCircleCreator, selectedCircle]
  );





  const executeRemoveMember = useCallback(
    async (member: CircleMember, memberId: string) => {
      if (!selectedCircle) return;
      const circleId = String(selectedCircle.id);

      try {
        setMemberRemovalLoadingId(memberId);
        const response = await authenticatedFetch(
          `${API_BASE_URL}/circles/${circleId}/members/${memberId}`,
          {
            method: "DELETE",
            headers: {
              accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.message ?? "Failed to remove member.");
        }

        await fetchCircleMembers(selectedCircle.id);
        await loadAssignedLocations(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not remove member.";
        showAlert({ title: "Remove failed", message, type: 'error' });
      } finally {
        setMemberRemovalLoadingId(null);
      }
    },
    [fetchCircleMembers, loadAssignedLocations, selectedCircle]
  );

  const confirmRemoveMember = useCallback(
    (member: CircleMember) => {
      const memberId = resolveMemberId(member);
      if (!memberId) return;

      if (!canRemoveMember(member)) {
        showAlert({ title: "Permission denied", message: "You do not have permission to remove this member.", type: 'warning' });
        return;
      }

      const memberName = member.Membership?.nickname || member.name || member.email || "this member";

      showAlert({
        title: "Remove member",
        message: `Are you sure you want to remove ${memberName} from this circle?`,
        type: 'confirmation',
        buttons: [
          { text: "Cancel", style: "cancel", onPress: () => { } },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => executeRemoveMember(member, memberId),
          },
        ]
      });
    },
    [canRemoveMember, executeRemoveMember]
  );


  // --- HANDLERS ---

  const handleOpenCirclesModal = useCallback(() => {
    setIsCirclesModalOpen(true);
  }, []);



  const handleOpenDriveDetectionModal = useCallback(() => {
    setIsDriveDetectionModalOpen(true);
    setIsSettingsModalOpen(false);
  }, []);







  const handleAddPeople = useCallback(() => {
    setIsCirclesModalOpen(true);
    setIsSettingsModalOpen(false);
  }, []);

  const handleToggleAdminStatus = useCallback(async (userId: string, isAdmin: boolean) => {
    if (!selectedCircle) return;
    const desiredRole = isAdmin ? 'admin' : 'member';
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/circles/${selectedCircle.id}/members/${userId}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({ role: desiredRole }),
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message ?? "Failed to update role.");
      }

      await fetchCircleMembers(selectedCircle.id);
    } catch (error: any) {
      showAlert({ title: "Error", message: error.message || "Failed to update admin status.", type: 'error' });
      throw error;
    }
  }, [selectedCircle, fetchCircleMembers]);

  // Edit Member Modal - computed values and handlers
  const editMemberModalVisible = isEditMemberModalOpen;

  const canEditRoleInModal = memberBeingEdited ? canEditMemberRole(memberBeingEdited) : false;
  const canEditNicknameInModal = memberBeingEdited ? canEditMemberNickname(memberBeingEdited) : false;



  const openEditMemberModal = useCallback((member: CircleMember) => {
    setMemberBeingEdited(member);
    setEditedMemberRole(normalizeRole(member.Membership?.role) || 'member');
    setEditedMemberNickname(member.Membership?.nickname || '');
    setEditedMemberRelation(member.Membership?.metadata?.relation || 'Other');
    setSelectedMemberLocationId(resolveMembershipLocationId(member));
    setMemberModalError(null);
    setIsEditMemberModalOpen(true);
  }, []);

  const closeEditMemberModal = useCallback(() => {
    setIsEditMemberModalOpen(false);
    setMemberBeingEdited(null);
    setEditedMemberRole('member');
    setEditedMemberNickname('');
    setEditedMemberRelation('Other');
    setSelectedMemberLocationId(null);
    setMemberModalError(null);
  }, []);

  const handleSaveMemberChanges = useCallback(async () => {
    if (!selectedCircle || !memberBeingEdited || isSavingMemberChanges) return;

    const memberId = resolveMemberId(memberBeingEdited);
    if (!memberId) {
      setMemberModalError('Invalid member ID');
      return;
    }

    setMemberModalError(null);
    setIsSavingMemberChanges(true);

    try {
      const updates: any = {};

      // Update role if changed and allowed
      const currentRole = normalizeRole(memberBeingEdited.Membership?.role) || 'member';
      if (canEditRoleInModal && editedMemberRole !== currentRole) {
        updates.role = editedMemberRole;
      }

      // Update nickname if changed and allowed
      const currentNickname = memberBeingEdited.Membership?.nickname || '';
      if (canEditNicknameInModal && editedMemberNickname !== currentNickname) {
        updates.nickname = editedMemberNickname;
      }

      // Update relation if changed
      const currentRelation = memberBeingEdited.Membership?.metadata?.relation || 'Other';
      if (editedMemberRelation !== currentRelation) {
        updates.metadata = { ...(memberBeingEdited.Membership?.metadata || {}), relation: editedMemberRelation };
      }

      // Update location assignment if changed
      const currentLocationId = resolveMembershipLocationId(memberBeingEdited);
      if (selectedMemberLocationId !== currentLocationId) {
        updates.locationId = selectedMemberLocationId;
      }

      if (Object.keys(updates).length === 0) {
        setMemberModalError('No changes to save');
        return;
      }

      const response = await authenticatedFetch(
        `${API_BASE_URL}/circles/${selectedCircle.id}/members/${memberId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message ?? 'Failed to update member');
      }

      await fetchCircleMembers(selectedCircle.id);
      showAlert({ title: 'Success', message: 'Member updated successfully', type: 'success' });
      closeEditMemberModal();
    } catch (error: any) {
      setMemberModalError(error.message || 'Failed to update member');
    } finally {
      setIsSavingMemberChanges(false);
    }
  }, [
    selectedCircle,
    memberBeingEdited,
    isSavingMemberChanges,
    canEditRoleInModal,
    canEditNicknameInModal,
    editedMemberRole,
    editedMemberNickname,
    editedMemberRelation,
    selectedMemberLocationId,
    fetchCircleMembers,
    showAlert,
    closeEditMemberModal,
  ]);

  const handleUpdateMyRelation = useCallback(async (newRelation: string) => {
    if (!selectedCircle || !currentMembership) return;

    const memberId = resolveMemberId(currentMembership);
    if (!memberId) return;

    try {
      const updates = {
        metadata: {
          ...(currentMembership.Membership?.metadata || {}),
          relation: newRelation,
        },
      };

      const response = await authenticatedFetch(
        `${API_BASE_URL}/circles/${selectedCircle.id}/members/${memberId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message ?? 'Failed to update relation');
      }

      await fetchCircleMembers(selectedCircle.id);
      showAlert({ title: 'Success', message: 'Relation updated successfully', type: 'success' });
      setIsMyRoleModalOpen(false);
    } catch (error: any) {
      showAlert({ title: 'Error', message: error.message || 'Failed to update relation', type: 'error' });
    }
  }, [selectedCircle, currentMembership, fetchCircleMembers, showAlert]);

  const handleStartInviteFlow = () => {
    if (!selectedCircle) {
      showAlert({ title: "Select a circle", message: "Choose a circle first to invite new members.", type: 'info' });
      return;
    }
    setIsAddPeopleModalOpen(true);
  };

  const handleNavigateToAddPlace = () => {
    if (!selectedCircle) {
      showAlert({ title: "Select a circle", message: "Choose a circle before adding a place.", type: 'info' });
      return;
    }
    snapTo(MIN_HEIGHT);
    setIsExpanded(false);

    setAddPlaceMode('create');
    setEditingLocation(null);
    setIsAddPlaceModalOpen(true);
  };

  const handleEditSavedPlace = (locationPoint: LocationPoint) => {
    if (!selectedCircle) {
      showAlert({ title: "Select a circle", message: "Choose a circle before editing a place.", type: 'info' });
      return;
    }

    if (!canManageLocations) {
      showAlert({ title: "Permission denied", message: "You do not have permission to update saved places.", type: 'warning' });
      return;
    }

    const hasValidId = locationPoint?.id !== undefined && locationPoint?.id !== null && String(locationPoint.id).trim().length > 0;
    if (!hasValidId) {
      showAlert({ title: "Cannot edit place", message: "This saved location is missing an identifier and cannot be updated.", type: 'error' });
      return;
    }

    snapTo(MIN_HEIGHT);
    setIsExpanded(false);

    setAddPlaceMode('edit');
    setEditingLocation(locationPoint);
    setIsAddPlaceModalOpen(true);
  };

  const handleDeleteSavedPlace = (locationPoint: LocationPoint) => {
    if (!selectedCircle) {
      showAlert({ title: "Select a circle", message: "Choose a circle before deleting a place.", type: 'info' });
      return;
    }

    if (!canManageLocations) {
      showAlert({ title: "Permission denied", message: "You do not have permission to delete saved places.", type: 'warning' });
      return;
    }

    const hasValidId = locationPoint?.id !== undefined && locationPoint?.id !== null && String(locationPoint.id).trim().length > 0;
    if (!hasValidId) {
      showAlert({ title: "Cannot delete place", message: "This saved location is missing an identifier.", type: 'error' });
      return;
    }

    const locationId = String(locationPoint.id);
    const placeName = locationPoint.name || "this place";

    showAlert({
      title: "Delete Place",
      message: `Are you sure you want to delete "${placeName}"? This will also remove any user assignments to this place.`,
      type: 'confirmation',
      buttons: [
        { text: "Cancel", style: "cancel", onPress: () => { } },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const circleId = String(selectedCircle.id);
              const response = await authenticatedFetch(
                `${API_BASE_URL}/circles/${circleId}/locations/${locationId}`,
                {
                  method: "DELETE",
                  headers: {
                    accept: "application/json",
                  },
                }
              );

              if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload?.message ?? "Failed to delete location.");
              }

              // Refresh data
              await loadCircles(true);
              await loadAssignedLocations(true);
              showAlert({ title: "Success", message: "Location deleted successfully.", type: 'success' });

            } catch (error) {
              const message = error instanceof Error ? error.message : "Could not delete location.";
              showAlert({ title: "Delete failed", message, type: 'error' });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    });
  };

  const handleSelectMemberLocation = useCallback((locationId: string | null) => {
    setSelectedMemberLocationId(locationId);
  }, []);

  const handleAddPlace = useCallback(() => {
    if (selectedCircle) {
      setAddPlaceMode('create');
      setEditingLocation(null);
      setIsAddPlaceModalOpen(true);
    }
  }, [selectedCircle]);

  const locationSelectionControls = useMemo(() => {
    if (!canManageLocations) {
      return (
        <Text style={styles.memberModalHelperText}>
          Assigned: {assignedLocationLabel}. Only circle admins can assign a saved place.
        </Text>
      );
    }

    if (!locationOptions.length) {
      return (
        <Text style={styles.memberModalHelperText}>
          Save a place for this circle to assign it here.
        </Text>
      );
    }

    return (
      <View style={styles.memberLocationOptionsWrapper}>
        <TouchableOpacity
          style={[
            styles.memberLocationOption,
            selectedMemberLocationId === null && styles.memberLocationOptionSelected,
          ]}
          onPress={() => handleSelectMemberLocation(null)}
        >
          <View style={styles.memberLocationOptionTextWrapper}>
            <Text style={styles.memberLocationOptionTitle}>No special place</Text>
            <Text style={styles.memberLocationOptionSubtitle}>
              Member will not be tied to a saved location.
            </Text>
          </View>
          <Ionicons
            name={selectedMemberLocationId === null ? "radio-button-on" : "radio-button-off"}
            size={20}
            color={selectedMemberLocationId === null ? COLORS.primary : COLORS.gray}
          />
        </TouchableOpacity>

        {locationOptions.map((option) => {
          const isSelected = selectedMemberLocationId === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.memberLocationOption, isSelected && styles.memberLocationOptionSelected]}
              onPress={() => handleSelectMemberLocation(option.id)}
            >
              <View style={styles.memberLocationOptionTextWrapper}>
                <Text style={styles.memberLocationOptionTitle}>{option.label}</Text>
                <Text style={styles.memberLocationOptionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons
                name={isSelected ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={isSelected ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [assignedLocationLabel, canManageLocations, handleSelectMemberLocation, locationOptions, selectedMemberLocationId]);



  const handleLogout = () => {

    showAlert({
      title: "Logout",
      message: "Are you sure?",
      type: 'confirmation',
      buttons: [
        { text: "Cancel", style: "cancel", onPress: () => { } },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              if (isNativePlatform) {
                try {
                  const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
                  if (hasStarted) {
                    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
                  }
                } catch (stopError) {
                  console.warn("Failed to stop background updates during logout", stopError);
                }
              }
              await AsyncStorage.removeItem(STORAGE_KEYS.lastSelectedCircleId).catch(() => undefined);
              await clearAllPostedLocations();
              await clearCircleLocationsCache();
              await clearLocationPresenceMap();
              await logout();
              router.replace("/screens/LogInScreen");
            } catch (error) {
              setLoading(false);
              const message = error instanceof Error ? error.message : "Could not log out.";
              showAlert({ title: "Logout failed", message, type: 'error' });
            }
          },
        },
      ]
    });
  };

  const handleOpenMapLayersModal = () => setIsMapStyleModalOpen(true);
  const handleLocateUser = useCallback(() => {
    if (!locationRef.current) {
      showAlert({
        title: "Location unavailable",
        message: "We couldn't find your current location yet. Please make sure location services are enabled.",
        type: 'info'
      });
      return;
    }
    
    // Explicitly move the camera to the user's coordinates
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [locationRef.current.longitude, locationRef.current.latitude],
        zoomLevel: 15,
        animationDuration: 1200,
      });
    }

    // Toggle followUserLocation off then on to re-engage native follow mode after user panning
    setIsFollowingUser(false);
    setTimeout(() => setIsFollowingUser(true), 50);
  }, [showAlert]);



  const handleChangeMapStyle = (type: MapStyle) => {

    setMapLayerStyle(type);
    setIsMapStyleModalOpen(false);
    AsyncStorage.setItem(STORAGE_KEYS.mapStyle, type).catch(() => undefined);
  };

  const handleOpenChat = async () => {
    const url = 'sms:';
    try { await Linking.openURL(url); }
    catch { showAlert({ title: "Chat Unavailable", message: "Unable to open the messaging app.", type: 'warning' }); }
  };

  // handleSubscribeToPlan moved down to be declared after fetchLocationHistory and loadCircles




  const handlePressSos = useCallback(() => {
    if (!selectedCircle) {
      showAlert({ title: "Select a circle", message: "Choose a circle before sending an SOS alert.", type: 'info' });
      return;
    }
    setIsSosModalOpen(true);
  }, [selectedCircle]);

  const handleCloseLocationHistoryModal = useCallback(() => {
    setIsLocationHistoryModalVisible(false);
  }, []);



  const fetchLocationHistory = useCallback(async () => {
    if (locationHistoryLoading) {
      return;
    }

    setLocationHistoryError(null);
    setLocationHistoryLoading(true);

    try {
      const params = new URLSearchParams({ limit: String(LOCATION_HISTORY_LIMIT), offset: "0" });
      const response = await authenticatedFetch(`${API_BASE_URL}/profile/location-history?${params.toString()}`, {
        headers: { accept: "application/json" },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.message ?? "Failed to load location history.";
        throw new Error(message);
      }

      const records = Array.isArray(payload?.data) ? payload.data : [];
      const normalized: LocationHistoryEntry[] = records
        .map((item: any): LocationHistoryEntry | null => {
          const lat = Number(item?.latitude ?? item?.lat);
          const lon = Number(item?.longitude ?? item?.lng);
          const createdAtRaw = asNonEmptyString(item?.createdAt) ?? asNonEmptyString(item?.created_at);
          if (!Number.isFinite(lat) || !Number.isFinite(lon) || !createdAtRaw) {
            return null;
          }
          return {
            id: asNonEmptyString(item?.id) ?? `${lat}-${lon}-${createdAtRaw}`,
            latitude: lat,
            longitude: lon,
            createdAt: createdAtRaw,
            name: asNonEmptyString(item?.name) ?? null,
            circleId: asNonEmptyString(item?.circleId) ?? asNonEmptyString(item?.circle_id) ?? null,
          };
        })
        .filter((entry: LocationHistoryEntry | null): entry is LocationHistoryEntry => entry !== null);

      setLocationHistory(normalized);

      if (records.length > 0) {
        const batteryCandidate = records.find((item: any) => item?.user?.batteryLevel)?.user?.batteryLevel;
        if (batteryCandidate) {
          const batteryData = batteryCandidate as Record<string, unknown>;
          setCurrentUserBatteryLevel({
            batteryLevel: typeof batteryData.level === "number" ? batteryData.level : Number(batteryData.level ?? NaN),
            deviceId: asNonEmptyString(batteryData.deviceId) ?? null,
            updatedAt: asNonEmptyString(batteryData.updatedAt) ?? null,
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load location history.";
      setLocationHistoryError(message);
    } finally {
      setLocationHistoryLoading(false);
    }
  }, [locationHistoryLoading]);

  const handleSubscribeToPlan = useCallback(async () => {
    setIsSubscribing(true);
    try {
      const planId = "b43acd71-5648-4180-b78b-f01e3c0a963c";
      const response = await authenticatedFetch(`${API_BASE_URL}/subscription/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "Failed to subscribe to the plan.");
      }

      const newPlan = payload?.data?.Plan ?? payload?.Plan ?? payload?.data ?? null;
      setUserPlan(newPlan);
      await AsyncStorage.setItem("userPlan", newPlan ? JSON.stringify(newPlan) : 'null').catch(() => undefined);

      showAlert({
        title: "Success",
        message: "You have successfully subscribed to the Premium plan!",
        type: 'success',
      });

      // Refresh data with new plan permissions
      loadCircles(true).catch(() => undefined);
      fetchLocationHistory().catch(() => undefined);
    } catch (error: any) {
      console.warn("Subscription failed", error);
      showAlert({
        title: "Subscription Error",
        message: error.message || "An unexpected error occurred during subscription.",
        type: 'error',
      });
    } finally {
      setIsSubscribing(false);
    }
  }, [showAlert, loadCircles, fetchLocationHistory]);

  const handleOpenLocationHistoryModal = useCallback(() => {
    router.push('/screens/LocationHistoryScreen' as any);
  }, []);

  const handleSelectLocationHistoryFilter = useCallback((filterKey: LocationHistoryFilterKey) => {
    if (isFreePlan(userPlan)) {
      if (filterKey !== "today" && filterKey !== "yesterday") {
        showAlert({
          title: "Subscription Required",
          message: "Location history beyond 2 days is a Premium feature. Please subscribe to our Premium plan for up to 30 days of history.",
          type: 'warning',
        });
        return;
      }
    }

    setLocationHistoryActiveFilter(filterKey);
    if (filterKey !== "custom") {
      setLocationHistoryCustomStart("");
      setLocationHistoryCustomEnd("");
    }
  }, [userPlan, showAlert]);

  const handleRefreshLocationHistory = useCallback(() => {
    void fetchLocationHistory();
  }, [fetchLocationHistory]);

  const renderLocationHistoryItem = useCallback(({ item }: { item: LocationHistoryEntry }) => {
    const timestampLabel = formatToSLTime(item.createdAt);

    return (
      <View style={styles.locationHistoryListItem}>
        <View style={styles.locationHistoryListItemHeader}>
          <Text style={styles.locationHistoryListItemTimestamp} numberOfLines={1}>
            {timestampLabel}
          </Text>
          {item.name ? (
            <Text style={styles.locationHistoryListItemName} numberOfLines={1}>
              {item.name}
            </Text>
          ) : null}
        </View>
        <Text style={styles.locationHistoryListItemCoords}>
          {`${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`}
        </Text>
        {item.circleId ? (
          <Text style={styles.locationHistoryListItemCircle}>{`Circle: ${item.circleId}`}</Text>
        ) : null}
      </View>
    );
  }, []);

  const locationHistoryKeyExtractor = useCallback((item: LocationHistoryEntry) => item.id, []);



  const handlePickProfileImage = useCallback(async () => {
    if (isSavingProfile || isPickingProfileImage) {
      return;
    }

    try {
      setProfileModalError(null);
      setIsPickingProfileImage(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        showAlert({ title: "Permission required", message: "Allow photo library access to update your profile picture.", type: 'warning' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      if (!uri) {
        return;
      }

      const mimeType = asset.mimeType ?? "image/jpeg";
      const fileName = asset.fileName ?? `avatar_${Date.now()}`;

      const preparedImage = await prepareImageAsWebp(uri, fileName, mimeType);

      setProfileAvatarPreview(preparedImage.uri);
      setProfileAvatarUpload(preparedImage);
    } catch (error) {
      console.warn("Failed to pick profile image", error);
      showAlert({ title: "Image error", message: "We couldn't open that image. Please try again.", type: 'error' });
    } finally {
      setIsPickingProfileImage(false);
    }
  }, [isPickingProfileImage, isSavingProfile]);

  const handleClearProfileImage = useCallback(() => {
    if (isSavingProfile) {
      return;
    }

    setProfileAvatarUpload(null);
    setProfileAvatarPreview(profileAvatarOriginal);
  }, [isSavingProfile, profileAvatarOriginal]);

  const handleInitiateEmailVerification = useCallback(async (email: string) => {
    try {
      // Use authenticated fetch if the user is logged in to associate the request with their account if needed
      // Or use the public endpoint if it's a generic verification
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/initiate-email-verification`, { // Assuming an endpoint for adding/verifying
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        // Fallback to resend-email-verification if the above fails or doesn't exist, generic approach
        const fallbackResponse = await fetch(`${API_BASE_URL}/auth/resend-email-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await fallbackResponse.json();
        if (!fallbackResponse.ok) throw new Error(data.message || "Failed to send verification code");
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initiate email verification.";
      throw new Error(message);
    }
  }, []);

  const handleInitiatePhoneVerification = useCallback(async (phone: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/initiate-phone-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to send verification code");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initiate phone verification.";
      throw new Error(message);
    }
  }, []);

  const handleSubmitEmailVerification = useCallback(async (email: string, code: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Verification failed");

      // Refresh user profile here
      await fetchCurrentUserProfile();
      showAlert({ title: "Success", message: "Email verified successfully!", type: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed.";
      throw new Error(message);
    }
  }, [fetchCurrentUserProfile]);

  const handleSubmitPhoneVerification = useCallback(async (phone: string, code: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, code }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Verification failed");

      // Store tokens if returned (standard for phone login/verification as it might act as a login)
      if (data.token) {
        await storeTokens(data.token, data.refreshToken);
      }

      await fetchCurrentUserProfile();
      showAlert({ title: "Success", message: "Phone verified successfully!", type: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed.";
      throw new Error(message);
    }
  }, [fetchCurrentUserProfile]);

  const handleSubmitProfileUpdate = useCallback(async () => {
    if (isSavingProfile) return;

    setProfileModalError(null);
    setIsSavingProfile(true);

    try {
      const trimmedName = profileNameInput.trim();
      const trimmedMetadata = profileMetadataInput.trim();
      const payloadEntries: [string, string][] = [];
      if (trimmedName.length > 0) {
        payloadEntries.push(["name", trimmedName]);
      }
      if (trimmedMetadata.length > 0) {
        payloadEntries.push(["metadata", trimmedMetadata]);
      }

      const hasAvatarChange = Boolean(profileAvatarUpload);
      const hasFieldUpdates = payloadEntries.length > 0;

      if (!hasAvatarChange && !hasFieldUpdates) {
        setProfileModalError("Nothing to update.");
        return;
      }

      const requestOptions: RequestInit = {
        method: "PUT",
        headers: {
          accept: "application/json",
        },
      };

      if (hasAvatarChange) {
        const formData = new FormData();
        for (const [key, value] of payloadEntries) {
          formData.append(key, value);
        }
        formData.append(
          "profileImage",
          {
            uri: profileAvatarUpload!.uri,
            type: profileAvatarUpload!.type,
            name: profileAvatarUpload!.name,
          } as any
        );
        requestOptions.body = formData;
      } else {
        const jsonPayload: Record<string, string> = {};
        for (const [key, value] of payloadEntries) {
          jsonPayload[key] = value;
        }
        requestOptions.headers = {
          ...requestOptions.headers,
          "Content-Type": "application/json",
        };
        requestOptions.body = JSON.stringify(jsonPayload);
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/profile`, requestOptions);

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.message ?? "Failed to update profile.";
        throw new Error(message);
      }


      setProfileAvatarUpload(null);
      showAlert({ title: "Profile updated", message: "Your profile details were saved.", type: 'success' });

      if (hasAvatarChange && profileAvatarUpload) {
        setProfileAvatarOriginal(profileAvatarUpload.uri);
        setProfileAvatarPreview(profileAvatarUpload.uri);
        setCurrentUserAvatarUrl(profileAvatarUpload.uri);
        if (currentUserId) {
          setSelectedCircleMembers((prevMembers) => {
            let changed = false;
            const updated = prevMembers.map((member) => {
              if (resolveMemberId(member) === currentUserId) {
                changed = true;
                return {
                  ...member,
                  avatar: profileAvatarUpload.uri,
                };
              }
              return member;
            });
            return changed ? updated : prevMembers;
          });
        }
      }

      if (selectedCircle?.id) {
        fetchCircleMembers(selectedCircle.id);
      } else {
        await loadCircles(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile.";
      setProfileModalError(message);
    } finally {
      setIsSavingProfile(false);
    }
  }, [currentUserId, fetchCircleMembers, isSavingProfile, loadCircles, profileAvatarUpload, profileMetadataInput, profileNameInput, selectedCircle]);

  const executeDeleteCircle = useCallback(async () => {
    if (!selectedCircle) {
      showAlert({ title: "No circle selected", message: "Select a circle before deleting.", type: 'info' });
      return;
    }

    if (isDeletingCircle) {
      return;
    }

    setIsDeletingCircle(true);

    try {
      const circleIdParam = typeof selectedCircle.id === "string" ? selectedCircle.id : String(selectedCircle.id);
      const response = await authenticatedFetch(`${API_BASE_URL}/circles/${circleIdParam}`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.message ?? "Unable to delete this circle.";
        throw new Error(message);
      }

      await AsyncStorage.removeItem(STORAGE_KEYS.lastSelectedCircleId).catch(() => undefined);
      await removeLastPostedLocationForCircle(circleIdParam).catch(() => undefined);
      await removeCachedCircleLocations(circleIdParam);
      setSelectedCircle(null);
      setSelectedCircleMembers([]);
      setMemberAvatarUrls({});
      setMemberLocations({});
      setCircles((prev) => {
        const filtered = prev.filter((circle) => String(circle.id) !== circleIdParam);
        circlesRef.current = filtered;
        return filtered;
      });
      await loadCircles(true);
      await loadAssignedLocations(true);
      showAlert({ title: "Circle deleted", message: "The circle was deleted successfully.", type: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete this circle.";
      showAlert({ title: "Delete failed", message, type: 'error' });
    } finally {
      setIsDeletingCircle(false);

    }
  }, [isDeletingCircle, loadAssignedLocations, loadCircles, selectedCircle]);

  const executeLeaveCircle = useCallback(async () => {
    if (!selectedCircle) {
      showAlert({ title: "No circle selected", message: "Select a circle before leaving.", type: 'info' });
      return;
    }

    if (isLeavingCircle) {
      return;
    }

    setIsLeavingCircle(true);

    try {
      const circleIdParam = typeof selectedCircle.id === "string" ? selectedCircle.id : String(selectedCircle.id);
      const response = await authenticatedFetch(`${API_BASE_URL}/circles/${circleIdParam}/leave`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.message ?? "Unable to leave this circle.";
        throw new Error(message);
      }

      await AsyncStorage.removeItem(STORAGE_KEYS.lastSelectedCircleId).catch(() => undefined);
      await removeLastPostedLocationForCircle(circleIdParam).catch(() => undefined);
      setSelectedCircle(null);
      setSelectedCircleMembers([]);
      setMemberAvatarUrls({});
      setMemberLocations({});
      await loadCircles(true);
      await loadAssignedLocations(true);
      await removeCachedCircleLocations(circleIdParam);
      showAlert({ title: "Circle left", message: "You have left the circle successfully.", type: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to leave this circle.";
      showAlert({ title: "Leave failed", message, type: 'error' });
    } finally {
      setIsLeavingCircle(false);

    }
  }, [isLeavingCircle, loadAssignedLocations, loadCircles, selectedCircle]);

  const handleDeleteCircle = useCallback(() => {
    if (!selectedCircle) {
      showAlert({ title: "No circle selected", message: "Select a circle before deleting.", type: 'info' });
      return;
    }


    const circleName = selectedCircle?.name ?? "this circle";
    showAlert({
      title: "Delete circle",
      message: `Deleting ${circleName} will remove the circle for every member. This action cannot be undone.`,
      type: 'confirmation',
      buttons: [
        { text: "Cancel", style: "cancel", onPress: () => { } },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void executeDeleteCircle();
          },
        },
      ]
    });
  }, [executeDeleteCircle, selectedCircle]);

  const handleLeaveCircle = useCallback(() => {
    if (!selectedCircle) {
      showAlert({ title: "No circle selected", message: "Select a circle before leaving.", type: 'info' });
      return;
    }


    const circleName = selectedCircle?.name ?? "this circle";

    if (isCircleCreator) {
      showAlert({
        title: "Cannot Leave Circle",
        message: "You are the creator of this circle. Creators cannot leave their own circle. If you wish to remove it for everyone, please use the 'Delete Circle' option in Circle Management.",
        type: 'warning'
      });
      return;
    }

    // Check if current user is an admin and if they are the only admin
    const isAdmin = currentMembershipRole === "admin";
    if (isAdmin) {
      const otherAdmins = selectedCircleMembers.filter((m) => {
        const mId = resolveMemberId(m);
        // exclude self
        if (mId === currentUserId) return false;
        // check role
        const role = normalizeRole(m.Membership?.role);
        return role === "admin";
      });

      if (otherAdmins.length === 0) {
        showAlert({
          title: "Cannot Leave Circle",
          message: "You are the only admin in this circle. Please appoint another member as an admin before leaving to ensure the circle can still be managed.",
          type: 'warning'
        });
        return;
      }
    }

    showAlert({
      title: "Leave circle",
      message: `Are you sure you want to leave ${circleName}?`,
      type: 'confirmation',
      buttons: [
        { text: "Cancel", style: "cancel", onPress: () => { } },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            void executeLeaveCircle();
          },
        },
      ]
    });
  }, [executeLeaveCircle, selectedCircle, isCircleCreator, currentMembershipRole, selectedCircleMembers, currentUserId]);

  // --- RENDER HELPERS ---

  // Fetch circle history and update members
  const fetchCircleHistory = useCallback(async (circleId: string) => {
    if (!circleId) return;
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/circles/${circleId}/history?page=1&perPage=100`);
      if (response.ok) {
        const payload = await response.json();
        const historyData = payload?.data;
        if (historyData) {
          const membersWithHistory = historyData.members || [];
          const creatorData = historyData.creator;

          // Map history data to a lookup
          const historyMap = new Map();

          if (creatorData) {
            historyMap.set(creatorData.id, creatorData.journeys || []);
          }

          membersWithHistory.forEach((m: any) => {
            historyMap.set(m.id, m.journeys || []);
          });

          // Update selectedCircleMembers with new journey data
          setSelectedCircleMembers(prev => prev.map(member => {
            const memberId = resolveMemberId(member);
            if (memberId && historyMap.has(memberId)) {
              return { ...member, journeys: historyMap.get(memberId) };
            }
            return member;
          }));
        }
      }
    } catch (error) {
      console.warn("Failed to fetch circle history", error);
    }
  }, []);

  // Effect to fetch history when circle changes
  useEffect(() => {
    if (selectedCircle?.id) {
      const circleId = String(selectedCircle.id);
      void fetchCircleHistory(circleId);
    }
  }, [selectedCircle?.id, fetchCircleHistory]);

  const mapStylesList: { key: MapStyle, label: string, image: any, previewColor: string }[] = [
    { key: 'standard', label: 'Default', image: require('../../assets/images/map_type_auto.jpg'), previewColor: '#84CC16' },
    { key: 'street', label: 'Street', image: require('../../assets/images/map_type_street.jpg'), previewColor: '#FBBF24' },
    { key: 'satellite', label: 'Satellite', image: require('../../assets/images/map_type_satellite.jpg'), previewColor: '#60A5FA' },
  ];

  const savedPlaces = currentLocations;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }



  // Fallback location if permissions denied or invalid coordinates (e.g., center of map)
  const mapRegion = (location && isValidCoordinate(location.latitude, location.longitude)) ? {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : {
    latitude: 6.9271, // Default (e.g., Colombo)
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const membershipNickname = currentMembership?.Membership?.nickname;
  const resolvedNickname = asNonEmptyString(membershipNickname);
  const membershipName = asNonEmptyString(currentMembership?.name);
  const userDisplayName = resolvedNickname ?? membershipName ?? "You";
  const userAccuracyRadius =
    location && typeof location.accuracy === "number" && Number.isFinite(location.accuracy) && location.accuracy > 0
      ? Math.min(Math.max(location.accuracy, 25), MAX_USER_ACCURACY_RADIUS)
      : null;

  // Fetch a specific member's location history (today)
  // const fetchMemberLocationHistory = async (memberId: string) => {
  //   setLocationHistoryError(null);
  //   setLocationHistoryLoading(true);
  //   try {
  //     const params = new URLSearchParams({limit: String(LOCATION_HISTORY_LIMIT), offset: "0", filter: "today", userId: memberId });
  //     const response = await authenticatedFetch(`${API_BASE_URL}/profile/location-history?${params.toString()}`, {
  //       headers: {accept: "application/json" },
  //     });
  //     const payload = await response.json().catch(() => ({ }));
  //     if (!response.ok) {
  //       const message = payload?.message ?? "Failed to load location history.";
  //       throw new Error(message);
  //     }
  //     const records = Array.isArray(payload?.data) ? payload.data : [];
  //     const normalized: LocationHistoryEntry[] = records
  //       .map((item: any): LocationHistoryEntry | null => {
  //         const lat = Number(item?.latitude ?? item?.lat);
  //         const lon = Number(item?.longitude ?? item?.lng);
  //         const createdAtRaw = asNonEmptyString(item?.createdAt) ?? asNonEmptyString(item?.created_at);
  //         if (!Number.isFinite(lat) || !Number.isFinite(lon) || !createdAtRaw) {
  //           return null;
  //         }
  //         return {
  //           id: asNonEmptyString(item?.id) ?? `${lat}-${lon}-${createdAtRaw}`,
  //           latitude: lat,
  //           longitude: lon,
  //           createdAt: createdAtRaw,
  //           name: asNonEmptyString(item?.name) ?? null,
  //           circleId: asNonEmptyString(item?.circleId) ?? asNonEmptyString(item?.circle_id) ?? null,
  //         };
  //       })
  //       .filter((entry: LocationHistoryEntry | null): entry is LocationHistoryEntry => entry !== null);
  //     setLocationHistory(normalized);
  //     setLocationHistoryActiveFilter("today");
  //     setIsLocationHistoryModalVisible(true);
  //   } catch (error) {
  //     const message = error instanceof Error ? error.message : "Failed to load location history.";
  //     setLocationHistoryError(message);
  //   } finally {
  //     setLocationHistoryLoading(false);
  //   }
  // };



  // Helper to keep the render function clean
  const getBatteryIconName = (val: number | null) => {
    if (val === null) return "battery-unknown";
    if (val >= 95) return "battery";
    const levels = [90, 80, 70, 60, 50, 40, 30, 20, 10];
    for (const l of levels) { if (val >= l - 5) return `battery-${l}`; }
    return "battery-10";
  };



  //       zIndex={isCurrentUser ? 3 : 2}
  //       onPress={() => {
  //         const isReallyCurrentUser = isCurrentUser || (currentUserId && memberId === currentUserId);
  //         if (isReallyCurrentUser) {
  //           return;
  //         }
  //         if (memberRecord) {
  //           handleOpenMemberJourneysModal(memberRecord);
  //         }
  //       }}
  //     >
  //       <View style={{ alignItems: 'center', justifyContent: 'center' }}>
  //         {/* Avatar Circle */}
  //         <View style={{
  //           width: 33,
  //           height: 33,
  //           borderRadius: 28,
  //           borderWidth: 3,
  //           borderColor: isCurrentUser ? "#2563EB" : "#22C55E",
  //           backgroundColor: 'white',
  //           overflow: 'hidden',
  //           shadowColor: "#000",
  //           shadowOffset: { width: 0, height: 2 },
  //           shadowOpacity: 0.3,
  //           shadowRadius: 3,
  //           elevation: 5,
  //           alignItems: 'center',
  //           justifyContent: 'center',
  //         }}>
  //           <Image
  //             source={{ uri: resolvedAvatar }}
  //             style={{ width: '100%', height: '100%' }}
  //             resizeMode="cover"
  //           />
  //         </View>

  //         {/* Pointer Triangle */}
  //         <View style={{
  //           width: 0,
  //           height: 0,
  //           backgroundColor: 'transparent',
  //           borderStyle: 'solid',
  //           borderLeftWidth: 6,
  //           borderRightWidth: 6,
  //           borderTopWidth: 8,
  //           borderLeftColor: 'transparent',
  //           borderRightColor: 'transparent',
  //           borderTopColor: isCurrentUser ? "#2563EB" : "#22C55E",
  //           marginTop: -2,
  //           shadowColor: '#000',
  //           shadowOffset: { width: 0, height: 1 },
  //           shadowOpacity: 0.2,
  //           shadowRadius: 1,
  //           elevation: 2,
  //         }} />

  //         {/* Battery Badge */}
  //         {batteryPercent !== null && (
  //           <View style={{
  //             position: 'absolute',
  //             top: -4,
  //             right: -4,
  //             backgroundColor: 'white',
  //             borderRadius: 10,
  //             borderWidth: 2,
  //             borderColor: isCurrentUser ? "#2563EB" : "#22C55E",
  //             paddingHorizontal: 4,
  //             paddingVertical: 1,
  //             alignItems: 'center',
  //             justifyContent: 'center',
  //             elevation: 6,
  //             shadowColor: "#000",
  //             shadowOffset: { width: 0, height: 1 },
  //             shadowOpacity: 0.2,
  //             shadowRadius: 1,
  //           }}>
  //             <Text style={{ fontSize: 9, fontWeight: '800', color: 'black' }}>
  //               {batteryPercent}%
  //             </Text>
  //           </View>
  //         )}
  //       </View>
  //     </Marker>
  //   );
  // };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 24}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        {/* --- MAP LAYER --- */}
        {canRenderMapbox() ? (
          <Mapbox.MapView
            ref={mapRef}
            style={[styles.map, { paddingBottom: MIN_HEIGHT }]}
            styleURL={mapLayerStyle === 'satellite' ? Mapbox.StyleURL.Satellite : mapLayerStyle === 'hybrid' ? Mapbox.StyleURL.SatelliteStreet : Mapbox.StyleURL.Street}
            logoEnabled={false}
            compassEnabled={false}
            scaleBarEnabled={false}
            onRegionIsChanging={syncMarkerPositions}
            onRegionDidChange={(e: any) => {
              syncMarkerPositions();
            }}
          >
            <Mapbox.Camera
              ref={cameraRef}
              followZoomLevel={14}
              followUserLocation={isFollowingUser}
              followUserMode={Mapbox.UserTrackingMode.Follow}
              animationDuration={1000}
            />
            <Mapbox.UserLocation
              visible={true}
              renderMode={Mapbox.UserLocationRenderMode.Normal}
              showsUserHeadingIndicator={true}
              onUpdate={(loc: any) => {
                if (!loc || !loc.coords) return;
                const { latitude, longitude, speed, accuracy, heading } = loc.coords;

                const nextLocation: UserLocation = {
                  latitude,
                  longitude,
                  heading: heading ?? undefined,
                  accuracy: Number.isFinite(accuracy) ? accuracy ?? null : null,
                };

                // Update local state for Mapbox Camera and Circle overlays
                setLocation(nextLocation);
                locationRef.current = nextLocation;

                // Automatically focus and zoom into user's location on startup (first update)
                if (!hasZoomedToUserRef.current && cameraRef.current) {
                  hasZoomedToUserRef.current = true;
                  console.log("[MapScreen] Auto-focusing to user's location on startup:", latitude, longitude);
                  cameraRef.current.setCamera({
                    centerCoordinate: [longitude, latitude],
                    zoomLevel: 15,
                    animationDuration: 1200,
                  });
                }

                // Calculate and update raw speed in km/h directly from Mapbox API
                const kmh = speed !== null && speed !== undefined ? Math.max(0, speed * 3.6) : 0;
                setCurrentSpeed(kmh);

                // Synchronize location update with backend in real-time
                if (activeCircleIdRef.current) {
                   maybePostCircleLocationUpdate(activeCircleIdRef.current, {
                      latitude,
                      longitude,
                      accuracy: accuracy ?? null,
                      speed: speed ?? null,
                      userId: currentUserId,
                      battery: currentUserBatteryLevel ? `${currentUserBatteryLevel.batteryLevel}%` : undefined,
                   }).then(result => {
                      if (result.success && result.data) {
                         handleLiveStatusUpdate(result.data);
                      }
                   }).catch(err => console.warn("Foreground Mapbox sync failed", err));
                }
              }}
            />
            {location && userAccuracyRadius ? (
              <MapboxCircle
                key="user-accuracy-circle"
                idKey="user-accuracy-circle"
                center={{ latitude: location.latitude, longitude: location.longitude }}
                radius={userAccuracyRadius}
                strokeColor={USER_ACCURACY_STROKE_COLOR}
                fillColor={USER_ACCURACY_FILL_COLOR}
                strokeWidth={1.5}
              />
            ) : null}

            {/* Render Fallback Circle */}
            {fallbackAssignedMarker ? (
              <MapboxCircle
                key="assigned-fallback-circle"
                idKey="assigned-fallback-circle"
                center={{
                  latitude: fallbackAssignedMarker.latitude,
                  longitude: fallbackAssignedMarker.longitude,
                }}
                radius={fallbackAssignedMarker.radius ?? DEFAULT_LOCATION_RADIUS_METERS}
                strokeColor={ASSIGNED_LOCATION_STROKE_COLOR}
                fillColor={ASSIGNED_LOCATION_FILL_COLOR}
                strokeWidth={2}
              />
            ) : null}
          </Mapbox.MapView>
        ) : (
          <MapFallback style={[styles.map, { paddingBottom: MIN_HEIGHT }]} />
        )}

        {/* --- X/Y FLOATING MARKER OVERLAY --- */}
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]} pointerEvents="box-none">

          {/* Render Locations (XY) */}
          {currentLocations.map((loc: LocationPoint, index: number) => {
            const key = loc.id ? String(loc.id) : `loc-${index}`;
            const proj = locationProjectedCoords[key];
            if (!proj) return null;

            const normalizedId = normalizeIdentifier(loc.id);
            const isAssignedToCurrentUser =
              currentUserAssignedLocationId !== null && normalizedId !== null && normalizedId === currentUserAssignedLocationId;

            return (
              <XYLocationMarker
                key={`xy-loc-${key}`}
                x={proj.x}
                y={proj.y}
                title={loc.name || "Saved Place"}
                placeType={(loc.metadata as any)?.placeType}
                locationType={(loc.metadata as any)?.locationType}
                isAssignedToCurrentUser={isAssignedToCurrentUser}
                onPress={() => {
                  if (isValidCoordinate(loc.latitude, loc.longitude) && cameraRef.current) {
                    cameraRef.current.setCamera({
                      centerCoordinate: [loc.longitude, loc.latitude],
                      zoomLevel: 14,
                      animationDuration: 1500,
                    });
                  }
                }}
              />
            );
          })}

          {/* Render Members (including Current User) */}
          {Object.entries(memberProjectedCoords).map(([mid, proj]) => {
            const isMe = mid === currentUserId;
            const memberRecord = circleMembersById.get(mid);

            // For current user, we prefer specific display name and avatar state
            const avatarFromRecord = resolveFullAvatarUrl(memberRecord?.avatar ?? memberRecord);
            const displayName = isMe ? (userDisplayName || "You") : ((memberRecord as any)?.Membership?.nickname || memberRecord?.name || "Member");
            const avatar = isMe ? (resolveFullAvatarUrl(currentUserAvatarUrl) || avatarFromRecord) : avatarFromRecord;

            // Get speed from memberLocations or user state
            const speed = isMe ? speedKmh : (memberLocations[mid]?.speed ?? 0);

            return (
              <XYMemberMarker
                key={`xy-member-${mid}`}
                memberId={mid}
                x={proj.x}
                y={proj.y}
                displayName={displayName}
                avatarUrl={avatar}
                speed={speed}
                isCurrentUser={isMe}
                onPress={() => {
                  const memberLoc = isMe ? locationRef.current : memberLocations[mid];
                  if (memberLoc && isValidCoordinate(memberLoc.latitude, memberLoc.longitude) && cameraRef.current) {
                    cameraRef.current.setCamera({
                      centerCoordinate: [memberLoc.longitude, memberLoc.latitude],
                      zoomLevel: 14,
                      animationDuration: 1500,
                    });
                  }
                }}
                onLongPress={() => {}}
              />
            );
          })}

          {/* Render Fallback Marker */}
          {fallbackProjectedCoord && fallbackAssignedMarker && (
            <View
              style={{
                position: 'absolute',
                left: fallbackProjectedCoord.x,
                top: fallbackProjectedCoord.y,
                transform: [{ translateX: -15 }, { translateY: -30 }]
              }}
              pointerEvents="none"
            >
              <Ionicons name="star" size={30} color="#FACC15" />
            </View>
          )}

        </View>

        {/* --- TOP HEADER --- */}
        <View style={[styles.headerContainer, { paddingTop: insets.top + 10,  }]}>
          {/* Left Side: Settings - Visible on all tabs */}
          <View style={{ width: 40 }}>
            <Animated.View style={{
              opacity: activeTab === "Location" ? sheetHeight.interpolate({
                inputRange: [MIN_HEIGHT, MAX_HEIGHT, MAP_FULL_HEIGHT - 110, MAP_FULL_HEIGHT - 65],
                outputRange: [1, 1, 1, 0],
                extrapolate: 'clamp'
              }) : 1,
              transform: [{
                translateY: activeTab === "Location" ? sheetHeight.interpolate({
                  inputRange: [MIN_HEIGHT, MAX_HEIGHT, MAP_FULL_HEIGHT - 110, MAP_FULL_HEIGHT - 65],
                  outputRange: [0, 0, 0, -60],
                  extrapolate: 'clamp'
                }) : 0
              }]
            }}>
              <TouchableOpacity style={styles.roundButton} onPress={handleOpenSettingsModal}>
                <SettingsIcon />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Middle: Circle Selector (Centered) - Visible on all tabs */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Animated.View style={{
              opacity: activeTab === "Location" ? sheetHeight.interpolate({
                inputRange: [MIN_HEIGHT, MAX_HEIGHT, MAP_FULL_HEIGHT - 110, MAP_FULL_HEIGHT - 65],
                outputRange: [1, 1, 1, 0],
                extrapolate: 'clamp'
              }) : 1,
              transform: [{
                translateY: activeTab === "Location" ? sheetHeight.interpolate({
                  inputRange: [MIN_HEIGHT, MAX_HEIGHT, MAP_FULL_HEIGHT - 110, MAP_FULL_HEIGHT - 65],
                  outputRange: [0, 0, 0, -60],
                  extrapolate: 'clamp'
                }) : 0
              }]
            }}>
              <TouchableOpacity style={styles.circleSelector} onPress={handleOpenCirclesModal} activeOpacity={0.9}>
                <View style={styles.selectorTextContainer}>
                  <Text style={styles.circleName} numberOfLines={1}>
                    {selectedCircle ? selectedCircle.name : (circles.length === 0 ? "No Circle" : "Select Circle")}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Right Side: Notification (all tabs) + Chat (Location only) */}
          <View style={{ width: 40, alignItems: 'flex-end' }}>
            <View style={{ gap: 10 }}>
              {/* Notification - Visible on all tabs */}
              <Animated.View style={{
                opacity: activeTab === "Location" ? sheetHeight.interpolate({
                  inputRange: [MIN_HEIGHT, MAX_HEIGHT, MAP_FULL_HEIGHT - 110, MAP_FULL_HEIGHT - 65],
                  outputRange: [1, 1, 1, 0],
                  extrapolate: 'clamp'
                }) : 1,
                transform: [{
                  translateY: activeTab === "Location" ? sheetHeight.interpolate({
                    inputRange: [MIN_HEIGHT, MAX_HEIGHT, MAP_FULL_HEIGHT - 110, MAP_FULL_HEIGHT - 65],
                    outputRange: [0, 0, 0, -60],
                    extrapolate: 'clamp'
                  }) : 0
                }]
              }}>
                <TouchableOpacity style={styles.roundButton} onPress={handleOpenNotificationsModal}>
                  <NotificationIcon width={22} height={22} color={COLORS.primary} />
                </TouchableOpacity>
              </Animated.View>

              {/* Chat - ONLY on Map tab */}
              {activeTab === "Location" && (
                <Animated.View style={{
                  opacity: sheetHeight.interpolate({
                    inputRange: [MIN_HEIGHT, MAX_HEIGHT, MAP_FULL_HEIGHT - 110, MAP_FULL_HEIGHT - 65],
                    outputRange: [1, 1, 1, 0],
                    extrapolate: 'clamp'
                  }),
                  transform: [{
                    translateX: sheetHeight.interpolate({
                      inputRange: [MIN_HEIGHT, MAX_HEIGHT, MAP_FULL_HEIGHT - 110, MAP_FULL_HEIGHT - 65],
                      outputRange: [0, 0, 0, -60],
                      extrapolate: 'clamp'
                    })
                  }]
                }}>
                  <TouchableOpacity style={styles.roundButton} onPress={handleOpenChat}>
                    <ChatIcon width={20} height={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </View>
        </View>

        {/* --- FLOATING MAP BUTTONS --- */}
        {activeTab === "Location" && (
          <Animated.View
            style={[
              styles.floatingControlsContainer,
              { bottom: Animated.add(sheetHeight, 20) }
            ]}
            pointerEvents="box-none"
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
              {/* Left side: Speedometer and (Check-in, SOS) - hide when drawer above mid */}
              <Animated.View
                style={{
                  alignItems: 'flex-start',
                  opacity: sheetHeight.interpolate({
                    inputRange: [MIN_HEIGHT, MID_HEIGHT, MID_HEIGHT + 20],
                    outputRange: [1, 1, 0],
                    extrapolate: 'clamp'
                  }),
                  transform: [{
                    translateY: sheetHeight.interpolate({
                      inputRange: [MIN_HEIGHT, MID_HEIGHT, MID_HEIGHT + 20],
                      outputRange: [0, 0, 60],
                      extrapolate: 'clamp'
                    })
                  }]
                }}
                pointerEvents="box-none"
              >
                {driveDetectionEnabled && (
                  <View style={[styles.speedometerContainer, { marginBottom: 8 }]} pointerEvents="none">
                    <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
                    <Ionicons name="speedometer-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.currentSpeedText}>
                      {speedKmh}
                    </Text>
                    <Text style={styles.speedUnitText}>kmph</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity style={styles.roundActionButtonPurple} onPress={handleNavigateToAddPlace}>
                    <CheckInIcon />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.roundActionButtonRed} onPress={handlePressSos}>
                    <SosIcon />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Right side: My Location (slides right/hides) + Map Layer (fades with left buttons) */}
              <View style={{ alignItems: 'center', gap: 12 }}>
                {/* My Location: slides to right and fades */}
                <Animated.View
                  style={{
                    opacity: sheetHeight.interpolate({
                      inputRange: [MIN_HEIGHT, MID_HEIGHT, MID_HEIGHT + 20],
                      outputRange: [1, 1, 0],
                      extrapolate: 'clamp'
                    }),
                    transform: [{
                      translateX: sheetHeight.interpolate({
                        inputRange: [MIN_HEIGHT, MID_HEIGHT, MID_HEIGHT + 20],
                        outputRange: [0, 0, 60],
                        extrapolate: 'clamp'
                      })
                    }]
                  }}
                  pointerEvents="box-none"
                >
                  <TouchableOpacity
                    style={styles.roundButtonSmall}
                    onPress={handleLocateUser}
                  >
                    <MyLocationIcon />
                  </TouchableOpacity>
                </Animated.View>

                {/* Map Layer: fades out with left buttons */}
                <Animated.View
                  style={{
                    opacity: sheetHeight.interpolate({
                      inputRange: [MIN_HEIGHT, MID_HEIGHT, MID_HEIGHT + 20],
                      outputRange: [1, 1, 0],
                      extrapolate: 'clamp'
                    }),
                    transform: [{
                      translateY: sheetHeight.interpolate({
                        inputRange: [MIN_HEIGHT, MID_HEIGHT, MID_HEIGHT + 20],
                        outputRange: [0, 0, 60],
                        extrapolate: 'clamp'
                      })
                    }]
                  }}
                  pointerEvents="box-none"
                >
                  <TouchableOpacity
                    onPress={handleOpenMapLayersModal}
                    style={{ width: 57, height: 57, alignItems: 'center', justifyContent: 'center', margin: -11 }}
                  >
                    <MapLayersIcon />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        )}





        {/* Modals replaced by Screen navigation */}

        {/* --- UNIFIED BOTTOM SHEET (Content and Nav) --- */}
        <Animated.View 
          {...(activeTab === "Location" ? panResponder.panHandlers : {})}
          style={[
          styles.unifiedSheet,
          {
            height: sheetHeight,
            paddingBottom: insets.bottom + keyboardHeight,
            borderTopLeftRadius: activeTab === "Location" ? 24 : 0,
            borderTopRightRadius: activeTab === "Location" ? 24 : 0,
            elevation: activeTab === "Location" ? 20 : 0,
            shadowOpacity: activeTab === "Location" ? 0.15 : 0,
          }
        ]}>
          {activeTab === "Location" && (
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>
          )}

          <View style={{ flex: 1, width: '100%' }}>
            {activeTab === "Location" ? (
              <ScrollView
                ref={sheetScrollRef}
                contentContainerStyle={styles.sheetContent}
                showsVerticalScrollIndicator={false}
                scrollEnabled={isExpanded}
                keyboardShouldPersistTaps="handled"
              >
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 16, gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      width: 101, height: 38, borderRadius: 23.5,
                      backgroundColor: activeSection === 'members' ? COLORS.primary : '#DBEAFE',
                      alignItems: 'center', justifyContent: 'center'
                    }}
                    onPress={() => {
                      scrollToSection('members');
                      setActiveSection('members');
                    }}
                  >
                    <UsersIcon
                      size={24}
                      color={activeSection === 'members' ? COLORS.white : COLORS.primary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      scrollToSection('place');
                      setActiveSection('place');
                    }}
                  >
                    <PlacesIcon
                      isActive={activeSection === 'place'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      scrollToSection('bluetooth');
                      setActiveSection('bluetooth');
                    }}
                  >
                    <BluetoothTabIcon
                      isActive={activeSection === 'bluetooth'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Members Section */}
                <View style={{ height: 1 }} onLayout={e => { sectionPositions['members'] = e.nativeEvent.layout.y; }} />

                {/* <TouchableOpacity style={styles.listItem} onPress={handleStartInviteFlow}>
                  <View style={[styles.listIconCircle, { borderStyle: 'dashed', borderColor: COLORS.primary }]}>
                    <Ionicons name="add" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.listItemText}>Add a new member</Text>
                </TouchableOpacity> */}

                {[...selectedCircleMembers]
                  .sort((a, b) => {
                    const idA = resolveMemberId(a);
                    const idB = resolveMemberId(b);
                    if (idA === currentUserId) return -1;
                    if (idB === currentUserId) return 1;
                    return 0;
                  })
                  .map((member) => {
                    const memberId = resolveMemberId(member) || "";
                    const displayName = member.Membership?.nickname || member.name || member.email || "Unknown";
                    const fallbackSeed = member.email || member.name || (memberId ?? displayName);

                    let avatarUri = null;
                    if (typeof member.avatar === "string" && member.avatar.trim().length > 0) {
                      const trimmed = member.avatar.trim();
                      avatarUri = (trimmed.startsWith("http") || trimmed.startsWith("file:")) ? trimmed : `${API_BASE_URL}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`.replace("/api/uploads", "/uploads");
                    } else if (memberId && currentUserId && memberId === currentUserId && currentUserAvatarUrl) {
                      avatarUri = currentUserAvatarUrl;
                    } else {
                      avatarUri = `${DEFAULT_MEMBER_AVATAR}${encodeURIComponent(fallbackSeed)}`;
                    }

                    const batteryInfo = memberId && memberId === currentUserId ? currentUserBatteryLevel : (member as any).batteryLevel;
                    const batteryLevel = batteryInfo?.batteryLevel;
                    const locationText = (member as any).locationText || "Location obscured";
                    const statusText = (member as any).status || "Offline";
                    const isInfavorite = favoriteMemberIds.includes(String(memberId));

                    return (
                      <View key={memberId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
                        {/* Avatar & Battery - tappable to go to Driving tab */}
                        <TouchableOpacity
                          style={{ alignItems: 'center', marginRight: 16 }}
                          onPress={() => {
                            const mId = String(member.id || member.userId || "");
                            if (mId) setSelectedDrivingMemberId(mId);
                            setActiveTab("Driving");
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={{
                            width: 60, height: 60, borderRadius: 30,
                            backgroundColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center',
                            overflow: 'hidden'
                          }}>
                            {avatarUri ? (
                              <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                              <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '700' }}>
                                {displayName.substring(0, 2).toUpperCase()}
                              </Text>
                            )}
                          </View>
                          {/* Battery Pill */}
                          {batteryLevel !== undefined && (
                            <View style={{
                              flexDirection: 'row', alignItems: 'center',
                              backgroundColor: COLORS.white, borderRadius: 10,
                              paddingHorizontal: 6, paddingVertical: 2,
                              marginTop: -10, // Overlap effect
                              shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
                            }}>
                              <MaterialCommunityIcons
                                name={batteryLevel > 20 ? "battery" : "battery-alert"}
                                size={12}
                                color={batteryLevel > 20 ? "#22C55E" : "#EF4444"}
                              />
                              <Text style={{ fontSize: 10, fontWeight: '700', marginLeft: 2, color: '#374151' }}>
                                {Math.round(batteryLevel)}%
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>

                        {/* Details - Tappable to center and zoom map on this member */}
                         <TouchableOpacity
                           style={{ flex: 1 }}
                           activeOpacity={0.7}
                           onPress={() => {
                             const memberLoc = memberId === currentUserId ? locationRef.current : memberLocations[memberId];
                             if (memberLoc && isValidCoordinate(memberLoc.latitude, memberLoc.longitude) && cameraRef.current) {
                               cameraRef.current.setCamera({
                                 centerCoordinate: [memberLoc.longitude, memberLoc.latitude],
                                 zoomLevel: 14,
                                 animationDuration: 1500,
                               });
                             } else {
                               showAlert({
                                 title: "Location unavailable",
                                 message: `We don't have a valid location for ${displayName} yet.`,
                                 type: 'info'
                               });
                             }
                           }}
                         >
                           <Text style={{ fontSize: 17, fontWeight: '700', color: '#1E3A8A' }}>{displayName}</Text>
                           <Text style={{ fontSize: 14, color: '#4B5563', marginTop: 1 }}>{locationText}</Text>
                           <Text style={{ fontSize: 13, color: '#3B82F6', marginTop: 2 }}>
                             {statusText === "Online" ? "Online" : `Since ${statusText}`}
                           </Text>
                         </TouchableOpacity>

                        {/* Actions */}
                        <TouchableOpacity style={{ padding: 8 }} onPress={() => toggleFavorite(String(memberId))}>
                          <MaterialCommunityIcons
                            name={isInfavorite ? "heart" : "heart-outline"}
                            size={24}
                            color="#1E3A8A"
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 }} />

                {/* Add a person */}
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
                  onPress={handleStartInviteFlow}
                >
                  <View style={{
                    width: 36, height:36, borderRadius: 26,
                    backgroundColor: '#113C9C', alignItems: 'center', justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <AddMemberIcon size={28} color={COLORS.white} />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#113C9C' }}>Add a person</Text>
                </TouchableOpacity>

                {/* Places Section */}
                <View onLayout={e => { sectionPositions['place'] = e.nativeEvent.layout.y; }} style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E3A8A', marginBottom: 16 }}>Places</Text>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
                    onPress={handleNavigateToAddPlace}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 24,
                      backgroundColor: '#113C9C', alignItems: 'center', justifyContent: 'center',
                      marginRight: 16
                    }}>
                      <BuildingIcon size={24} color={COLORS.white} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E3A8A' }}>Manage Places</Text>
                  </TouchableOpacity>

                  {currentAssignedEntry ? (
                    <TouchableOpacity
                      style={[
                        styles.assignedSummaryCard,
                        !assignedLocationDetails?.coordinates && styles.assignedSummaryCardDisabled,
                        { marginBottom: 16 }
                      ]}
                      onPress={handleFocusAssignedLocation}
                      activeOpacity={assignedLocationDetails?.coordinates ? 0.85 : 1}
                      disabled={!assignedLocationDetails?.coordinates}
                    >
                      <View style={styles.assignedSummaryIcon}>
                        <Ionicons name="star" size={18} color={COLORS.white} />
                      </View>
                      <View style={styles.assignedSummaryTextWrapper}>
                        <Text style={styles.assignedSummaryTitle}>{assignedLocationDetails?.label ?? "Assigned location"}</Text>
                        {assignedLocationDetails?.coordinates ? (
                          <Text style={styles.assignedSummaryHint}>Tap to focus on this place</Text>
                        ) : null}
                      </View>
                      {loadingAssignedLocations ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : null}
                    </TouchableOpacity>
                  ) : null}

                  {savedPlaces.length > 0 ? (
                    <View style={[styles.savedPlacesWrapper, { marginTop: 0, paddingHorizontal: 0 }]}>
                      {savedPlaces.map((loc: LocationPoint, index: number) => {
                        let metadataAddress: string | undefined;
                        if (loc.metadata && typeof loc.metadata === "object") {
                          const addressValue = (loc.metadata as any).address;
                          const formattedValue = (loc.metadata as any).formattedAddress;
                          if (typeof addressValue === "string" && addressValue.trim().length > 0) {
                            metadataAddress = addressValue.trim();
                          } else if (typeof formattedValue === "string" && formattedValue.trim().length > 0) {
                            metadataAddress = formattedValue.trim();
                          }
                        }

                        const label = loc.name && loc.name.trim().length > 0 ? loc.name.trim() : metadataAddress ?? `Place ${index + 1}`;
                        const subtitle = metadataAddress && metadataAddress !== label ? metadataAddress : "Location Label";
                        const hasEditableId = loc.id !== undefined && loc.id !== null && String(loc.id).trim().length > 0;
                        const canEditThisLocation = canManageLocations && hasEditableId;
                        const normalizedLocationId = normalizeIdentifier(loc.id);
                        const isAssignedToCurrentUser =
                          currentUserAssignedLocationId !== null &&
                          normalizedLocationId !== null &&
                          normalizedLocationId === currentUserAssignedLocationId;

                        return (
                          <View key={loc.id ? `saved-${loc.id}` : `saved-${index}`} style={[styles.savedPlaceRow, { paddingHorizontal: 0 }]}>
                            <View style={styles.savedPlaceIconCircle}>
                              <Ionicons
                                name={getPlaceTypeIcon((loc.metadata as any)?.locationType || (loc.metadata as any)?.placeType) as any}
                                size={18}
                                color={COLORS.primary}
                              />
                            </View>
                            <View style={styles.savedPlaceTextWrapper}>
                              <Text style={styles.savedPlaceName}>{label}</Text>
                              <Text style={styles.savedPlaceCoords}>{subtitle}</Text>
                              {isAssignedToCurrentUser ? (
                                <View style={styles.assignedBadge}>
                                  <Ionicons name="star" size={12} color={COLORS.primary} />
                                  <Text style={styles.assignedBadgeText}>Assigned to you</Text>
                                </View>
                              ) : null}
                            </View>
                            {canEditThisLocation && (
                              <TouchableOpacity
                                style={styles.savedPlaceActionButton}
                                onPress={() => handleEditSavedPlace(loc)}
                              >
                                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>

                {/* Items Section */}
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E3A8A', marginBottom: 16 }}>Items</Text>


                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
                    onPress={handleStartInviteFlow}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 26,
                      backgroundColor: '#D5D5D5', alignItems: 'center', justifyContent: 'center',
                      marginRight: 16
                    }}>
                      <BluetoothIcon2 size={28} color={COLORS.white} />
                    </View>


                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#9CA3AF' }}>Add an Item</Text>
                  </TouchableOpacity>
                </View>





              </ScrollView>
            ) : null}

            {activeTab === "Driving" ? (
              <View style={{ flex: 1, backgroundColor: COLORS.white, paddingTop: insets.top }}>
                <View style={{ height: TOP_HEADER_HEIGHT, justifyContent: 'center' }}>
                  {/* Content Header if needed */}
                </View>
                {/* Member Selector Row */}
                <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {/* "All" Option */}
                    <TouchableOpacity
                      style={{ marginRight: 20, alignItems: 'center' }}
                      onPress={() => setSelectedDrivingMemberId("all")}
                    >
                      <View style={{
                        width: 58, height: 58, borderRadius: 29,
                        backgroundColor: selectedDrivingMemberId === "all" ? COLORS.primary : '#E5E7EB',
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: 6
                      }}>
                        {selectedCircle?.name ? (
                          <Text style={{ fontSize: 18, color: selectedDrivingMemberId === "all" ? COLORS.white : '#4B5563', fontWeight: '700' }}>
                            {selectedCircle.name.substring(0, 2).toUpperCase()}
                          </Text>
                        ) : (
                          <UsersIcon color={selectedDrivingMemberId === "all" ? COLORS.white : '#4B5563'} size={24} />
                        )}
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: selectedDrivingMemberId === "all" ? COLORS.primary : '#6B7280' }}>All</Text>
                    </TouchableOpacity>

                    {/* Member Avatars */}
                    {selectedCircleMembers.map((member: CircleMember) => {
                      const memberId = resolveMemberId(member) || "";
                      const displayName = member.Membership?.nickname || member.name || "Unknown";
                      let avatarUri = null;
                      if (typeof member.avatar === "string" && member.avatar.trim().length > 0) {
                        const trimmed = member.avatar.trim();
                        avatarUri = (trimmed.startsWith("http") || trimmed.startsWith("file:")) ? trimmed : `${API_BASE_URL}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`.replace("/api/uploads", "/uploads");
                      }
                      const isSelected = selectedDrivingMemberId === memberId;
                      return (
                        <TouchableOpacity
                          key={memberId}
                          style={{ marginRight: 20, alignItems: 'center' }}
                          onPress={() => setSelectedDrivingMemberId(memberId)}
                        >
                          <View style={{
                            width: 58, height: 58, borderRadius: 29,
                            borderWidth: 2, borderColor: isSelected ? COLORS.primary : 'transparent',
                            padding: 2, marginBottom: 6
                          }}>
                            <Image
                              source={{ uri: avatarUri || `${DEFAULT_MEMBER_AVATAR}${encodeURIComponent(displayName)}` }}
                              style={{ width: '100%', height: '100%', borderRadius: 27 }}
                            />
                          </View>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? COLORS.primary : '#6B7280' }} numberOfLines={1}>
                            {displayName.split(' ')[0]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Date / Section Header - "This Week" with back button */}
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <TouchableOpacity 
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}
                    onPress={() => setActiveTab("Location")}
                  >
                    <Ionicons name="chevron-back" size={20} color="#1E3A8A" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E3A8A', flex: 1, textAlign: 'center', marginRight: 52 }}>This Week</Text>
                </View>

                {/* Drives List */}
                {(() => {
                  const journeysForTab: Journey[] = selectedDrivingMemberId === "all"
                    ? Object.values(drivingJourneyCache).flat()
                    : (drivingJourneyCache[selectedDrivingMemberId] || []);
                  const statsForTab = selectedDrivingMemberId !== "all" && drivingBatchStatsCache[selectedDrivingMemberId]
                    ? drivingBatchStatsCache[selectedDrivingMemberId]
                    : (() => {
                        let totalMeters = 0, topSpeed = 0, driveCount = 0;
                        journeysForTab.filter(j => !isJourneyStationary(j.history || [])).forEach(j => {
                          const s = calcJourneyStats(j.history || []);
                          if (s.topSpeedMph > topSpeed) topSpeed = s.topSpeedMph;
                          totalMeters += parseFloat(s.distanceMiles) * 1609.34;
                          driveCount++;
                        });
                        return { totalMiles: (totalMeters / 1609.34).toFixed(1), totalDrives: driveCount, topSpeed };
                      })();
                  const driveJourneys = journeysForTab.filter(j => !isJourneyStationary(j.history || []));
                  const stayJourneys = journeysForTab.filter(j => isJourneyStationary(j.history || []));

                  return (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                      {/* Stats Row */}
                      <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8, gap: 8 }}>
                        {[
                          { label: "Top Speed", value: drivingLoading ? "—" : `${statsForTab.topSpeed} mph` },
                          { label: "Total Drives", value: drivingLoading ? "—" : `${statsForTab.totalDrives}` },
                          { label: "Total Miles", value: drivingLoading ? "—" : `${statsForTab.totalMiles} mi` },
                        ].map(stat => (
                          <View key={stat.label} style={{ flex: 1, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E3A8A', marginBottom: 2 }}>{stat.value}</Text>
                            <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>{stat.label}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Journey list */}
                      {drivingLoading ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
                          <ActivityIndicator color={COLORS.primary} />
                          <Text style={{ marginTop: 8, color: '#6B7280', fontSize: 14 }}>Loading journeys…</Text>
                        </View>
                      ) : journeysForTab.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                          <View style={{ width: '100%', backgroundColor: '#EFF6FF', borderRadius: 20, padding: 30, alignItems: 'center' }}>
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                              <SteeringWheelIcon color={COLORS.white} size={30} />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E3A8A', marginBottom: 8 }}>No Drives Detected</Text>
                            <Text style={{ fontSize: 14, color: COLORS.primary, textAlign: 'center', lineHeight: 20 }}>
                              Your Circle may have turned off Drive Detection or had a low battery/poor connectivity.
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          {driveJourneys.length > 0 && (
                            <>
                              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E3A8A', flex: 1 }}>Drives ({driveJourneys.length})</Text>
                              </View>
                              {driveJourneys.map((journey, idx) => {
                                const stats = calcJourneyStats(journey.history || []);
                                return (
                                  <View key={journey.startTime || idx} style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                        <Ionicons name="shuffle" size={20} color="#FFFFFF" />
                                      </View>
                                      <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{stats.distanceMiles} mi Trip</Text>
                                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{formatJourneyTimeRange(journey.startTime, journey.endTime)} · {getJourneyDuration(journey.startTime, journey.endTime)}</Text>
                                      </View>
                                    </View>
                                    <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                                      <JourneyMapPreview history={journey.history || []} />
                                    </View>
                                  </View>
                                );
                              })}
                            </>
                          )}
                          {stayJourneys.length > 0 && (
                            <>
                              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E3A8A', flex: 1 }}>Stops ({stayJourneys.length})</Text>
                              </View>
                              {stayJourneys.map((journey, idx) => (
                                <View key={journey.startTime || idx} style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#002B7F', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                      <Ionicons name="location-sharp" size={20} color="#FFFFFF" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{journey.history?.[0]?.name || "Stayed at Location"}</Text>
                                      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{formatJourneyTimeRange(journey.startTime, journey.endTime)} · {getJourneyDuration(journey.startTime, journey.endTime)}</Text>
                                    </View>
                                  </View>
                                  <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                                    <JourneyMapPreview history={journey.history || []} />
                                  </View>
                                </View>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </ScrollView>
                  );
                })()}
              </View>
            ) : null}

            {activeTab === "Safety" ? (
              <View style={{ flex: 1, backgroundColor: COLORS.white, paddingTop: insets.top }}>
                <View style={{ height: TOP_HEADER_HEIGHT, justifyContent: 'center' }}>
                  {/* Content Header if needed */}
                </View>
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                   <View style={{ backgroundColor: '#1E3A8A', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                    <View
                                                                style={{
                                                                  width: 80,
                                                                  height: 80,
                                                                  borderRadius: 40,
                                                                  backgroundColor: "white",
                                                                  justifyContent: "center",
                                                                  alignItems: "center",
                                                                  marginRight: 12,
                                                                  shadowColor: "#000",
                                                                  shadowOffset: { width: 0, height: 2 },
                                                                  shadowOpacity: 0.1,
                                                                  shadowRadius: 4,
                                                                  elevation: 2,
                                                                }}
                                                              >
                                                                <Svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                                                  {/* Three Green Arcs */}
                                                                  <SvgCircle 
                                                                    cx="40" 
                                                                    cy="40" 
                                                                    r="28" 
                                                                    stroke="#3DCA1D" 
                                                                    strokeWidth="1.5"
                                                                    strokeDasharray="42 16.5"
                                                                    strokeDashoffset="10"
                                                                  />
                                            
                                                                  {/* User Icon 1 (Top Left) */}
                                                                  <G transform="translate(6, 14)">
                                                                    <SvgCircle cx="13" cy="13" r="13" fill="white" />
                                                                    <Path 
                                                                      d="M16.1148 13.22C16.6396 12.7581 17.0605 12.1869 17.3491 11.545C17.6376 10.9032 17.7869 10.2057 17.7869 9.5C17.7869 8.17392 17.2687 6.90215 16.3464 5.96447C15.4241 5.02678 14.1732 4.5 12.8689 4.5C11.5645 4.5 10.3136 5.02678 9.39128 5.96447C8.46897 6.90215 7.95082 8.17392 7.95082 9.5C7.95081 10.2057 8.10013 10.9032 8.38865 11.545C8.67716 12.1869 9.09812 12.7581 9.62295 13.22C8.24604 13.8539 7.07783 14.8775 6.25801 16.1685C5.43819 17.4596 5.00145 18.9633 5 20.5C5 20.7652 5.10363 21.0196 5.28809 21.2071C5.47255 21.3946 5.72274 21.5 5.98361 21.5C6.24448 21.5 6.49466 21.3946 6.67912 21.2071C6.86358 21.0196 6.96721 20.7652 6.96721 20.5C6.96721 18.9087 7.58899 17.3826 8.69576 16.2574C9.80254 15.1321 11.3036 14.5 12.8689 14.5C14.4341 14.5 15.9352 15.1321 17.0419 16.2574C18.1487 17.3826 18.7705 18.9087 18.7705 20.5C18.7705 20.7652 18.8741 21.0196 19.0586 21.2071C19.243 21.3946 19.4932 21.5 19.7541 21.5C20.015 21.5 20.2652 21.3946 20.4496 21.2071C20.6341 21.0196 20.7377 20.7652 20.7377 20.5C20.7363 18.9633 20.2995 17.4596 19.4797 16.1685C18.6599 14.8775 17.4917 13.8539 16.1148 13.22ZM12.8689 12.5C12.2852 12.5 11.7147 12.3241 11.2295 11.9944C10.7442 11.6648 10.366 11.1962 10.1427 10.648C9.91931 10.0999 9.86087 9.49667 9.97473 8.91473C10.0886 8.33279 10.3696 7.79824 10.7823 7.37868C11.195 6.95912 11.7208 6.6734 12.2932 6.55764C12.8656 6.44189 13.4589 6.5013 13.9981 6.72836C14.5373 6.95542 14.9981 7.33994 15.3224 7.83329C15.6466 8.32664 15.8197 8.90666 15.8197 9.5C15.8197 10.2957 15.5088 11.0587 14.9554 11.6213C14.402 12.1839 13.6515 12.5 12.8689 12.5Z" 
                                                                      fill="#031C55" 
                                                                      transform="translate(0, 0)"
                                                                    />
                                                                  </G>
                                            
                                                                  {/* User Icon 2 (Top Right) */}
                                                                  <G transform="translate(48, 14)">
                                                                    <SvgCircle cx="13" cy="13" r="13" fill="white" />
                                                                    <Path 
                                                                      d="M16.1148 13.22C16.6396 12.7581 17.0605 12.1869 17.3491 11.545C17.6376 10.9032 17.7869 10.2057 17.7869 9.5C17.7869 8.17392 17.2687 6.90215 16.3464 5.96447C15.4241 5.02678 14.1732 4.5 12.8689 4.5C11.5645 4.5 10.3136 5.02678 9.39128 5.96447C8.46897 6.90215 7.95082 8.17392 7.95082 9.5C7.95081 10.2057 8.10013 10.9032 8.38865 11.545C8.67716 12.1869 9.09812 12.7581 9.62295 13.22C8.24604 13.8539 7.07783 14.8775 6.25801 16.1685C5.43819 17.4596 5.00145 18.9633 5 20.5C5 20.7652 5.10363 21.0196 5.28809 21.2071C5.47255 21.3946 5.72274 21.5 5.98361 21.5C6.24448 21.5 6.49466 21.3946 6.67912 21.2071C6.86358 21.0196 6.96721 20.7652 6.96721 20.5C6.96721 18.9087 7.58899 17.3826 8.69576 16.2574C9.80254 15.1321 11.3036 14.5 12.8689 14.5C14.4341 14.5 15.9352 15.1321 17.0419 16.2574C18.1487 17.3826 18.7705 18.9087 18.7705 20.5C18.7705 20.7652 18.8741 21.0196 19.0586 21.2071C19.243 21.3946 19.4932 21.5 19.7541 21.5C20.015 21.5 20.2652 21.3946 20.4496 21.2071C20.6341 21.0196 20.7377 20.7652 20.7377 20.5C20.7363 18.9633 20.2995 17.4596 19.4797 16.1685C18.6599 14.8775 17.4917 13.8539 16.1148 13.22ZM12.8689 12.5C12.2852 12.5 11.7147 12.3241 11.2295 11.9944C10.7442 11.6648 10.366 11.1962 10.1427 10.648C9.91931 10.0999 9.86087 9.49667 9.97473 8.91473C10.0886 8.33279 10.3696 7.79824 10.7823 7.37868C11.195 6.95912 11.7208 6.6734 12.2932 6.55764C12.8656 6.44189 13.4589 6.5013 13.9981 6.72836C14.5373 6.95542 14.9981 7.33994 15.3224 7.83329C15.6466 8.32664 15.8197 8.90666 15.8197 9.5C15.8197 10.2957 15.5088 11.0587 14.9554 11.6213C14.402 12.1839 13.6515 12.5 12.8689 12.5Z" 
                                                                      fill="#031C55" 
                                                                    />
                                                                  </G>
                                            
                                                                  {/* User Icon 3 (Bottom Center) */}
                                                                  <G transform="translate(27, 48)">
                                                                    <SvgCircle cx="13" cy="13" r="13" fill="white" />
                                                                    <Path 
                                                                      d="M16.1148 13.22C16.6396 12.7581 17.0605 12.1869 17.3491 11.545C17.6376 10.9032 17.7869 10.2057 17.7869 9.5C17.7869 8.17392 17.2687 6.90215 16.3464 5.96447C15.4241 5.02678 14.1732 4.5 12.8689 4.5C11.5645 4.5 10.3136 5.02678 9.39128 5.96447C8.46897 6.90215 7.95082 8.17392 7.95082 9.5C7.95081 10.2057 8.10013 10.9032 8.38865 11.545C8.67716 12.1869 9.09812 12.7581 9.62295 13.22C8.24604 13.8539 7.07783 14.8775 6.25801 16.1685C5.43819 17.4596 5.00145 18.9633 5 20.5C5 20.7652 5.10363 21.0196 5.28809 21.2071C5.47255 21.3946 5.72274 21.5 5.98361 21.5C6.24448 21.5 6.49466 21.3946 6.67912 21.2071C6.86358 21.0196 6.96721 20.7652 6.96721 20.5C6.96721 18.9087 7.58899 17.3826 8.69576 16.2574C9.80254 15.1321 11.3036 14.5 12.8689 14.5C14.4341 14.5 15.9352 15.1321 17.0419 16.2574C18.1487 17.3826 18.7705 18.9087 18.7705 20.5C18.7705 20.7652 18.8741 21.0196 19.0586 21.2071C19.243 21.3946 19.4932 21.5 19.7541 21.5C20.015 21.5 20.2652 21.3946 20.4496 21.2071C20.6341 21.0196 20.7377 20.7652 20.7377 20.5C20.7363 18.9633 20.2995 17.4596 19.4797 16.1685C18.6599 14.8775 17.4917 13.8539 16.1148 13.22ZM12.8689 12.5C12.2852 12.5 11.7147 12.3241 11.2295 11.9944C10.7442 11.6648 10.366 11.1962 10.1427 10.648C9.91931 10.0999 9.86087 9.49667 9.97473 8.91473C10.0886 8.33279 10.3696 7.79824 10.7823 7.37868C11.195 6.95912 11.7208 6.6734 12.2932 6.55764C12.8656 6.44189 13.4589 6.5013 13.9981 6.72836C14.5373 6.95542 14.9981 7.33994 15.3224 7.83329C15.6466 8.32664 15.8197 8.90666 15.8197 9.5C15.8197 10.2957 15.5088 11.0587 14.9554 11.6213C14.402 12.1839 13.6515 12.5 12.8689 12.5Z" 
                                                                      fill="#031C55" 
                                                                    />
                                                                  </G>
                                                                </Svg>
                                                              </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Expand your safety network</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>We recommend to invite 3 to 4 members to your emergency contacts in your circle.</Text>
                      </View>
                   </View>

                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#416FD6' }}>Your Circle emergency contacts</Text>
                      <TouchableOpacity>
                         <Text style={{ fontSize: 14, fontWeight: '700', color: '#031C55' }}>+ Add Contact</Text>
                      </TouchableOpacity>
                   </View>

                   <View style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8, marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Will be available soon</Text>
                   </View>

                   <View style={{ backgroundColor: '#EFEFEF', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', borderColor:'#DBEAFE' }}>
                      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#D5D5D5', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                          <CrashDetectionIcon size={30} color="#031C55" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#1E3A8A', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Crash Detection</Text>
                        <Text style={{ color: COLORS.primary, fontSize: 13 }}>Crash Alerts help keep you safe by sending a notification to everyone in your circle.</Text>
                      </View>
                   </View>
                </ScrollView>
              </View>
            ) : null}

            {activeTab === "Membership" ? (
              <View style={{ flex: 1, backgroundColor: COLORS.white, paddingTop: insets.top }}>
                <View style={{ height: TOP_HEADER_HEIGHT, justifyContent: 'center' }}>
                  {/* Content Header if needed */}
                </View>
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                   <Text style={{ fontSize: 24, fontWeight: '800', color: '#1E3A8A', marginBottom: 24 }}>Membership Plans</Text>
                   
                   {/* Pricing Options */}
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                     <TouchableOpacity style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginRight: 8, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                       <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.gray, marginBottom: 8 }}>Monthly Access</Text>
                       <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.black }}>SAR 27</Text>
                       <Text style={{ fontSize: 12, color: COLORS.gray }}>/ month</Text>
                     </TouchableOpacity>

                     <TouchableOpacity style={{ flex: 1, backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16, marginLeft: 8, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                       <View style={{ position: 'absolute', top: -12, backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                         <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.white }}>BEST VALUE</Text>
                       </View>
                       <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8, marginTop: 4 }}>Annual Membership</Text>
                       <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.primary }}>SAR 297</Text>
                       <Text style={{ fontSize: 12, color: COLORS.primary, textAlign: 'center' }}>/ year</Text>
                       <Text style={{ fontSize: 10, color: COLORS.primary, fontWeight: '700', marginTop: 4 }}>Save SAR 27 (1 Month Free)</Text>
                     </TouchableOpacity>
                   </View>

                   {/* Free Tier Details */}
                   <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 16 }}>Free Tier Details</Text>
                   <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' }}>
                     <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                       <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                         <MaterialCommunityIcons name="account-group" size={22} color="#64748B" />
                       </View>
                       <View style={{ flex: 1 }}>
                         <Text style={{ fontSize: 15, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Circle Limitation</Text>
                         <Text style={{ fontSize: 13, color: COLORS.gray, lineHeight: 18 }}>
                           Users are limited to five circles during the first seven days of the free tier. Upon expiration of this period, the account will revert to a single active circle. While users may designate their preferred active circle, all other existing circles will be restricted and visually obscured.
                         </Text>
                       </View>
                     </View>
                     
                     <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                       <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                         <MaterialCommunityIcons name="history" size={22} color="#64748B" />
                       </View>
                       <View style={{ flex: 1 }}>
                         <Text style={{ fontSize: 15, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Driving History</Text>
                         <Text style={{ fontSize: 13, color: COLORS.gray, lineHeight: 18 }}>
                           Full driving records are accessible during your 7-day free trial. Once the trial ends, history will be limited to a rolling one-day window.
                         </Text>
                       </View>
                     </View>

                     <View style={{ flexDirection: 'row' }}>
                       <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                         <MaterialCommunityIcons name="map-marker-plus" size={22} color="#64748B" />
                       </View>
                       <View style={{ flex: 1 }}>
                         <Text style={{ fontSize: 15, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Add Places (Geofencing)</Text>
                         <Text style={{ fontSize: 13, color: COLORS.gray, lineHeight: 18 }}>
                           Free Tier supports a maximum of 10 Places per circle. Once the Free Tier concludes, the capacity is reduced to 5 Places. Additional entries will be automatically disabled and displayed at 90% transparency.
                         </Text>
                       </View>
                     </View>
                   </View>

                   {/* Emergency & Security Features */}
                   <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 16 }}>Emergency & Security Features</Text>
                   <View style={{ backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#DBEAFE' }}>
                     <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                       <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                         <MaterialCommunityIcons name="alert-octagon" size={22} color={COLORS.primary} />
                       </View>
                       <View style={{ flex: 1 }}>
                         <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary, marginBottom: 4 }}>🆘 Instant SOS Panic Alert</Text>
                         <Text style={{ fontSize: 13, color: COLORS.gray, lineHeight: 18 }}>High-priority emergency trigger instantly notifies all Circle members and emergency contacts with your live location.</Text>
                       </View>
                     </View>
                     <View style={{ flexDirection: 'row' }}>
                       <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                         <MaterialCommunityIcons name="card-account-phone" size={22} color={COLORS.primary} />
                       </View>
                       <View style={{ flex: 1 }}>
                         <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary, marginBottom: 4 }}>📍 Emergency Contacts</Text>
                         <Text style={{ fontSize: 13, color: COLORS.gray, lineHeight: 18 }}>Add up to 5 external emergency contacts. Automatically sends SMS with GPS coordinates during an SOS event.</Text>
                       </View>
                     </View>
                   </View>

                   {/* Core Premium Benefits */}
                   <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 16 }}>Core Premium Benefits</Text>
                   <View style={{ marginBottom: 30 }}>
                     {[
                       { icon: "history", title: "30-Day Location History", desc: "Access a detailed breadcrumb trail of your circle's movements." },
                       { icon: "map-marker-radius", title: "Unlimited Place Geofencing", desc: "Set unlimited saved locations and get notified for arrivals." },
                       { icon: "car-speed-limiter", title: "Precision Speed Tracking", desc: "Monitor driving behavior and receive alerts for rapid acceleration." },
                     ].map((feature, idx) => (
                       <View key={idx} style={{ flexDirection: 'row', marginBottom: 20 }}>
                         <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                           <MaterialCommunityIcons name={feature.icon as any} size={24} color={COLORS.primary} />
                         </View>
                         <View style={{ flex: 1, justifyContent: 'center' }}>
                           <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.black, marginBottom: 4 }}>{feature.title}</Text>
                           <Text style={{ fontSize: 13, color: COLORS.gray, lineHeight: 18 }}>{feature.desc}</Text>
</View>
                       </View>
                     ))}
                   </View>

                   <TouchableOpacity 
                      disabled={isSubscribing}
                      onPress={handleSubscribeToPlan}
                      style={{
                        backgroundColor: isSubscribing ? COLORS.gray : COLORS.primary,
                        paddingVertical: 16,
                        width: '100%',
                        borderRadius: 14,
                        alignItems: 'center',
                        shadowColor: COLORS.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isSubscribing ? 0 : 0.3, shadowRadius: 8, elevation: 5
                      }}
                    >
                      {isSubscribing ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>Subscribe Now</Text>
                      )}
                    </TouchableOpacity>
                </ScrollView>
              </View>
            ) : null}
          </View>

          {/* Navigation Bar */}
          <View style={styles.navBar}>
            <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Location")}>
              <View style={styles.iconContainer}>
                <MapIcon
                  color={activeTab === "Location" ? COLORS.primary : COLORS.gray}
                  size={20}
                />
              </View>
              <Text style={[styles.navText, activeTab === "Location" && styles.activeNavText]}>Map</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Driving")}>
              <View style={styles.iconContainer}>
                <DrivingIcon
                  color={activeTab === "Driving" ? COLORS.primary : COLORS.gray}
                />
              </View>
              <Text style={[styles.navText, activeTab === "Driving" && styles.activeNavText]}>Driving</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Safety")}>
              <View style={styles.iconContainer}>
                <SafetyIcon
                  color={activeTab === "Safety" ? COLORS.primary : COLORS.gray}
                  size={28}
                />
              </View>
              <Text style={[styles.navText, activeTab === "Safety" && styles.activeNavText]}>Safety</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Membership")}>
              <View style={styles.iconContainer}>
                <MembershipIcon
                  color={activeTab === "Membership" ? COLORS.primary : COLORS.gray}
                />
              </View>
              <Text style={[styles.navText, activeTab === "Membership" && styles.activeNavText]}>Membership</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* CirclesModal removed */}





        {/* SettingsModal removed */}

        {/* LocationSharingModal removed */}

        {/* CircleManagementModal removed */}

        {/* AccountModal removed */}

        {/* NotificationsModal removed */}

        <Modal
          visible={isLocationHistoryModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          presentationStyle="overFullScreen"
          onRequestClose={handleCloseLocationHistoryModal}
        >
          <View style={styles.memberModalOverlay}>
            <TouchableOpacity
              style={styles.memberModalBackdrop}
              activeOpacity={1}
              onPress={handleCloseLocationHistoryModal}
            />
            <View style={[styles.locationHistoryCard, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.locationHistoryHeader}>
                <Text style={styles.locationHistoryTitle}>Location history</Text>
                <TouchableOpacity
                  style={styles.locationHistoryCloseButton}
                  onPress={handleCloseLocationHistoryModal}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <Ionicons name="close" size={22} color={COLORS.black} />
                </TouchableOpacity>
              </View>

              <View style={styles.locationHistoryBatteryRow}>
                <View>
                  <Text style={styles.locationHistoryBatteryLabel}>Battery status</Text>
                  {batteryUpdatedAtLabel ? (
                    <Text style={styles.locationHistoryBatterySubLabel}>{`Updated ${batteryUpdatedAtLabel}`}</Text>
                  ) : null}
                </View>
                <View style={styles.batteryIndicatorWrapper}>
                  <View style={styles.batteryShell}>
                    <View
                      style={[
                        styles.batteryFill,
                        batteryLevelPercent !== null
                          ? {
                            width: `${batteryLevelPercent}%`,
                            backgroundColor:
                              batteryLevelPercent < LOW_BATTERY_THRESHOLD ? COLORS.accent : COLORS.success,
                          }
                          : styles.batteryFillEmpty,
                      ]}
                    />
                    <View style={styles.batteryCap} />
                  </View>
                  <Text style={styles.batteryPercentText}>
                    {batteryLevelPercent !== null ? `${batteryLevelPercent}%` : "--"}
                  </Text>
                </View>
              </View>

              <View style={styles.locationHistoryActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.locationHistoryRefreshButton,
                    locationHistoryLoading && styles.locationHistoryRefreshButtonDisabled,
                  ]}
                  onPress={handleRefreshLocationHistory}
                  disabled={locationHistoryLoading}
                >
                  {locationHistoryLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.locationHistoryRefreshButtonText}>Refresh</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.locationHistoryFiltersRow}>
                {LOCATION_HISTORY_FILTERS.map((filter) => {
                  const isActive = filter.key === locationHistoryActiveFilter;
                  return (
                    <TouchableOpacity
                      key={filter.key}
                      style={[styles.locationHistoryFilterChip, isActive && styles.locationHistoryFilterChipActive]}
                      onPress={() => handleSelectLocationHistoryFilter(filter.key)}
                    >
                      <Text
                        style={[
                          styles.locationHistoryFilterText,
                          isActive && styles.locationHistoryFilterTextActive,
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {locationHistoryActiveFilter === "custom" ? (
                <View style={styles.locationHistoryCustomRange}>
                  <View style={styles.locationHistoryCustomInputBlock}>
                    <Text style={styles.locationHistoryCustomLabel}>Start</Text>
                    <TouchableOpacity
                      style={styles.locationHistoryCustomInput}
                      onPress={() => setShowLocationHistoryCustomStartPicker(true)}
                    >
                      <Text style={{ color: locationHistoryCustomStart ? COLORS.black : COLORS.gray }}>
                        {locationHistoryCustomStart || "Select Start Date"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.locationHistoryCustomInputBlock, styles.locationHistoryCustomInputBlockLast]}>
                    <Text style={styles.locationHistoryCustomLabel}>End</Text>
                    <TouchableOpacity
                      style={styles.locationHistoryCustomInput}
                      onPress={() => setShowLocationHistoryCustomEndPicker(true)}
                    >
                      <Text style={{ color: locationHistoryCustomEnd ? COLORS.black : COLORS.gray }}>
                        {locationHistoryCustomEnd || "Select End Date"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showLocationHistoryCustomStartPicker && (
                    <DateTimePicker
                      value={parseDateInput(locationHistoryCustomStart) || new Date()}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={handleCustomStartChange}
                    />
                  )}
                  {showLocationHistoryCustomEndPicker && (
                    <DateTimePicker
                      value={parseDateInput(locationHistoryCustomEnd) || new Date()}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={handleCustomEndChange}
                    />
                  )}
                </View>
              ) : null}

              {shouldRenderLocationHistoryMap && locationHistoryPolylineCoordinates.length > 0 ? (
                <View style={styles.locationHistoryMapWrapper}>
                  {canRenderMapbox() ? (
                    <Mapbox.MapView
                      ref={locationHistoryMapRef}
                      style={styles.locationHistoryMap}
                      styleURL={Mapbox.StyleURL.Street}
                      logoEnabled={false}
                      compassEnabled={false}
                      scaleBarEnabled={false}
                      scrollEnabled={false}
                      pitchEnabled={false}
                      rotateEnabled={false}
                      zoomEnabled={false}
                      pointerEvents="none"
                    >
                      <Mapbox.Camera
                        ref={locationHistoryCameraRef}
                        zoomLevel={14}
                        centerCoordinate={locationHistoryMapInitialRegion ? [locationHistoryMapInitialRegion.longitude, locationHistoryMapInitialRegion.latitude] : undefined}
                      />
                      {locationHistoryPolylineCoordinates.length >= 2 ? (
                        <Mapbox.ShapeSource id="historyRouteSource" shape={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: locationHistoryPolylineCoordinates.map(c => [c.longitude, c.latitude]) } } as any}>
                          <Mapbox.LineLayer id="historyRouteLayer" style={{ lineColor: "#2563EB", lineWidth: 4 }} />
                        </Mapbox.ShapeSource>
                      ) : null}

                      {locationHistoryPolylineCoordinates.length === 1 ? (
                        <Mapbox.PointAnnotation
                          id="history-single-point"
                          coordinate={[locationHistoryPolylineCoordinates[0].longitude, locationHistoryPolylineCoordinates[0].latitude]}
                          anchor={{ x: 0.5, y: 0.5 }}
                        >
                          <View style={styles.locationHistorySinglePoint} />
                        </Mapbox.PointAnnotation>
                      ) : null}

                      {locationHistoryArrowMarkers.map((segment) => (
                        <Mapbox.PointAnnotation
                          key={`history-arrow-${segment.id}`}
                          id={`history-arrow-${segment.id}`}
                          coordinate={[segment.longitude, segment.latitude]}
                          anchor={{ x: 0.5, y: 0.5 }}
                        >
                          <View style={[styles.locationHistoryArrowIcon, { transform: [{ rotate: `${segment.rotation}deg` }] }]}>
                            <Ionicons name="arrow-forward-circle" size={18} color="#2563EB" />
                          </View>
                        </Mapbox.PointAnnotation>
                      ))}
                    </Mapbox.MapView>
                  ) : (
                    <MapFallback style={styles.locationHistoryMap} />
                  )}
                </View>
              ) : null}

              {locationHistoryFilterError ? (
                <Text style={styles.locationHistoryErrorText}>{locationHistoryFilterError}</Text>
              ) : null}

              {locationHistoryError ? (
                <View style={styles.locationHistoryErrorBanner}>
                  <Text style={styles.locationHistoryErrorBannerText}>{locationHistoryError}</Text>
                </View>
              ) : null}

              <View style={styles.locationHistoryListWrapper}>
                {locationHistoryLoading && !locationHistory.length ? (
                  <ActivityIndicator size="large" color={COLORS.primary} style={styles.locationHistoryLoadingSpinner} />
                ) : null}

                {!locationHistoryLoading && locationHistoryFilteredDescending.length === 0 && !locationHistoryFilterError ? (
                  <View style={styles.locationHistoryEmptyState}>
                    <MaterialCommunityIcons name="map-search-outline" size={42} color={COLORS.gray} />
                    <Text style={styles.locationHistoryEmptyText}>No location history found for this range.</Text>
                  </View>
                ) : null}

                {locationHistoryFilteredDescending.length > 0 ? (
                  <FlatList
                    data={locationHistoryFilteredDescending}
                    keyExtractor={locationHistoryKeyExtractor}
                    renderItem={renderLocationHistoryItem}
                    contentContainerStyle={styles.locationHistoryList}
                    showsVerticalScrollIndicator={false}
                  />
                ) : null}
              </View>
            </View>
          </View>
        </Modal>



        <Modal
          visible={editMemberModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeEditMemberModal}
        >
          <View style={styles.memberModalOverlay}>
            <TouchableOpacity
              style={styles.memberModalBackdrop}
              activeOpacity={1}
              onPress={closeEditMemberModal}
            />
            <View style={[styles.memberModalCard, { maxHeight: '90%', paddingBottom: 0 }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
                <Text style={styles.memberModalTitle}>Manage member</Text>
                {memberBeingEdited ? (
                  <Text style={styles.memberModalSubtitle}>
                    {memberBeingEdited.Membership?.nickname || memberBeingEdited.name || memberBeingEdited.email || "Unnamed member"}
                  </Text>
                ) : null}

                <Text style={styles.memberModalLabel}>Member Type</Text>
                <View style={styles.roleOptionsRow}>
                  {ROLE_OPTIONS.map((option, index) => {
                    const isSelected = editedMemberRole === option.value;
                    const isDisabled = !canEditRoleInModal;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.roleOptionChip,
                          isSelected && styles.roleOptionChipSelected,
                          isDisabled && styles.roleOptionChipDisabled,
                          index === ROLE_OPTIONS.length - 1 && { marginRight: 0 },
                        ]}
                        onPress={() => {
                          if (isDisabled) return;
                          setEditedMemberRole(option.value);
                        }}
                        disabled={isDisabled}
                      >
                        <Text
                          style={[
                            styles.roleOptionText,
                            isSelected && styles.roleOptionTextSelected,
                            isDisabled && styles.roleOptionTextDisabled,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.memberModalLabel}>Role</Text>
                <View style={styles.relationOptionsRow}>
                  {RELATION_OPTIONS.map((option) => {
                    const isSelected = editedMemberRelation === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.relationOptionChip,
                          isSelected && styles.relationOptionChipSelected,
                        ]}
                        onPress={() => setEditedMemberRelation(option.value)}
                      >
                        <Text
                          style={[
                            styles.relationOptionText,
                            isSelected && styles.relationOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.memberModalLabel}>Nickname</Text>
                <TextInput
                  style={[styles.memberModalInput, !canEditNicknameInModal && styles.memberModalInputDisabled]}
                  value={editedMemberNickname}
                  onChangeText={setEditedMemberNickname}
                  editable={canEditNicknameInModal}
                  placeholder="Enter nickname"
                  placeholderTextColor={COLORS.gray}
                />

                <Text style={[styles.memberModalLabel, { marginTop: 16 }]}>Special place</Text>
                {locationSelectionControls}

                {canManageLocations && selectedMemberLocationId && !selectedLocationExists ? (
                  <Text style={styles.memberModalHelperText}>
                    The previously assigned place is no longer available.
                  </Text>
                ) : null}

                {memberModalError ? <Text style={styles.memberModalError}>{memberModalError}</Text> : null}

                <View style={styles.memberModalButtonsRow}>
                  <TouchableOpacity style={styles.memberModalSecondaryButton} onPress={closeEditMemberModal} disabled={isSavingMemberChanges}>
                    <Text style={styles.memberModalSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.memberModalPrimaryButton, isSavingMemberChanges && styles.memberModalPrimaryButtonDisabled]}
                    onPress={handleSaveMemberChanges}
                    disabled={isSavingMemberChanges}
                  >
                    {isSavingMemberChanges ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.memberModalPrimaryText}>Edit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* --- MAP STYLE MODAL --- */}
        <Modal
          visible={isMapStyleModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsMapStyleModalOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsMapStyleModalOpen(false)}
          >
            <View style={[styles.mapStyleModalContent, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 20 }]}>
              {/* <View style={styles.modalHeaderRow}>
                <TouchableOpacity onPress={() => setIsMapStyleModalOpen(false)} style={styles.modalCloseIcon}>
                  <Ionicons name="close" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.activateSosText}>Activate SOS →</Text>
              </View> */}

              <Text style={styles.modalTitle}>Map type</Text>

              <FlatList
                data={mapStylesList}
                keyExtractor={(item) => item.key}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalOptionsContainer}
                snapToInterval={SCREEN_WIDTH * 0.35 + 15}
                decelerationRate="fast"
                renderItem={({ item }) => {
                  const isSelected = mapLayerStyle === item.key;
                  return (
                    <TouchableOpacity
                      style={styles.mapPreviewCard}
                      onPress={() => handleChangeMapStyle(item.key)}
                    >
                      <View style={[styles.mapPreviewInner, isSelected && styles.mapPreviewInnerSelected]}>
                        <Image source={item.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      </View>
                      <View style={styles.mapPreviewLabelContainer}>
                        <Text style={[styles.mapPreviewLabel, isSelected && { color: COLORS.primary, fontWeight: '700' }]} numberOfLines={1}>
                          {item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
              <View style={styles.activeStyleIndicatorBar}>
                <View style={styles.activeStyleIndicator} />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>


{/* Startup Loading Overlay */}
        {startupStatus && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            <StartupLoading status={startupStatus} progress={startupProgress} />
          </View>
        )}

        {/* Global Action Loading Overlay */}
        {(loading && !startupStatus) && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 9998, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' }]}>
            <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="light" />
            <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          </View>
        )}

        <NotificationToast
          visible={!!toastNotification}
          notification={toastNotification}
          onClose={() => setToastNotification(null)}
          onPress={() => {
            setToastNotification(null);
            router.push('/screens/NotificationsScreen' as any);
          }}
        />




        <CirclesModal
          isOpen={isCirclesModalOpen}
          onClose={() => setIsCirclesModalOpen(false)}
          onRefresh={requestCirclesRefresh}
          circles={circles}
          loadingCircles={loadingCircles}
          activeCircleId={selectedCircle?.id}
          onSelectCircle={(id) => {
            selectCircle(id);
            setIsCirclesModalOpen(false);
          }}
        />

        <AddPlaceModal
          visible={isAddPlaceModalOpen}
          onClose={() => setIsAddPlaceModalOpen(false)}
          circleId={selectedCircle?.id}
          circleName={selectedCircle?.name}
          mode={addPlaceMode}
          editingLocation={editingLocation}
          members={selectedCircleMembers}
          memberLocations={memberLocations}
          savedPlaces={currentLocations}
          currentUserId={currentUserId}
          currentUserAvatarUrl={currentUserAvatarUrl}
          currentUserBatteryLevel={currentUserBatteryLevel}
          memberAvatarUrls={memberAvatarUrls}
          onPlaceSaved={() => {
            if (selectedCircle?.id) {
              fetchCircleLocations(selectedCircle.id);
            }
            setIsAddPlaceModalOpen(false);
          }}
        />


        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          circleId={selectedCircle?.id}
          circleName={selectedCircle?.name}
          onOpenSmartNotifications={handleOpenSmartNotificationsModal}
          onOpenLocationSharing={handleOpenLocationSharingModal}
          onOpenCircleManagement={handleOpenCircleManagementModal}
          onOpenAddPeople={handleOpenAddPeopleModal}
          onOpenAccount={handleOpenAccountModal}
          onOpenDriveDetection={handleOpenDriveDetectionModal}
          onOpenCreateCircle={handleOpenCreateCircleModal}
          onLogout={handleLogout}
        />

        <CreateCircleModal
          isOpen={isCreateCircleModalOpen}
          onClose={() => setIsCreateCircleModalOpen(false)}
          onCreate={async (name: string, relationship: string) => {
            try {
              const result = await handleCreateCircleAction(name, relationship);
              const newCircleId = result?.data?.id ?? result?.id ?? result?.data?.circle?.id;

              if (newCircleId) {
                await AsyncStorage.setItem(STORAGE_KEYS.lastSelectedCircleId, String(newCircleId)).catch(() => undefined);
              }

              await requestCirclesRefresh();
              setIsCreateCircleModalOpen(false);
              showAlert({ title: "Success", message: "Circle created successfully!", type: 'success' });
            } catch (error: any) {
              showAlert({ title: "Error", message: error.message, type: 'error' });
            }
          }}
        />

        <JoinCircleModal
          isOpen={isJoinCircleModalOpen}
          onClose={() => setIsJoinCircleModalOpen(false)}
          onJoin={async (pin: string) => {
            try {
              const result = await handleJoinCircleAction(pin);
              const newCircleId = result?.data?.id ?? result?.id ?? result?.data?.circle?.id;

              if (newCircleId) {
                await AsyncStorage.setItem(STORAGE_KEYS.lastSelectedCircleId, String(newCircleId)).catch(() => undefined);
              }

              await requestCirclesRefresh();
              setIsJoinCircleModalOpen(false);
              showAlert({ title: "Success", message: "Joined circle successfully!", type: 'success' });
            } catch (error: any) {
              showAlert({ title: "Error", message: error.message, type: 'error' });
            }
          }}
        />

        <NotificationsModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
        />

        <DriveDetectionModal
          isOpen={isDriveDetectionModalOpen}
          onClose={() => setIsDriveDetectionModalOpen(false)}
          onSettingsChanged={async (enabled) => {
            setDriveDetectionEnabled(enabled);
            // Restart background service to apply new frequency config
            await stopBackgroundLocation();
            if (locationSharingEnabled && selectedCircle) {
              await startBackgroundLocation();
            }
          }}
        />

        <AccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
        />

        <LocationSharingModal
          isOpen={isLocationSharingModalOpen}
          onClose={() => setIsLocationSharingModalOpen(false)}
          userName={storedUser?.name || "User"}
          userAvatarUrl={currentUserAvatarUrl}
          userRole={selectedCircle ? formatRoleLabel(currentMembershipRole) : "None"}
        />

        <SmartNotificationModal
          isOpen={isSmartNotificationModalOpen}
          onClose={() => setIsSmartNotificationModalOpen(false)}
          userName={storedUser?.name || "User"}
          userAvatarUrl={currentUserAvatarUrl}
          circleId={selectedCircle ? String(selectedCircle.id) : undefined}
          notificationSettings={selectedCircle?.notificationSettings}
          onSettingsChanged={() => requestCirclesRefresh()}
        />

        <CircleManagementModal
          isOpen={isCircleManagementModalOpen}
          onClose={() => setIsCircleManagementModalOpen(false)}
          circleId={selectedCircle?.id}
          circleName={selectedCircle?.name}
          userRole={currentMembershipRole ?? "Member"}
          onOpenAdminManagement={(type?: string) => {
            setIsCircleManagementModalOpen(false);
            if (type === 'my-role') {
              setIsMyRoleModalOpen(true);
            } else {
              // In NearU, admin management is done per member in the bottom sheet list.
              // We can scroll to the members section as a way to "manage" them.
              scrollToSection('members');
              setActiveSection('members');
              snapTo(MAX_HEIGHT);
              setIsExpanded(true);
            }
          }}
          onOpenEditCircle={() => {
            setIsCircleManagementModalOpen(false);
            setIsEditCircleNameModalOpen(true);
          }}
          onAddPeople={() => {
            setIsCircleManagementModalOpen(false);
            handleStartInviteFlow();
          }}
          onLeaveCircle={() => {
            setIsCircleManagementModalOpen(false);
            handleLeaveCircle();
          }}
        />

        <EditCircleNameModal
          isOpen={isEditCircleNameModalOpen}
          onClose={() => setIsEditCircleNameModalOpen(false)}
          initialName={selectedCircle?.name || ""}
          onSave={async (newName) => {
            try {
              if (!selectedCircle) return;
              await handleUpdateCircleNameAction(selectedCircle.id, newName);
              await requestCirclesRefresh();
              setIsEditCircleNameModalOpen(false);
              showAlert({ title: "Success", message: "Circle name updated!", type: 'success' });
            } catch (error: any) {
              showAlert({ title: "Error", message: error.message, type: 'error' });
            }
          }}
        />

        <SosModal
          isOpen={isSosModalOpen}
          onClose={() => setIsSosModalOpen(false)}
          circleId={selectedCircle?.id}
          circleName={selectedCircle?.name}
          members={selectedCircleMembers}
          emergencyContacts={emergencyContacts}
          onAddContact={handleAddEmergencyContact}
          isPickingContact={isPickingContact}
        />

        {/* --- DEBUG SOCKET ALERT --- */}
        {/* <Modal
          visible={showDebugAlert}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDebugAlert(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, width: '100%', maxHeight: '80%', elevation: 10 }}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.primary }}>Socket Data Sent</Text>
                  <TouchableOpacity onPress={() => setShowDebugAlert(false)}>
                    <Ionicons name="close-circle" size={28} color={COLORS.gray} />
                  </TouchableOpacity>
               </View>
               <ScrollView>
                 <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.accent, marginBottom: 5 }}>Event: {debugSocketData?.event}</Text>
                 <Text style={{ fontSize: 12, color: COLORS.gray, marginBottom: 10 }}>Time: {debugSocketData?.timestamp}</Text>
                 <View style={{ backgroundColor: '#f8f9fa', padding: 10, borderRadius: 10 }}>
                   <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 }}>
                     {JSON.stringify(debugSocketData?.data, null, 2)}
                   </Text>
                 </View>
               </ScrollView>
               <TouchableOpacity 
                 style={{ marginTop: 20, backgroundColor: COLORS.primary, padding: 12, borderRadius: 12, alignItems: 'center' }}
                 onPress={() => setShowDebugAlert(false)}
               >
                 <Text style={{ color: 'white', fontWeight: 'bold' }}>Close Debugger</Text>
               </TouchableOpacity>
            </View>
          </View>
        </Modal> */}

        <AddPeopleModal
          isOpen={isAddPeopleModalOpen}
          onClose={() => setIsAddPeopleModalOpen(false)}
          circleId={selectedCircle?.id}
          circleName={selectedCircle?.name}
        />

        <MyRoleModal
          isOpen={isMyRoleModalOpen}
          onClose={() => setIsMyRoleModalOpen(false)}
          userRole={currentMembershipRole ?? "Member"}
          userRelation={currentMembership?.Membership?.metadata?.relation}
          onSaveRelation={handleUpdateMyRelation}
        />

      </View>
    </KeyboardAvoidingView >
  );
};

export default MapScreen;

// =======================================================
// STYLES
// =======================================================
const styles = StyleSheet.create({
  coordinateAlertContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 10000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  coordinateAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  coordinateAlertText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  coordinateAlertHeader: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  coordinateAlertDetail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 1,
  },
  speedometerContainer: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 8,
  },
  currentSpeedText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  speedUnitText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.gray,
    textTransform: 'uppercase',
  },
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  map: { flex: 1 },

  // --- Map Style Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  mapStyleModalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalCloseIcon: {
    padding: 5,
  },
  activateSosText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    padding: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 20,
  },
  horizontalOptionsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  mapPreviewCard: {
    width: SCREEN_WIDTH * 0.35,
    marginRight: 15,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  mapPreviewInner: {
    height: 100,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  mapPreviewInnerSelected: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  mapPreviewLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  mapPreviewLabel: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeStyleIndicatorBar: {
    height: 10,
    width: '100%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 5,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStyleIndicator: {
    height: 6,
    width: '30%',
    backgroundColor: COLORS.white,
    borderRadius: 3,
    position: 'absolute',
    left: '5%',
  },

  // Header
  headerContainer: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: 16, paddingBottom: 10, zIndex: 30
  },
  roundButton: {
    width: 35,
    height: 35,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 5,
  },
  floatingChatButton: {
    position: 'absolute',
    right: 16,
    zIndex: 12,
    elevation: 6,
  },
  circleSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    width: 173,
    height: 35,
    paddingHorizontal: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 5,
  },
  selectorTextContainer: { flex: 1, justifyContent: 'center' },
  selectorLabel: { fontSize: 10, color: COLORS.gray, textTransform: 'uppercase', fontWeight: '700' },
  circleName: { fontSize: 16, fontWeight: "700", color: COLORS.primary },

  // Floating Controls
  floatingControlsContainer: {
    position: 'absolute',
    bottom: MIN_HEIGHT + 15,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 15,
  },
  roundActionButtonPurple: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  roundActionButtonRed: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  roundButtonSmall: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  locationHistoryArrowIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationHistoryCard: {
    marginHorizontal: 16,
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: SCREEN_HEIGHT * 0.75,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  locationHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationHistoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },
  locationHistoryCloseButton: {
    padding: 6,
  },
  locationHistoryBatteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationHistoryBatteryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  locationHistoryBatterySubLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  batteryIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryShell: {
    width: 70,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginRight: 8,
    position: 'relative',
  },
  batteryCap: {
    position: 'absolute',
    right: -6,
    width: 6,
    height: 12,
    backgroundColor: COLORS.black,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    top: 7,
  },
  batteryFill: {
    height: '80%',
    borderRadius: 4,
  },
  batteryFillEmpty: {
    width: '0%',
    backgroundColor: COLORS.lightGray,
  },
  batteryPercentText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },
  locationHistoryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  locationHistoryRefreshButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  locationHistoryRefreshButtonDisabled: {
    opacity: 0.6,
  },
  locationHistoryRefreshButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  locationHistoryFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  locationHistoryFilterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginRight: 8,
    marginBottom: 8,
  },
  locationHistoryFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  locationHistoryFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
  },
  locationHistoryFilterTextActive: {
    color: COLORS.white,
  },
  locationHistoryCustomRange: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  locationHistoryCustomInputBlock: {
    flex: 1,
    marginRight: 12,
  },
  locationHistoryCustomInputBlockLast: {
    marginRight: 0,
  },
  locationHistoryMapWrapper: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  locationHistoryMap: {
    width: '100%',
    height: 200,
  },
  locationHistorySinglePoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  locationHistoryCustomLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 6,
  },
  locationHistoryCustomInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: '#F9FAFB',
  },
  locationHistoryErrorText: {
    color: COLORS.accent,
    fontSize: 12,
    marginBottom: 8,
  },
  locationHistoryErrorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  locationHistoryErrorBannerText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  locationHistoryListWrapper: {
    flex: 1,
    flexGrow: 1,
    minHeight: 160,
  },
  locationHistoryLoadingSpinner: {
    marginVertical: 24,
  },
  locationHistoryEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  locationHistoryEmptyText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  locationHistoryList: {
    paddingBottom: 16,
  },
  locationHistoryListItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  locationHistoryListItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationHistoryListItemTimestamp: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
    marginRight: 12,
  },
  locationHistoryListItemName: {
    fontSize: 13,
    color: COLORS.gray,
    flexShrink: 0,
  },
  locationHistoryListItemCoords: {
    fontSize: 13,
    color: COLORS.black,
  },
  locationHistoryListItemCircle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },

  // Markers
  userMarkerWrapper: { alignItems: 'center', justifyContent: 'center', maxWidth: 180 },
  userMarkerGlow: {
    padding: 4,
    borderRadius: 24,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  userMarkerCard: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 6,
    position: 'relative',
  },
  userMarkerAvatarShell: {
    width: 46,
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerAvatarImage: { width: '100%', height: '100%' },
  userMarkerInitial: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  userMarkerStatusDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userMarkerPointer: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#113C9C',
    marginTop: -3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 1.4,
    elevation: 4,
  },
  userMarkerLabelBubble: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
  },
  userMarkerLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    maxWidth: 150,
  },
  locationMarkerWrapper: { alignItems: 'center', maxWidth: 220 },
  locationMarkerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 6,
    borderWidth: 1,
  },
  locationMarkerCardDefault: {
    backgroundColor: COLORS.white,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  locationMarkerCardAssigned: {
    backgroundColor: COLORS.primary,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  locationMarkerBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationMarkerBadgeDefault: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  locationMarkerBadgeAssigned: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  locationMarkerBadgeText: { fontSize: 14, fontWeight: '700' },
  locationMarkerBadgeTextDefault: { color: COLORS.accent },
  locationMarkerBadgeTextAssigned: { color: COLORS.white },
  locationMarkerTextBlock: { marginLeft: 10, maxWidth: 160 },
  locationMarkerTitle: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  locationMarkerTitleAssigned: { color: COLORS.white },
  locationMarkerSubtitle: { fontSize: 11, color: '#4B5563', marginTop: 2 },
  locationMarkerSubtitleAssigned: { color: 'rgba(255, 255, 255, 0.85)' },
  locationMarkerPointer: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.2,
    elevation: 4,
  },
  locationMarkerPointerDefault: { borderTopColor: COLORS.white },
  locationMarkerPointerAssigned: { borderTopColor: COLORS.primary },

  // Bottom Sheet
  unifiedSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.15, shadowRadius: 8,
    zIndex: 20, overflow: 'hidden'
  },
  dragHandleContainer: { width: '100%', height: HANDLE_HEIGHT, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },

  sheetContent: { paddingHorizontal: 20, paddingTop: 5 },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 4,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sectionTitleContainer: { paddingVertical: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  divider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: 10 },

  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  memberRow: { alignItems: 'center' },
  listIconCircle: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.lightGray,
    alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: '#E5E7EB'
  },
  memberAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: COLORS.lightGray,
  },
  memberAvatarImage: {
    width: '100%',
    height: '100%',
  },
  memberDetails: {
    flex: 1,
  },
  listItemText: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  listItemSubText: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  memberNicknameText: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  memberActionsColumn: {
    marginLeft: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  memberActionButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  memberActionButtonSpacing: {
    marginBottom: 6,
  },

  // Nav Bar
  navBar: {
    height: TAB_BAR_HEIGHT, flexDirection: "row", width: '100%',
    justifyContent: "space-around", alignItems: "flex-start", paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: COLORS.white
  },
  navItem: { alignItems: "center", justifyContent: "flex-start", flex: 1 },
  iconContainer: { marginBottom: 4, height: 30, justifyContent: 'center', alignItems: 'center' },
  navText: { fontSize: 11, color: COLORS.gray, fontWeight: "600" },
  activeNavText: { color: COLORS.primary, fontWeight: "700" },

  savedPlacesWrapper: {
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  savedPlacesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
  },
  savedPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  savedPlaceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savedPlaceTextWrapper: {
    flex: 1,
  },
  savedPlaceName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  savedPlaceCoords: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  assignedSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F4F0FF',
    marginTop: 16,
  },
  assignedSummaryCardDisabled: {
    opacity: 0.7,
  },
  assignedSummaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  assignedSummaryTextWrapper: {
    flex: 1,
  },
  assignedSummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },
  assignedSummarySubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  assignedSummaryHint: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EDE9FE',
    borderRadius: 999,
  },
  assignedBadgeText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  savedPlaceActionButton: {
    padding: 6,
    marginLeft: 8,
  },
  savedPlacesEmpty: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.gray,
  },
  memberModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  memberModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  memberModalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  memberModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
  },
  memberModalSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  memberModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  profileAvatarPreviewWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileAvatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarActions: {
    flex: 1,
  },
  profileAvatarPrimaryButton: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileAvatarPrimaryText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  profileAvatarSecondaryButton: {
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarSecondaryText: {
    color: COLORS.gray,
    fontWeight: '600',
  },
  roleOptionsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roleOptionChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginRight: 10,
  },
  roleOptionChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F3F0FF',
  },
  roleOptionChipDisabled: {
    opacity: 0.5,
  },
  roleOptionText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: COLORS.primary,
  },
  roleOptionTextDisabled: {
    color: COLORS.gray,
  },
  relationOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  relationOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginRight: 8,
    marginBottom: 8,
  },
  relationOptionChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F3F0FF',
  },
  relationOptionText: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: '600',
  },
  relationOptionTextSelected: {
    color: COLORS.primary,
  },
  memberModalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.black,
    backgroundColor: '#F8FAFC',
  },
  memberModalTextarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  memberModalInputDisabled: {
    opacity: 0.5,
  },
  memberLocationOptionsWrapper: {
    marginTop: 8,
  },
  memberLocationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: COLORS.white,
  },
  memberLocationOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F3F0FF',
  },
  memberLocationOptionTextWrapper: {
    flex: 1,
    marginRight: 12,
  },
  memberLocationOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  memberLocationOptionSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  memberModalHelperText: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 6,
  },
  memberModalError: {
    color: COLORS.accent,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  memberModalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  memberModalSecondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberModalSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  memberModalPrimaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberModalPrimaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  memberModalPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },




  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBadge: {
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'white',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1.5,
    minHeight: 16,
    position: 'absolute',
    top: -4,
    right: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 20,
    zIndex: 10,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'white',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 3,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  batteryBadgeContainer: {
    position: 'absolute',
    top: -6,
    right: -5,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 20,
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
    color: COLORS.black, // Ensure COLORS is defined in your theme
    textAlign: 'center',
    backgroundColor: 'white',
    borderRadius: 2,
  },

  safetyAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addAvatarButton: {
    backgroundColor: '#EFF6FF',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  addContactText: {
    fontSize: 14,
    color: '#60A5FA',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 4,
  },

});