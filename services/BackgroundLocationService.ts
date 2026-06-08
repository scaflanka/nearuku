import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';

// BackgroundService: only load in custom dev builds (not Expo Go)
let BackgroundService: any = null;
const _isExpoGo = Constants.executionEnvironment === 'storeClient';
if (!_isExpoGo) {
  try {
    BackgroundService = require('react-native-background-actions').default;
  } catch (e) {
    console.warn("BackgroundService native module not available (expected in Expo Go)");
  }
}
import {authenticatedFetch } from '../utils/auth';
import { API_BASE_URL } from '../utils/constants';
import SocketService from './SocketService';
import { formatToSLTime } from '../utils/dateHelpers';
import { storeLastKnownLocation, readLastKnownLocation } from '../utils/locationCache';
import { readBatteryLevel } from '../utils/battery';

const BACKGROUND_LOCATION_TASK = 'background-location-task';
const LOCATION_QUEUE_KEY = 'location-sync-queue';
const LAST_BACKGROUND_SYNC_TIME = 'last-background-sync-time';
export const LAST_FOREGROUND_HEARTBEAT = 'last-foreground-heartbeat';
export const LOCATION_TIME_INTERVAL_KEY = 'location_time_interval';

let isSyncInProgress = false;

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

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
        const circleId = await AsyncStorage.getItem("mapScreen:lastSelectedCircleId");
        if (!circleId) return "Background Update";

        // OPTIMIZATION: Cache location names to prevent Nominatim rate-limiting/delays
        const lastGeoStr = await AsyncStorage.getItem(`last_geocoded_name_${circleId}`);
        const lastGeoLat = await AsyncStorage.getItem(`last_geocoded_lat_${circleId}`);
        const lastGeoLng = await AsyncStorage.getItem(`last_geocoded_lng_${circleId}`);
        
        if (lastGeoStr && lastGeoLat && lastGeoLng) {
            const gLat = parseFloat(lastGeoLat);
            const gLng = parseFloat(lastGeoLng);
            if (Math.abs(latitude - gLat) < 0.0005 && Math.abs(longitude - gLng) < 0.0005) {
                return lastGeoStr;
            }
        }

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
            const name = data.display_name;
            await AsyncStorage.setItem(`last_geocoded_name_${circleId}`, name);
            await AsyncStorage.setItem(`last_geocoded_lat_${circleId}`, latitude.toString());
            await AsyncStorage.setItem(`last_geocoded_lng_${circleId}`, longitude.toString());
            return name;
        }
        return "Background Update";
    } catch (error) {
        return "Background Update";
    }
};

// --- Type Definitions ---
interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: number;
    speed: number | null;
}

// --- Queue Management ---

const getQueue = async (): Promise<LocationData[]> => {
    try {
        const raw = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Error reading location queue:', error);
        return [];
    }
};

