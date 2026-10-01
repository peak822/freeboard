# ESP32 + ESPHome + Firebase RTDB Setup Guide

This guide walks you through the step-by-step process of setting up Firebase Realtime Database, configuring ESPHome, and hosting the Realtime Web Dashboard on GitHub Pages.

---

## 1. Firebase Project Setup

### 1.1 Create Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Enter a project name (e.g., `esp32-iot-lab`).
4. (Optional) Disable Google Analytics for this lab project.
5. Click **Create project** and wait for provisioning to finish.

### 1.2 Create Realtime Database
1. In the left sidebar of the Firebase Console, select **Build** → **Realtime Database**.
2. Click **Create Database**.
3. Choose your database location:
   - Recommended for Thailand/Southeast Asia: `Singapore (asia-southeast1)`.
   - Default: `United States (us-central1)`.
4. In the Security rules dialog, select **Start in locked mode** or **Start in test mode**, then click **Enable**.
5. Copy your **Database URL** displayed at the top of the database pane.
   - Format: `https://<PROJECT-ID>-default-rtdb.<REGION>.firebasedatabase.app`

### 1.3 Configure Firebase Security Rules
In the **Rules** tab of Realtime Database, paste the instructor-specified lab rules:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "lab": {
      ".read": true,
      ".write": true
    }
  }
}
```
Click **Publish**.

> [!NOTE]
> These rules permit read and write operations exclusively inside `/lab`, which protects any root metadata while allowing the ESP32 and Dashboard to communicate freely without auth tokens during lab demonstrations.

---

## 2. ESPHome Configuration & Secrets

### 2.1 Set Up Secrets
1. Navigate to the `esphome/` folder.
2. Copy `secrets.example.yaml` to `secrets.yaml`:
   ```bash
   cp esphome/secrets.example.yaml esphome/secrets.yaml
   ```
3. Open `esphome/secrets.yaml` and update your actual Wi-Fi SSID, Password, and Firebase URLs:

```yaml
wifi_ssid: "Your_Actual_WiFi_SSID"
wifi_password: "Your_Actual_WiFi_Password"

firebase_base_url: "https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app"
firebase_latest_url: "https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app/lab/esp32-01/latest.json"
firebase_history_url: "https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app/lab/esp32-01/history.json"
```

### 2.2 Flashing ESPHome to ESP32
Connect your ESP32 board via USB, then run:

```bash
# Level 1: Constant data test
esphome run esphome/firebase-l1.yaml

# Or Level 5 / Production release:
esphome run esphome/firebase-final.yaml
```

---

## 3. GitHub Pages Deployment

1. Commit and push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "feat: complete ESP32 Firebase IoT dashboard"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. On GitHub, go to your repository's **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
4. Set Branch to `main` and Folder to `/ (root)`.
5. Click **Save**.
6. Within 1-2 minutes, your dashboard will be live at:
   `https://<your-username>.github.io/<your-repo-name>/`
7. Open the live URL, click **Settings**, paste your Realtime Database URL, and click **Save & Connect**!
