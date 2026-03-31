package com.mechat

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
// Add this import
import com.twiliovoicereactnative.VoiceApplicationProxy

class MainApplication : Application(), ReactApplication {

  // Instantiate VoiceApplicationProxy here
  private val voiceApplicationProxy: VoiceApplicationProxy = VoiceApplicationProxy(this)

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
    // Hook the SDK to your Application onCreate
    voiceApplicationProxy.onCreate() 
    
    loadReactNative(this)
  }

  override fun onTerminate() {
    // Hook the SDK to your Application onTerminate
    voiceApplicationProxy.onTerminate()
    super.onTerminate()
  }
}