const saveQueue = async (queue: LocationData[]) => {
    try {
        await AsyncStorage.setItem(LOCATION_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
        console.error('Error saving location queue:', error);
    }
};

const queueLocation = async (location: LocationData) => {
    const queue = await getQueue();
    
    // 1. Prevent duplicate timestamps
    if (queue.length > 0) {
        const last = queue[queue.length - 1];
        if (last.timestamp === location.timestamp) {
            return;
        }
        
        // 2. Strict 10s throttle for background collection
        // This prevents bursts if the OS sends multiple locations at once
        // if (location.timestamp - last.timestamp < 10000) {
        //     return;
        // }
    }

    queue.push(location);
    await saveQueue(queue);
};

/**
 * Robust check to see if the app is currently open and active.
 * We use a heartbeat from MapScreen.tsx because AppState is often
 * unreliable when checked from within a background task.
 */
const isAppInForeground = async (): Promise<boolean> => {
    try {
        const lastHeartbeat = await AsyncStorage.getItem(LAST_FOREGROUND_HEARTBEAT);
        if (!lastHeartbeat) return false;
        
        const diff = Date.now() - parseInt(lastHeartbeat, 10);
        // If the app sent a heartbeat in the last 6 seconds, consider it active
        // Reduced from 12s to 6s for faster background hand-off
        return diff < 6000;
    } catch (e) {
        return false;
    }
};

/**
 * Gets the configured time interval for location updates.
 * Returns value in milliseconds. Default is 10000 (10s).
 */
export const getTimeInterval = async (): Promise<number> => {
    try {
        const val = await AsyncStorage.getItem(LOCATION_TIME_INTERVAL_KEY);
        if (val) {
            const seconds = parseInt(val, 10);
            if (!isNaN(seconds) && seconds > 0) {
                return seconds * 1000;
            }
        }
    } catch (e) {
        console.warn('Failed to read time interval from storage:', e);
    }
    return 10000; // Default 10s
};

// --- Sync Logic ---

export const syncLocationQueue = async () => {
    // 1. Prevent overlapping syncs
    if (isSyncInProgress) return;
    
    // 2. Only run background sync if app is NOT active
    // Foreground updates are handled by MapScreen.tsx
    if (await isAppInForeground()) {
        return;
    }

    // 3. Throttle background syncs to 10 seconds
    const lastSyncStr = await AsyncStorage.getItem(LAST_BACKGROUND_SYNC_TIME);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
    // if (Date.now() - lastSync < 8000) {
    //     return;
    // }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
        return;
    }

    isSyncInProgress = true;
    try {
        const queue = await getQueue();
        if (queue.length === 0) return;

        // Clear queue immediately to prevent other triggers from seeing these items
        await saveQueue([]);

        const circleId = await AsyncStorage.getItem("mapScreen:lastSelectedCircleId");
        if (!circleId) {
            // Put items back if we can't sync
            await saveQueue(queue);
            return;
        }

        const remainingQueue: LocationData[] = [];
        await AsyncStorage.setItem(LAST_BACKGROUND_SYNC_TIME, Date.now().toString());


        const userStr = await AsyncStorage.getItem("user");
        let userId = null;
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                userId = user.id || user.userId || user.UserId;
            } catch (e) {}
        }

        const batteryLevel = await readBatteryLevel();
        const batteryStr = batteryLevel !== null ? `${batteryLevel}%` : null;

        for (const loc of queue) {
            try {
                // Fetch location name (with small cache logic or just OSM)
                const locationName = await getLocationNameFromOSM(loc.latitude, loc.longitude);

                // Use new Connection Socket
                await SocketService.emitLocationUpdate(circleId, {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    name: locationName,
                    speed: loc.speed !== null && loc.speed !== undefined ? String(loc.speed) : "0",
                    userId: userId,
                    battery: batteryStr,
                    run: 'background',
                    time: formatToSLTime(loc.timestamp),
                });

            } catch (error) {
                remainingQueue.push(loc);
            }
        }

        // Put failed items back in the queue
        if (remainingQueue.length > 0) {
            const currentQueue = await getQueue();
            await saveQueue([...remainingQueue, ...currentQueue]);
        }
    } finally {
        isSyncInProgress = false;
    }
};

// --- Background Task (Android) ---

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

const backgroundTask = async (taskDataArguments?: { timeInterval: number }) => {
    const delay = taskDataArguments?.timeInterval || 10000;

    await new Promise<void>(async (resolve) => {
        let subscription: Location.LocationSubscription | null = null;

        try {
            // Start watching position
            const interval = await getTimeInterval();
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: interval,
                    // distanceInterval: 50,
                },
                async (location) => {
                    // Inhibition: Do not collect background points if app is open
                    if (await isAppInForeground()) {
                        return;
                    }

                    const locData: LocationData = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy,
                        speed: location.coords.speed !== null ? location.coords.speed : null, //test case 1
                        timestamp: location.timestamp,
                    };

                    console.log('[Android Service] Location received:', locData);

                    // Sync with centralized location cache so foreground can see it
                    await storeLastKnownLocation({
                        latitude: locData.latitude,
                        longitude: locData.longitude,
                        speed: locData.speed
                    });

                    const state = await NetInfo.fetch();
                    if (state.isConnected) {
                        await queueLocation(locData);
                        await syncLocationQueue();
                    } else {
                        await queueLocation(locData);
                    }
                }
            );

            // Unified periodic loop: handles location sync and heartbeats
            let lastHeartbeatTime = 0;
            while (BackgroundService?.isRunning()) {
                await sleep(10000); // 10s interval
                const now = Date.now();

                if (!(await isAppInForeground())) {
                    // Sync location
                    const lastLoc = await readLastKnownLocation();
                    if (lastLoc) {
                        await queueLocation({
                            latitude: lastLoc.latitude,
                            longitude: lastLoc.longitude,
                            speed: lastLoc.speed ?? 0,
                            accuracy: 10,
                            timestamp: now
                        });
                    }
                    void syncLocationQueue();

                    // Send heartbeat every minute
                    if (now - lastHeartbeatTime >= 60000) {
                        lastHeartbeatTime = now;
                        try {
                            const circleId = await AsyncStorage.getItem("mapScreen:lastSelectedCircleId");
                            if (circleId) {
                                const userStr = await AsyncStorage.getItem("user");
                                let userId = null;
                                if (userStr) {
                                    try {
                                        const user = JSON.parse(userStr);
                                        userId = user.id || user.userId || user.UserId;
                                    } catch (e) {}
                                }
                                await SocketService.heartbeat(circleId, userId);
                            }
                        } catch (err) {
                            console.warn('[Background Service] Heartbeat error:', err);
                        }
                    }
                }
            }

        } catch (e) {
            console.error(e);
        } finally {
            if (subscription) {
                subscription.remove();
            }
        }
    });
};

