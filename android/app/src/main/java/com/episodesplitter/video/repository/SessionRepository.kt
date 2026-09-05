package com.episodesplitter.video.repository

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import com.episodesplitter.video.model.EpisodeClip
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class SessionRepository(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("episode_splitter_sessions", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_LAST_URI = "last_video_uri"
        private const val KEY_LAST_INTERVAL = "last_interval_sec"
        private const val KEY_SESSION_DIR = "session_dir_path"
        private const val KEY_COMPLETED_EPISODES = "completed_episodes_json"
        private const val KEY_SOUND_ENABLED = "sound_effects_enabled"
    }

    var isSoundEnabled: Boolean
        get() = prefs.getBoolean(KEY_SOUND_ENABLED, true)
        set(value) = prefs.edit().putBoolean(KEY_SOUND_ENABLED, value).apply()

    fun saveActiveSession(
        uri: Uri,
        intervalSec: Int,
        sessionDir: File,
        completedEpisodes: List<EpisodeClip>
    ) {
        val array = JSONArray()
        completedEpisodes.forEach { clip ->
            val obj = JSONObject().apply {
                put("number", clip.episodeNumber)
                put("fileName", clip.fileName)
                put("startSec", clip.startSeconds)
                put("endSec", clip.endSeconds)
                put("path", clip.outputFile.absolutePath)
                put("size", clip.fileSizeBytes)
            }
            array.put(obj)
        }

        prefs.edit()
            .putString(KEY_LAST_URI, uri.toString())
            .putInt(KEY_LAST_INTERVAL, intervalSec)
            .putString(KEY_SESSION_DIR, sessionDir.absolutePath)
            .putString(KEY_COMPLETED_EPISODES, array.toString())
            .apply()
    }

    fun getInterruptedSession(): InterruptedSession? {
        val uriStr = prefs.getString(KEY_LAST_URI, null) ?: return null
        val interval = prefs.getInt(KEY_LAST_INTERVAL, 10)
        val dirPath = prefs.getString(KEY_SESSION_DIR, null) ?: return null
        val jsonStr = prefs.getString(KEY_COMPLETED_EPISODES, null) ?: return null

        val dir = File(dirPath)
        if (!dir.exists()) return null

        val clips = mutableListOf<EpisodeClip>()
        try {
            val array = JSONArray(jsonStr)
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                val file = File(obj.getString("path"))
                if (file.exists()) {
                    clips.add(
                        EpisodeClip(
                            episodeNumber = obj.getInt("number"),
                            fileName = obj.getString("fileName"),
                            startSeconds = obj.getDouble("startSec"),
                            endSeconds = obj.getDouble("endSec"),
                            outputFile = file,
                            fileSizeBytes = obj.optLong("size", file.length())
                        )
                    )
                }
            }
        } catch (_: Exception) {
            return null
        }

        return InterruptedSession(
            videoUri = Uri.parse(uriStr),
            intervalSeconds = interval,
            sessionDir = dir,
            completedEpisodes = clips
        )
    }

    fun clearSession() {
        prefs.edit()
            .remove(KEY_LAST_URI)
            .remove(KEY_LAST_INTERVAL)
            .remove(KEY_SESSION_DIR)
            .remove(KEY_COMPLETED_EPISODES)
            .apply()
    }

    data class InterruptedSession(
        val videoUri: Uri,
        val intervalSeconds: Int,
        val sessionDir: File,
        val completedEpisodes: List<EpisodeClip>
    )
}
