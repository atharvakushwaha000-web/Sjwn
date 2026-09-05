package com.episodesplitter.video

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import com.episodesplitter.video.ui.screens.MainScreen
import com.episodesplitter.video.ui.theme.BgPrimary
import com.episodesplitter.video.ui.theme.EpisodeSplitterTheme
import com.episodesplitter.video.ui.viewmodel.EpisodeSplitterViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: EpisodeSplitterViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        handleIntent(intent)

        setContent {
            EpisodeSplitterTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = BgPrimary
                ) {
                    MainScreen(viewModel = viewModel)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        if (intent == null) return
        val action = intent.action
        val type = intent.type

        if ((Intent.ACTION_VIEW == action || Intent.ACTION_SEND == action) && type?.startsWith("video/") == true) {
            val videoUri: Uri? = if (Intent.ACTION_SEND == action) {
                intent.getParcelableExtra(Intent.EXTRA_STREAM)
            } else {
                intent.data
            }
            videoUri?.let { uri ->
                viewModel.onVideoSelected(uri)
            }
        }
    }
}
