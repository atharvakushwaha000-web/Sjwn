package com.episodesplitter.video.worker

import android.app.NotificationManager
import android.content.Context
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.episodesplitter.video.EpisodeSplitterApp
import com.episodesplitter.video.engine.MetadataRetrieverHelper
import com.episodesplitter.video.engine.VideoSplitterEngine
import com.episodesplitter.video.engine.ZipManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class SplitWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        const val KEY_VIDEO_URI = "key_video_uri"
        const val KEY_INTERVAL_SEC = "key_interval_sec"
        const val KEY_PROGRESS_PERCENT = "key_progress_percent"
        const val KEY_CURRENT_EPISODE = "key_current_episode"
        const val KEY_TOTAL_EPISODES = "key_total_episodes"
        const val KEY_OUTPUT_ZIP_PATH = "key_output_zip_path"
        const val NOTIFICATION_ID = 4040
    }

    private val splitterEngine = VideoSplitterEngine(context)

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val uriStr = inputData.getString(KEY_VIDEO_URI) ?: return@withContext Result.failure()
        val intervalSec = inputData.getInt(KEY_INTERVAL_SEC, 10)
        val uri = Uri.parse(uriStr)

        val videoInfoResult = MetadataRetrieverHelper.extractVideoInfo(context, uri)
        if (videoInfoResult.isFailure) {
            return@withContext Result.failure(
                workDataOf("error" to (videoInfoResult.exceptionOrNull()?.message ?: "Failed to read video"))
            )
        }

        val videoInfo = videoInfoResult.getOrThrow()
        val sessionDir = splitterEngine.createSessionDirectory()

        // Set up foreground notification
        setForeground(createForegroundInfo("Preparing video splitting...", 0, 0, 0))

        try {
            val episodes = splitterEngine.splitVideo(
                videoInfo = videoInfo,
                intervalSeconds = intervalSec,
                sessionDir = sessionDir,
                onProgress = { progress ->
                    setProgressAsync(
                        workDataOf(
                            KEY_PROGRESS_PERCENT to progress.percentage,
                            KEY_CURRENT_EPISODE to progress.currentEpisode,
                            KEY_TOTAL_EPISODES to progress.totalEpisodes
                        )
                    )

                    updateNotification(
                        "Splitting Episode ${progress.currentEpisode} of ${progress.totalEpisodes}",
                        progress.percentage,
                        progress.currentEpisode,
                        progress.totalEpisodes
                    )
                },
                onEpisodeReady = { _ -> }
            )

            // Auto-create ZIP
            updateNotification("Packaging Video Episodes.zip...", 99, episodes.size, episodes.size)
            val zipResult = ZipManager.createZipArchive(sessionDir, episodes)

            if (zipResult.isSuccess) {
                val zipFile = zipResult.getOrThrow()
                Result.success(
                    workDataOf(
                        KEY_OUTPUT_ZIP_PATH to zipFile.absolutePath,
                        KEY_TOTAL_EPISODES to episodes.size
                    )
                )
            } else {
                Result.failure(
                    workDataOf("error" to (zipResult.exceptionOrNull()?.message ?: "Failed to create ZIP"))
                )
            }
        } catch (e: Exception) {
            if (isStopped) {
                splitterEngine.cancel()
                Result.failure(workDataOf("error" to "Processing cancelled"))
            } else {
                Result.failure(workDataOf("error" to (e.message ?: "Processing error")))
            }
        }
    }

    private fun createForegroundInfo(
        content: String,
        progress: Int,
        currentEpisode: Int,
        totalEpisodes: Int
    ): ForegroundInfo {
        val notification = NotificationCompat.Builder(context, EpisodeSplitterApp.NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Episode Splitter")
            .setContentText(content)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setProgress(100, progress, progress == 0)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ForegroundInfo(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } else {
            ForegroundInfo(NOTIFICATION_ID, notification)
        }
    }

    private fun updateNotification(
        content: String,
        progress: Int,
        currentEpisode: Int,
        totalEpisodes: Int
    ) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notification = NotificationCompat.Builder(context, EpisodeSplitterApp.NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Episode Splitter")
            .setContentText(content)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setProgress(100, progress, false)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
        manager.notify(NOTIFICATION_ID, notification)
    }

    override suspend fun getForegroundInfo(): ForegroundInfo {
        return createForegroundInfo("Splitting video in background...", 0, 0, 0)
    }
}
