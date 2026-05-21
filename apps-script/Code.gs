// ============================================================
// Portfolio Tracker — Slack Daily Report
// Google Apps Script · Hoàn toàn miễn phí
// ============================================================
// Cài đặt:
//   1. Vào script.google.com → New project
//   2. Paste toàn bộ code này vào
//   3. Điền SLACK_WEBHOOK và FINNHUB_KEY bên dưới
//   4. Chạy setupTrigger() một lần để đặt lịch tự động
// ============================================================

const CONFIG = {
  SLACK_WEBHOOK: 'https://hooks.slack.com/services/XXX/YYY/ZZZ', // ← thay vào đây
  FINNHUB_KEY:   'd1xxxxxxxxxxxxxxxx',                             // ← finnhub.io (free)
  REPORT_HOUR:   8,    // Gửi lúc 8 giờ sáng
  TIMEZONE:      'Asia/Tokyo',

  // Portfolio của bạn — chỉnh số lượng ở đây
  HOLDINGS: {
    BTC:  0.01,
    ETH:  0.1,
    NVDA: 1,
  }
}

// ── Main: gửi báo cáo ───────────────────────────────────────
function sendDailyReport() {
  try {
    const prices  = fetchPrices()
    const report  = buildReport(prices)
    sendSlack(report)
    Logger.log('✅ Gửi báo cáo thành công: ' + new Date())
  } catch(e) {
    Logger.log('❌ Lỗi: ' + e.message)
  }
}

// ── Fetch giá ───────────────────────────────────────────────
function fetchPrices() {
  // Crypto: CoinGecko (free, không cần key)
  const cgUrl = 'https://api.coingecko.com/api/v3/simple/price' +
    '?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
  const cgRes  = UrlFetchApp.fetch(cgUrl)
  const cgData = JSON.parse(cgRes.getContentText())

  // NVDA: Finnhub (free tier, cần key)
  const fhUrl  = `https://finnhub.io/api/v1/quote?symbol=NVDA&token=${CONFIG.FINNHUB_KEY}`
  const fhRes  = UrlFetchApp.fetch(fhUrl)
  const fhData = JSON.parse(fhRes.getContentText())

  const nvdaPrice  = fhData.c
  const nvdaChange = fhData.pc > 0 ? ((fhData.c - fhData.pc) / fhData.pc * 100) : 0

  const fxUrl  = 'https://api.exchangerate.host/latest?base=USD&symbols=JPY'
  const fxRes  = UrlFetchApp.fetch(fxUrl)
  const fxData = JSON.parse(fxRes.getContentText())
  const usdJpy = fxData && fxData.rates ? fxData.rates.JPY : null

  return {
    BTC:  { price: cgData.bitcoin.usd,  chg24h: cgData.bitcoin.usd_24h_change },
    ETH:  { price: cgData.ethereum.usd, chg24h: cgData.ethereum.usd_24h_change },
    NVDA: { price: nvdaPrice,           chg24h: nvdaChange },
    FX:   { usdJpy: usdJpy },
  }
}

// ── Tính portfolio ───────────────────────────────────────────
function buildReport(prices) {
  const h = CONFIG.HOLDINGS
  const vals = {
    BTC:  prices.BTC.price  * h.BTC,
    ETH:  prices.ETH.price  * h.ETH,
    NVDA: prices.NVDA.price * h.NVDA,
  }
  const total   = vals.BTC + vals.ETH + vals.NVDA
  const todayPL = (vals.BTC  * prices.BTC.chg24h  +
                   vals.ETH  * prices.ETH.chg24h  +
                   vals.NVDA * prices.NVDA.chg24h) / 100
  const todayPct = total > 0 ? (todayPL / (total - todayPL) * 100) : 0

  // Rule-based analysis — không cần AI API
  const insights = generateInsights(prices, vals, total, todayPL, todayPct)

  const fxRate = prices.FX.usdJpy

  return { prices, vals, total, todayPL, todayPct, insights, fxRate }
}

