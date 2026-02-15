# 📱 B-HUB POS - ANDROID APK GUIDE

This guide explains how to turn your web app into a native **Android APK** using Capacitor.

## ✅ PREREQUISITES

1.  **Node.js** installed (you have this).
2.  **Android Studio** installed (Download from: [developer.android.com](https://developer.android.com/studio)).
3.  **Java JDK 17** (Usually included with Android Studio).

## 🚀 STEP 1: PREPARE THE BUILD

I have already initialized Capacitor for you. Now, generate the latest web drive:

```bash
# 1. Build the web app (creates 'dist' folder)
npm run build

# 2. Sync the web app to the Android native project
npx cap sync
```

## 🛠 STEP 2: OPEN IN ANDROID STUDIO

1.  Open **Android Studio**.
2.  Click **"Open"** (or File > Open).
3.  Navigate to your project folder: `/Users/bhaeesma/Downloads/posbhaees/android`.
4.  Select the **`android`** folder and click **Open**.
5.  Wait for Gradle sync to finish (bottom bar).

## 📦 STEP 3: BUILD THE APK

1.  In the top menu, click **Build**.
2.  Select **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3.  Wait for the build to complete.
4.  Click the **"locate"** link in the "Build APK" notification (bottom right).
    - Or find it at: `android/app/build/outputs/apk/debug/app-debug.apk`.

## 📲 STEP 4: INSTALL ON DEVICE

1.  Copy the `app-debug.apk` to your tablet/phone.
2.  Tap to install (Allow "Install from Unknown Sources" if asked).
3.  **Done!** Your B-HUB POS is now a native Android app.

## ⚠️ TROUBLESHOOTING

-   **Gradle Errors?** ensure you have the latest Android SDK Platform installed via SDK Manager in Android Studio.
-   **White Screen?** Check if you copied the `dist` folder correctly (`npm run build`).
-   **API Errors?** Ensure your `.env` variables are baked into the build (Vite does this automatically during build).

---

**Note:** For a "Release" (Production) APK to upload to Play Store, select **Generate Signed Bundle / APK** in Step 3 and follow the signing wizard.
