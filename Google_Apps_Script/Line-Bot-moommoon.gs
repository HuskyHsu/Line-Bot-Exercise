var CHANNEL_ACCESS_TOKEN = 'X0Ms+Ag2w0q8YpWGrxBioPhFRTi5jgpBkaorsq0u4ejtF5rYRULDbvJ1457VeLqlxRdUVy76QxhOLKq+6Eti7sqQwFaRr5J7YVgQwS/HN5eS/csfxwoFBTw5jhZ86EbP98voTJzmaH0r8Ezs9WNPRQdB04t89/1O/w1cDnyilFU=';

//抓取IP位置
function doGet(e) {
  return ContentService.createTextOutput(UrlFetchApp.fetch("http://ip-api.com/json"));
}

//處理Line server傳進來訊息，再送出訊息到用戶端
function doPost(e) {
  var events = JSON.parse(e.postData.contents).events[0];
  var reply_token = events.replyToken;
  
  if (typeof reply_token === 'undefined') 
    return;
  
  var url = 'https://api.line.me/v2/bot/message/reply';
  
  var header = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  }
  
  switch(events.type)
  {
    case 'message':
      messages = analysisMessageType(events.message, events.source.userId, events.source.groupId)
      break;
      
    case 'follow':
      
      break;
      
    case 'postback':
      try {
        messages = THSRC(events.postback.data, events.postback.params['datetime'])
      } catch (e) {
        messages = THSRC(events.postback.data, "")
      }
      break;
  }
  
  
  var payload = {
    'replyToken': reply_token,
    'messages' : messages
  }
  
  var options = {
    'headers': header,
    'method': 'post',
    'payload': JSON.stringify(payload)
  }
  
  UrlFetchApp.fetch(url, options);
  
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

// 處理不同類型事件
function analysisMessageType(message, userId, groupId)
{
  switch(message.type)
  {
    case 'text':
//      console.log(userId);
      messages = analysisMessage(message.text, userId, groupId)
      break;
    case 'location':
      messages = analysislocation(message.longitude, message.latitude)
      break;
    case 'image':
      //      messages = saveImage(message.id)
      break;
  }
  
  return messages
}

// 處理文字事件
function analysisMessage(messageText, userId, groupId)
{
  if (messageText.substring(0,2) === "高鐵"){
    return THSRC('高鐵', "")
  }
  else if(messageText.substring(0,2) === "點餐"){
    return order(messageText, userId, groupId)
  }
  else {
    //    return [{
    //      'type': 'text',
    //      'text': messageText
    //    }]
  }
}

// 處理座標事件
function analysisLocation(longitude, latitude){
  
  longitude = 118.319407;
  latitude = 24.437090;
  var formData = {
    'city':"W",
    'coordX': longitude,
    'coordY': latitude,
  };
  
  var options = {
    'method' : 'post',
    'payload' : formData
  };
  
  var response = JSON.parse(UrlFetchApp.fetch('http://easymap.land.moi.gov.tw/R02/Door_json_getDoorInfoByXY', options));
  
  
  Logger.log(response);
  
  return [{
    "type":"text",
    "text": "您查詢的地點為"
  },{
    "type":"text",
    "text": "地段：" + response.sectName
  },{
    "type":"text",
    "text": "地號：" +response.sectno
  }]
}

function saveImage(id){
  
  //  id = 7253583068818
  var url = 'https://api.line.me/v2/bot/message/' + id + '/content';
  var image = UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'get'
  });
  
  var blob = image.getAs("image/jpeg");    
  var thisFolder = DriveApp.getFolderById('1SsMqlWsBuhp3wciQzwjUOX49xwswZYza');
  thisFolder.createFile(blob);
  
  return [{
    "type":"text",
    "text": '收到'
  }]
  
}

