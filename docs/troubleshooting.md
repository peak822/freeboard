# Troubleshooting & Diagnostics Matrix

This guide provides targeted solutions for common networking, Firebase, ESPHome, and Dashboard issues.

---

## 1. Diagnostic Matrix

| Error / Symptom | Root Cause | Resolution |
|---|---|---|
| **ESP32 logs `Skip Firebase: WiFi not connected`** | ESP32 failed to associate with Wi-Fi AP | Check `wifi_ssid` and `wifi_password` in `secrets.yaml`. Ensure 2.4 GHz band is used (ESP32 does not support 5 GHz). |
| **ESP32 logs `Skip Firebase: WiFi or time not ready`** | SNTP server unreachable or UDP port 123 blocked | Ensure your router allows outbound NTP traffic on UDP 123. Verify `timezone: "Asia/Bangkok"`. |
| **HTTP Status `401 Unauthorized` or `403 Forbidden`** | Firebase Security Rules deny access | Check Firebase Console → Realtime Database → Rules. Ensure `lab` has `".read": true` and `".write": true`. |
| **HTTP Status `404 Not Found`** | Endpoint URL missing `.json` extension or invalid path | Verify URL ends with `.json`. Path must be `/lab/esp32-01/latest.json` or `/lab/esp32-01/history.json`. |
| **Dashboard shows "Connecting to Firebase..." indefinitely** | Invalid Database URL or network firewall blocking WebSocket | Click **Settings** in the dashboard and verify your `databaseURL`. Check browser developer console for CORS/WSS errors. |
| **Dashboard values are stuck or not updating live** | Firebase Realtime Database listener not attached to `/lab/esp32-01/latest` | Open developer console (F12) to inspect active WebSocket subscriptions. Verify node name matches `IOT_CONFIG.latestPath`. |
| **Chart timestamps show year 1970 or invalid dates** | Timestamp unit mismatch (seconds vs milliseconds) | ESP32 Unix timestamp is in **seconds**. Dashboard multiplies by `1000` to convert to JavaScript milliseconds. |
| **History table is empty despite ESP32 running** | ESP32 using PUT instead of POST for history | Verify you are using `firebase-l5.yaml` or `firebase-final.yaml` which sends POST to `history.json`. |

---

## 2. Common Quick Checks

### Check Firebase RTDB via Browser / cURL
You can test your Firebase Database URL directly in your terminal:

```bash
# Test reading latest data
curl "https://<YOUR-PROJECT-ID>-default-rtdb.asia-southeast1.firebasedatabase.app/lab/esp32-01/latest.json"

# Test manual PUT
curl -X PUT -d '{"temp":27.5,"humi":60.0,"light":400,"timestamp":1789237000}' \
  "https://<YOUR-PROJECT-ID>-default-rtdb.asia-southeast1.firebasedatabase.app/lab/esp32-01/latest.json"
```
