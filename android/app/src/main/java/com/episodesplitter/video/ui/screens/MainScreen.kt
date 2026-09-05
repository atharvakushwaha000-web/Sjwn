package com.episodesplitter.video.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.episodesplitter.video.model.EpisodeClip
import com.episodesplitter.video.model.ProcessingProgress
import com.episodesplitter.video.model.SplitConfig
import com.episodesplitter.video.model.SplitUiState
import com.episodesplitter.video.model.VideoInfo
import com.episodesplitter.video.ui.components.PreviewPlayerDialog
import com.episodesplitter.video.ui.theme.*
import com.episodesplitter.video.ui.viewmodel.EpisodeSplitterViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    viewModel: EpisodeSplitterViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val intervalInput by viewModel.intervalInput.collectAsState()
    val soundEnabled by viewModel.soundEnabled.collectAsState()
    val showCancelDialog by viewModel.showCancelDialog.collectAsState()
    val previewClip by viewModel.previewClip.collectAsState()

    val videoDenoise by viewModel.autoVideoNoiseReduction.collectAsState()
    val audioDenoise by viewModel.autoAudioNoiseReduction.collectAsState()
    val silenceCut by viewModel.autoEditSilenceCut.collectAsState()

    val mediaPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            viewModel.onVideoSelected(uri)
        }
    }

    Scaffold(
        topBar = {
            HeaderBar(
                soundEnabled = soundEnabled,
                onToggleSound = { viewModel.toggleSound() }
            )
        },
        containerColor = BgPrimary,
        modifier = modifier.fillMaxSize()
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (val state = uiState) {
                is SplitUiState.Idle -> {
                    EmptyStateContent(
                        onSelectVideo = {
                            mediaPickerLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.VideoOnly)
                            )
                        }
                    )
                }

                is SplitUiState.Ready -> {
                    ReadyStateContent(
                        videoInfo = state.videoInfo,
                        config = state.config,
                        intervalInput = intervalInput,
                        videoDenoise = videoDenoise,
                        audioDenoise = audioDenoise,
                        silenceCut = silenceCut,
                        onToggleVideoDenoise = { viewModel.toggleVideoNoiseReduction() },
                        onToggleAudioDenoise = { viewModel.toggleAudioNoiseReduction() },
                        onToggleSilenceCut = { viewModel.toggleSilenceCut() },
                        onChangeVideo = {
                            mediaPickerLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.VideoOnly)
                            )
                        },
                        onIntervalChanged = { viewModel.onIntervalChanged(it) },
                        onPresetSelected = { viewModel.selectPreset(it) },
                        onSplitVideo = { viewModel.startSplitting() }
                    )
                }

                is SplitUiState.Processing -> {
                    ProcessingContent(
                        videoInfo = state.videoInfo,
                        progress = state.progress,
                        onCancel = { viewModel.requestCancel() }
                    )
                }

                is SplitUiState.Completed -> {
                    CompletedContent(
                        videoInfo = state.videoInfo,
                        episodes = state.episodes,
                        onShareZip = { viewModel.shareZip() },
                        onPreviewEpisode = { viewModel.openPreview(it) },
                        onShareEpisode = { viewModel.shareEpisode(it) },
                        onReset = {
                            mediaPickerLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.VideoOnly)
                            )
                        }
                    )
                }

                is SplitUiState.Error -> {
                    ErrorContent(
                        message = state.message,
                        onRetry = {
                            mediaPickerLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.VideoOnly)
                            )
                        }
                    )
                }
            }

            // Real ExoPlayer Preview Dialog
            previewClip?.let { clip ->
                PreviewPlayerDialog(
                    clip = clip,
                    onDismiss = { viewModel.closePreview() },
                    onShare = { viewModel.shareEpisode(clip) }
                )
            }

            // Cancel Confirmation Dialog
            if (showCancelDialog) {
                AlertDialog(
                    onDismissRequest = { viewModel.dismissCancel() },
                    title = {
                        Text(
                            text = "Cancel video splitting?",
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    text = {
                        Text(
                            text = "Are you sure you want to stop? Completed episodes up to this point will be saved.",
                            color = TextSecondary
                        )
                    },
                    confirmButton = {
                        TextButton(onClick = { viewModel.dismissCancel() }) {
                            Text("Continue", color = TextPrimary)
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { viewModel.confirmCancel() }) {
                            Text("Cancel", color = PrimaryNeonRed)
                        }
                    },
                    containerColor = SurfaceCard,
                    shape = RoundedCornerShape(16.dp)
                )
            }
        }
    }
}

