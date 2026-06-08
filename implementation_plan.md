# Fix Android Background Run Under Screen Off and Power Saver Mode

This plan outlines the changes required to fix the background location tracking when the screen is off and under power saver mode on Android devices.

## Background & Root Causes

1. **Missing Foreground Service Types (Android 14+ / SDK 34-35 requirement):**
   Modern Android versions require all foreground services to declare their type (e.g., `location`) in the `AndroidManifest.xml` AND specify it in the `startForeground()` call. Currently, the `RNBackgroundActionsTask` (from `react-native-background-actions`) and the boot bootstrapping `BootUpService` do not declare/pass this type, which causes crashes or restrictions.

2. **Power Saver Mode and Doze Mode Restricting Background Network/Location:**
   Under Power Saver mode, Android disables network access and restricts location updates for background services unless the app is explicitly whitelisted from battery optimizations (set to **Unrestricted** under Battery Usage settings). We need a Native Module to check this state and prompt the user to whitelist the app.

---

## Proposed Changes

### 1. Native Service Declarations and Permissions

#### [MODIFY] [AndroidManifest.xml](file:///d:/360app/android/app/src/main/AndroidManifest.xml)
- Add the `android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` permission.
- Update `<service android:name="com.asterinet.react.bgactions.RNBackgroundActionsTask">` and `<service android:name=".BootUpService">` to include `android:foregroundServiceType="location"`.

#### [MODIFY] [withBootReceiver.js](file:///d:/360app/plugins/withBootReceiver.js)
- Update the Expo Config Plugin so that if a prebuild is run, it correctly inserts `android:foregroundServiceType="location"` for the services.
- Update the `BootUpService.java` template to call `startForeground` with the `location` service type on Android 10+ (API 29+).

#### [MODIFY] [BootUpService.java](file:///d:/360app/android/app/src/main/java/com/nearu/appt/BootUpService.java)
- Manually sync the changes to the existing `BootUpService.java` file by updating `startForeground` to include the foreground service type on Android 10+.

#### [NEW] [patch-background-actions.js](file:///d:/360app/scripts/patch-background-actions.js)
- Create a self-contained post-install JS script to patch `RNBackgroundActionsTask.java` inside `node_modules` so that `startForeground` is called with `FOREGROUND_SERVICE_TYPE_LOCATION` on API 29+.

#### [MODIFY] [package.json](file:///d:/360app/package.json)
- Add a `postinstall` script to execute `node ./scripts/patch-background-actions.js`.

---

### 2. Battery Optimization Native Module

#### [NEW] [BatteryOptimizationModule.kt](file:///d:/360app/android/app/src/main/java/com/nearu/appt/BatteryOptimizationModule.kt)
- Expose two methods to React Native:
  1. `isIgnoringBatteryOptimizations(promise)`: Returns a boolean indicating if the app is already whitelisted.
  2. `requestIgnoreBatteryOptimizations(promise)`: Launches the system intent/dialog to request battery optimization exemption.

#### [NEW] [BatteryOptimizationPackage.kt](file:///d:/360app/android/app/src/main/java/com/nearu/appt/BatteryOptimizationPackage.kt)
- Implement the standard React Native package wrapper to register `BatteryOptimizationModule`.

#### [MODIFY] [MainApplication.kt](file:///d:/360app/android/app/src/main/java/com/nearu/appt/MainApplication.kt)
- Register `BatteryOptimizationPackage()` inside the package list.

#### [MODIFY] [app.json](file:///d:/360app/app.json)
- Add `"REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"` to the `"android.permissions"` array.

---

### 3. Frontend UI Integration

#### [MODIFY] [LocationSharingModal.tsx](file:///d:/360app/app/components/modals/LocationSharingModal.tsx)
- Check the battery optimization status on Android when the modal is opened or when the app is focused/resumed.
- Implement a carousel (or togglable view) that lets users toggle between the "Location Permission" info card and a new "Battery & Background" info card.
- The new card will inform the user of the battery optimization status:
  - If whitelisted: Show a success checkmark and "Status: Unrestricted (Optimal)".
  - If optimized/restricted: Show a warning badge and a "Fix Background Tracking" button which calls the native module to open settings.

---

## Verification Plan

### Automated/Build Verification
- Run `node ./scripts/patch-background-actions.js` to ensure the patch executes successfully.
- Trigger `npx expo prebuild --platform android` to verify config plugin changes write correctly without errors.
- Run `npm run android` to verify the build compiles and launches successfully.

### Manual Verification
- Open the location sharing modal: verify the new "Battery & Background" card appears on Android.
- Tap "Fix Background Tracking": verify it prompts the user with the battery optimization exemption dialog.
- Verify status changes in the app after allowing/exempting battery optimization.
