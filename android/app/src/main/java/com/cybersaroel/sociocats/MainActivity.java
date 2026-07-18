package com.cybersaroel.sociocats;

import android.os.Bundle;
import android.webkit.WebView;
import android.os.Build;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Отключаем Force Dark Mode для WebView (MIUI / Android 10+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.setForceDarkAllowed(false);
                }
            } catch (Exception e) {
                // Если getWebView() недоступен — игнорируем,
                // forceDarkAllowed=false в styles.xml уже защитит
            }
        }
    }
}