function order(queryStr, userId, groupId){
  var res = queryStr.split(" ");
  
  //  console.log(queryStr);
  //  console.log(userId);
  //  console.log(groupId);
  var scriptProperties = PropertiesService.getScriptProperties();
  var orderReceipt = JSON.parse(scriptProperties.getProperty("orderReceipt"));
  var menu = JSON.parse(scriptProperties.getProperty("menu"));
  
  console.log(menu)
  
  if (menu === null) {
    menu = {}
  }
  
  if (res[1] == '今天吃什麼?' || res[1] == '今天吃什麼？'){
    return [{
      "type": "image",
      "originalContentUrl": menu[groupId],
      "previewImageUrl": menu[groupId]
    }]
  }
  else if (res[1] == '今天吃這個'){
    
    menu[groupId] = res[2];
    scriptProperties.setProperty("menu", JSON.stringify(menu));
    
    return [{
      "type": "text",
      "text": "就決定是你了!!"
    }, {
      "type": "image",
      "originalContentUrl": res[2],
      "previewImageUrl": res[2]
    }]
    
  }
  else if (res[1] == '清單'){
    
    var outString = '';
    
    for (var user in orderReceipt[groupId]) {
      outString += orderReceipt[groupId][user].name + '：' + orderReceipt[groupId][user].item + '，共計 $' + orderReceipt[groupId][user].price + '\n';
    }
    return [{
      "type": "text",
      "text": outString
    }]
    
  }
  else if (res[1] == '統計'){
    
    var items = {};
    var outString = '';
    var totalPrice = 0;
    
    for (var user in orderReceipt[groupId]) {
      if (typeof items[orderReceipt[groupId][user].item]  === 'undefined'){
        items[orderReceipt[groupId][user].item] = 0;
      }
      items[orderReceipt[groupId][user].item] += 1;
      
      var price = parseInt(orderReceipt[groupId][user].price);

      
      if (!isNaN(price)){
        totalPrice += price;
      }
      else {
        items[orderReceipt[groupId][user].item] -= 1;
      }

    }
    
    for (var item in items) {
      if (items[item] > 0) {
        outString += item + '：' + items[item] + '\n';
      }
    }
    
    return [{
      "type": "text",
      "text": outString
    },{
      "type": "text",
      "text": '共計 $' + totalPrice
    }]
    
  }
  else if(res[1] == '清除'){
    orderReceipt[groupId] = {};
    scriptProperties.setProperty("orderReceipt", JSON.stringify(orderReceipt));
    return [{
      "type":"text",
      "text": "本群組點餐紀錄清除完畢"
    }]
  }
  else if(res.length < 3){
    return [{
      "type": "text",
      "text": '請檢查格式'
    }]
    
  }
  else if( isNaN( parseInt(res[2]) ) ){
    return [{
      "type": "text",
      "text": '請檢查金額'
    }]
  }
  
  if (typeof groupId === 'undefined'){
    var url = 'https://api.line.me/v2/bot/profile/' + userId;
    var profile = JSON.parse(UrlFetchApp.fetch(url, {
      'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
      },
      'method': 'get'
    }));
  }
  else {
    var url = 'https://api.line.me/v2/bot/group/' + groupId + '/member/' + userId;
    var profile = JSON.parse(UrlFetchApp.fetch(url, {
      'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
      },
      'method': 'get'
    }));
  }
  
  if (orderReceipt == null) {
    orderReceipt = {}
  }
  
  if (typeof orderReceipt[groupId] === 'undefined') {
    orderReceipt[groupId] = {};
  }
  
  orderReceipt[groupId][userId] = {'name': profile.displayName, 'item': res[1], 'price': res[2]};
  scriptProperties.setProperty("orderReceipt", JSON.stringify(orderReceipt));
  
  console.log(orderReceipt);
  
  return [{
    "type":"text",
    "text": '收到您的點餐紀錄 ' + res[1]
  }]
  
}

