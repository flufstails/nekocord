package com.nekocord;

import android.app.Application;
import android.content.pm.PackageInfo;
import android.content.res.AssetManager;
import android.util.Log;
import com.facebook.react.bridge.JSBundleLoaderDelegate;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Bootstraps Nekocord's pre-bundle and post-bundle JavaScript hooks around
 * Discord's React Native bundle loading pipeline.
 */
public final class NekocordLoader {
    private static final String TAG = "Nekocord";
    private static final String PRELOAD_ASSET = "nekocord-preload.js";
    private static final String BUNDLE_ASSET = "nekocord.js";
    private static final String DEV_PRELOAD_NAME = "nekocord-preload.dev.js";
    private static final String DEV_BUNDLE_NAME = "nekocord.dev.js";

    private static volatile Application app;

    private NekocordLoader() {
    }

    /**
     * Captures the application context during {@code MainApplication.onCreate()}.
     */
    public static void init(Application application) {
        if (application == null) {
            return;
        }
        app = application;
        try {
            File extDir = application.getExternalFilesDir("nekocord");
            if (extDir != null && !extDir.exists()) {
                extDir.mkdirs();
            }
        } catch (Throwable ignored) {
        }
        Log.i(TAG, "Initialized NekocordLoader for package " + application.getPackageName());
    }

    /**
     * Runs before Discord loads its primary Hermes bundle so Metro globals
     * ({@code __d} and {@code __r}) can be intercepted from module 0.
     */
    public static void beforeBundle(JSBundleLoaderDelegate delegate) {
        Application context = app;
        if (context == null || delegate == null) {
            return;
        }
        try {
            File devPreload = findDevOverride(context, DEV_PRELOAD_NAME);
            if (devPreload != null) {
                Log.i(TAG, "Loading dev preload from " + devPreload.getAbsolutePath());
                delegate.loadSplitBundleFromFile(devPreload.getAbsolutePath(), PRELOAD_ASSET);
                return;
            }
            if (assetExists(context.getAssets(), PRELOAD_ASSET)) {
                Log.i(TAG, "Loading preload from assets://" + PRELOAD_ASSET);
                delegate.loadScriptFromAssets(context.getAssets(), "assets://" + PRELOAD_ASSET, false);
            }
        } catch (Throwable t) {
            Log.e(TAG, "Preload injection failed; continuing Discord boot", t);
        }
    }

    /**
     * Runs right after Discord's Hermes bundle finishes executing without
     * overwriting React Native's primary {@code sourceURL}.
     */
    public static void afterBundle(JSBundleLoaderDelegate delegate) {
        Application context = app;
        if (context == null || delegate == null) {
            return;
        }
        try {
            File dir = getNekocordDir(context);
            File devBundle = findDevOverride(context, DEV_BUNDLE_NAME);
            if (devBundle != null) {
                Log.i(TAG, "Loading dev bundle from " + devBundle.getAbsolutePath());
                delegate.loadSplitBundleFromFile(devBundle.getAbsolutePath(), BUNDLE_ASSET);
                return;
            }
            if (!assetExists(context.getAssets(), BUNDLE_ASSET)) {
                Log.w(TAG, "Asset " + BUNDLE_ASSET + " not found; skipping Nekocord runtime");
                return;
            }
            File extracted = syncAssetBundle(context, dir);
            Log.i(TAG, "Loading runtime bundle from " + extracted.getAbsolutePath());
            delegate.loadSplitBundleFromFile(extracted.getAbsolutePath(), BUNDLE_ASSET);
        } catch (Throwable t) {
            Log.e(TAG, "Runtime injection failed; continuing Discord boot", t);
        }
    }

    private static File findDevOverride(Application context, String fileName) {
        try {
            File extDir = context.getExternalFilesDir("nekocord");
            if (extDir != null) {
                File extFile = new File(extDir, fileName);
                if (extFile.isFile() && extFile.canRead()) {
                    return extFile;
                }
            }
        } catch (Throwable ignored) {
        }
        File internalFile = new File(getNekocordDir(context), fileName);
        return (internalFile.isFile() && internalFile.canRead()) ? internalFile : null;
    }

    private static File getNekocordDir(Application context) {
        File dir = new File(context.getFilesDir(), "nekocord");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return dir;
    }

    private static boolean assetExists(AssetManager assets, String name) {
        try (InputStream ignored = assets.open(name)) {
            return true;
        } catch (IOException ignored) {
            return false;
        }
    }

    private static File syncAssetBundle(Application context, File dir) throws IOException {
        File target = new File(dir, BUNDLE_ASSET);
        File stamp = new File(dir, ".bundle.stamp");
        String currentStamp = resolveApkStamp(context);
        if (target.isFile() && currentStamp.equals(readText(stamp))) {
            return target;
        }
        try (InputStream in = context.getAssets().open(BUNDLE_ASSET);
             FileOutputStream out = new FileOutputStream(target, false)) {
            byte[] buf = new byte[16384];
            int read;
            while ((read = in.read(buf)) != -1) {
                out.write(buf, 0, read);
            }
        }
        writeText(stamp, currentStamp);
        return target;
    }

    private static String resolveApkStamp(Application context) {
        try {
            PackageInfo info = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            return info.versionName + ":" + info.lastUpdateTime;
        } catch (Throwable ignored) {
            return "unknown";
        }
    }

    private static String readText(File file) {
        if (!file.isFile()) {
            return "";
        }
        try (InputStream in = new java.io.FileInputStream(file)) {
            byte[] data = new byte[(int) Math.min(file.length(), 256)];
            int read = in.read(data);
            return read > 0 ? new String(data, 0, read, StandardCharsets.UTF_8) : "";
        } catch (IOException ignored) {
            return "";
        }
    }

    private static void writeText(File file, String content) {
        try (FileOutputStream out = new FileOutputStream(file, false)) {
            out.write(content.getBytes(StandardCharsets.UTF_8));
        } catch (IOException ignored) {
        }
    }
}
