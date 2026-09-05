# ProGuard & R8 Configuration for Episode Splitter
# Target Android 15 (API 35) & Google Play Store release

# AndroidX Media3 / ExoPlayer
-keep class androidx.media3.** { *; }
-keep interface androidx.media3.** { *; }
-dontwarn androidx.media3.**

# FFmpeg Kit
-keep class com.arthenica.ffmpegkit.** { *; }
-keep interface com.arthenica.ffmpegkit.** { *; }
-dontwarn com.arthenica.ffmpegkit.**

# AndroidX WorkManager
-keep class * extends androidx.work.Worker { *; }
-keep class * extends androidx.work.CoroutineWorker { *; }
-keep class * extends androidx.work.ListenableWorker { *; }
-keep class androidx.work.** { *; }

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}

# Coil
-keep class coil.** { *; }
-dontwarn coil.**

# Application Models
-keep class com.episodesplitter.video.model.** { *; }
-keepclassmembers class com.episodesplitter.video.model.** { *; }
