# line bot 筆記

## 使用環境

### 1. Python
* python3.6
* Flask
* line-bot-sdk

搭派ngrok做為開發環境

### 2. Google Apps Script

線上服務，免架設伺服器，方便的用法
請參閱gs系列檔案
s
#### 功能清單
1. 點餐服務

|語法|功能|示範|
|--|--|--|
|`點餐 今天吃這個 https_img_URL`|傳入菜單圖片|`點餐 今天吃這個 https://i.imgur.com/UFlpiPG.jpg`|
|`點餐 今天吃什麼?`|呼叫上述儲存圖片|同語法|
|`點餐 項目 金額`|輸入點餐資訊|`點餐 大麥克 115`|
|`點餐 清單`|呼叫同群組內點餐紀錄|同語法|
|`點餐 統計`|統計圖群組內的點餐紀錄|同語法|
|`點餐 清除`|清除當前群組點餐紀錄|同語法|

2. 地籍定位

提供座標與位置訊息查詢地籍功能

![Alt text](https://i.imgur.com/R1h1qrr.png)

![Alt text](https://i.imgur.com/HRoFGh0.jpg)