package com.surerideautoservices.sureride

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    createDefaultNotificationChannel()
  }

  // Android 8+ refuses to display notifications without an explicit channel.
  // FCM's manifest-declared default_notification_channel_id only works if a
  // channel with that ID actually exists, so we create it here with HIGH
  // importance so banners + sound show on the lock screen.
  private fun createDefaultNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java) ?: return
    val channelId = "sureride_default"
    if (manager.getNotificationChannel(channelId) != null) return
    val channel = NotificationChannel(
      channelId,
      "General",
      NotificationManager.IMPORTANCE_HIGH,
    ).apply {
      description = "Booking updates, KYC alerts, and SureRide announcements"
      enableLights(true)
      enableVibration(true)
    }
    manager.createNotificationChannel(channel)
  }
}
