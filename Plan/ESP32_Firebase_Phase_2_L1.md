# ESP32 + ESPHome + Firebase RTDB — Phase 2
## L1: เชื่อมต่อ ESPHome กับ Firebase Realtime Database ด้วยค่าคงที่

> เอกสารนี้เป็นขั้นถัดจาก `ESP32_Firebase_GitHub_Dashboard_Project_Plan.md`
>
> เป้าหมายของ Phase 2 คือทำให้ ESP32 ที่ติดตั้ง ESPHome สำเร็จแล้ว สามารถส่งข้อมูลค่าคงที่ไปยัง Firebase Realtime Database ผ่าน REST API ได้จริง
>
> **ยังไม่ทำ:** random sensor, history, timestamp, GitHub Pages Dashboard, MQTT หรือระบบหลายอุปกรณ์

---

# 1. เป้าหมาย

เมื่อจบ Phase นี้ ระบบต้องทำงานดังนี้:

```text
ESP32
  ↓
ESPHome + Wi-Fi
  ↓
HTTP REST API / PUT
  ↓
Firebase Realtime Database
  ↓
/lab/esp32-01/latest
```

ข้อมูลทดสอบ:

```json
{
  "temp": 30,
  "humi": 60,
  "light": 500
}
```

# 2. ขอบเขต

## ต้องทำ
- ตรวจ ESP32/ESPHome พื้นฐาน
- ตรวจ Wi-Fi
- ตรวจ Firebase Realtime Database
- ใช้ Database URL จริงจาก Firebase
- ตั้ง Firebase Rules ตามเอกสารงาน
- เพิ่ม `http_request`
- ส่งข้อมูลด้วย HTTP `PUT`
- เขียนไป `/lab/esp32-01/latest`
- ตรวจ HTTP status
- ตรวจข้อมูลใน Firebase
- ทดสอบทั้งกรณีสำเร็จและผิดพลาด

## ยังไม่ทำ
- `POST /history`
- Firebase Push ID
- SNTP
- timestamp
- random values
- sensor จริง
- GitHub Pages
- Firebase Web SDK
- Realtime Dashboard
- หลาย ESP32

# 3. Prerequisites

ต้องผ่านทั้งหมดก่อน:
- [ ] สร้าง `esp32-01`
- [ ] Board ตรงกับ ESP32 จริง
- [ ] Framework เป็น ESP-IDF
- [ ] Flash firmware พื้นฐานสำเร็จ
- [ ] ESP32 เชื่อม Wi-Fi ได้
- [ ] เปิด Logs ได้
- [ ] มี Firebase project
- [ ] เปิด Realtime Database แล้ว

ถ้าข้อใดไม่ผ่าน ให้หยุดและแก้จุดนั้นก่อน

# 4. Firebase Realtime Database

เข้า Firebase Console → Build → Realtime Database

ถ้ายังไม่มี Database ให้สร้างก่อน

ใช้ region ตามเอกสารงาน/ที่กำหนด โดยเอกสารยกตัวอย่าง `asia-southeast1`

**ห้ามสร้าง Database URL ขึ้นมาเอง** ให้ใช้ URL จริงที่ Firebase แสดง

# 5. Firebase Rules

สำหรับ Lab ใช้:

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

จากนั้น Publish

> Rules นี้เป็นกติกาสำหรับ Lab ตามโจทย์ ไม่ควรนำไปใช้เป็น production security โดยไม่มี authentication/authorization เพิ่มเติม

# 6. Database Path

ใช้โครงสร้าง:

```text
/lab/esp32-01/latest
```

ผลลัพธ์:

```text
lab
└── esp32-01
    └── latest
        ├── temp
        ├── humi
        └── light
```

# 7. Firebase REST URL

ถ้า Firebase แสดง:

```text
https://YOUR_DATABASE_URL/
```

endpoint สำหรับ L1 คือ:

```text
https://YOUR_DATABASE_URL/lab/esp32-01/latest.json
```

**ใช้ URL จริงจาก Firebase เท่านั้น ห้ามเดา**

# 8. REST Method

L1 ใช้:

```text
PUT
```

PUT = เขียน/แทนที่ข้อมูลที่ path ที่กำหนด

ตัวอย่าง body:

```json
{
  "temp": 30,
  "humi": 60,
  "light": 500
}
```

# 9. ESPHome http_request

เพิ่ม component:

```yaml
http_request:
```

ต้องใช้ syntax ที่ตรงกับ ESPHome version ที่ติดตั้งจริง

**ห้ามให้ AI ใช้ syntax จาก ESPHome รุ่นเก่าโดยไม่ตรวจสอบ**

# 10. ค่าคงที่

ใช้:

```text
temp  = 30
humi  = 60
light = 500
```

เหตุผลคือเราต้องแยกปัญหา Firebase/HTTP ออกจากปัญหาการสร้าง sensor และ random data

# 11. การส่งข้อมูล

ลำดับ:

```text
ESP32 boot
 ↓
Wi-Fi connected
 ↓
HTTP PUT
 ↓
Firebase /lab/esp32-01/latest
 ↓
ตรวจ HTTP status
```

สำหรับการทดสอบครั้งแรก สามารถส่งหลัง boot เพียงครั้งเดียวก่อน แล้วค่อยเพิ่ม interval เมื่อ L1 ผ่าน

# 12. HTTP Status