// ── Rule-based analysis (free, không cần AI) ────────────────
function generateInsights(prices, vals, total, todayPL, todayPct) {
  const msgs = []
  const cryptoPct = total > 0 ? ((vals.BTC + vals.ETH) / total * 100) : 0

  if (todayPct <= -3)      msgs.push('🔴 Giảm mạnh hôm nay — giữ bình tĩnh, không panic sell')
  else if (todayPct >= 3)  msgs.push('🟢 Tăng tốt hôm nay — cân nhắc chốt một phần nếu đã đủ target')
  else                     msgs.push('🟡 Thị trường ổn định')

  const btcChg  = prices.BTC.chg24h
  const ethChg  = prices.ETH.chg24h
  const nvdaChg = prices.NVDA.chg24h

  if (Math.abs(btcChg - ethChg) > 3) {
    msgs.push((btcChg > ethChg ? '₿ BTC' : 'Ξ ETH') + ' outperform hôm nay')
  }
  if (Math.abs(nvdaChg) > 5) {
    msgs.push('🖥 NVDA biến động lớn (' + fmt(nvdaChg) + '%) — check tin AI/chip')
  }
  if (cryptoPct > 80) {
    msgs.push('⚠ Crypto chiếm ' + cryptoPct.toFixed(0) + '% — xem xét rebalance')
  }

  return msgs
}

// ── Build Slack message (Block Kit) ─────────────────────────
function buildSlackBlocks(report) {
  const { prices, vals, total, todayPL, todayPct, insights, fxRate } = report
  const plSign  = todayPL >= 0 ? '+' : ''
  const plEmoji = todayPL >= 0 ? '📈' : '📉'
  const now     = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'HH:mm dd/MM/yyyy')

  const fmtStock = n => jpy(toJpy(n, fxRate))
  const assetLine = (name, p, chg, val, fmtMoney) =>
    `${chgEmoji(chg)} *${name}* ${fmtMoney(p)} (${fmt(chg)}%) · giữ: ${fmtMoney(val)}`

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${plEmoji} Portfolio Report · ${now}` }
    },
    { type: 'divider' },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Tổng giá trị*\n${usd(total)}` },
        { type: 'mrkdwn', text: `*Hôm nay*\n${plSign}${usd(Math.abs(todayPL))} (${fmt(todayPct)}%)` },
      ]
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          assetLine('BTC',  prices.BTC.price,  prices.BTC.chg24h,  vals.BTC,  usd),
          assetLine('ETH',  prices.ETH.price,  prices.ETH.chg24h,  vals.ETH,  usd),
          assetLine('NVDA', prices.NVDA.price, prices.NVDA.chg24h, vals.NVDA, fmtStock),
        ].join('\n')
      }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: '*Nhận xét*\n' + insights.join('\n') }
    },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: 'CoinGecko · Finnhub · Google Apps Script · _Hoàn toàn miễn phí_' }
      ]
    }
  ]

  return blocks
}

// ── Gửi Slack ────────────────────────────────────────────────
function sendSlack(report) {
  const payload = JSON.stringify({ blocks: buildSlackBlocks(report) })
  UrlFetchApp.fetch(CONFIG.SLACK_WEBHOOK, {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
  })
}

// ── Cài trigger tự động ──────────────────────────────────────
// Chạy hàm này MỘT LẦN từ Editor để đặt lịch hàng ngày
function setupTrigger() {
  // Xóa trigger cũ nếu có
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t))

  ScriptApp.newTrigger('sendDailyReport')
    .timeBased()
    .everyDays(1)
    .atHour(CONFIG.REPORT_HOUR)
    .inTimezone(CONFIG.TIMEZONE)
    .create()

  Logger.log('✅ Trigger đã đặt: mỗi ngày lúc ' + CONFIG.REPORT_HOUR + ':00 ' + CONFIG.TIMEZONE)
}

// ── Chạy thủ công để test ────────────────────────────────────
function testReport() {
  sendDailyReport()
}

// ── Helpers ──────────────────────────────────────────────────
function usd(n) {
  if (n == null) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function jpy(n) {
  if (n == null) return '—'
  return '¥' + n.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
}
function toJpy(usd, rate) {
  if (usd == null || !rate) return null
  return usd * rate
}
function fmt(n) { return (n >= 0 ? '+' : '') + n.toFixed(2) }
function chgEmoji(n) { return n > 0 ? '🟢' : n < 0 ? '🔴' : '⚪' }