const options = {
    taskName: 'Nearu Location Service',
    taskTitle: 'Nearu Running',
    taskDesc: 'Your location is being tracked in the background.',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#ff00ff',
    linkingURI: 'nearu://chat/jane',
    stopOnTerminate: false,
    parameters: {
        timeInterval: 10000,
    },
};

// --- Expo Task (iOS) ---

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
        console.error('Background location task error:', error);
        return;
    }
    if (data) {
        // Inhibition: Do not collect background points if app is open
        if (await isAppInForeground()) {
            return;
        }

        const { locations } = data as { locations: Location.LocationObject[] };
        const location = locations[0];
        if (!location) return;

        const locData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed !== null ? location.coords.speed : null,   //Test case 2
            timestamp: location.timestamp,
        };

        const state = await NetInfo.fetch();
        
        // Sync with centralized location cache
        await storeLastKnownLocation({
            latitude: locData.latitude,
            longitude: locData.longitude,
            speed: locData.speed
        });

        if (state.isConnected) {
            await queueLocation(locData);
            await syncLocationQueue();
        } else {
            await queueLocation(locData);
        }
    }
});

// --- Public API ---

export const startBackgroundLocation = async () => {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
        console.warn('Foreground location permission denied');
        return;
    }

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') {
        console.warn('Background location permission denied');
    }

    if (Platform.OS === 'android') {
        if (!BackgroundService) {
            console.warn('BackgroundService native module unavailable — skipping Android background service start');
            return;
        }
        const interval = await getTimeInterval();
        if (!BackgroundService.isRunning()) {
            try {
                await BackgroundService.start(backgroundTask, {
                    ...options,
                    parameters: { timeInterval: interval }
                });
                console.log(`Android Background Service Started with interval: ${interval}ms`);
            } catch (e) {
                console.error('Error starting background service', e);
            }
        }
    } else {
        // iOS or others
        const interval = await getTimeInterval();
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.High,
            // distanceInterval: 50,
            timeInterval: interval,
            showsBackgroundLocationIndicator: true,
            pausesUpdatesAutomatically: false,
            foregroundService: {
                notificationTitle: 'Location Tracking Active',
                notificationBody: 'Your location is being tracked in the background.',
                notificationColor: '#113C9C',
            },
        });
        console.log(`iOS Background location tracking started with interval: ${interval}ms`);
    }
};

export const stopBackgroundLocation = async () => {
    if (Platform.OS === 'android') {
        if (BackgroundService) {
            try {
                await BackgroundService.stop();
            } catch (e) {
                console.error('Error stopping background service', e);
            }
        }
    } else {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
        if (isRegistered) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        }
    }
    console.log('Background location tracking stopped.');
};

export const isBackgroundLocationRunning = async () => {
    if (Platform.OS === 'android') {
        return BackgroundService ? BackgroundService.isRunning() : false;
    }
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
};





// import AsyncStorage from '@react-native-async-storage/async-storage';
// import NetInfo from '@react-native-community/netinfo';
// import * as Location from 'expo-location';
// import * as TaskManager from 'expo-task-manager';
// import { AppState, Platform } from 'react-native';
// import BackgroundService from 'react-native-background-actions';
// import { API_BASE_URL, authenticatedFetch } from '../utils/auth';

// const BACKGROUND_LOCATION_TASK = 'background-location-task';
// const LOCATION_QUEUE_KEY = 'location-sync-queue';
// const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

// // --- Type Definitions ---
// interface LocationData {
//     latitude: number;
//     longitude: number;
//     accuracy: number | null;
//     timestamp: number;
//     speed: number | null;
// }

