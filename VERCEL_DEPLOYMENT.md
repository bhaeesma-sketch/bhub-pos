# ☁️ DEPLOYING B-HUB POS TO VERCEL

You can deploy the B-HUB POS to the web for free using Vercel. This allows you to access the **Owner Dashboard** from anywhere.

## ✅ PREREQUISITES
1.  A GitHub Account.
2.  A Vercel Account (Free).
3.  Your Firebase Config Keys (from `.env`).

## 🚀 STEP 1: PUSH TO GITHUB
1.  Initialize Git (if not done):
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  Create a new repo on GitHub.
3.  Push your code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/bhub-pos.git
    git push -u origin main
    ```

## 🌐 STEP 2: CONNECT TO VERCEL
1.  Go to [vercel.com](https://vercel.com) and Log In.
2.  Click **"Add New..."** > **"Project"**.
3.  Import your `bhub-pos` repository.
4.  **Configure Project:**
    - **Framework Preset:** Vite (should be auto-detected).
    - **Root Directory:** `./`
5.  **Environment Variables:**
    - Expand "Environment Variables".
    - Copy ALL keys from your local `.env` file and paste them here.
    - Example: `VITE_FIREBASE_API_KEY`, etc.
6.  Click **"Deploy"**.

## 📱 ACCESSING THE APP
-   Once deployed, Vercel will give you a URL (e.g., `https://bhub-pos.vercel.app`).
-   **Owner Dashboard:** `https://bhub-pos.vercel.app/bhub/owner/STORE001`
-   **POS Terminal:** `https://bhub-pos.vercel.app/bhub`

## ⚠️ IF BUILD FAILS
If you see "Command failed with exit code 1" on Vercel:
-   Check the Build Logs.
-   If it says "Stack size exceeded", try checking your imports or ask for support.
-   Ensure you added ALL environment variables correctly.

**Your POS is now live on the cloud!** 🚀
