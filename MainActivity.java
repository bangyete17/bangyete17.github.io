package com.(nama pakage aplikasimu);

// ================== PACKAGE ==================

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;

import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.appopen.AppOpenAd;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.FullScreenContentCallback;

// 🔥 IMPORT INTERSTITIAL
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.AdError;

// 🔥 TAMBAHAN
import android.webkit.JavascriptInterface;

import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

// ================== CLASS UTAMA ==================
public class MainActivity extends AppCompatActivity {

    // Variabel global
    private WebView webView;
    private AppOpenAd appOpenAd;

    // ================== INTERSTITIAL ==================
    private InterstitialAd interstitialAd;
    private boolean isShowingAd = false;
    private long lastInterstitialTime = 0;
    private int clickCount = 0;

    // ================== APP OPEN FLAG ==================
    private boolean hasShownAppOpenAd = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);

        // ================== SYSTEM BAR ==================
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(android.R.id.content), (v, insets) -> {
            int bottomInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
            if (webView != null) {
                webView.setPadding(0, 0, 0, bottomInset);
            }
            return insets;
        });

        // Init AdMob
        MobileAds.initialize(this);

        // ================== WEBVIEW ==================
        webView = findViewById(R.id.webview);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(false);
        webSettings.setAllowContentAccess(false);
        webSettings.setSupportMultipleWindows(false);

        // 🔥 TAMBAHAN: BRIDGE KE JAVASCRIPT
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void showInterstitialAd() {
                runOnUiThread(() -> showInterstitial());
            }
        }, "Android");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView unusedView, WebResourceRequest request) {
                return handleUrl(request.getUrl());
            }

            private boolean handleUrl(Uri uri) {
                String url = uri.toString();

                if (url.startsWith("mailto:")) {
                    Intent intent = new Intent(Intent.ACTION_SENDTO);
                    intent.setData(uri);
                    startActivity(intent);
                    return true;
                }

                if (url.startsWith("file:///android_asset/")) {
                    return false;
                }

                if (url.startsWith("http://") || url.startsWith("https://")) {
                    clickCount++;
                    if (clickCount % 3 == 0) {
                        showInterstitial();
                    }
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                    return true;
                }

                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl("file:///android_asset/index.html");

        // ================== APP OPEN ADS ==================
        loadOpenAd();

        // ================== LOAD INTERSTITIAL ==================
        loadInterstitial();

        // ================== BACK BUTTON ==================
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    finish();
                }
            }
        });
    }

    // ================== INTERSTITIAL ==================
    private void loadInterstitial() {
        AdRequest adRequest = new AdRequest.Builder().build();

        InterstitialAd.load(
                this,
                "ca-app-pub-3940256099942544/1033173712", // test id INTERSTITIAL

                adRequest,
                new InterstitialAdLoadCallback() {
                    @Override
                    public void onAdLoaded(InterstitialAd ad) {
                        interstitialAd = ad;
                    }

                    @Override
                    public void onAdFailedToLoad(LoadAdError adError) {
                        interstitialAd = null;
                    }
                }
        );
    }

    private void showInterstitial() {
        long now = System.currentTimeMillis();
        if (interstitialAd == null || isShowingAd || now - lastInterstitialTime < 30000) return;

        isShowingAd = true;
        lastInterstitialTime = now;

        interstitialAd.show(this);

        interstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                interstitialAd = null;
                isShowingAd = false;
                loadInterstitial();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(AdError adError) {
                isShowingAd = false;
            }
        });
    }

    // ================== APP OPEN ADS ==================
    private void loadOpenAd() {
        AdRequest request = new AdRequest.Builder().build();

        AppOpenAd.load(
                this,
                "ca-app-pub-3940256099942544/9257395921", //test id APP OPEN ADS

                request,
                AppOpenAd.APP_OPEN_AD_ORIENTATION_PORTRAIT,
                new AppOpenAd.AppOpenAdLoadCallback() {
                    @Override
                    public void onAdLoaded(AppOpenAd ad) {
                        appOpenAd = ad;
                        if (!hasShownAppOpenAd) {
                            showOpenAd();
                            hasShownAppOpenAd = true;
                        }
                    }

                    @Override
                    public void onAdFailedToLoad(LoadAdError error) {
                        appOpenAd = null;
                    }
                }
        );
    }

    private void showOpenAd() {
        if (appOpenAd != null && !isShowingAd) {
            isShowingAd = true;
            appOpenAd.show(this);

            appOpenAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override
                public void onAdDismissedFullScreenContent() {
                    appOpenAd = null;
                    isShowingAd = false;
                }
            });
        }
    }
}
