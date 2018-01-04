from flask import Flask, request, abort

from linebot import (
    LineBotApi, WebhookHandler
)
from linebot.exceptions import (
    InvalidSignatureError
)

from linebot.models import (
    MessageEvent, PostbackEvent,
    TextMessage, TextSendMessage, 
    StickerMessage,
    ImageSendMessage,
    imagemap,
    template,
)

import secret

app = Flask(__name__)

line_bot_api = LineBotApi(CHANNEL_ACCESS_TOKEN())
handler = WebhookHandler(CHANNEL_SECRET())


@app.route("/callback", methods=['POST'])
def callback():
    # get X-Line-Signature header value
    signature = request.headers['X-Line-Signature']

    # get request body as text
    body = request.get_data(as_text=True)
    app.logger.info("Request body: " + body)

    # handle webhook body
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)

    return 'OK'


@handler.add(MessageEvent)
def handle_message(event):

    # print(event.source.user_id)
    # profile = line_bot_api.get_profile(event.source.user_id)

    # print(profile.display_name)
    # print(profile.user_id)
    # print(profile.picture_url)
    # print(profile.status_message)

    buttons_template_message = template.TemplateSendMessage(
            alt_text='予定日を設定',
            template=template.ButtonsTemplate(
                text='予定日を設定',
                title='YYYY-MM-dd',
                actions=[
                    template.DatetimePickerTemplateAction(
                        label='設定',
                        data='action=buy&itemid=1',
                        mode='date',
                        initial='2017-04-01',
                        min='2017-04-01',
                        max='2017-12-31'
                    )
                ]
            )
        )

    line_bot_api.reply_message(
        event.reply_token,
        buttons_template_message)
    #TextSendMessage(text=event.message.type)



@handler.add(PostbackEvent)
def handle_message(event):

    # print(event.source.user_id)
    # profile = line_bot_api.get_profile(event.source.user_id)

    # print(profile.display_name)
    # print(profile.user_id)
    # print(profile.picture_url)
    # print(profile.status_message)

    print('PostbackEvent')
    line_bot_api.reply_message(
        event.reply_token,
        TextSendMessage(text=event.postback.params['date']))
    #TextSendMessage(text=event.message.type)


if __name__ == "__main__":
    app.run()