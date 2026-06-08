const fs = require('fs');
const path = require('path');

const targetFile = path.join(
    __dirname,
    '../node_modules/react-native-background-actions/android/src/main/java/com/asterinet/react/bgactions/RNBackgroundActionsTask.java'
);

if (fs.existsSync(targetFile)) {
    try {
        let content = fs.readFileSync(targetFile, 'utf8');

        // Look for the startForeground call and replace it with type-specific call on API 29+
        const oldCall = 'startForeground(SERVICE_NOTIFICATION_ID, notification);';
        const newCall = `if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(SERVICE_NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(SERVICE_NOTIFICATION_ID, notification);
        }`;

        if (content.includes(oldCall)) {
            content = content.replace(oldCall, newCall);
            fs.writeFileSync(targetFile, content, 'utf8');
            console.log('[Success] React Native Background Actions service patched successfully.');
        } else if (content.includes('FOREGROUND_SERVICE_TYPE_LOCATION')) {
            console.log('[Info] React Native Background Actions service is already patched.');
        } else {
            console.warn('[Warning] Could not find the startForeground call in RNBackgroundActionsTask.java. It might have been modified.');
        }
    } catch (error) {
        console.error('[Error] Failed to patch react-native-background-actions:', error);
    }
} else {
    console.error(`[Error] Target file not found at: ${targetFile}`);
}
