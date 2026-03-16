package net.dynart.bible;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.graphics.Color;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        // Try to opt out of edge-to-edge
        WindowCompat.setDecorFitsSystemWindows(window, true);
        // Set opaque system bar backgrounds so content doesn't show through
        window.setStatusBarColor(Color.parseColor("#3b3f4a"));
        window.setNavigationBarColor(Color.parseColor("#3b3f4a"));

        // Apply padding for system bar insets as a safety net
        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
            Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
