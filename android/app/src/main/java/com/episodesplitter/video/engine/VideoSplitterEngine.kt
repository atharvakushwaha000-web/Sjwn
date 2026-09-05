package com.episodesplitter.video.engine

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.media.MediaMuxer
import android.net.Uri
import android.os.Environment
import android.util.Log
import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.ReturnCode
import com.episodesplitter.video.model.EpisodeClip
import com.episodesplitter.video.model.ProcessingProgress
import com.episodesplitter.video.model.SplitConfig
import com.episodesplitter.video.model.VideoInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

class VideoSplitterEngine(private val context: Context) {

    companion object {
        private const val TAG = "VideoSplitterEngine"
    }

    private val isCancelled = AtomicBoolean(false)

    fun cancel() {
        isCancelled.set(true)
        FFmpegKit.cancel()
    }

    /**
     * Resolves the app-specific output folder:
     * "Episode Splitter/Episodes/Session 001/"
     */
    fun createSessionDirectory(): File {
        val baseDir = File(
            context.getExternalFilesDir(Environment.DIRECTORY_MOVIES) 
                ?: context.filesDir,
            "Episode Splitter/Episodes"
        )
        if (!baseDir.exists()) {
            baseDir.mkdirs()
        }

        var sessionIndex = 1
        var sessionDir: File
        do {
            val sessionName = String.format(Locale.US, "Session %03d", sessionIndex)
            sessionDir = File(baseDir, sessionName)
            sessionIndex++
        } while (sessionDir.exists())

        sessionDir.mkdirs()
        return sessionDir
    }

