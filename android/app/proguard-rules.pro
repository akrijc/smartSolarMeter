# --- React Native TurboModules & Reanimated ---
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# --- ML Kit pro @react-native-ml-kit/text-recognition ---
-keep class com.google.mlkit.vision.text.** { *; }
-keep class com.google.mlkit.vision.common.** { *; }
-keep class com.google.mlkit.vision.interfaces.** { *; }
-keep class com.google.mlkit.common.sdkinternal.** { *; }
-keep class com.google.mlkit.common.model.** { *; }
-keep class com.google.android.gms.tasks.** { *; }

# Pokud se používá TextRecognizerOptions (někdy vyžadováno výslovně)
-keep class com.google.mlkit.vision.text.TextRecognizerOptions { *; }

# --- Zachování anotací a typových informací ---
-keepattributes *Annotation*, Signature