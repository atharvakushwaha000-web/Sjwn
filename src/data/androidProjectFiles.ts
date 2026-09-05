import { AndroidProjectFile } from '../types';

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: 'build.gradle.kts',
    category: 'gradle',
    description: 'Root Gradle configuration defining plugins and repositories',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}`
  },
  {
    path: 'settings.gradle.kts',
    category: 'gradle',
    description: 'Gradle settings and dependency resolution management',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = java.net.URI("https://jitpack.io") }
    }
}
rootProject.name = "EpisodeSplitter"
include(":app")`
  },
  {
    path: 'app/build.gradle.kts',
    category: 'gradle',
    description: 'App module build script with Jetpack Compose, Media3 Transformer, and FFmpeg-Kit',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.episodesplitter.video"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.episodesplitter.video"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables.useSupportLibrary = true
        ndk.abiFilters.addAll(setOf("armeabi-v7a", "arm64-v8a", "x86", "x86_64"))
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.material:material-icons-extended")

    // AndroidX Media3 (ExoPlayer & Transformer)
    val media3Version = "1.5.1"
    implementation("androidx.media3:media3-exoplayer:$media3Version")
    implementation("androidx.media3:media3-ui:$media3Version")
    implementation("androidx.media3:media3-common:$media3Version")
    implementation("androidx.media3:media3-transformer:$media3Version")

    // FFmpeg Kit for frame-accurate stream-copy
    implementation("com.arthenica:ffmpeg-kit-full:6.0-2")

    // WorkManager for background splitting
    implementation("androidx.work:work-runtime-ktx:2.10.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("io.coil-kt:coil-compose:2.7.0")
}`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'manifest',
    description: 'Android Manifest with Scoped Storage, Foreground Service, and FileProvider',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROCESSING" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:name=".EpisodeSplitterApp"
        android:allowBackup="true"
        android:icon="@drawable/ic_split_logo"
        android:label="@string/app_name"
        android:roundIcon="@drawable/ic_split_logo"
        android:theme="@style/Theme.EpisodeSplitter"
        tools:targetApi="35">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="video/*" />
            </intent-filter>
        </activity>

        <service
            android:name="androidx.work.impl.foreground.SystemForegroundService"
            android:foregroundServiceType="mediaProcessing|dataSync"
            tools:node="merge" />

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>`
  },
  {
    path: 'app/src/main/java/com/episodesplitter/video/MainActivity.kt',
    category: 'kotlin',
    description: 'Main activity entry point with edge-to-edge Compose setup',
    content: `package com.episodesplitter.video

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import com.episodesplitter.video.ui.screens.MainScreen
import com.episodesplitter.video.ui.theme.BgPrimary
import com.episodesplitter.video.ui.theme.EpisodeSplitterTheme
import com.episodesplitter.video.ui.viewmodel.EpisodeSplitterViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: EpisodeSplitterViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContent {
            EpisodeSplitterTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = BgPrimary) {
                    MainScreen(viewModel = viewModel)
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/episodesplitter/video/engine/VideoSplitterEngine.kt',
    category: 'kotlin',
    description: 'Core native splitting engine using sequential memory-safe stream-copy and FFmpeg fallback',
    content: `package com.episodesplitter.video.engine

import android.content.Context
import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.ReturnCode
import com.episodesplitter.video.model.EpisodeClip
import com.episodesplitter.video.model.ProcessingProgress
import com.episodesplitter.video.model.VideoInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

class VideoSplitterEngine(private val context: Context) {
    private val isCancelled = AtomicBoolean(false)

    fun cancel() {
        isCancelled.set(true)
        FFmpegKit.cancel()
    }

    suspend fun splitVideo(
        videoInfo: VideoInfo,
        intervalSeconds: Int,
        sessionDir: File,
        onProgress: (ProcessingProgress) -> Unit,
        onEpisodeReady: (EpisodeClip) -> Unit
    ): List<EpisodeClip> = withContext(Dispatchers.IO) {
        val totalDuration = videoInfo.durationSeconds
        val totalEpisodes = Math.ceil(totalDuration / intervalSeconds).toInt()
        val completedClips = mutableListOf<EpisodeClip>()

        for (i in 0 until totalEpisodes) {
            if (isCancelled.get()) throw Exception("Splitting cancelled by user.")

            val episodeNum = i + 1
            val startSec = i * intervalSeconds.toDouble()
            val endSec = minOf((i + 1) * intervalSeconds.toDouble(), totalDuration)
            val durationSec = endSec - startSec

            val outputFileName = "Episode $episodeNum.mp4"
            val outputFile = File(sessionDir, outputFileName)

            // Step 1: Stream-copy splitting (instant, lossless, zero RAM)
            val startStr = String.format(Locale.US, "%.3f", startSec)
            val durStr = String.format(Locale.US, "%.3f", durationSec)
            val cmd = "-ss $startStr -i \\"\${videoInfo.uri.path}\\" -t $durStr -c copy -avoid_negative_ts make_zero \\"\${outputFile.absolutePath}\\""

            var session = FFmpegKit.execute(cmd)
            if (!ReturnCode.isSuccess(session.returnCode) || !outputFile.exists() || outputFile.length() == 0L) {
                // Fallback: frame-accurate transcode
                val fallbackCmd = "-ss $startStr -i \\"\${videoInfo.uri.path}\\" -t $durStr -c:v libx264 -preset ultrafast -crf 18 -c:a aac \\"\${outputFile.absolutePath}\\""
                session = FFmpegKit.execute(fallbackCmd)
            }

            val clip = EpisodeClip(episodeNum, outputFileName, startSec, endSec, outputFile, outputFile.length())
            completedClips.add(clip)
            onEpisodeReady(clip)
            System.gc() // Clean up segment buffers
        }
        completedClips
    }
}`
  },
  {
    path: 'app/src/main/java/com/episodesplitter/video/engine/ZipManager.kt',
    category: 'kotlin',
    description: 'Streaming ZipOutputStream creation for Video Episodes.zip',
    content: `package com.episodesplitter.video.engine

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.episodesplitter.video.model.EpisodeClip
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.*
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

object ZipManager {
    suspend fun createZipArchive(
        outputDirectory: File,
        episodes: List<EpisodeClip>,
        onProgress: (Int) -> Unit = {}
    ): Result<File> = withContext(Dispatchers.IO) {
        val zipFile = File(outputDirectory, "Video Episodes.zip")
        FileOutputStream(zipFile).use { fos ->
            BufferedOutputStream(fos, 64 * 1024).use { bos ->
                ZipOutputStream(bos).use { zos ->
                    val buffer = ByteArray(128 * 1024)
                    episodes.forEachIndexed { index, ep ->
                        val entry = ZipEntry(ep.fileName)
                        zos.putNextEntry(entry)
                        BufferedInputStream(FileInputStream(ep.outputFile)).use { bis ->
                            var bytesRead: Int
                            while (bis.read(buffer).also { bytesRead = it } != -1) {
                                zos.write(buffer, 0, bytesRead)
                            }
                        }
                        zos.closeEntry()
                        onProgress(((index + 1) * 100) / episodes.size)
                    }
                }
            }
        }
        Result.success(zipFile)
    }

    fun shareZipFile(context: Context, zipFile: File) {
        val uri = FileProvider.getUriForFile(context, "\${context.packageName}.fileprovider", zipFile)
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/zip"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Share Episodes ZIP"))
    }
}`
  },
  {
    path: 'app/proguard-rules.pro',
    category: 'proguard',
    description: 'ProGuard and R8 rules for Media3, FFmpeg-Kit, and WorkManager',
    content: `-keep class androidx.media3.** { *; }
-keep class com.arthenica.ffmpegkit.** { *; }
-keep class * extends androidx.work.Worker { *; }
-keep class * extends androidx.work.CoroutineWorker { *; }
-keep class com.episodesplitter.video.model.** { *; }`
  }
];