@Composable
fun HeaderBar(
    soundEnabled: Boolean,
    onToggleSound: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(BgPrimary)
            .padding(horizontal = 20.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(PrimaryNeonRed),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.ContentCut,
                    contentDescription = "Split Icon",
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column {
                Text(
                    text = "Episode Splitter",
                    style = MaterialTheme.typography.titleLarge,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Split videos automatically",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMuted
                )
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(
                onClick = onToggleSound,
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(BgSecondary)
            ) {
                Icon(
                    imageVector = if (soundEnabled) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                    contentDescription = "Toggle Sound Effects",
                    tint = if (soundEnabled) PrimaryNeonRed else TextMuted,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
fun EmptyStateContent(
    onSelectVideo: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(SurfaceCard)
                .border(1.5.dp, SurfaceCardBorder, RoundedCornerShape(20.dp))
                .clickable { onSelectVideo() }
                .padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(PrimaryNeonRed.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.VideoLibrary,
                        contentDescription = null,
                        tint = PrimaryNeonRed,
                        modifier = Modifier.size(36.dp)
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                Text(
                    text = "No video selected",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Select a video to get started.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = TextSecondary,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = onSelectVideo,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryNeonRed),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 24.dp, vertical = 14.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp), tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Select Video",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
fun ReadyStateContent(
    videoInfo: VideoInfo,
    config: SplitConfig,
    intervalInput: String,
    videoDenoise: Boolean,
    audioDenoise: Boolean,
    silenceCut: Boolean,
    onToggleVideoDenoise: () -> Unit,
    onToggleAudioDenoise: () -> Unit,
    onToggleSilenceCut: () -> Unit,
    onChangeVideo: () -> Unit,
    onIntervalChanged: (String) -> Unit,
    onPresetSelected: (Int) -> Unit,
    onSplitVideo: () -> Unit
) {
    val focusManager = LocalFocusManager.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 10.dp, bottom = 32.dp)
    ) {
        // Video Preview Banner
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(BgSecondary),
                        contentAlignment = Alignment.Center
                    ) {
                        AsyncImage(
                            model = videoInfo.uri,
                            contentDescription = "Thumbnail",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = videoInfo.fileName,
                            style = MaterialTheme.typography.titleMedium,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${videoInfo.formattedDuration} • ${videoInfo.resolutionLabel} • ${videoInfo.formattedSize}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }

                    IconButton(onClick = onChangeVideo) {
                        Icon(Icons.Default.Refresh, contentDescription = "Change Video", tint = TextSecondary)
                    }
                }
            }
        }

        // Interval Input Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Split Duration",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Enter duration in seconds for each episode",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextMuted
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = intervalInput,
                        onValueChange = onIntervalChanged,
                        trailingIcon = { Text("sec", color = PrimaryNeonRed, fontWeight = FontWeight.Bold, modifier = Modifier.padding(end = 12.dp)) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryNeonRed,
                            unfocusedBorderColor = SurfaceCardBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Preset Chips
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(10, 15, 30, 60).forEach { sec ->
                            val isSelected = intervalInput == sec.toString()
                            FilterChip(
                                selected = isSelected,
                                onClick = { onPresetSelected(sec) },
                                label = { Text("${sec}s") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = PrimaryNeonRed,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                }
            }
        }

        // Advanced Processing Features (Noise Reduction & Silence Cut)
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Audio & Video Enhancements",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Auto Video Noise Reduction
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Auto Video Noise Reduction", fontWeight = FontWeight.SemiBold, color = TextPrimary, fontSize = 14.sp)
                            Text("Applies hqdn3d spatial-temporal denoising", fontSize = 12.sp, color = TextSecondary)
                        }
                        Switch(
                            checked = videoDenoise,
                            onCheckedChange = { onToggleVideoDenoise() },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = PrimaryNeonRed)
                        )
                    }

                    if (videoDenoise) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("⚠ Warning: Video denoising may increase processing time.", color = Color(0xFFD97706), fontSize = 11.sp)
                    }

                    Divider(modifier = Modifier.padding(vertical = 10.dp), color = SurfaceCardBorder)

                    // Auto Audio Noise Reduction
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Auto Audio Noise Reduction", fontWeight = FontWeight.SemiBold, color = TextPrimary, fontSize = 14.sp)
                            Text("Removes background hum and hiss (afftdn)", fontSize = 12.sp, color = TextSecondary)
                        }
                        Switch(
                            checked = audioDenoise,
                            onCheckedChange = { onToggleAudioDenoise() },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = PrimaryNeonRed)
                        )
                    }

                    Divider(modifier = Modifier.padding(vertical = 10.dp), color = SurfaceCardBorder)

                    // Auto Edit (Silence Cut Only)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Auto Edit — Silence Cut Only", fontWeight = FontWeight.SemiBold, color = TextPrimary, fontSize = 14.sp)
                            Text("Trims silent gaps (-35 dB, 0.5s) automatically", fontSize = 12.sp, color = TextSecondary)
                        }
                        Switch(
                            checked = silenceCut,
                            onCheckedChange = { onToggleSilenceCut() },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = PrimaryNeonRed)
                        )
                    }
                }
            }
        }

        // Summary Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Total Duration", style = MaterialTheme.typography.bodyMedium, color = TextMuted)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(videoInfo.formattedDuration, style = MaterialTheme.typography.headlineMedium, color = TextPrimary)
                    }

                    Box(modifier = Modifier.height(44.dp).width(1.dp).background(SurfaceCardBorder))

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Interval", style = MaterialTheme.typography.bodyMedium, color = TextMuted)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("${intervalInput.ifEmpty { "0" }}s", style = MaterialTheme.typography.headlineMedium, color = PrimaryNeonRed)
                    }

                    Box(modifier = Modifier.height(44.dp).width(1.dp).background(SurfaceCardBorder))

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Episodes", style = MaterialTheme.typography.bodyMedium, color = TextMuted)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(config.totalEpisodes.toString(), style = MaterialTheme.typography.headlineMedium, color = StatusSuccess)
                    }
                }
            }
        }

        // Split Button
        item {
            val isEnabled = config.totalEpisodes > 0 && (intervalInput.toIntOrNull() ?: 0) > 0

            Button(
                onClick = onSplitVideo,
                enabled = isEnabled,
                colors = ButtonDefaults.buttonColors(
                    containerColor = PrimaryNeonRed,
                    disabledContainerColor = PrimaryNeonRed.copy(alpha = 0.3f)
                ),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
            ) {
                Icon(Icons.Default.ContentCut, contentDescription = null, modifier = Modifier.size(20.dp), tint = Color.White)
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "Split Video",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
    }
}

