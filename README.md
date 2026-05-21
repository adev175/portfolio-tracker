# Portfolio Tracker · Hướng dẫn deploy

**Stack:** GitHub Pages (PWA) + Google Apps Script → Slack  
**Chi phí:** $0 hoàn toàn

---

## PHẦN 1 — Deploy PWA lên GitHub Pages

### Bước 1: Tạo repo GitHub

1. Vào **github.com** → **New repository**
2. Đặt tên: `portfolio-tracker`
3. Chọn **Public**
4. Nhấn **Create repository**

### Bước 2: Upload code

```bash
# Clone repo vừa tạo
git clone https://github.com/TEN_BAN/portfolio-tracker.git
cd portfolio-tracker

# Copy các file sau vào thư mục này:
#   index.html
#   manifest.json
#   sw.js
#   .github/workflows/deploy.yml

git add .
git commit -m "init portfolio tracker PWA"
git push origin main
```

### Bước 3: Bật GitHub Pages

1. Vào repo → **Settings** → **Pages**
2. **Source:** chọn **GitHub Actions**
3. Nhấn **Save**

→ GitHub Actions tự chạy, sau ~1 phút có URL:  
`https://TEN_BAN.github.io/portfolio-tracker`

### Bước 4: Tạo icon PNG (bắt buộc cho PWA)

Truy cập **https://favicon.io/favicon-generator/**
- Background: `#0f172a` · Foreground: `#3b82f6` · Text: `₿`
- Download → lấy 2 file PNG, đổi tên thành `icon-192.png` và `icon-512.png`
- Upload lên repo cùng với các file trên

### Bước 5: Lấy Finnhub API key (miễn phí)

1. Vào **https://finnhub.io/register**
2. Đăng ký bằng email
3. Copy API key từ dashboard
4. Mở app → ⚙ Cài đặt → dán key vào ô **Finnhub API Key**

---

## PHẦN 2 — Cài app lên điện thoại (PWA)

### Android (Chrome)
1. Mở URL của app trong Chrome
2. Thanh banner "Cài đặt" hiện → nhấn **Cài đặt**
3. Hoặc: menu ⋮ → **Add to Home screen**

### iPhone (Safari)
1. Mở URL trong **Safari** (bắt buộc, Chrome không có tính năng này trên iOS)
2. Nhấn nút **Share** (icon hộp có mũi tên lên)
3. Cuộn xuống → **Add to Home Screen**
4. Nhấn **Add**

→ App hiện trên màn hình chính, mở như app thật, không có thanh địa chỉ.

---

## PHẦN 3 — Slack Daily Report (Google Apps Script)

### Bước 1: Tạo Slack Webhook

1. Vào **https://api.slack.com/apps** → **Create New App** → **From scratch**
2. Đặt tên app: `Portfolio Bot`
3. **Incoming Webhooks** → bật **On**
4. **Add New Webhook to Workspace** → chọn channel muốn nhận báo cáo
5. Copy URL webhook (dạng `https://hooks.slack.com/services/...`)

### Bước 2: Setup Apps Script

1. Vào **https://script.google.com** → **New project**
2. Đặt tên: `Portfolio Slack Reporter`
3. Copy nội dung file `apps-script/Code.gs` vào editor
4. Điền 2 giá trị trong CONFIG:
   ```javascript
   SLACK_WEBHOOK: 'https://hooks.slack.com/services/XXX/YYY/ZZZ',
   FINNHUB_KEY:   'd1xxxxxxxx',
   ```
5. Điều chỉnh `HOLDINGS` theo số lượng bạn thực sự nắm giữ:
   ```javascript
   HOLDINGS: { BTC: 0.05, ETH: 0.3, NVDA: 2 }
   ```

### Bước 3: Test trước

1. Chọn function `testReport` từ dropdown
2. Nhấn **Run**
3. Lần đầu sẽ hỏi quyền → **Allow**
4. Kiểm tra Slack — báo cáo xuất hiện trong ~10 giây

### Bước 4: Đặt lịch tự động

1. Chọn function `setupTrigger`
2. Nhấn **Run**
3. → Mỗi ngày lúc 8:00 sáng Tokyo, báo cáo tự gửi vào Slack

---

## Tóm tắt chi phí

| Thành phần       | Service           | Chi phí |
|-----------------|-------------------|---------|
| Host web/PWA    | GitHub Pages      | Free    |
| Giá crypto      | CoinGecko API     | Free    |
| Giá NVDA        | Finnhub free tier | Free    |
| Báo cáo tự động | Google Apps Script| Free    |
| Kênh nhận report| Slack webhook     | Free    |
| AI phân tích    | Rule-based (built-in) | Free |

**Tổng: $0/tháng**

---

## Tùy chỉnh thêm portfolio

Mở `index.html`, tìm phần HTML của các asset card và nhân bản để thêm coin/cổ phiếu khác.  
Tương tự trong `apps-script/Code.gs`, thêm vào `CONFIG.HOLDINGS` và cập nhật hàm `fetchPrices()`.
