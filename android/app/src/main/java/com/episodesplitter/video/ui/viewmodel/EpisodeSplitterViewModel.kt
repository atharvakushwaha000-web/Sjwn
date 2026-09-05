package com.episodesplitter.video.ui.viewmodel

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.episodesplitter.video.engine.MetadataRetrieverHelper
import com.episodesplitter.video.engine.VideoSplitterEngine
import com.episodesplitter.video.engine.ZipManager
import com.episodesplitter.video.model.EpisodeClip
import com.episodesplitter.video.model.ProcessingProgress
import com.episodesplitter.video.model.SplitConfig
import com.episodesplitter.video.model.SplitUiState
import com.episodesplitter.video.model.VideoInfo
import com.episodesplitter.video.repository.SessionRepository
import com.episodesplitter.video.utils.SoundHapticManager
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

class EpisodeSplitterViewModel(application: Application) : AndroidViewModel(application) {

    private val context = application.applicationContext
    private val sessionRepo = SessionRepository(context)
    private val soundHaptic = SoundHapticManager(context)
    private val splitterEngine = VideoSplitterEngine(context)

    private val _uiState = MutableStateFlow<SplitUiState>(SplitUiState.Idle)
    val uiState: StateFlow<SplitUiState> = _uiState.asStateFlow()

    private val _intervalInput = MutableStateFlow("10")
    val intervalInput: StateFlow<String> = _intervalInput.asStateFlow()

    // Config options
    private val _videoQuality = MutableStateFlow("original") // "original", "high", "medium"
    val videoQuality: StateFlow<String> = _videoQuality.asStateFlow()

    private val _originalAudioVolume = MutableStateFlow(1.0f)
    val originalAudioVolume: StateFlow<Float> = _originalAudioVolume.asStateFlow()

    private val _autoVideoNoiseReduction = MutableStateFlow(false)
    val autoVideoNoiseReduction: StateFlow<Boolean> = _autoVideoNoiseReduction.asStateFlow()

    private val _autoAudioNoiseReduction = MutableStateFlow(false)
    val autoAudioNoiseReduction: StateFlow<Boolean> = _autoAudioNoiseReduction.asStateFlow()

    private val _autoEditSilenceCut = MutableStateFlow(false)
    val autoEditSilenceCut: StateFlow<Boolean> = _autoEditSilenceCut.asStateFlow()

    private val _silenceThresholdDb = MutableStateFlow(-35f)
    val silenceThresholdDb: StateFlow<Float> = _silenceThresholdDb.asStateFlow()

    private val _minSilenceDurationSec = MutableStateFlow(0.5f)
    val minSilenceDurationSec: StateFlow<Float> = _minSilenceDurationSec.asStateFlow()

    // Background Music
    private val _backgroundMusicEnabled = MutableStateFlow(false)
    val backgroundMusicEnabled: StateFlow<Boolean> = _backgroundMusicEnabled.asStateFlow()

    private val _backgroundMusicVolume = MutableStateFlow(0.2f)
    val backgroundMusicVolume: StateFlow<Float> = _backgroundMusicVolume.asStateFlow()

    private val _backgroundMusicPath = MutableStateFlow<String?>(null)
    val backgroundMusicPath: StateFlow<String?> = _backgroundMusicPath.asStateFlow()

    private val _soundEnabled = MutableStateFlow(sessionRepo.isSoundEnabled)
    val soundEnabled: StateFlow<Boolean> = _soundEnabled.asStateFlow()

    private val _showCancelDialog = MutableStateFlow(false)
    val showCancelDialog: StateFlow<Boolean> = _showCancelDialog.asStateFlow()

    private val _previewClip = MutableStateFlow<EpisodeClip?>(null)
    val previewClip: StateFlow<EpisodeClip?> = _previewClip.asStateFlow()

    private var activeSplitJob: Job? = null
    private var currentSessionDir: File? = null

    init {
        checkInterruptedSession()
    }

    private fun checkInterruptedSession() {
        val interrupted = sessionRepo.getInterruptedSession()
        if (interrupted != null && interrupted.completedEpisodes.isNotEmpty()) {
            // Restore session if available
        }
    }

