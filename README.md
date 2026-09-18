# 鏡頭選型工作台

這個專案有**兩種跑法**，可以擇一使用，也可以兩個都開：

| | NAS 自架版（`/` 根目錄） | GitHub Pages 靜態版（`/docs`） |
|---|---|---|
| 需要伺服器嗎 | 要，Node.js + Docker | 不用，純網頁 |
| 型號資料庫存哪 | NAS 上的 `data/db.json`，大家看到同一份 | 每個人自己瀏覽器的 localStorage，**不共用** |
| 網址 | 你的 NAS IP，例如 `http://10.1.2.61:8278` | `https://你的帳號.github.io/repo名稱/` |
| 適合情境 | 同事共用、要看到彼此新增的型號 | 自己用、想要一個免費、隨時能打開的公開網址、想放到 GitHub 展示 |

兩邊的計算工具、光路示意圖、手機排版都完全一樣，差別只在「型號資料庫要不要多人共用」。

## 部署到 GitHub（把程式碼放上去 + 順便有一個能跑的公開網址）

1. 到 [github.com/new](https://github.com/new) 建立一個新的 repository（例如取名 `lens-workbench`），
   **不要**勾選自動加 README / .gitignore / license（因為這個資料夾裡已經有了，勾了反而等一下 push 會衝突）。
2. 在**你自己電腦**的終端機（不是 NAS）解壓縮這個 zip，`cd` 進去這個資料夾後執行：

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的帳號/lens-workbench.git
   git push -u origin main
   ```

   如果 `git push` 要求輸入密碼卻一直失敗：GitHub 現在 HTTPS push 不接受帳號密碼，要用「Personal Access Token」代替密碼
   （GitHub 網站右上角頭像 → Settings → Developer settings → Personal access tokens → 建立一個，勾 `repo` 權限，
   複製下來，push 時密碼欄貼這個 token）。

3. 上傳成功後，到 repo 頁面 → **Settings** → 左側選單 **Pages**：
   - Source 選 **Deploy from a branch**
   - Branch 選 **main**，資料夾選 **/docs**，按 **Save**
   - 等 1～2 分鐘，畫面會出現一個網址，通常長這樣：`https://你的帳號.github.io/lens-workbench/`
   - 打開這個網址，就是完整能跑的計算工具（手機也能開，也能加到主畫面）。

4. **請注意這個 GitHub Pages 版本的資料庫是「每個瀏覽器各自存」**：你在後台新增的型號只有你自己這台裝置、這個瀏覽器看得到，
   別人打開同一個網址看到的是內建的初始 34 款相機／17 款鏡頭，不會看到你新增的東西（因為 GitHub Pages 只能放純網頁，
   沒辦法像 NAS 版那樣跑一個真正的伺服器來存共用資料庫）。如果你要的是「大家新增的型號都同步」，請用上面的 NAS 自架版。

5. 之後想更新程式碼到 GitHub：改完檔案後，在同一個資料夾執行 `git add .`、`git commit -m "說明這次改了什麼"`、`git push`，
   Pages 網站會在 push 後自動重新部署，不需要額外操作。

## NAS 自架版：跟原本 Artifact 版差在哪

- 計算工具本身（FOV／焦距／解析度／頻寬公式、光路示意圖）完全沒變。
- 相機／鏡頭型號資料庫改成存在伺服器的 `data/db.json`，用 Docker volume 掛出來，容器重建、更新映像檔都不會遺失資料。
- **後台管理不需要密碼**（依你的要求拿掉了）。右上角有一個看不到的按鈕，按住 5 秒才會打開後台面板，
  只是降低一般人不小心點到的機率，並不是真正的存取控制——任何知道要按住那個角落 5 秒的人都能新增／刪除型號。
  這個工具預設是內部小範圍使用（同一個區網、信任的同事），如果之後想要有一道真正的門檻，
  跟我說一聲，我可以再幫你加回去（伺服器端密碼驗證、或是限制只有特定 IP 才能呼叫新增/刪除 API）。
- 已經拿掉「AI 自動解析網址」功能（那個功能需要呼叫 claude.ai 才能跑，自架環境沒有這個能力）。
  型號一樣可以在後台手動新增；如果之後你想要類似的自動解析功能，可以自己申請 Anthropic API key，
  我可以再幫你把這個功能接回來（會產生少量 API 費用）。
- 初始資料庫已經內建 34 筆相機、17 筆鏡頭（都是這次對話中查證過的真實型號規格），第一次啟動會自動建立。
- **新增：手機版排版 + 可加到手機主畫面（PWA）**，詳見下方「手機使用」。

## 部署步驟（Synology / QNAP 等已有 Docker 環境的 NAS）

1. 把這整個資料夾（`lens-workbench-nas`）上傳到 NAS 上你想放專案的位置，例如
   `/volume1/docker/lens-workbench/`。
2. 到該資料夾用終端機（SSH）或容器管理工具的「專案」功能執行：

   ```bash
   docker compose up -d --build
   ```

   - Synology「Container Manager」：專案 → 新增 → 來源選「資料夾」，指到這個資料夾，會自動讀取 `docker-compose.yml`。
   - QNAP「Container Station」：用「Create Application」貼上 `docker-compose.yml` 內容，或直接用 SSH 跑上面的指令。

3. 開瀏覽器打開 `http://10.1.2.61:8278`，應該就能看到選型工作台頁面，感測器／鏡頭下拉選單裡已經有 34 款相機、17 款鏡頭。

## 後台管理

- 網頁右上角有一個看不到的按鈕，滑鼠移過去按住不放 **5 秒**會直接打開後台面板，**不需要輸入密碼**。
- 打開後可以新增／刪除相機、鏡頭型號，資料存進 `./data/db.json`，所有人打開網頁都會看到最新內容。
- 因為沒有密碼門檻，任何能打開這個網址的人理論上都能改資料庫，請確認 8278 這個 port 只有你們內部網路能連到（不要對外開放），或視需要另外加防火牆規則限制來源 IP。

## 手機使用（加到主畫面，像 App 一樣開啟）

排版已經針對手機重新調整過：小螢幕會自動改成單欄顯示、輸入框與按鈕加大方便手指點擊、下拉選單跟按鈕都符合最小 44px 的觸控尺寸，不會再有「螢幕太小擠成一團」的問題。

手機瀏覽器打開 `http://10.1.2.61:8278` 後，可以加到主畫面，之後點桌面圖示就會全螢幕開啟、不會看到網址列，體驗上很接近一個真正的 App：

- **iPhone（Safari）**：打開網址 → 按下方的「分享」圖示 → 選「加入主畫面」。
- **Android（Chrome）**：打開網址 → 右上角三個點選單 → 選「新增至主畫面」或「安裝應用程式」。

**有一點要老實說**：因為這個網址是內網 `http://`（不是 `https://`），Android Chrome 不會自動跳出「安裝這個應用程式」的提示（那個自動提示需要 HTTPS），但用上面說的「手動加入主畫面」一樣可以裝到桌面、一樣會有圖示。iPhone Safari 則沒有這個限制，內網 http 網址一樣能正常加到主畫面、全螢幕開啟。如果之後想要 Android 也有自動安裝提示，需要幫這個服務加一層 HTTPS（例如 NAS 上用反向代理 + 憑證），需要的話再跟我說。

離線的部分也做了基本處理：頁面本身（排版、計算功能）第一次打開後會被快取起來，之後就算 NAS 網路不穩，介面還是能先顯示；但相機/鏡頭資料庫一定要連得到伺服器才會是最新的，離線時看到的是上次連線時的資料。

## 資料備份

`./data/db.json` 就是全部型號資料，定期備份這個檔案（複製一份到別的地方）即可；
要救援或搬家，把這個檔案放回新環境的 `./data/db.json` 再啟動容器就會讀到。

## 檔案結構

```
lens-workbench-nas/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js          # Express 伺服器 + 型號資料庫 API
├── seed-data.json      # 初始 34 款相機／17 款鏡頭的種子資料
├── public/
│   ├── index.html       # 前端頁面（選型計算工具 + 後台管理介面，含手機版排版）
│   ├── manifest.json     # PWA 設定（App 名稱、圖示、全螢幕顯示模式）
│   ├── sw.js             # Service Worker，讓頁面外殼可離線快取
│   └── icons/            # App 圖示（192/512/180/32 四種尺寸）
├── docs/                # GitHub Pages 用的靜態版（資料庫存瀏覽器 localStorage，不需要伺服器）
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
└── data/                # 執行後自動產生，db.json 存在這裡（docker-compose 掛成 volume）
```

## 本機測試（不用 Docker 也能跑）

需要先裝 Node.js 18+：

```bash
npm install
node server.js
```

預設監聽 3000 port，瀏覽器打開 `http://localhost:3000` 即可測試。
