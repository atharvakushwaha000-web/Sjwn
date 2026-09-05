# Episode Splitter — Android Native Application

Production-ready native Android application built with **Kotlin**, **Jetpack Compose (Material 3)**, **AndroidX Media3 Transformer & ExoPlayer**, and **FFmpeg-Kit**.

## Features

- **Automated Video Splitting**: Automatically splits any selected video into equal-duration clips (e.g. every 10 seconds) without manual timestamp entry.
- **Sequential Memory-Safe Processing**: Segments are sliced and written sequentially to disk, releasing memory after each clip to prevent OOM errors even on 4K or 1-hour videos.
- **Smart Stream-Copy & Fallback**: Slices using stream-copy whenever keyframes allow, falling back to precise re-encoding with full audio retention.
- **Simple Output Filenames**: Generates sequential `Episode 1.mp4`, `Episode 2.mp4`, etc., into `Episode Splitter/Episodes/Session XXX/`.
- **Automatic Streaming ZIP Generation**: Compresses all episodes into `Video Episodes.zip` without buffering in RAM.
- **In-App ExoPlayer Preview**: Play/Pause, Seek, Volume, and Fullscreen preview for every generated episode.
- **Background WorkManager & Foreground Service**: Keeps processing active even if the screen turns off or the user switches apps.
- **Scoped Storage & Modern Photo Picker**: No broad storage permission prompts on Android 13+.
- **Subtle Audio & Haptic Feedback**: ToneGenerator & Haptic feedback for tactile confirmations, with an in-app toggle.

---

## Project Structure

```
android/
├── build.gradle.kts                 # Root Gradle build script
├── settings.gradle.kts              # Gradle plugin & module setup
├── gradle.properties                # JVM & AndroidX memory options
└── app/
    ├── build.gradle.kts             # App Gradle config (Media3, FFmpeg, Compose)
    ├── proguard-rules.pro           # R8 / ProGuard rules for release build
    └── src/main/
        ├── AndroidManifest.xml      # Scoped storage, WorkManager service, FileProvider
        ├── java/com/episodesplitter/video/
        │   ├── MainActivity.kt
        │   ├── EpisodeSplitterApp.kt
        │   ├── model/VideoModels.kt
        │   ├── engine/
        │   │   ├── VideoSplitterEngine.kt
        │   │   ├── MetadataRetrieverHelper.kt
        │   │   └── ZipManager.kt
        │   ├── worker/SplitWorker.kt
        │   ├── repository/SessionRepository.kt
        │   ├── utils/SoundHapticManager.kt
        │   └── ui/
        │       ├── theme/Theme.kt, Color.kt, Type.kt
        │       ├── viewmodel/EpisodeSplitterViewModel.kt
        │       └── screens/MainScreen.kt
        └── res/
            ├── values/strings.xml, colors.xml, themes.xml
            ├── xml/file_paths.xml, data_extraction_rules.xml, backup_rules.xml
            └── drawable/ic_split_logo.xml, ic_launcher_foreground.xml
```

---

## Building in Android Studio

1. Open **Android Studio** (Koala, Ladybug, or newer recommended).
2. Choose **Open Project** and select the `android/` directory.
3. Ensure JDK is set to **Java 17 or Java 21** (`Settings -> Build, Execution, Deployment -> Build Tools -> Gradle -> Gradle JDK`).
4. Wait for Gradle Sync to complete.
5. Click **Run 'app'** or connect an Android device running Android 7.0+ (API 24 to 35).

---

## Generating Signed AAB for Google Play Store

Google Play requires the **Android App Bundle (.aab)** format for publishing.

1. In Android Studio, select **Build -> Generate Signed Bundle / APK...**
2. Choose **Android App Bundle** and click **Next**.
3. Select your release keystore (or create a new one with 2048-bit RSA key).
4. Select destination folder and choose the **release** build variant.
5. Check **V1 and V2 (Full APK Signature)** and click **Finish**.
6. The resulting `.aab` file will be located at `app/release/app-release.aab`.

---

## Google Play Publication Checklist

- [x] **Target SDK 35**: Targets the latest Google Play requirement.
- [x] **Scoped Storage**: Uses system Photo Picker (`PickVisualMedia`) and scoped app directories (`getExternalFilesDir`).
- [x] **No Unnecessary Permissions**: No camera, microphone, contacts, location, or broad SMS permissions.
- [x] **Foreground Service Type**: Declared `mediaProcessing` and `dataSync` foreground service types for Android 14+.
- [x] **64-bit Architecture**: FFmpeg and native libs support `arm64-v8a` and `x86_64`.
- [x] **ProGuard / R8**: Full shrinking, obfuscation, and optimization enabled with explicit keep rules.
- [x] **Play Integrity / Security**: Zero piracy bypasses; compliant with all Google Play developer policies.
- [x] **Data Safety**: Offline-first media processing. No personal videos uploaded to any external server.