// // --- Queue Management ---

// const getQueue = async (): Promise<LocationData[]> => {
//     try {
//         const raw = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
//         return raw ? JSON.parse(raw) : [];
//     } catch (error) {
//         console.error('Error reading location queue:', error);
//         return [];
//     }
// };

// const saveQueue = async (queue: LocationData[]) => {
//     try {
//         await AsyncStorage.setItem(LOCATION_QUEUE_KEY, JSON.stringify(queue));
//     } catch (error) {
//         console.error('Error saving location queue:', error);
//     }
// };

// const queueLocation = async (location: LocationData) => {
//     const queue = await getQueue();
//     queue.push(location);
//     await saveQueue(queue);
// };

// // --- Sync Logic ---

// const getLocationNameFromOSM = async (latitude: number, longitude: number): Promise<string> => {
//     try {
//         const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}`;
//         const response = await fetch(url, {
//             headers: {
//                 'Accept': 'application/json',
//                 'User-Agent': 'NearuApp/1.0'
//             }
//         });
//         const data = await response.json();

//         if (data && data.display_name) {
//             return data.display_name;
//         } else {
//             console.warn("Nominatim reverse geocoding returned no display_name");
//             return "Backgroud Update by Front  End";
//         }
//     } catch (error) {
//         console.warn("Error fetching location name from OSM:", error);
//         return "Backgroud Update by Front  End";
//     }
// };

// export const syncLocationQueue = async () => {
//     const state = await NetInfo.fetch();
//     if (!state.isConnected) {
//         console.log('Offline: Skipping sync.');
//         return;
//     }

//     const queue = await getQueue();
//     if (queue.length === 0) return;

//     console.log(`Syncing ${queue.length} locations...`);

//     const remainingQueue: LocationData[] = [];

//     const circleId = await AsyncStorage.getItem("mapScreen:lastSelectedCircleId");
//     const isDriveDetectionEnabled = (await AsyncStorage.getItem("user_drive_detection_enabled")) === "true";

//     if (!circleId) {
//         console.warn("No circle ID found for background update. Aborting sync.");
//         return;
//     }

//     for (const loc of queue) {
//         try {
//             const realLocationName = await getLocationNameFromOSM(loc.latitude, loc.longitude);
            
//             const response = await authenticatedFetch(`${API_BASE_URL}/profile/circles/${circleId}/location`, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     accept: "application/json",
//                 },
//                 body: JSON.stringify({
//                     latitude: loc.latitude,
//                     longitude: loc.longitude,
//                     name: realLocationName,
//                     metadata:JSON.stringify({
//                         accuracy: loc.accuracy,
//                         speed: loc.speed,
//                         timestamp: loc.timestamp,
//                         is_offline_sync: true
//                     })
//                 })
//             });

//             if (!response.ok) {
//                 console.warn("Failed to sync location:", await response.text());
//                 remainingQueue.push(loc);
//             }
//         } catch (error) {
//             console.error("Sync error:", error);
//             remainingQueue.push(loc);
//         }
//     }

//     await saveQueue(remainingQueue);
// };

// // --- Dynamic Config ---

// const getFrequencyConfig = (_isDriveEnabled: boolean) => {
//     return {
//         timeInterval: 5000, // 5s
//     };
// };

// // --- Background Task (Android) ---

// const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

// const backgroundTask = async (taskDataArguments?: { timeInterval: number }) => {
//     const timeInterval = taskDataArguments?.timeInterval || 5000;

//     await new Promise<void>(async (resolve) => {
//         let subscription: Location.LocationSubscription | null = null;

//         try {
//             // Start watching position
//             subscription = await Location.watchPositionAsync(
//                 {
//                     accuracy: Location.Accuracy.High,
//                     timeInterval,
//                 },
//                 async (location) => {
//                     const locData: LocationData = {
//                         latitude: location.coords.latitude,
//                         longitude: location.coords.longitude,
//                         accuracy: location.coords.accuracy,
//                         speed: location.coords.speed,
//                         timestamp: location.timestamp,
//                     };

//                     console.log('[Android Service] Location received:', locData);

//                     // Skip background update if app is in foreground
//                     if (AppState.currentState === 'active') {
//                         console.log('[Android Service] App is active, skipping background location queue');
//                         return;
//                     }

