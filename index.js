'use strict'

const
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  app = express().use(bodyParser.json()); 

require('dotenv').config();

app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

const FOURSQUARE_API_ENDPOINT = "https://api.foursquare.com/v2/";

let lat, long, placeType, findRadius = 1000;

let sections = {
  FOOD: 'food', 
  DRINK: 'drinks', 
  CAFE: 'coffee',
  SHOP: 'shops',
  ART: 'arts',
  OUTDOOR: 'outdoors',
  SIGHT: 'sights', 
  TREND: 'trending'
}

app.post('/webhook', (req, res) => {

  let body = req.body;

  if (body.object === 'page') {

    body.entry.forEach(function(entry) {
      let webhook_event = entry.messaging[0];
      // console.log(webhook_event);

      let sender_psid = webhook_event.sender.id;
      // console.log('Sender PSID: ' + sender_psid);

      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }

});

app.get('/webhook', (req, res) => {

  let VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {  
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

function handleMessage(sender_psid, received_message) {
  let response;

  console.log(received_message.quick_reply)

  if (received_message.text && !received_message.quick_reply) {
    switch(received_message.text) {
      case '/start': 
        response = {
          "text": "Chào mầy, tao sẽ gợi ý xem nên ăn uống vui chơi gì gần đây, cơ mà gửi cho tao location trước đã.\nGửi xong thì chờ tao xíu.",
          "quick_replies": [
            {
              "content_type": "location"
            }
          ]
        }
        break;
      default: 
        response = {
          "text": "Hình như mày nhập sai cú pháp rồi, nhập lại đi"
        }
        break;
    }
    callSendAPI(sender_psid, response);
  } else if (received_message.attachments) {
    if (received_message.attachments[0].payload.coordinates) {
      console.log('location sent!')
      lat = received_message.attachments[0].payload.coordinates.lat;
      long = received_message.attachments[0].payload.coordinates.long;
      response = {
        "text": "Mầy muốn tìm cái gì đây?",
        "quick_replies": [
          {
            "content_type": "text",
            "title": "Ăn",
            "payload": "/food"
          },
          {
            "content_type": "text",
            "title": "Cafe!",
            "payload": "/coffee"
          },
          {
            "content_type": "text",
            "title": "Vui chơi",
            "payload": "/outdoors"
          },
          {
            "content_type": "text",
            "title": "Uống",
            "payload": "/drinks"
          },
          {
            "content_type": "text",
            "title": "Trend",
            "payload": "/trend"
          },
        ],
      }
    }
    callSendAPI(sender_psid, response);
  } else if (received_message.quick_reply) {
    let payload = received_message.quick_reply.payload;
    console.log('Payload: ', received_message.quick_reply.payload);
    console.log('Payload: ', payload);
    console.log("received quick reply!");
    response = {
      "text": "Phạm vi tìm kiếm bao nhiêu mầy (1km đổ xuống thôi nha, tao mệt lắm) ?",
      "quick_replies": [
        {
          "content_type": "text",
          "title": "1 km",
          "payload": "/r1000"
        },
        {
          "content_type": "text",
          "title": "750m",
          "payload": "/r750"
        },
        {
          "content_type": "text",
          "title": "500m",
          "payload": "/r500"
        },
        {
          "content_type": "text",
          "title": "250m",
          "payload": "/r250"
        }
      ]
    }
    if (payload === '/coffee') {
      callSendAPI(sender_psid, response);
      placeType = sections.CAFE;
    } else if (payload === '/food') {
      callSendAPI(sender_psid, response);
      placeType = sections.FOOD;
    } else if (payload === '/drinks') {
      callSendAPI(sender_psid, response);
      placeType = sections.DRINK;
    } else if (payload === '/trend') {
      callSendAPI(sender_psid, response);
      placeType = sections.TREND;
    } else if (payload === '/outdoors') {
      callSendAPI(sender_psid, response);
      placeType = sections.OUTDOOR;
    } else if (payload === '/r1000') {
      callSendAPI(sender_psid, {"text": "Chờ tao tìm xíu"});
      findRadius = 1000;
      findRecommendedPlace(sender_psid, lat, long, placeType, findRadius, 0);
    } else if (payload === '/r750') {
      callSendAPI(sender_psid, {"text": "Chờ tao tìm xíu"});
      findRadius = 750;
      findRecommendedPlace(sender_psid, lat, long, placeType, findRadius, 0);
    } else if (payload === '/r500') {
      callSendAPI(sender_psid, {"text": "Chờ tao tìm xíu"});
      findRadius = 500;
      findRecommendedPlace(sender_psid, lat, long, placeType, findRadius, 0);
    } else if (payload === '/r250') {
      callSendAPI(sender_psid, {"text": "Chờ tao tìm xíu"});
      findRadius = 250;
      findRecommendedPlace(sender_psid, lat, long, placeType, findRadius, 0);
    }
  }
}

function handlePostback(sender_psid, received_postback) {
}

function callSendAPI(sender_psid, response) {
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: request_body
  }, (err, res, body) => {
    if (!err) {
      // console.log('message sent!')
    } else {
      console.error('Unable to send message:' + err);
    }
  }); 
}

function findRecommendedPlace (sender_psid, lat, long, type, radius, page) {
  let api = `${FOURSQUARE_API_ENDPOINT}venues/explore`;
  let response;
  const PER_PAGE = 15;
  let now = new Date();
  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth() + 1;
  currentMonth = currentMonth > 9 ? currentMonth : `0${currentMonth}`
  let currentDate = now.getDate();
  currentDate = currentDate > 9 ? currentDate : `0${currentDate}`;
  request({
    uri: api,
    qs: {
      client_id: process.env.FOURSQUARE_CLIENT_ID,
      client_secret: process.env.FOURSQUARE_CLIENT_SECRET,
      ll: `${lat},${long}`,
      section: type,
      radius: radius,
      limit: PER_PAGE,
      offset: page * PER_PAGE,
      v: `${currentYear}${currentMonth}${currentDate}`
    }
  }, (err, res, body) => {
    if (err) {
      console.error('Error: ' + err);
    } else {
      let listElements = [];
      console.log(body.response)
      let results = body.response.groups[0].items;
      if (results.length > 0) {
        results.forEach(item => {
          let element = {
            title: item.venue.name,
            subtitle: item.venue.postalCode + item.venue.location.address + item.venue.contact.phone,
            image_url: item.venue.categories.icon.prefix + 100 + item.venue.categories.icon.suffix,
            buttons: [
              {
                title: "Xem",
                type: "web_url",
                url: item.venue.url,
                messenger_extensions: true,
                webview_height_ratio: full,
                fallback_url: item.venue.url
              }
            ]
          }
          listElements.push(element);
        })
      }
      response = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "list",
            "top_element_style": "compact",
            "elements": listElements,
            "buttons": [
              {
                "title": "View More",
                "type": "postback",
                "payload": "/viewmore"
              }
            ]  
          }
        }
      }
      callSendAPI(sender_psid, response)
    }
  })
}