@Composable
fun ProcessingContent(
    videoInfo: VideoInfo,
    progress: ProcessingProgress,
    onCancel: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceCard),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(160.dp, 100.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(BgSecondary),
                    contentAlignment = Alignment.Center
                ) {
                    AsyncImage(
                        model = videoInfo.uri,
                        contentDescription = "Processing Video",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                Text(
                    text = "Splitting your video...",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Processing Episode ${progress.currentEpisode} / ${progress.totalEpisodes}",
                    style = MaterialTheme.typography.titleLarge,
                    color = PrimaryNeonRed,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Progress Counters
                val curSec = progress.currentEpisodeElapsedSec.toInt()
                val totalEpSec = progress.currentEpisodeTotalSec.toInt()
                val curMin = curSec / 60
                val curS = curSec % 60
                val totMin = totalEpSec / 60
                val totS = totalEpSec % 60

                Text(
                    text = String.format("Current: %02d:%02d / %02d:%02d", curMin, curS, totMin, totS),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextPrimary,
                    fontWeight = FontWeight.SemiBold
                )

                Text(
                    text = "Overall: ${progress.overallCurrentSeconds.toInt()} / ${progress.overallTotalSeconds.toInt()} seconds",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Continuous Progress Bar
                LinearProgressIndicator(
                    progress = { progress.percentage / 100f },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(10.dp)
                        .clip(RoundedCornerShape(5.dp)),
                    color = PrimaryNeonRed,
                    trackColor = BgSecondary
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Progress: ${progress.percentage}%",
                        style = MaterialTheme.typography.labelLarge,
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold
                    )

                    if (progress.estimatedRemainingSeconds != null) {
                        val remSec = progress.estimatedRemainingSeconds
                        val remStr = if (remSec > 60) "${remSec / 60}m ${remSec % 60}s left" else "${remSec}s left"
                        Text(
                            text = "Est. time: $remStr",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextMuted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

                OutlinedButton(
                    onClick = onCancel,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryNeonRed),
                    border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryNeonRed.copy(alpha = 0.5f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Close, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Cancel", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun CompletedContent(
    videoInfo: VideoInfo,
    episodes: List<EpisodeClip>,
    onShareZip: () -> Unit,
    onPreviewEpisode: (EpisodeClip) -> Unit,
    onShareEpisode: (EpisodeClip) -> Unit,
    onReset: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 10.dp, bottom = 32.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, StatusSuccess.copy(alpha = 0.4f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(StatusSuccess.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = StatusSuccess, modifier = Modifier.size(20.dp))
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Text(
                                text = "Your episodes are ready",
                                style = MaterialTheme.typography.titleLarge,
                                color = TextPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${episodes.size} episodes created successfully.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = StatusSuccess
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(
                            onClick = onShareZip,
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryNeonRed),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.White)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Save All (.zip)", fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        OutlinedButton(
                            onClick = onReset,
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                            border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Split Another", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }

        item {
            Text(
                text = "Generated Episodes (${episodes.size})",
                style = MaterialTheme.typography.titleMedium,
                color = TextPrimary,
                fontWeight = FontWeight.Bold
            )
        }

        items(episodes, key = { it.episodeNumber }) { clip ->
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = clip.fileName,
                            style = MaterialTheme.typography.labelLarge,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "${clip.formattedRange} • ${clip.formattedDuration}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = PrimaryNeonRed,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = { onPreviewEpisode(clip) },
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryNeonRed),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color.White)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Preview", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        IconButton(
                            onClick = { onShareEpisode(clip) },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(Icons.Default.Share, contentDescription = "Share", tint = TextSecondary, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ErrorContent(
    message: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = PrimaryNeonRed, modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = "Unable to process video", style = MaterialTheme.typography.headlineMedium, color = TextPrimary)
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = message, style = MaterialTheme.typography.bodyLarge, color = TextSecondary, textAlign = TextAlign.Center)
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryNeonRed),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Try Another Video", fontWeight = FontWeight.Bold, color = Color.White)
        }
    }
}
