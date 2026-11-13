package ai.deepseek.harness.android

import android.app.Activity
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.javaScriptCanOpenWindowsAutomatically = false
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
            addJavascriptInterface(AndroidBridge(), "dshAndroid")
        }
        setContentView(webView)

        val hasBuiltClient = assets.list("web")?.contains("index.html") == true
        if (hasBuiltClient) {
            webView.loadUrl("file:///android_asset/web/index.html")
        } else {
            webView.loadDataWithBaseURL(
                "https://appassets.androidplatform.net/",
                missingClientPage(),
                "text/html",
                "UTF-8",
                null
            )
        }
    }

    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.removeJavascriptInterface("dshAndroid")
            webView.destroy()
        }
        super.onDestroy()
    }

    private inner class AndroidBridge {
        @JavascriptInterface
        fun platform(): String = "android"

        @JavascriptInterface
        fun appVersion(): String = BuildConfig.VERSION_NAME
    }

    private fun missingClientPage(): String = """
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light dark">
          <title>DeepSeek Harness Android</title>
          <style>
            body { font: 16px system-ui; margin: 0; padding: 32px 24px; background: #101318; color: #f4f5f7; }
            main { max-width: 560px; margin: 12vh auto; }
            h1 { font-size: 25px; }
            p { color: #b9c0cc; line-height: 1.6; }
            code { color: #9cc4ff; }
          </style>
        </head>
        <body><main>
          <h1>DeepSeek Harness for Android</h1>
          <p>The Android shell is installed, but the web client has not been built yet.</p>
          <p>Build the web frontend from the repository root, then build the Android app from <code>android/</code>.</p>
        </main></body>
        </html>
    """.trimIndent()
}