    fun onVideoSelected(uri: Uri) {
        viewModelScope.launch {
            soundHaptic.playVideoSelected(_soundEnabled.value)
            val result = MetadataRetrieverHelper.extractVideoInfo(context, uri)
            result.onSuccess { videoInfo ->
                val interval = _intervalInput.value.toIntOrNull() ?: 10
                _uiState.value = SplitUiState.Ready(
                    videoInfo = videoInfo,
                    config = currentConfig(videoInfo.durationSeconds, interval)
                )
            }.onFailure { error ->
                soundHaptic.playError(_soundEnabled.value)
                _uiState.value = SplitUiState.Error(
                    error.localizedMessage ?: "Failed to read selected video file."
                )
            }
        }
    }

    fun onIntervalChanged(newValue: String) {
        val cleaned = newValue.filter { it.isDigit() }
        _intervalInput.value = cleaned

        val currentState = _uiState.value
        if (currentState is SplitUiState.Ready) {
            val interval = cleaned.toIntOrNull() ?: 0
            _uiState.value = currentState.copy(
                config = currentConfig(currentState.videoInfo.durationSeconds, interval)
            )
        }
    }

    fun selectPreset(seconds: Int) {
        soundHaptic.playButtonFeedback()
        _intervalInput.value = seconds.toString()
        val currentState = _uiState.value
        if (currentState is SplitUiState.Ready) {
            _uiState.value = currentState.copy(
                config = currentConfig(currentState.videoInfo.durationSeconds, seconds)
            )
        }
    }

    fun setVideoQuality(quality: String) {
        soundHaptic.playButtonFeedback()
        _videoQuality.value = quality
        updateReadyConfig()
    }

    fun setOriginalAudioVolume(volume: Float) {
        _originalAudioVolume.value = volume.coerceIn(0f, 2f)
        updateReadyConfig()
    }

    fun toggleVideoNoiseReduction() {
        soundHaptic.playButtonFeedback()
        _autoVideoNoiseReduction.value = !_autoVideoNoiseReduction.value
        updateReadyConfig()
    }

    fun toggleAudioNoiseReduction() {
        soundHaptic.playButtonFeedback()
        _autoAudioNoiseReduction.value = !_autoAudioNoiseReduction.value
        updateReadyConfig()
    }

    fun toggleSilenceCut() {
        soundHaptic.playButtonFeedback()
        _autoEditSilenceCut.value = !_autoEditSilenceCut.value
        updateReadyConfig()
    }

    fun setBackgroundMusic(enabled: Boolean, path: String? = null, volume: Float = 0.2f) {
        soundHaptic.playButtonFeedback()
        _backgroundMusicEnabled.value = enabled
        if (path != null) _backgroundMusicPath.value = path
        _backgroundMusicVolume.value = volume.coerceIn(0f, 1f)
        updateReadyConfig()
    }

    private fun updateReadyConfig() {
        val currentState = _uiState.value
        if (currentState is SplitUiState.Ready) {
            val interval = _intervalInput.value.toIntOrNull() ?: 10
            _uiState.value = currentState.copy(
                config = currentConfig(currentState.videoInfo.durationSeconds, interval)
            )
        }
    }

    private fun currentConfig(duration: Double, interval: Int): SplitConfig {
        return SplitConfig(
            intervalSeconds = interval,
            videoDurationSeconds = duration,
            videoQuality = _videoQuality.value,
            originalAudioVolume = _originalAudioVolume.value,
            autoVideoNoiseReduction = _autoVideoNoiseReduction.value,
            autoAudioNoiseReduction = _autoAudioNoiseReduction.value,
            autoEditSilenceCut = _autoEditSilenceCut.value,
            silenceThresholdDb = _silenceThresholdDb.value,
            minSilenceDurationSec = _minSilenceDurationSec.value,
            backgroundMusicEnabled = _backgroundMusicEnabled.value,
            backgroundMusicPath = _backgroundMusicPath.value,
            backgroundMusicVolume = _backgroundMusicVolume.value
        )
    }