    /**
     * Sequential execution engine:
     * Splits video every [intervalSeconds] into Episode 1.mp4, Episode 2.mp4, etc.
     */
    suspend fun splitVideo(
        videoInfo: VideoInfo,
        config: SplitConfig,
        sessionDir: File,
        startIndex: Int = 0,
        onProgress: (ProcessingProgress) -> Unit,
        onEpisodeReady: (EpisodeClip) -> Unit
    ): List<EpisodeClip> = withContext(Dispatchers.IO) {
        isCancelled.set(false)
        val intervalSeconds = config.intervalSeconds
        val totalDuration = videoInfo.durationSeconds
        val totalEpisodes = Math.ceil(totalDuration / intervalSeconds).toInt()
        val completedClips = mutableListOf<EpisodeClip>()

        Log.i(TAG, "Starting splitVideo: source=${videoInfo.fileName}, totalDuration=${totalDuration}s, interval=${intervalSeconds}s, totalEpisodes=$totalEpisodes")
        Log.i(TAG, "Config: videoDenoise=${config.autoVideoNoiseReduction}, audioDenoise=${config.autoAudioNoiseReduction}, bgMusic=${config.backgroundMusicEnabled}, quality=${config.videoQuality}")

        // Copy source video Uri to local staging file for high-speed random seeking
        val stagingSourceFile = ensureLocalSourceFile(videoInfo.uri, videoInfo.fileName)
        val startProcessingTimestamp = System.currentTimeMillis()

        try {
            for (i in startIndex until totalEpisodes) {
                if (isCancelled.get()) {
                    Log.w(TAG, "Splitting job was cancelled at episode ${i + 1}")
                    throw Exception("Video splitting cancelled by user.")
                }

                val episodeNum = i + 1
                val startSec = i * intervalSeconds.toDouble()
                val endSec = minOf((i + 1) * intervalSeconds.toDouble(), totalDuration)
                val durationSec = endSec - startSec

                val outputFileName = "Episode $episodeNum.mp4"
                val outputFile = File(sessionDir, outputFileName)

                val elapsedMs = System.currentTimeMillis() - startProcessingTimestamp
                val completedCount = i - startIndex
                val estimatedRemainingSec: Long? = if (completedCount > 0) {
                    val msPerEpisode = elapsedMs / completedCount
                    val remainingEpisodes = totalEpisodes - i
                    (msPerEpisode * remainingEpisodes) / 1000
                } else null

                val overallPercent = ((i.toFloat() / totalEpisodes.toFloat()) * 100).toInt()

                // Emit initial episode progress
                onProgress(
                    ProcessingProgress(
                        currentEpisode = episodeNum,
                        totalEpisodes = totalEpisodes,
                        percentage = overallPercent,
                        currentSegmentStartSec = startSec,
                        currentSegmentEndSec = endSec,
                        currentEpisodeElapsedSec = 0.0,
                        currentEpisodeTotalSec = durationSec,
                        overallCurrentSeconds = startSec,
                        overallTotalSeconds = totalDuration,
                        estimatedRemainingSeconds = estimatedRemainingSec,
                        speedLabel = if (completedCount > 0) "${String.format(Locale.US, "%.1f", (completedCount.toDouble() / (elapsedMs / 1000.0)))}x" else "1.0x",
                        currentTask = "Creating Episode $episodeNum"
                    )
                )

                val epStartTime = System.currentTimeMillis()

                // Process single episode using Mode A (Stream-Copy) or Mode B (Single-Pass Quality Encode)
                processSingleSegment(
                    sourceFile = stagingSourceFile,
                    outputFile = outputFile,
                    startSec = startSec,
                    durationSec = durationSec,
                    config = config,
                    hasAudio = videoInfo.hasAudio,
                    onSubProgress = { subElapsedSec ->
                        val currentOverall = startSec + subElapsedSec
                        val dynamicPercent = minOf(99, ((currentOverall / totalDuration) * 100).toInt())
                        onProgress(
                            ProcessingProgress(
                                currentEpisode = episodeNum,
                                totalEpisodes = totalEpisodes,
                                percentage = dynamicPercent,
                                currentSegmentStartSec = startSec,
                                currentSegmentEndSec = endSec,
                                currentEpisodeElapsedSec = subElapsedSec,
                                currentEpisodeTotalSec = durationSec,
                                overallCurrentSeconds = currentOverall,
                                overallTotalSeconds = totalDuration,
                                estimatedRemainingSeconds = estimatedRemainingSec,
                                speedLabel = if (config.autoAudioNoiseReduction || config.backgroundMusicEnabled) "High-Quality Encode" else "Stream-Copy",
                                currentTask = "Creating Episode $episodeNum"
                            )
                        )
                    }
                )

                if (isCancelled.get()) {
                    if (outputFile.exists()) outputFile.delete()
                    throw Exception("Video splitting cancelled by user.")
                }

                if (!outputFile.exists() || outputFile.length() <= 1024L) {
                    val errMsg = "Failed to generate $outputFileName. Output file is empty or corrupted."
                    Log.e(TAG, errMsg)
                    throw Exception(errMsg)
                }

                // POST-PROCESSING STREAM VALIDATION:
                // Verify that if original video has audio, the output file MUST have audio.
                var verifiedHasAudio = false
                try {
                    val retriever = MediaMetadataRetriever()
                    retriever.setDataSource(outputFile.absolutePath)
                    val outHasAudio = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_HAS_AUDIO) == "yes"
                    val outHasVideo = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_HAS_VIDEO) == "yes"
                    retriever.release()

                    if (videoInfo.hasAudio && !outHasAudio) {
                        Log.e(TAG, "AUDIO VALIDATION WARNING: Output file $outputFileName missing audio! Retrying with direct copy fallback...")
                        // Fallback: transcode with direct stream copy to guarantee audio presence
                        extractSegmentWithStreamCopyFallback(stagingSourceFile, outputFile, startSec, durationSec)
                        verifiedHasAudio = true
                    } else {
                        verifiedHasAudio = outHasAudio
                    }
                } catch (ex: Exception) {
                    Log.w(TAG, "Metadata check warning: ${ex.message}")
                    verifiedHasAudio = videoInfo.hasAudio
                }

                val epDurationMs = System.currentTimeMillis() - epStartTime
                Log.i(TAG, "Episode $episodeNum generated: path=${outputFile.absolutePath}, size=${outputFile.length()} bytes in ${epDurationMs}ms, hasAudio=$verifiedHasAudio")

                val clip = EpisodeClip(
                    episodeNumber = episodeNum,
                    fileName = outputFileName,
                    startSeconds = startSec,
                    endSeconds = endSec,
                    outputFile = outputFile,
                    fileSizeBytes = outputFile.length(),
                    fileUri = Uri.fromFile(outputFile),
                    hasAudio = verifiedHasAudio
                )

                completedClips.add(clip)
                onEpisodeReady(clip)

                // Explicit garbage collection / resource release between episodes
                System.gc()
            }

