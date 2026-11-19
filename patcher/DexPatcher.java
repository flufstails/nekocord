import brut.androlib.smali.SmaliBuilder;
import brut.androlib.smali.SmaliDecoder;
import com.android.tools.smali.dexlib2.Opcodes;
import com.android.tools.smali.dexlib2.dexbacked.DexBackedDexFile;
import com.android.tools.smali.dexlib2.writer.builder.DexBuilder;
import com.android.tools.smali.dexlib2.writer.io.FileDataStore;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.stream.Stream;

/**
 * Applies surgical Nekocord bootstrap hooks to Discord's primary {@code classes.dex}
 * without decoding or re-encoding APK resources or secondary DEX shards.
 */
public final class DexPatcher {
    private static final String MAIN_APP_REL = "com/discord/MainApplication.smali";
    private static final String ASSET_LOADER_REL =
        "com/facebook/react/bridge/JSBundleLoader$Companion$createAssetLoader$1.smali";
    private static final String FILE_LOADER_REL =
        "com/facebook/react/bridge/JSBundleLoader$Companion$createFileLoader$1.smali";

    public static void main(String[] args) throws Exception {
        if (args.length != 3) {
            System.err.println("Usage: DexPatcher <base.apk> <out-classes.dex> <temp-smali-dir>");
            System.exit(2);
        }

        File baseApk = new File(args[0]);
        File outDex = new File(args[1]);
        Path smaliDir = Path.of(args[2]);

        deleteDirectory(smaliDir);
        Files.createDirectories(smaliDir);
        if (outDex.getParentFile() != null) {
            outDex.getParentFile().mkdirs();
        }
        if (outDex.exists() && !outDex.delete()) {
            throw new IOException("Could not remove existing output dex: " + outDex);
        }

        long t0 = System.currentTimeMillis();
        SmaliDecoder decoder = new SmaliDecoder(baseApk, false);
        DexBackedDexFile dexFile = (DexBackedDexFile) decoder.mDexContainer.getEntries().get("classes.dex");
        if (dexFile == null) {
            throw new IllegalStateException("classes.dex not found in " + baseApk);
        }

        decoder.decodeFile(dexFile, smaliDir.toFile());
        int apiLevel = Math.max(dexFile.opcodes.api, decoder.mInferredApiLevel.get());
        System.out.println("Decoded classes.dex (API " + apiLevel + ") in " + (System.currentTimeMillis() - t0) + "ms");

        patchMainApplication(smaliDir.resolve(MAIN_APP_REL));
        patchBundleLoader(
            smaliDir.resolve(ASSET_LOADER_REL),
            "    invoke-interface {p1, v0, v1, v2}, Lcom/facebook/react/bridge/JSBundleLoaderDelegate;->loadScriptFromAssets(Landroid/content/res/AssetManager;Ljava/lang/String;Z)V"
        );
        patchBundleLoader(
            smaliDir.resolve(FILE_LOADER_REL),
            "    invoke-interface {p1, v0, v1, v2}, Lcom/facebook/react/bridge/JSBundleLoaderDelegate;->loadScriptFromFile(Ljava/lang/String;Ljava/lang/String;Z)V"
        );

        long t1 = System.currentTimeMillis();
        DexBuilder dexBuilder = new DexBuilder(new Opcodes(apiLevel));
        SmaliBuilder smaliBuilder = new SmaliBuilder(apiLevel);

        try (Stream<Path> walk = Files.walk(smaliDir)) {
            Path[] smaliFiles = walk
                .filter((p) -> Files.isRegularFile(p) && p.toString().endsWith(".smali"))
                .sorted()
                .toArray(Path[]::new);

            for (Path smaliFile : smaliFiles) {
                if (!smaliBuilder.buildFile(smaliFile.toFile(), dexBuilder)) {
                    throw new IllegalStateException("Failed to assemble smali file: " + smaliFile);
                }
            }
            System.out.println("Assembled " + smaliFiles.length + " smali files in " + (System.currentTimeMillis() - t1) + "ms");
        }

        dexBuilder.writeTo(new FileDataStore(outDex));
        System.out.println("Wrote patched classes.dex -> " + outDex);
    }

    private static void patchMainApplication(Path path) throws IOException {
        String content = Files.readString(path, StandardCharsets.UTF_8);
        String anchor = "    invoke-super {p0}, Landroid/app/Application;->onCreate()V";
        String replacement = anchor + "\n\n    invoke-static {p0}, Lcom/nekocord/NekocordLoader;->init(Landroid/app/Application;)V";
        String patched = replaceExactOnce(content, anchor, replacement, MAIN_APP_REL);
        Files.writeString(path, patched, StandardCharsets.UTF_8);
    }

    private static void patchBundleLoader(Path path, String anchor) throws IOException {
        String content = Files.readString(path, StandardCharsets.UTF_8);
        String replacement =
            "    invoke-static {p1}, Lcom/nekocord/NekocordLoader;->beforeBundle(Lcom/facebook/react/bridge/JSBundleLoaderDelegate;)V\n\n"
                + anchor
                + "\n\n    invoke-static {p1}, Lcom/nekocord/NekocordLoader;->afterBundle(Lcom/facebook/react/bridge/JSBundleLoaderDelegate;)V";
        String patched = replaceExactOnce(content, anchor, replacement, path.toString());
        Files.writeString(path, patched, StandardCharsets.UTF_8);
    }

    private static String replaceExactOnce(String content, String target, String replacement, String label) {
        String normalizedTarget = target;
        if (content.contains("\r\n")) {
            normalizedTarget = target.replace("\n", "\r\n");
            replacement = replacement.replace("\n", "\r\n");
        }
        int first = content.indexOf(normalizedTarget);
        if (first < 0) {
            throw new IllegalStateException("Hook anchor not found in " + label + ": " + target);
        }
        int second = content.indexOf(normalizedTarget, first + normalizedTarget.length());
        if (second >= 0) {
            throw new IllegalStateException("Hook anchor matched multiple times in " + label + ": " + target);
        }
        return content.substring(0, first)
            + replacement
            + content.substring(first + normalizedTarget.length());
    }

    private static void deleteDirectory(Path dir) throws IOException {
        if (!Files.exists(dir)) {
            return;
        }
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach((p) -> {
                try {
                    Files.delete(p);
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            });
        }
    }
}
