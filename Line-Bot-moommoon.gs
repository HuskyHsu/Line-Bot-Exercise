var CHANNEL_ACCESS_TOKEN = 'YOUR_CHANNEL_ACCESS_TOKEN';

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
      messages = analysisMessageType(events.message)
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

function analysisMessageType(message)
{
  switch(message.type)
  {
    case 'text':
      messages = analysisMessage(message.text)
    break;
    case 'location':
      
      var formData = {
        'city':"W",
        'coordX': message.longitude,
        'coordY': message.latitude,
      };
    
      var options = {
        'method' : 'post',
        'payload' : formData
      };
       
      var response = JSON.parse(UrlFetchApp.fetch('http://easymap.land.moi.gov.tw/R02/Door_json_getDoorInfoByXY', options));
      Logger.log(response);
      messages = [{
            "type":"text",
            "text": message.longitude
        },{
            "type":"text",
            "text": message.latitude
        },{
            "type":"text",
            "text": JSON.stringify(response)
        }]
    break;
  }
  
  return messages
}

function analysisMessage(messageText)
{
  if (messageText.substring(0,2) === "高鐵"){
    return THSRC('高鐵', "")
  }
  else {
    return [{
      'type': 'text',
      'text': messageText
    }]
  }
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
               "initial":'2017-04-01T12:00',
               "min":'2017-04-01T12:00',
               "max":'2017-12-31T12:00'}
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



function checkUpdateAndSendEmail() {
  var cache = CacheService.getPrivateCache();

  var url = "http://www.thsrc.com.tw/tw/TimeTable/SearchResult";
  var path = "/html/body/div[0]/section/section[1]/ul/section/table/tbody/tr[2]/td/table/tbody/tr/td[0]/a";
  var cached = cache.get(url);
  var text = getDataFromXpath(path, url);
  if(cached == null || cached != text) {
//      cache.put(url, cached, 3666);
//      MailApp.sendEmail("<email>", "YCombinator Top", text);
//      Logger.log("Mail Sent!!! ");
  }
  Logger.log("text : " + text);
  Logger.log("cached : " + cached);
}

function getDataFromXpath(path, url) {
  var data = UrlFetchApp.fetch(url);
  var text = data.getContentText();
  var xmlDoc = Xml.parse(text, true);

  // Replacing tbody tag because app script doesnt understand.
  path = path.replace("/html/","").replace("/tbody","","g");
  var tags = path.split("/");
  Logger.log("tags : " + tags);
  // getting the DOM of HTML
  var element = xmlDoc.getElement();

  for(var i in tags) {
    var tag = tags[i];
    Logger.log("Tag : " + tag);
     var index = tag.indexOf("[");
     if(index != -1) {
       var val = parseInt(tag[index + 1]);
       tag = tag.substring(0,index);
       Logger.log(tag + '-' + val);
       element =  Xml.parse(element.getElements(tag)[val], true);
       Logger.log(element);
     } else {
       element = element.getElement(tag);
     }
//    Logger.log(element.toXmlString());
  }
  return element
}
