package com.episodesplitter.video.utils

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class SoundHapticManager(private val context: Context) {

    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    private var toneGenerator: ToneGenerator? = null
    private var lastTickTime = 0L

    init {
        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 60)
        } catch (_: Exception) {}
    }

    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    fun playVideoSelected(soundEnabled: Boolean) {
        vibrate(20)
        if (soundEnabled && isNotSilent()) {
            try {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 70)
            } catch (_: Exception) {}
        }
    }

    fun playProcessingStarted(soundEnabled: Boolean) {
        vibrate(30)
        if (soundEnabled && isNotSilent()) {
            try {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_PROMPT, 40)
            } catch (_: Exception) {}
        }
    }

    fun playEpisodeCompleted(soundEnabled: Boolean) {
        val now = System.currentTimeMillis()
        if (now - lastTickTime < 300) return
        lastTickTime = now

        vibrate(10)
        if (soundEnabled && isNotSilent()) {
            try {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_ACK, 30)
            } catch (_: Exception) {}
        }
    }

    fun playAllProcessingCompleted(soundEnabled: Boolean) {
        vibratePattern(longArrayOf(0, 30, 60, 40))
        if (soundEnabled && isNotSilent()) {
            try {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP2, 250)
            } catch (_: Exception) {}
        }
    }

    fun playError(soundEnabled: Boolean) {
        vibratePattern(longArrayOf(0, 50, 40, 50))
        if (soundEnabled && isNotSilent()) {
            try {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_NACK, 180)
            } catch (_: Exception) {}
        }
    }

    fun playButtonFeedback() {
        vibrate(12)
    }

    private fun isNotSilent(): Boolean {
        val ringer = audioManager?.ringerMode ?: AudioManager.RINGER_MODE_NORMAL
        return ringer == AudioManager.RINGER_MODE_NORMAL
    }

    private fun vibrate(durationMs: Long) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(durationMs)
            }
        } catch (_: Exception) {}
    }

    private fun vibratePattern(pattern: LongArray) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, -1)
            }
        } catch (_: Exception) {}
    }
}
