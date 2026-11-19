package com.facebook.react.bridge;

import android.content.res.AssetManager;

/**
 * Compile-only stub matching Discord's {@code JSBundleLoaderDelegate} contract.
 * Excluded from the packaged DEX so the host APK's class is used at runtime.
 */
public interface JSBundleLoaderDelegate {
    void loadScriptFromAssets(AssetManager assetManager, String assetURL, boolean loadSynchronously);

    void loadScriptFromFile(String fileName, String sourceURL, boolean loadSynchronously);

    void loadSplitBundleFromFile(String fileName, String sourceURL);

    void setSourceURLs(String deviceURL, String remoteURL);
}
