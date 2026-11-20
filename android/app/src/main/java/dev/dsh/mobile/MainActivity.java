package dev.dsh.mobile;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private TextView status;
    private TextView log;
    private Button launchButton;
    private boolean runtimeStarted = false;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    static { System.loadLibrary("nodebridge"); }
    private native int startNode(String scriptPath, String homePath, String tempPath);

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        File home = new File(getFilesDir(), "dsh");
        File cache = new File(getCacheDir(), "node");
        home.mkdirs();
        cache.mkdirs();
        try {
            File entry = new File(home, "android-entry.mjs");
            try (InputStream in = getAssets().open("dsh/android-entry.mjs");
                 FileOutputStream out = new FileOutputStream(entry)) {
                    byte[] buffer = new byte[4096];
                    int count;
                    while ((count = in.read(buffer)) > 0) out.write(buffer, 0, count);
                }
            }
        } catch (Exception e) { }
        buildUi();
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(32, 36, 32, 24);
        root.setBackgroundColor(Color.rgb(18, 20, 24));

        TextView heading = new TextView(this);
        heading.setText("DeepSeek Harness · Android");
        heading.setTextColor(Color.WHITE);
        heading.setTextSize(22);
        root.addView(heading);

        status = new TextView(this);
        status.setText("Embedded Node · DSH profile launcher");
        status.setTextColor(Color.rgb(130, 210, 160));
        status.setPadding(0, 24, 0, 24);
        root.addView(status);

        launchButton = new Button(this);
        launchButton.setText("Start DSH agent");
        root.addView(launchButton);
        launchButton.setOnClickListener(v -> launchRuntime());

        ScrollView scroll = new ScrollView(this);
        log = new TextView(this);
        log.setTextColor(Color.LTGRAY);
        log.setTextSize(14);
        log.setText("Runtime smoke output is written to logcat.\n");
        scroll.addView(log);
        root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(root);
    }

    private void launchRuntime() {
        if (runtimeStarted) return;
        runtimeStarted = true;
        if (launchButton != null) launchButton.setEnabled(false);
        File script = new File(getFilesDir(), "dsh/android-entry.mjs");
        if (!script.exists()) {
            status.setText("Runtime test script is missing");
            return;
        }
        status.setText("Node starting…");
        log.append("Starting bundled Node runtime…\n");
        executor.execute(() -> {
            int code;
            try {
                code = startNode(script.getAbsolutePath(),
                        new File(getFilesDir(), "dsh").getAbsolutePath(),
                        new File(getCacheDir(), "node").getAbsolutePath());
            } catch (Throwable error) {
                runOnUiThread(() -> {
                    status.setText("Node startup failed");
                    log.append("Native runtime startup error: " + error.getMessage() + "\\n");
                });
                return;
            }
            final int exitCode = code;
            runOnUiThread(() -> status.setText("Node exited · code " + exitCode));
        });
    }

    @Override protected void onDestroy() {
        executor.shutdown();
        super.onDestroy();
    }
}
