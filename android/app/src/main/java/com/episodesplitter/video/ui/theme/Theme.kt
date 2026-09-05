package com.episodesplitter.video.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Dedicated White + Neon Red Color Scheme
private val WhiteNeonRedColorScheme = lightColorScheme(
    primary = PrimaryNeonRed,
    onPrimary = BgPrimary,
    secondary = AccentNeonRed,
    onSecondary = BgPrimary,
    background = BgPrimary,
    onBackground = TextPrimary,
    surface = SurfaceCard,
    onSurface = TextPrimary,
    surfaceVariant = BgSecondary,
    onSurfaceVariant = TextSecondary,
    outline = SurfaceCardBorder
)

@Composable
fun EpisodeSplitterTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // White + Neon Red theme is active
    val colorScheme = WhiteNeonRedColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            window.navigationBarColor = colorScheme.background.toArgb()
            // Light status bar with dark icons
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = true
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
