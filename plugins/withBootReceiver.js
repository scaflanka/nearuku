const { withAndroidManifest, withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withBootReceiverManifest = (config) => {
    return withAndroidManifest(config, (config) => {
        const androidManifest = config.modResults;
        const packageName = config.android?.package || "com.Nearu";

        // Ensure tools namespace is present for targetApi annotations
        if (!androidManifest.manifest.$['xmlns:tools']) {
            androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
        }

        // Add permissions
        if (!androidManifest.manifest.$['uses-permission']) {
            androidManifest.manifest.$['uses-permission'] = [];
        }
        const permissions = androidManifest.manifest['uses-permission'];
        const requiredPermissions = [
            'android.permission.RECEIVE_BOOT_COMPLETED',
            'android.permission.WAKE_LOCK',
            'android.permission.FOREGROUND_SERVICE',
            'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS'
            // FOREGROUND_SERVICE_LOCATION is API 34+ — declared in AndroidManifest.xml with tools:targetApi="34"
        ];

        requiredPermissions.forEach(p => {
            if (!permissions.find(perm => perm.$['android:name'] === p)) {
                permissions.push({ $: { 'android:name': p } });
            }
        });

        // Add Receiver and Service to application
        const application = androidManifest.manifest.application[0];
        if (!application.receiver) application.receiver = [];
        if (!application.service) application.service = [];

        // BootReceiver
        if (!application.receiver.find(r => r.$['android:name'] === '.BootReceiver')) {
            application.receiver.push({
                $: {
                    'android:name': '.BootReceiver',
                    'android:enabled': 'true',
                    'android:exported': 'true',
                    'android:permission': 'android.permission.RECEIVE_BOOT_COMPLETED'
                },
                'intent-filter': [{
                    action: [
                        { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
                        { $: { 'android:name': 'android.intent.action.QUICKBOOT_POWERON' } },
                        { $: { 'android:name': 'android.intent.action.MY_PACKAGE_REPLACED' } }
                    ]
                }]
            });
        }

        // BootUpService
        const bootUpService = application.service.find(s => s.$['android:name'] === '.BootUpService');
        if (!bootUpService) {
            application.service.push({
                $: {
                    'android:name': '.BootUpService',
                    'android:permission': 'android.permission.BIND_JOB_SERVICE',
                    'android:exported': 'false',
                    // foregroundServiceType is only enforced on API 29+ at runtime;
                    // tools:targetApi="29" suppresses lint warnings on older targets
                    'android:foregroundServiceType': 'location',
                    'tools:targetApi': '29'
                }
            });
        } else {
            bootUpService.$['android:foregroundServiceType'] = 'location';
            bootUpService.$['tools:targetApi'] = '29';
        }

        // RNBackgroundActionsTask Service
        const bgTaskService = application.service.find(s => s.$['android:name'] === 'com.asterinet.react.bgactions.RNBackgroundActionsTask');
        if (!bgTaskService) {
            application.service.push({
                $: {
                    'android:name': 'com.asterinet.react.bgactions.RNBackgroundActionsTask',
                    'android:foregroundServiceType': 'location',
                    'tools:targetApi': '29'
                }
            });
        } else {
            bgTaskService.$['android:foregroundServiceType'] = 'location';
            bgTaskService.$['tools:targetApi'] = '29';
        }

        return config;
    });
};

const withBootReceiverFiles = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const packageName = config.android?.package || "com.Nearu";
            const packagePath = packageName.replace(/\./g, '/');
            const mainPath = path.join(config.modRequest.platformProjectRoot, 'app/src/main/java', packagePath);

            // Create BootReceiver.java
            const bootReceiverContent = `
package ${packageName};

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        String action = intent.getAction();
        if (action.equals(Intent.ACTION_BOOT_COMPLETED) ||
            action.equals("android.intent.action.QUICKBOOT_POWERON") ||
            action.equals(Intent.ACTION_MY_PACKAGE_REPLACED)) {

            Intent serviceIntent = new Intent(context, BootUpService.class);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            } catch (Exception e) {
                android.util.Log.w("BootReceiver", "Failed to start BootUpService: " + e.getMessage());
            }
        }
    }
}
      `;

            // Create BootUpService.java
            const bootUpServiceContent = `
package ${packageName};

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import javax.annotation.Nullable;
import ${packageName}.R;

public class BootUpService extends HeadlessJsTaskService {

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                String CHANNEL_ID = "BootUpChannel";
                NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                if (nm != null) {
                    NotificationChannel channel = new NotificationChannel(
                            CHANNEL_ID,
                            "Boot Up Service",
                            NotificationManager.IMPORTANCE_LOW
                    );
                    nm.createNotificationChannel(channel);
                }

                Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setContentTitle("Nearu is starting")
                        .setContentText("Initializing background services...")
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setPriority(NotificationCompat.PRIORITY_LOW)
                        .build();

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(1001, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
                } else {
                    startForeground(1001, notification);
                }
            } catch (Exception e) {
                android.util.Log.e("BootUpService", "Failed to start foreground: " + e.getMessage());
                try {
                    Notification fallback = new NotificationCompat.Builder(this, "BootUpChannel")
                            .setContentTitle("Nearu")
                            .setSmallIcon(R.mipmap.ic_launcher)
                            .setPriority(NotificationCompat.PRIORITY_MIN)
                            .build();
                    startForeground(1001, fallback);
                } catch (Exception ignored) {}
            }
        }
    }

    @Override
    protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        return new HeadlessJsTaskConfig(
            "BootUpTask",
            Arguments.createMap(),
            10000,
            true
        );
    }
}
      `;

            fs.writeFileSync(path.join(mainPath, 'BootReceiver.java'), bootReceiverContent);
            fs.writeFileSync(path.join(mainPath, 'BootUpService.java'), bootUpServiceContent);

            return config;
        },
    ]);
};

module.exports = (config) => {
    return withPlugins(config, [
        withBootReceiverManifest,
        withBootReceiverFiles
    ]);
};
