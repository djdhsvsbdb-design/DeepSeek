package dev.dsh.mobile;

import android.app.Activity;
import android.os.Bundle;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView web;
    private EditText address;
    private SharedPreferences prefs;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("dsh_mobile", MODE_PRIVATE);
        buildUi();
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(12), dp(12), dp(12), dp(8));
        root.setBackgroundColor(Color.rgb(18, 18, 22));

        TextView heading = new TextView(this);
        heading.setText("DSH Mobile");
        heading.setTextColor(Color.WHITE);
        heading.setTextSize(20);
        root.addView(heading);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        address = new EditText(this);
        address.setSingleLine(true);
        address.setHint("https://your-dsh-server/");
        address.setText(prefs.getString("url", ""));
        address.setTextColor(Color.WHITE);
        address.setHintTextColor(Color.LTGRAY);
        bar.addView(address, new LinearLayout.LayoutParams(0, dp(48), 1));

        Button open = new Button(this);
        open.setText("Open");
        bar.addView(open);
        root.addView(bar);

        web = new WebView(this);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        web.setBackgroundColor(Color.rgb(18, 18, 22));
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !url.startsWith("https://") && !url.startsWith("http://");
            }
        });
        root.addView(web, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));

        open.setOnClickListener(v -> loadAddress());
        setContentView(root);
        if (!address.getText().toString().trim().isEmpty()) loadAddress();
    }

    private void loadAddress() {
        String url = address.getText().toString().trim();
        if (!url.startsWith("https://") && !url.startsWith("http://")) {
            Toast.makeText(this, "Enter a valid http(s) address", Toast.LENGTH_SHORT).show();
            return;
        }
        prefs.edit().putString("url", url).apply();
        web.loadUrl(url);
    }

    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density);
    }
}
