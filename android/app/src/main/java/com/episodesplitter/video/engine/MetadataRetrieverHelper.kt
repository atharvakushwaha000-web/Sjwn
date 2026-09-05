package com.episodesplitter.video.engine

import android.content.Context
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.provider.OpenableColumns
import com.episodesplitter.video.model.VideoInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object MetadataRetrieverHelper {

    suspend fun extractVideoInfo(context: Context, uri: Uri): Result<VideoInfo> = withContext(Dispatchers.IO) {
        val retriever = MediaMetadataRetriever()
        try {
            retriever.setDataSource(context, uri)

            // Duration
            val durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                ?: return@withContext Result.failure(Exception("Unable to determine video duration. File may be corrupted."))
            val durationMs = durationStr.toDoubleOrNull()
                ?: return@withContext Result.failure(Exception("Invalid duration metadata in video."))
            val durationSec = durationMs / 1000.0

            if (durationSec <= 0.0) {
                return@withContext Result.failure(Exception("Video duration must be greater than 0 seconds."))
            }

            // Dimensions and Rotation
            val widthStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
            val heightStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
            val rotationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)

            var width = widthStr?.toIntOrNull() ?: 1920
            var height = heightStr?.toIntOrNull() ?: 1080
            val rotation = rotationStr?.toIntOrNull() ?: 0

            // If video is rotated 90 or 270 degrees, swap visual aspect ratio
            if (rotation == 90 || rotation == 270) {
                val temp = width
                width = height
                height = temp
            }

            // Audio presence check
            val hasAudioStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_HAS_AUDIO)
            val hasAudio = hasAudioStr?.equals("yes", ignoreCase = true) ?: true

            // Frame rate
            val frameRate: Float = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                val fpsStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_CAPTURE_FRAMERATE)
                fpsStr?.toFloatOrNull() ?: 30f
            } else {
                30f
            }

            // File Name & Size from ContentResolver
            var fileName = "Selected_Video.mp4"
            var fileSize = 0L

            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                if (cursor.moveToFirst()) {
                    if (nameIndex != -1) {
                        cursor.getString(nameIndex)?.let { fileName = it }
                    }
                    if (sizeIndex != -1) {
                        fileSize = cursor.getLong(sizeIndex)
                    }
                }
            }

            val mimeType = context.contentResolver.getType(uri) ?: "video/mp4"

            Result.success(
                VideoInfo(
                    uri = uri,
                    fileName = fileName,
                    durationSeconds = durationSec,
                    width = width,
                    height = height,
                    frameRate = frameRate,
                    fileSizeBytes = fileSize,
                    rotation = rotation,
                    hasAudio = hasAudio,
                    mimeType = mimeType
                )
            )
        } catch (e: Exception) {
            Result.failure(Exception("Failed to read video file: ${e.localizedMessage ?: "Unsupported or unreadable format"}"))
        } finally {
            try {
                retriever.release()
            } catch (_: Exception) {}
        }
    }
}
