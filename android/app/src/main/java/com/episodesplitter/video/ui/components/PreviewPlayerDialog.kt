package com.episodesplitter.video.ui.components

import android.net.Uri
import android.util.Log
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.episodesplitter.video.model.EpisodeClip
import kotlinx.coroutines.delay

@Composable
fun PreviewPlayerDialog(
    clip: EpisodeClip,
    onDismiss: () -> Unit,
    onShare: () -> Unit
) {
    val context = LocalContext.current
    val targetUri = clip.fileUri ?: Uri.fromFile(clip.outputFile)

    var exoPlayer by remember { mutableStateOf<ExoPlayer?>(null) }
    var isPlaying by remember { mutableStateOf(true) }
    var isMuted by remember { mutableStateOf(false) }
    var currentPositionMs by remember { mutableLongStateOf(0L) }
    var durationMs by remember { mutableLongStateOf(0L) }
    var playerError by remember { mutableStateOf<String?>(null) }
    var isFullscreen by remember { mutableStateOf(false) }

    val primaryNeonRed = Color(0xFFFF003F)
    val textPrimary = Color(0xFF0F172A)
    val textSecondary = Color(0xFF64748B)

    DisposableEffect(clip) {
        val fileExists = clip.outputFile.exists()
        val fileSize = if (fileExists) clip.outputFile.length() else -1L

        Log.i("PreviewPlayer", "Initializing ExoPlayer for Episode ${clip.episodeNumber}:")
        Log.i("PreviewPlayer", " - File name: ${clip.fileName}")
        Log.i("PreviewPlayer", " - File path: ${clip.outputFile.absolutePath}")
        Log.i("PreviewPlayer", " - URI: $targetUri")
        Log.i("PreviewPlayer", " - Exists: $fileExists, Size: $fileSize bytes")

        if (!fileExists || fileSize <= 0L) {
            playerError = "Unable to play this episode. File does not exist or is empty ($fileSize bytes)."
            Log.e("PreviewPlayer", playerError!!)
            return@DisposableEffect onDispose {}
        }

        val player = ExoPlayer.Builder(context).build().apply {
            val mediaItem = MediaItem.fromUri(targetUri)
            setMediaItem(mediaItem)
            prepare()
            playWhenReady = true

            addListener(object : Player.Listener {
                override fun onIsPlayingChanged(playing: Boolean) {
                    isPlaying = playing
                }

                override fun onPlaybackStateChanged(playbackState: Int) {
                    if (playbackState == Player.STATE_READY) {
                        durationMs = duration
                    }
                }

                override fun onPlayerError(error: PlaybackException) {
                    val errMsg = "Unable to play this episode (Code: ${error.errorCodeName})"
                    playerError = errMsg
                    Log.e("PreviewPlayer", "EXOPLAYER ERROR on Episode ${clip.episodeNumber}:", error)
                    Log.e("PreviewPlayer", " - Code: ${error.errorCodeName} (${error.errorCode})")
                    Log.e("PreviewPlayer", " - Message: ${error.message}")
                    Log.e("PreviewPlayer", " - File: ${clip.outputFile.absolutePath}")
                    Log.e("PreviewPlayer", " - URI: $targetUri")
                }
            })
        }

        exoPlayer = player

        onDispose {
            player.stop()
            player.release()
            exoPlayer = null
        }
    }

    // Polling loop for playback position
    LaunchedEffect(exoPlayer, isPlaying) {
        while (exoPlayer != null && isPlaying) {
            currentPositionMs = exoPlayer?.currentPosition ?: 0L
            durationMs = exoPlayer?.duration?.takeIf { it > 0 } ?: ((clip.endSeconds - clip.startSeconds) * 1000).toLong()
            delay(250)
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = !isFullscreen, dismissOnBackPress = true, dismissOnClickOutside = true)
    ) {
        Card(
            shape = RoundedCornerShape(if (isFullscreen) 0.dp else 20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 12.dp),
            modifier = if (isFullscreen) Modifier.fillMaxSize() else Modifier
                .fillMaxWidth()
                .padding(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(if (isFullscreen) 8.dp else 16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = clip.fileName,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = textPrimary
                        )
                        Text(
                            text = "Timecode: ${clip.formattedRange} • ${clip.formattedDuration}",
                            fontSize = 13.sp,
                            color = primaryNeonRed,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        IconButton(onClick = onShare) {
                            Icon(Icons.Default.Share, contentDescription = "Share", tint = textSecondary)
                        }
                        IconButton(onClick = { isFullscreen = !isFullscreen }) {
                            Icon(
                                if (isFullscreen) Icons.Default.FullscreenExit else Icons.Default.Fullscreen,
                                contentDescription = "Fullscreen",
                                tint = textSecondary
                            )
                        }
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = textPrimary)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Video Surface
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(16f / 9f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.Black),
                    contentAlignment = Alignment.Center
                ) {
                    if (playerError != null) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = primaryNeonRed, modifier = Modifier.size(44.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = playerError ?: "Unable to play this episode",
                                color = Color.White,
                                textAlign = TextAlign.Center,
                                fontSize = 14.sp
                            )
                        }
                    } else {
                        AndroidView(
                            factory = { ctx ->
                                PlayerView(ctx).apply {
                                    player = exoPlayer
                                    useController = false
                                    layoutParams = FrameLayout.LayoutParams(
                                        ViewGroup.LayoutParams.MATCH_PARENT,
                                        ViewGroup.LayoutParams.MATCH_PARENT
                                    )
                                }
                            },
                            update = { view ->
                                view.player = exoPlayer
                            },
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Progress Slider
                val currentSec = currentPositionMs / 1000f
                val totalSec = (durationMs / 1000f).coerceAtLeast(0.1f)
                Slider(
                    value = currentSec.coerceIn(0f, totalSec),
                    onValueChange = { targetSec ->
                        exoPlayer?.seekTo((targetSec * 1000).toLong())
                        currentPositionMs = (targetSec * 1000).toLong()
                    },
                    valueRange = 0f..totalSec,
                    colors = SliderDefaults.colors(
                        thumbColor = primaryNeonRed,
                        activeTrackColor = primaryNeonRed,
                        inactiveTrackColor = Color(0xFFE2E8F0)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // Time labels
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    val curM = (currentPositionMs / 1000) / 60
                    val curS = (currentPositionMs / 1000) % 60
                    val durM = (durationMs / 1000) / 60
                    val durS = (durationMs / 1000) % 60
                    Text(
                        text = String.format("%02d:%02d", curM, curS),
                        fontSize = 12.sp,
                        color = textSecondary
                    )
                    Text(
                        text = String.format("%02d:%02d", durM, durS),
                        fontSize = 12.sp,
                        color = textSecondary
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Controls Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = {
                        val player = exoPlayer ?: return@IconButton
                        val nextMuted = !isMuted
                        player.volume = if (nextMuted) 0f else 1f
                        isMuted = nextMuted
                    }) {
                        Icon(
                            if (isMuted) Icons.Default.VolumeOff else Icons.Default.VolumeUp,
                            contentDescription = "Mute",
                            tint = textSecondary
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    IconButton(
                        onClick = {
                            val player = exoPlayer ?: return@IconButton
                            if (player.isPlaying) {
                                player.pause()
                            } else {
                                player.play()
                            }
                        },
                        modifier = Modifier
                            .size(54.dp)
                            .clip(RoundedCornerShape(27.dp))
                            .background(primaryNeonRed)
                    ) {
                        Icon(
                            if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                            contentDescription = if (isPlaying) "Pause" else "Play",
                            tint = Color.White,
                            modifier = Modifier.size(30.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    IconButton(onClick = {
                        exoPlayer?.seekTo(0)
                        exoPlayer?.play()
                    }) {
                        Icon(Icons.Default.Replay, contentDescription = "Restart", tint = textSecondary)
                    }
                }
            }
        }
    }
}
