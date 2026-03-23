# Railway 部署指南 - Google Review Automation

## 前置要求

1. **Railway 帳號**：https://railway.app（免費註冊）
2. **GitHub 帳號**：用於連接 Railway
3. **環境變數準備**：見下方

## 部署步驟

### 1. 準備 GitHub 倉庫

```bash
# 初始化 Git（如果尚未初始化）
git init
git add .
git commit -m "Initial commit: Google Review Automation"

# 推送到 GitHub（需要先在 GitHub 建立倉庫）
git remote add origin https://github.com/YOUR_USERNAME/google-review-automation.git
git branch -M main
git push -u origin main
```

### 2. 在 Railway 上建立新專案

1. 訪問 https://railway.app
2. 登入或註冊
3. 點擊「New Project」
4. 選擇「Deploy from GitHub」
5. 授權 Railway 訪問你的 GitHub
6. 選擇 `google-review-automation` 倉庫
7. 點擊「Deploy」

### 3. 配置環境變數

在 Railway Dashboard 中，進入你的專案，點擊「Variables」，新增以下環境變數：

#### 必需的環境變數

```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=your-name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
NODE_ENV=production
```

#### 可選的環境變數

```
# 如果使用外部 LLM（OpenAI）
OPENAI_API_KEY=sk-...

# Playwright 配置
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
```

### 4. 配置數據庫

Railway 提供 MySQL 服務：

1. 在 Railway Dashboard 中，點擊「+ New」
2. 選擇「MySQL」
3. 等待數據庫建立完成
4. 複製 `DATABASE_URL` 到環境變數中

### 5. 驗證部署

1. 等待 Railway 完成構建（約 5-10 分鐘）
2. 部署完成後，你會看到一個公開 URL（例如：`https://your-app.railway.app`）
3. 訪問該 URL 並登入測試

## 部署後的配置

### 啟用 Playwright 自動化

Railway 已經包含 Chromium 和必要的系統依賴。Playwright 會在部署時自動安裝。

### 監控日誌

在 Railway Dashboard 中：

1. 進入你的專案
2. 點擊「Deployments」
3. 選擇最新的部署
4. 查看「Logs」標籤以查看實時日誌

### 自動重啟

Railway 會在以下情況自動重啟應用：

- 應用崩潰
- 環境變數更改
- 新的 Git push（如果啟用自動部署）

## 常見問題

### Q: 部署失敗，顯示「Playwright not found」

**A**: 確保 `package.json` 中包含 `playwright` 依賴。運行：

```bash
pnpm add playwright
```

然後推送到 GitHub，Railway 會自動重新部署。

### Q: 評論發佈失敗

**A**: 檢查以下幾點：

1. **帳號密碼正確**：確保 Google 帳號和密碼正確
2. **2FA 備用碼**：如果帳號啟用了 2FA，確保備用碼已保存
3. **Google 防護機制**：Google 可能會因為異常登入而鎖定帳號。嘗試：
   - 從 Google 帳號設定中驗證登入
   - 使用代理 IP（可選）
   - 增加任務之間的延遲

### Q: 如何查看評論執行日誌？

**A**: 在應用的「Logs」頁面中，每個任務的執行結果都會被記錄。你可以查看：

- 帳號登入狀態
- 評論發佈步驟
- 任何錯誤信息

### Q: 如何更新應用代碼？

**A**: 簡單地推送到 GitHub：

```bash
git add .
git commit -m "Update: [description]"
git push origin main
```

Railway 會自動檢測到變更並重新部署（如果啟用了自動部署）。

## 成本估算

Railway 的免費額度：

- **計算時間**：500 小時/月（足以運行全月）
- **數據庫存儲**：5GB（足以存儲數千個任務記錄）
- **帶寬**：無限

超過免費額度後，按使用量計費（通常很便宜）。

## 下一步

1. **監控系統**：設定告警，當任務失敗時通知你
2. **備份數據庫**：定期備份 MySQL 數據庫
3. **優化性能**：根據日誌調整任務延遲和並發數
4. **安全加固**：考慮使用代理 IP 和帳號輪換策略

## 支持

如有問題，請查看：

- Railway 文檔：https://docs.railway.app
- Playwright 文檔：https://playwright.dev
- 應用日誌：Railway Dashboard > Logs