    fun startSplitting() {
        val currentState = _uiState.value as? SplitUiState.Ready ?: return
        val interval = _intervalInput.value.toIntOrNull() ?: 0

        if (interval <= 0) {
            soundHaptic.playError(_soundEnabled.value)
            _uiState.value = SplitUiState.Error("Interval must be greater than 0 seconds.")
            return
        }
        if (interval > currentState.videoInfo.durationSeconds) {
            soundHaptic.playError(_soundEnabled.value)
            _uiState.value = SplitUiState.Error(
                "Split interval (${interval}s) cannot exceed video duration (${currentState.videoInfo.durationSeconds.toInt()}s)."
            )
            return
        }

        soundHaptic.playProcessingStarted(_soundEnabled.value)

        val sessionDir = splitterEngine.createSessionDirectory()
        currentSessionDir = sessionDir

        val initialProgress = ProcessingProgress(
            currentEpisode = 1,
            totalEpisodes = currentState.config.totalEpisodes,
            percentage = 0,
            currentSegmentStartSec = 0.0,
            currentSegmentEndSec = minOf(interval.toDouble(), currentState.videoInfo.durationSeconds),
            currentEpisodeElapsedSec = 0.0,
            currentEpisodeTotalSec = minOf(interval.toDouble(), currentState.videoInfo.durationSeconds),
            overallCurrentSeconds = 0.0,
            overallTotalSeconds = currentState.videoInfo.durationSeconds,
            currentTask = "Creating Episode 1"
        )

        _uiState.value = SplitUiState.Processing(
            videoInfo = currentState.videoInfo,
            config = currentState.config,
            progress = initialProgress
        )

        activeSplitJob = viewModelScope.launch {
            try {
                val completedClips = splitterEngine.splitVideo(
                    videoInfo = currentState.videoInfo,
                    config = currentState.config,
                    sessionDir = sessionDir,
                    onProgress = { progress ->
                        _uiState.value = SplitUiState.Processing(
                            videoInfo = currentState.videoInfo,
                            config = currentState.config,
                            progress = progress
                        )
                        soundHaptic.playEpisodeCompleted(_soundEnabled.value)
                    },
                    onEpisodeReady = { clip ->
                        sessionRepo.saveActiveSession(
                            uri = currentState.videoInfo.uri,
                            intervalSec = interval,
                            sessionDir = sessionDir,
                            completedEpisodes = listOf(clip)
                        )
                    }
                )

                // Package ZIP
                val zipResult = ZipManager.createZipArchive(sessionDir, completedClips)
                if (zipResult.isSuccess) {
                    val zipFile = zipResult.getOrThrow()
                    soundHaptic.playAllProcessingCompleted(_soundEnabled.value)
                    sessionRepo.clearSession()
                    _uiState.value = SplitUiState.Completed(
                        videoInfo = currentState.videoInfo,
                        config = currentState.config,
                        episodes = completedClips,
                        zipFile = zipFile
                    )
                } else {
                    throw zipResult.exceptionOrNull() ?: Exception("Failed to package ZIP")
                }
            } catch (e: Exception) {
                if (e.message?.contains("cancelled", ignoreCase = true) == true) {
                    _uiState.value = SplitUiState.Ready(
                        videoInfo = currentState.videoInfo,
                        config = currentState.config
                    )
                } else {
                    soundHaptic.playError(_soundEnabled.value)
                    _uiState.value = SplitUiState.Error(
                        e.localizedMessage ?: "An error occurred during video processing."
                    )
                }
            }
        }
    }

    fun requestCancel() {
        soundHaptic.playButtonFeedback()
        _showCancelDialog.value = true
    }

    fun dismissCancel() {
        soundHaptic.playButtonFeedback()
        _showCancelDialog.value = false
    }

    fun confirmCancel() {
        soundHaptic.playButtonFeedback()
        _showCancelDialog.value = false
        splitterEngine.cancel()
        activeSplitJob?.cancel()
    }

    fun openPreview(clip: EpisodeClip) {
        soundHaptic.playButtonFeedback()
        _previewClip.value = clip
    }

    fun closePreview() {
        _previewClip.value = null
    }

    fun shareZip() {
        val currentState = _uiState.value as? SplitUiState.Completed ?: return
        soundHaptic.playButtonFeedback()
        ZipManager.shareZipFile(context, currentState.zipFile)
    }

    fun shareEpisode(clip: EpisodeClip) {
        soundHaptic.playButtonFeedback()
        ZipManager.shareSingleEpisode(context, clip)
    }

    fun toggleSound() {
        val newSound = !_soundEnabled.value
        _soundEnabled.value = newSound
        sessionRepo.isSoundEnabled = newSound
    }
}
