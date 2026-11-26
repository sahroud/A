package com.sahroud.hamletasi;

import android.app.Activity;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.Window;
import android.view.WindowManager;
import java.util.Locale;
import java.util.HashMap;

public class MainActivity extends Activity {
    private WebView gameView;
    private TextToSpeech persianTts;
    private boolean ttsReady = false;
    private String pendingSpeech = null;

    private class AndroidTtsBridge {
        @JavascriptInterface
        public void speak(String message) {
            runOnUiThread(() -> {
                if (persianTts == null) return;
                if (!ttsReady) { pendingSpeech = message; return; }
                speakNow(message);
            });
        }
        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> { if (persianTts != null) persianTts.stop(); pendingSpeech = null; });
        }
    }

    private void speakNow(String message) {
        if (persianTts == null || !ttsReady || message == null || message.trim().isEmpty()) return;
        persianTts.setSpeechRate(0.88f);
        persianTts.setPitch(0.96f);
        if (android.os.Build.VERSION.SDK_INT >= 21) {
            persianTts.speak(message, TextToSpeech.QUEUE_FLUSH, null, "hamle_tasi_fa");
        } else {
            HashMap<String, String> params = new HashMap<>();
            params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "hamle_tasi_fa");
            persianTts.speak(message, TextToSpeech.QUEUE_FLUSH, params);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                             WindowManager.LayoutParams.FLAG_FULLSCREEN);
        persianTts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int language = persianTts.setLanguage(new Locale("fa", "IR"));
                if (language == TextToSpeech.LANG_MISSING_DATA || language == TextToSpeech.LANG_NOT_SUPPORTED) {
                    language = persianTts.setLanguage(new Locale("fa"));
                }
                ttsReady = language != TextToSpeech.LANG_MISSING_DATA &&
                           language != TextToSpeech.LANG_NOT_SUPPORTED;
                if (ttsReady && pendingSpeech != null) {
                    String message = pendingSpeech;
                    pendingSpeech = null;
                    speakNow(message);
                }
            }
        });

        gameView = new WebView(this);
        gameView.setBackgroundColor(0xFF2E2017);
        gameView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        WebSettings settings = gameView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        gameView.addJavascriptInterface(new AndroidTtsBridge(), "AndroidTTS");
        gameView.setWebViewClient(new WebViewClient());
        gameView.setWebChromeClient(new WebChromeClient());
        setContentView(gameView);
        if (savedInstanceState == null) {
            gameView.loadUrl("file:///android_asset/index.html");
        } else {
            gameView.restoreState(savedInstanceState);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (gameView != null) gameView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (gameView != null && gameView.canGoBack()) gameView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (gameView != null) { gameView.destroy(); gameView = null; }
        if (persianTts != null) { persianTts.stop(); persianTts.shutdown(); persianTts = null; }
        super.onDestroy();
    }
}