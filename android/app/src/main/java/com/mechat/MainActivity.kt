package com.mechat

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
// Add this import
import com.twiliovoicereactnative.VoiceActivityProxy

class MainActivity : ReactActivity() {

  // Instantiate VoiceActivityProxy and handle permission rationally
  private val voiceActivityProxy: VoiceActivityProxy = VoiceActivityProxy(
    this
  ) { permission ->
    if (Manifest.permission.RECORD_AUDIO.equals(permission)) {
      Toast.makeText(
        this@MainActivity,
        "Microphone permissions needed. Please allow in your application settings.",
        Toast.LENGTH_LONG
      ).show()
    } else if ((Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) &&
      Manifest.permission.BLUETOOTH_CONNECT.equals(permission)
    ) {
      Toast.makeText(
        this@MainActivity,
        "Bluetooth permissions needed. Please allow in your application settings.",
        Toast.LENGTH_LONG
      ).show()
    } else if ((Build.VERSION.SDK_INT > Build.VERSION_CODES.S_V2) &&
      Manifest.permission.POST_NOTIFICATIONS.equals(permission)
    ) {
      Toast.makeText(
        this@MainActivity,
        "Notification permissions needed. Please allow in your application settings.",
        Toast.LENGTH_LONG
      ).show()
    }
  }

  override fun getMainComponentName(): String = "MeChat"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // Hook into the onCreate lifecycle
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    voiceActivityProxy.onCreate(savedInstanceState)
  }

  // Hook into the onDestroy lifecycle
  override fun onDestroy() {
    super.onDestroy()
    voiceActivityProxy.onDestroy()
  }

  // Hook into the onNewIntent lifecycle
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    voiceActivityProxy.onNewIntent(intent)
  }
}