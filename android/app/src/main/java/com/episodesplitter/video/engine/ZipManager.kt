package com.episodesplitter.video.engine

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.episodesplitter.video.model.EpisodeClip
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

object ZipManager {

    /**
     * Creates "Video Episodes.zip" in [outputDirectory] containing all generated episode clips.
     * Streams files chunk-by-chunk to guarantee minimal RAM footprint even for multiple GBs.
     */
    suspend fun createZipArchive(
        outputDirectory: File,
        episodes: List<EpisodeClip>,
        onProgress: (Int) -> Unit = {}
    ): Result<File> = withContext(Dispatchers.IO) {
        val zipFile = File(outputDirectory, "Video Episodes.zip")
        if (zipFile.exists()) {
            zipFile.delete()
        }

        try {
            val totalEpisodes = episodes.size
            FileOutputStream(zipFile).use { fos ->
                BufferedOutputStream(fos, 64 * 1024).use { bos ->
                    ZipOutputStream(bos).use { zos ->
                        // Optimize compression speed for pre-compressed video data (store/deflate)
                        zos.setLevel(1)

                        val buffer = ByteArray(128 * 1024)

                        episodes.forEachIndexed { index, episode ->
                            val file = episode.outputFile
                            if (file.exists() && file.length() > 0) {
                                // Strictly flat filename without nested directories
                                val entry = ZipEntry(episode.fileName)
                                entry.time = file.lastModified()
                                zos.putNextEntry(entry)

                                BufferedInputStream(FileInputStream(file), 128 * 1024).use { bis ->
                                    var bytesRead: Int
                                    while (bis.read(buffer).also { bytesRead = it } != -1) {
                                        zos.write(buffer, 0, bytesRead)
                                    }
                                }
                                zos.closeEntry()
                            }
                            val percent = (((index + 1).toFloat() / totalEpisodes.toFloat()) * 100).toInt()
                            onProgress(percent)
                        }
                    }
                }
            }

            if (!zipFile.exists() || zipFile.length() == 0L) {
                return@withContext Result.failure(Exception("Failed to create ZIP archive: file is empty."))
            }

            Result.success(zipFile)
        } catch (e: Exception) {
            if (zipFile.exists()) zipFile.delete()
            Result.failure(Exception("ZIP creation error: ${e.localizedMessage ?: "I/O failure"}"))
        }
    }

    /**
     * Shares the ZIP file using Android's native sharesheet
     */
    fun shareZipFile(context: Context, zipFile: File) {
        val contentUri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            zipFile
        )

        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "application/zip"
            putExtra(Intent.EXTRA_STREAM, contentUri)
            putExtra(Intent.EXTRA_SUBJECT, "Video Episodes ZIP")
            putExtra(Intent.EXTRA_TEXT, "Here are your split video episodes (${zipFile.name}).")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        context.startActivity(Intent.createChooser(shareIntent, "Share Episodes ZIP"))
    }

    /**
     * Shares an individual episode
     */
    fun shareSingleEpisode(context: Context, episode: EpisodeClip) {
        val contentUri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            episode.outputFile
        )

        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "video/mp4"
            putExtra(Intent.EXTRA_STREAM, contentUri)
            putExtra(Intent.EXTRA_SUBJECT, episode.fileName)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        context.startActivity(Intent.createChooser(shareIntent, "Share ${episode.fileName}"))
    }
}
