package com.episodesplitter.video.model

import android.net.Uri
import java.io.File

data class VideoInfo(
    val uri: Uri,
    val fileName: String,
    val durationSeconds: Double,
    val width: Int,
    val height: Int,
    val frameRate: Float = 30f,
    val fileSizeBytes: Long = 0L,
    val rotation: Int = 0,
    val hasAudio: Boolean = true,
    val mimeType: String = "video/mp4"
) {
    val formattedDuration: String
        get() {
            val totalSec = durationSeconds.toInt()
            val hours = totalSec / 3600
            val minutes = (totalSec % 3600) / 60
            val seconds = totalSec % 60
            return if (hours > 0) {
                String.format("%02d:%02d:%02d", hours, minutes, seconds)
            } else {
                String.format("%02d:%02d", minutes, seconds)
            }
        }

    val resolutionLabel: String
        get() {
            val minDim = minOf(width, height)
            val maxDim = maxOf(width, height)
            return when {
                maxDim >= 3840 || minDim >= 2160 -> "4K"
                maxDim >= 2560 || minDim >= 1440 -> "1440p"
                maxDim >= 1920 || minDim >= 1080 -> "1080p"
                maxDim >= 1280 || minDim >= 720 -> "720p"
                maxDim >= 854 || minDim >= 480 -> "480p"
                else -> "${width}x${height}"
            }
        }

    val formattedSize: String
        get() {
            if (fileSizeBytes <= 0) return "0 B"
            val units = arrayOf("B", "KB", "MB", "GB")
            var size = fileSizeBytes.toDouble()
            var unitIndex = 0
            while (size >= 1024 && unitIndex < units.size - 1) {
                size /= 1024
                unitIndex++
            }
            return String.format("%.1f %s", size, units[unitIndex])
        }
}

data class SplitConfig(
    val intervalSeconds: Int = 10,
    val videoDurationSeconds: Double = 0.0,
    val videoQuality: String = "original", // "original", "high", "medium"
    val originalAudioVolume: Float = 1.0f,
    val autoVideoNoiseReduction: Boolean = false,
    val autoAudioNoiseReduction: Boolean = false,
    val autoEditSilenceCut: Boolean = false,
    val silenceThresholdDb: Float = -35f,
    val minSilenceDurationSec: Float = 0.5f,
    val backgroundMusicEnabled: Boolean = false,
    val backgroundMusicPath: String? = null,
    val backgroundMusicVolume: Float = 0.2f,
    val musicFadeIn: Boolean = true,
    val musicFadeOut: Boolean = true
) {
    val totalEpisodes: Int
        get() = if (intervalSeconds > 0 && videoDurationSeconds > 0) {
            Math.ceil(videoDurationSeconds / intervalSeconds).toInt()
        } else {
            0
        }
}

data class EpisodeClip(
    val episodeNumber: Int,
    val fileName: String, // e.g. "Episode 1.mp4"
    val startSeconds: Double,
    val endSeconds: Double,
    val outputFile: File,
    val fileSizeBytes: Long = 0L,
    val fileUri: Uri? = null,
    val hasAudio: Boolean = true
) {
    val formattedRange: String
        get() {
            val sMin = (startSeconds / 60).toInt()
            val sSec = (startSeconds % 60).toInt()
            val eMin = (endSeconds / 60).toInt()
            val eSec = (endSeconds % 60).toInt()
            return String.format("%d:%02d–%d:%02d", sMin, sSec, eMin, eSec)
        }

    val formattedDuration: String
        get() {
            val dur = (endSeconds - startSeconds).toInt()
            val min = dur / 60
            val sec = dur % 60
            return String.format("%02d:%02d", min, sec)
        }
}

data class ProcessingProgress(
    val currentEpisode: Int,
    val totalEpisodes: Int,
    val percentage: Int,
    val currentSegmentStartSec: Double,
    val currentSegmentEndSec: Double,
    val currentEpisodeElapsedSec: Double = 0.0,
    val currentEpisodeTotalSec: Double = 10.0,
    val overallCurrentSeconds: Double = 0.0,
    val overallTotalSeconds: Double = 0.0,
    val estimatedRemainingSeconds: Long? = null,
    val speedLabel: String = "1.0x",
    val currentTask: String = "Creating Episode"
) {
    val formattedCurrentSegment: String
        get() {
            val startTotal = currentSegmentStartSec.toInt()
            val endTotal = currentSegmentEndSec.toInt()
            val sH = startTotal / 3600
            val sM = (startTotal % 3600) / 60
            val sS = startTotal % 60
            val eH = endTotal / 3600
            val eM = (endTotal % 3600) / 60
            val eS = endTotal % 60
            return String.format("%02d:%02d:%02d → %02d:%02d:%02d", sH, sM, sS, eH, eM, eS)
        }
}

sealed class SplitUiState {
    object Idle : SplitUiState()
    data class Ready(val videoInfo: VideoInfo, val config: SplitConfig) : SplitUiState()
    data class Processing(
        val videoInfo: VideoInfo,
        val config: SplitConfig,
        val progress: ProcessingProgress
    ) : SplitUiState()
    data class Completed(
        val videoInfo: VideoInfo,
        val config: SplitConfig,
        val episodes: List<EpisodeClip>,
        val zipFile: File
    ) : SplitUiState()
    data class Error(val message: String, val canRetry: Boolean = true) : SplitUiState()
}

data class AiImageRequest(
    val prompt: String,
    val negativePrompt: String? = null,
    val width: Int = 512,
    val height: Int = 512,
    val steps: Int = 20,
    val seed: Long? = null
)

data class AiImageResponse(
    val success: Boolean,
    val image: String,
    val imageUrl: String,
    val seed: Long,
    val durationSeconds: Float
)

data class AiImageItem(
    val id: String,
    val prompt: String,
    val negativePrompt: String?,
    val imageUrl: String,
    val seed: Long,
    val width: Int,
    val height: Int,
    val timestamp: Long = System.currentTimeMillis()
)