ต้อง Log ผลลัพธ์ให้เห็นชัดเจน

ต้องตรวจว่า request สำเร็จหรือไม่จาก HTTP response/status ไม่ใช่แค่แสดงว่า request ถูกเรียก

# 13. Testing

## Test 1 — Firebase
เปิด Realtime Database และตรวจว่าพร้อมรับข้อมูล

## Test 2 — Wi-Fi
เปิด ESPHome Logs และยืนยันว่า ESP32 เชื่อมต่อ Wi-Fi สำเร็จ

## Test 3 — HTTP PUT
ส่งข้อมูลและตรวจ HTTP status ใน Logs

## Test 4 — Firebase Data
ตรวจ:

```text
lab
└── esp32-01
    └── latest
```

ต้องพบ:

```text
temp: 30
humi: 60
light: 500
```

# 14. ทดสอบ PUT ทับข้อมูลเดิม

เปลี่ยนค่าทดสอบ เช่น:

```text
temp = 31
```

ส่ง PUT ใหม่

Firebase ต้องเปลี่ยนค่า `temp` เป็น `31` ที่ `latest`

ไม่ควรสร้าง node ใหม่หลายตัว เพราะ L1 ใช้ PUT ที่ path เดิม

# 15. Error Testing

ทดสอบอย่างน้อย:

### URL ผิด
ใช้ URL ผิดชั่วคราว → ตรวจ Logs → คืน URL ที่ถูกต้อง

### Path ผิด
ใช้ endpoint ผิดชั่วคราว → ตรวจ HTTP response

### Wi-Fi ไม่มี
ทำให้ ESP32 ต่อ Wi-Fi ไม่ได้ → ตรวจ Logs

### Firebase Rules
ตรวจว่าการเข้าถึง path เป็นไปตาม Rules

# 16. Definition of Done

- [ ] ESP32 ทำงานด้วย ESPHome
- [ ] Wi-Fi เชื่อมต่อได้
- [ ] ESPHome ส่ง HTTP request ได้
- [ ] ใช้ HTTP `PUT`
- [ ] ใช้ Firebase Database URL จริง
- [ ] ใช้ `/lab/esp32-01/latest`
- [ ] Firebase มี `temp`
- [ ] Firebase มี `humi`
- [ ] Firebase มี `light`
- [ ] ค่า Firebase ตรงกับ ESP32
- [ ] เปลี่ยนค่าคงที่แล้ว PUT ทับค่าเดิมได้
- [ ] มี HTTP status/error logging
- [ ] ทดสอบ error เบื้องต้นแล้ว
- [ ] ยังไม่มี `/history`
- [ ] ยังไม่มี timestamp
- [ ] ยังไม่มี Dashboard

# 17. Prompt สำหรับ AI Coding Assistant

```text
You are implementing Phase 2 of an ESP32 + ESPHome + Firebase Realtime Database lab project.

CURRENT SCOPE:
Implement ONLY L1:
ESP32/ESPHome → Firebase Realtime Database using HTTP PUT.

GOAL:
Write constant test values to:
/lab/esp32-01/latest

Required data:
{
  "temp": 30,
  "humi": 60,
  "light": 500
}

REQUIREMENTS:
- Preserve the existing ESPHome configuration.
- Keep ESP-IDF unless there is a documented compatibility reason not to.
- Use the current ESPHome http_request syntax.
- Verify syntax against the installed/current ESPHome version.
- Use the real Firebase Realtime Database URL supplied by the user.
- Never invent or guess the Firebase URL.
- Use HTTP PUT.
- Append .json to the Firebase REST endpoint.
- Log the HTTP result/status clearly.
- Preserve existing Wi-Fi, API, OTA and logger configuration.
- Do not add random values.
- Do not add real sensors.
- Do not add history.
- Do not add timestamp/SNTP.
- Do not implement GitHub Pages.
- Do not implement Firebase Web SDK.
- Do not modify unrelated files.

BEFORE EDITING:
1. Inspect the existing ESPHome YAML.
2. Identify the installed ESPHome version.
3. Verify compatible http_request syntax.
4. Explain exactly which parts will change.
5. Do not make unrelated refactors.

AFTER EDITING:
1. Validate YAML.
2. Compile the firmware.
3. Flash only when the user explicitly proceeds.
4. Explain how to verify Firebase data.
5. Report errors and distinguish Wi-Fi / ESPHome / HTTP / Firebase URL / Rules problems.

SUCCESS CRITERIA:
- Firmware compiles.
- ESP32 connects to Wi-Fi.
- ESP32 sends HTTP PUT successfully.
- Firebase contains /lab/esp32-01/latest.
- temp, humi and light match the required values.
- HTTP result/status is visible in logs.
```

# 18. ขั้นถัดไปหลัง L1

เมื่อ L1 ผ่านแล้วค่อยไป:

```text
L2 → Random / Simulated Sensor Values
```

ช่วงค่าตามโจทย์:

```text
temp: 25–35 °C
humi: 50–80 %
light: 100–1000 lx
```

โดยแยก:
- sensor update ≈ 5 seconds
- cloud upload ≈ 10 seconds

จากนั้น:

```text
L3 → POST /history
L4 → SNTP + timestamp
L5 → latest + history
Final → GitHub Pages Dashboard
```

**อย่าข้าม L1 เพราะแต่ละ L ใช้ตรวจสอบระบบทีละชั้น**