function THSRC(queryStr, datetime){
  
  var res = queryStr.split("-");
  
  
  switch(res.length)
  {
    case 1:
      messages = [
        {
          "type": "template",
          "altText": "this is a carousel template",
          "template": {
            "type": "carousel",
            "columns": [{
              "title": "南港、台北、板橋",
              "text": "請選擇出發站",
              "actions": [
                { "type": "postback", "label": "南港", "data": "高鐵-南港"}, 
                { "type": "postback", "label": "台北", "data": "高鐵-台北"},
                { "type": "postback", "label": "板橋", "data": "高鐵-板橋"}
              ]
            }, {
              "title": "桃園、新竹、苗栗",
              "text": "請選擇出發站",
              "actions": [
                { "type": "postback", "label": "桃園", "data": "高鐵-桃園"},
                { "type": "postback", "label": "新竹", "data": "高鐵-新竹"},
                { "type": "postback", "label": "苗栗", "data": "高鐵-苗栗"}
              ]
            }, {
              "title": "台中、彰化、雲林",
              "text": "請選擇出發站",
              "actions": [
                { "type": "postback", "label": "台中", "data": "高鐵-台中"},
                { "type": "postback", "label": "彰化", "data": "高鐵-彰化"},
                { "type": "postback", "label": "雲林", "data": "高鐵-雲林"}
              ]
            }, {
              "title": "嘉義、台南、左營",
              "text": "請選擇出發站",
              "actions": [
                { "type": "postback", "label": "嘉義", "data": "高鐵-嘉義"},
                { "type": "postback", "label": "台南", "data": "高鐵-台南"},
                { "type": "postback", "label": "左營", "data": "高鐵-左營"}
              ]
            }],
          }
        }
      ]
      break;
    case 2:
      messages = [
        {
          "type": "template",
          "altText": "this is a carousel template",
          "template": {
            "type": "carousel",
            "columns": [{
              "title": "嘉義、台南、左營",
              "text": "請選擇到達站",
              "actions": [
                { "type": "postback", "label": "嘉義", "data": res.join("-") + "-嘉義"},
                { "type": "postback", "label": "台南", "data": res.join("-") + "-台南"},
                { "type": "postback", "label": "左營", "data": res.join("-") + "-左營"}
              ]
            }, {
              "title": "台中、彰化、雲林",
              "text": "請選擇到達站",
              "actions": [
                { "type": "postback", "label": "台中", "data": res.join("-") + "-台中"},
                { "type": "postback", "label": "彰化", "data": res.join("-") + "-彰化"},
                { "type": "postback", "label": "雲林", "data": res.join("-") + "-雲林"}
              ]
            }, {
              "title": "桃園、新竹、苗栗",
              "text": "請選擇到達站",
              "actions": [
                { "type": "postback", "label": "桃園", "data": res.join("-") + "-桃園"},
                { "type": "postback", "label": "新竹", "data": res.join("-") + "-新竹"},
                { "type": "postback", "label": "苗栗", "data": res.join("-") + "-苗栗"}
              ]
            }, {
              "title": "南港、台北、板橋",
              "text": "請選擇到達站",
              "actions": [
                { "type": "postback", "label": "南港", "data": res.join("-") + "-南港"}, 
                { "type": "postback", "label": "台北", "data": res.join("-") + "-台北"},
                { "type": "postback", "label": "板橋", "data": res.join("-") + "-板橋"}
              ]
            }],
          }
        }
      ]
      break;
    case 3:
      messages = [
        {
          "type": "template", "altText": "出發日期",
          "template": {
            "type": "buttons", "title": "請選擇出發時間", "text": "Please select",
            "actions": [
              { "type": "datetimepicker",
               "label": "日期",
               "data": res.join("-"),
               "mode":'datetime',
               "initial": getDate(0),
               "min": getDate(-7),
               "max": getDate(60)}
            ]
          }
        }
      ]
      
      if (datetime != ""){
        messages = [{
          'type': 'text',
          'text': res.join("-") + "-" + datetime
        }]
      }
      
      break;
  }
  
  return messages
}

function getDate(n){
  
  var today = new Date();
  today.setDate(today.getDate() + n);
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();
  
  if(dd<10) {
    dd = '0'+ dd
  } 
  
  if(mm<10) {
    mm = '0'+ mm
  } 
  
  today = [yyyy, mm, dd].join('-');
  
  Logger.log(today + 'T12:00')
  
  return today + 'T12:00'
  
}