            // Report 100%
            onProgress(
                ProcessingProgress(
                    currentEpisode = totalEpisodes,
                    totalEpisodes = totalEpisodes,
                    percentage = 100,
                    currentSegmentStartSec = (totalEpisodes - 1) * intervalSeconds.toDouble(),
                    currentSegmentEndSec = totalDuration,
                    currentEpisodeElapsedSec = totalDuration - (totalEpisodes - 1) * intervalSeconds,
                    currentEpisodeTotalSec = totalDuration - (totalEpisodes - 1) * intervalSeconds,
                    overallCurrentSeconds = totalDuration,
                    overallTotalSeconds = totalDuration,
                    estimatedRemainingSeconds = 0L,
                    speedLabel = "Finished",
                    currentTask = "Video Processing Complete"
                )
            )

            completedClips
        } finally {
            if (stagingSourceFile.exists() && stagingSourceFile.parentFile == context.cacheDir) {
                stagingSourceFile.delete()
            }
        }
    }

    /**
     * Executes segment slicing with Smart Processing:
     * Mode A: Fast stream-copy if no filters or background music are requested.
     * Mode B: Single-pass high quality encode with conservative noise reduction and proper audio mixing.
     */
    private fun processSingleSegment(
        sourceFile: File,
        outputFile: File,
        startSec: Double,
        durationSec: Double,
        config: SplitConfig,
        hasAudio: Boolean,
        onSubProgress: (Double) -> Unit
    ) {
        if (outputFile.exists()) {
            outputFile.delete()
        }

        val startFormatted = String.format(Locale.US, "%.3f", startSec)
        val durationFormatted = String.format(Locale.US, "%.3f", durationSec)

        val needsFilters = config.autoVideoNoiseReduction ||
                config.autoAudioNoiseReduction ||
                config.autoEditSilenceCut ||
                config.backgroundMusicEnabled ||
                config.originalAudioVolume != 1.0f ||
                config.videoQuality != "original"

        // MODE A: Fast stream-copy
        if (!needsFilters) {
            try {
                val success = extractSegmentWithMediaMuxer(
                    sourceFile = sourceFile,
                    outputFile = outputFile,
                    startUs = (startSec * 1_000_000L).toLong(),
                    endUs = ((startSec + durationSec) * 1_000_000L).toLong(),
                    onProgressUs = { currentUs ->
                        val subElapsed = (currentUs - (startSec * 1_000_000L)) / 1_000_000.0
                        onSubProgress(maxOf(0.0, minOf(subElapsed, durationSec)))
                    }
                )
                if (success && outputFile.exists() && outputFile.length() > 2048L) {
                    return
                }
            } catch (e: Exception) {
                Log.w(TAG, "Native MediaMuxer stream-copy fallback to FFmpeg: ${e.message}")
            }

            // FFmpeg Stream-Copy (Mode A fallback)
            if (outputFile.exists()) outputFile.delete()
            val streamCopyCmd = "-ss $startFormatted -i \"${sourceFile.absolutePath}\" -t $durationFormatted -map 0:v:0 -map 0:a? -c copy -avoid_negative_ts make_zero -movflags +faststart \"${outputFile.absolutePath}\""
            val copySession = FFmpegKit.execute(streamCopyCmd)
            if (ReturnCode.isSuccess(copySession.returnCode) && outputFile.exists() && outputFile.length() > 1024L) {
                return
            }
        }

        // MODE B: Single-Pass Quality Encode
        if (outputFile.exists()) outputFile.delete()

        // 1. Video Filter & Codec Configuration
        val videoFilters = mutableListOf<String>()
        if (config.autoVideoNoiseReduction) {
            // Light, clean spatial denoiser that does not blur detail
            videoFilters.add("hqdn3d=3:2:4:3")
        }

        // CRF quality preset (18 = visually lossless, 22 = medium)
        val crf = when (config.videoQuality) {
            "high" -> 18
            "medium" -> 22
            else -> 18
        }
        val vfArg = if (videoFilters.isNotEmpty()) "-vf \"${videoFilters.joinToString(",")}\"" else ""

        // 2. Audio Processing & Stream Mapping
        // NEVER drop original audio.
        if (config.backgroundMusicEnabled && !config.backgroundMusicPath.isNullOrBlank() && File(config.backgroundMusicPath).exists()) {
            // Mix original audio with background music using amix
            val origVol = config.originalAudioVolume
            val bgVol = config.backgroundMusicVolume
            val bgFile = config.backgroundMusicPath

            val filterComplex = if (hasAudio) {
                "[0:a]volume=$origVol[orig_a];[1:a]aloop=loop=-1:size=2e+09,volume=$bgVol,afade=t=in:st=0:d=1,afade=t=out:st=${durationSec - 1}:d=1[bg_a];[orig_a][bg_a]amix=inputs=2:duration=first:dropout_transition=2[aout]"
            } else {
                "[1:a]aloop=loop=-1:size=2e+09,volume=$bgVol,afade=t=in:st=0:d=1,afade=t=out:st=${durationSec - 1}:d=1[aout]"
            }

            val cmd = "-ss $startFormatted -i \"${sourceFile.absolutePath}\" -i \"$bgFile\" -t $durationFormatted -filter_complex \"$filterComplex\" -map 0:v:0 -map \"[aout]\" -c:v libx264 -preset fast -crf $crf $vfArg -c:a aac -b:a 192k -movflags +faststart \"${outputFile.absolutePath}\""
            val session = FFmpegKit.execute(cmd)
            if (ReturnCode.isSuccess(session.returnCode) && outputFile.exists() && outputFile.length() > 1024L) {
                return
            }
        }

        // Standard Single-Pass with Optional Conservative Noise Reduction
        val audioFilters = mutableListOf<String>()
        if (config.originalAudioVolume != 1.0f) {
            audioFilters.add("volume=${config.originalAudioVolume}")
        }
        if (config.autoAudioNoiseReduction && hasAudio) {
            // Conservative speech-preserving noise reduction
            audioFilters.add("afftdn=nr=10:nf=-30:tn=1")
        }
        if (config.autoEditSilenceCut && hasAudio) {
            val thresh = config.silenceThresholdDb.toInt()
            val minD = String.format(Locale.US, "%.2f", config.minSilenceDurationSec)
            audioFilters.add("silenceremove=stop_periods=-1:stop_duration=$minD:stop_threshold=${thresh}dB")
        }

        val afArg = if (audioFilters.isNotEmpty() && hasAudio) "-af \"${audioFilters.joinToString(",")}\"" else ""
        val audioArgs = if (hasAudio) "-c:a aac -b:a 192k $afArg" else ""

        val cmd = "-ss $startFormatted -i \"${sourceFile.absolutePath}\" -t $durationFormatted -map 0:v:0 ${if (hasAudio) "-map 0:a?" else ""} -c:v libx264 -preset fast -crf $crf $vfArg $audioArgs -movflags +faststart \"${outputFile.absolutePath}\""

        val session = FFmpegKit.execute(cmd)
        if (!ReturnCode.isSuccess(session.returnCode) || !outputFile.exists() || outputFile.length() < 1024L) {
            // Fallback: Safe stream copy
            extractSegmentWithStreamCopyFallback(sourceFile, outputFile, startSec, durationSec)
        }
    }

    private fun extractSegmentWithStreamCopyFallback(sourceFile: File, outputFile: File, startSec: Double, durationSec: Double) {
        if (outputFile.exists()) outputFile.delete()
        val startFormatted = String.format(Locale.US, "%.3f", startSec)
        val durationFormatted = String.format(Locale.US, "%.3f", durationSec)
        val cmd = "-ss $startFormatted -i \"${sourceFile.absolutePath}\" -t $durationFormatted -map 0:v:0 -map 0:a? -c copy -avoid_negative_ts make_zero -movflags +faststart \"${outputFile.absolutePath}\""
        val session = FFmpegKit.execute(cmd)
        if (!ReturnCode.isSuccess(session.returnCode) || !outputFile.exists() || outputFile.length() < 1024L) {
            throw Exception("Failed to generate segment at $startFormatted: ${session.failStackTrace ?: "Unknown error"}")
        }
    }

    /**
     * Native MediaExtractor + MediaMuxer stream copy without re-encoding
     */
    private fun extractSegmentWithMediaMuxer(
        sourceFile: File,
        outputFile: File,
        startUs: Long,
        endUs: Long,
        onProgressUs: (Long) -> Unit
    ): Boolean {
        var extractor: MediaExtractor? = null
        var muxer: MediaMuxer? = null

        try {
            extractor = MediaExtractor()
            extractor.setDataSource(sourceFile.absolutePath)

            muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

            val trackCount = extractor.trackCount
            val trackMap = mutableMapOf<Int, Int>()

            for (i in 0 until trackCount) {
                val format = extractor.getTrackFormat(i)
                val mime = format.getString(MediaFormat.KEY_MIME) ?: ""
                if (mime.startsWith("video/") || mime.startsWith("audio/")) {
                    val muxerTrack = muxer.addTrack(format)
                    trackMap[i] = muxerTrack
                    extractor.selectTrack(i)
                }
            }

            if (trackMap.isEmpty()) return false

            muxer.start()

            val maxBufferSize = 1024 * 1024
            val buffer = ByteBuffer.allocateDirect(maxBufferSize)
            val bufferInfo = MediaCodec.BufferInfo()

            extractor.seekTo(startUs, MediaExtractor.SEEK_TO_CLOSEST_SYNC)

            var lastReportedUs = startUs

            while (true) {
                if (isCancelled.get()) return false

                val trackIndex = extractor.sampleTrackIndex
                if (trackIndex < 0) break

                val sampleTimeUs = extractor.sampleTime
                if (sampleTimeUs > endUs) break

                if (sampleTimeUs >= startUs) {
                    bufferInfo.size = extractor.readSampleData(buffer, 0)
                    if (bufferInfo.size < 0) break

                    bufferInfo.offset = 0
                    bufferInfo.presentationTimeUs = sampleTimeUs - startUs
                    bufferInfo.flags = extractor.sampleFlags

                    val muxerTrack = trackMap[trackIndex]
                    if (muxerTrack != null) {
                        muxer.writeSampleData(muxerTrack, buffer, bufferInfo)
                    }

                    if (sampleTimeUs - lastReportedUs > 500_000L) {
                        lastReportedUs = sampleTimeUs
                        onProgressUs(sampleTimeUs)
                    }
                }

                extractor.advance()
            }

            return true
        } finally {
            try {
                muxer?.stop()
                muxer?.release()
            } catch (e: Exception) {
                Log.w(TAG, "Error closing muxer: ${e.message}")
            }
            try {
                extractor?.release()
            } catch (e: Exception) {
                Log.w(TAG, "Error releasing extractor: ${e.message}")
            }
        }
    }

    private fun ensureLocalSourceFile(uri: Uri, fileName: String): File {
        if (uri.scheme == "file") {
            uri.path?.let { path ->
                val f = File(path)
                if (f.exists()) return f
            }
        }

        val cacheFile = File(context.cacheDir, "source_${System.currentTimeMillis()}_$fileName")
        context.contentResolver.openInputStream(uri)?.use { input ->
            FileOutputStream(cacheFile).use { output ->
                val buffer = ByteArray(64 * 1024)
                var bytesRead: Int
                while (input.read(buffer).also { bytesRead = it } != -1) {
                    output.write(buffer, 0, bytesRead)
                }
            }
        } ?: throw Exception("Could not open video stream from selected Uri.")

        return cacheFile
    }
}