//                     const state = await NetInfo.fetch();
//                     if (state.isConnected) {
//                         await queueLocation(locData);
//                         await syncLocationQueue();
//                     } else {
//                         await queueLocation(locData);
//                     }
//                 }
//             );

//             // Loop to keep service alive and force sync every 5s
//             while (BackgroundService.isRunning()) {
//                 await sleep(5000); // 5s frequency
                
//                 try {
//                     const state = await NetInfo.fetch();
//                     if (state.isConnected) {
//                         try {
//                             const loc = await Location.getCurrentPositionAsync({
//                                 accuracy: Location.Accuracy.Balanced,
//                             });
//                             const locData: LocationData = {
//                                 latitude: loc.coords.latitude,
//                                 longitude: loc.coords.longitude,
//                                 accuracy: loc.coords.accuracy,
//                                 speed: loc.coords.speed,
//                                 timestamp: loc.timestamp,
//                             };
//                             await queueLocation(locData);
//                         } catch (locErr) {
//                             console.warn("Failed to get location in explicit bg loop:", locErr);
//                         }
//                         await syncLocationQueue();
//                     }
//                 } catch (syncErr) {
//                     console.error("Error during explicit background sync:", syncErr);
//                 }
//             }

//         } catch (e) {
//             console.error(e);
//         } finally {
//             if (subscription) {
//                 subscription.remove();
//             }
//         }
//     });
// };

// const options = {
//     taskName: 'Nearu Location Service',
//     taskTitle: 'Nearu Running',
//     taskDesc: 'Your location is being tracked in the background.',
//     taskIcon: {
//         name: 'ic_launcher',
//         type: 'mipmap',
//     },
//     color: '#ff00ff',
//     linkingURI: 'yourSchemeHere://chat/jane',
//     parameters: {
//         timeInterval: 5000,
//     },
// };

// // --- Expo Task (iOS) ---

// TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
//     if (error) {
//         console.error('Background location task error:', error);
//         return;
//     }
//     if (data) {
//         const { locations } = data as { locations: Location.LocationObject[] };
//         const location = locations[0];
//         if (!location) return;

//         const locData: LocationData = {
//             latitude: location.coords.latitude,
//             longitude: location.coords.longitude,
//             accuracy: location.coords.accuracy,
//             speed: location.coords.speed,
//             timestamp: location.timestamp,
//         };

//         // Skip background update if app is in foreground
//         if (AppState.currentState === 'active') {
//             console.log('[iOS Task] App is active, skipping background location queue');
//             return;
//         }

//         const state = await NetInfo.fetch();
//         if (state.isConnected) {
//             await queueLocation(locData);
//             await syncLocationQueue();
//         } else {
//             await queueLocation(locData);
//         }
//     }
// });

// // --- Public API ---

// export const startBackgroundLocation = async () => {
//     const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
//     if (fgStatus !== 'granted') {
//         console.warn('Foreground location permission denied');
//         return;
//     }

//     const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
//     if (bgStatus !== 'granted') {
//         console.warn('Background location permission denied');
//     }

//     const isDriveEnabled = (await AsyncStorage.getItem("user_drive_detection_enabled")) === "true";
//     const config = getFrequencyConfig(isDriveEnabled);

//     if (Platform.OS === 'android') {
//         if (!BackgroundService.isRunning()) {
//             try {
//                 await BackgroundService.start(backgroundTask, {
//                     ...options,
//                     parameters: config
//                 });
//                 console.log('Android Background Service Started with config:', config);
//             } catch (e) {
//                 console.error('Error starting background service', e);
//             }
//         }
//     } else {
//         // iOS or others
//         await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
//             accuracy: Location.Accuracy.High,
//             timeInterval: config.timeInterval,
//             showsBackgroundLocationIndicator: true,
//             pausesUpdatesAutomatically: false,
//             foregroundService: {
//                 notificationTitle: 'Location Tracking Active',
//                 notificationBody: 'Your location is being tracked in the background.',
//                 notificationColor: '#113C9C',
//             },
//         });
//         console.log('iOS Background location tracking started with config:', config);
//     }
// };
// export const stopBackgroundLocation = async () => {
//     if (Platform.OS === 'android') {
//         await BackgroundService.stop();
//     } else {
//         const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
//         if (isRegistered) {
//             await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
//         }
//     }
//     console.log('Background location tracking stopped.');
// };

// export const isBackgroundLocationRunning = async () => {
//     if (Platform.OS === 'android') {
//         return BackgroundService.isRunning();
//     }
//     return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
// };