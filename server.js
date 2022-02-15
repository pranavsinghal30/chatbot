// Dependencies
const fs = require("fs");
const http = require("http");
const https = require("https");
const express = require("express");
const bodyParser = require("body-parser");
const app = express().use(bodyParser.json());
const request = require("request");
const MongoClient = require("mongodb").MongoClient;
// Certificate
const privateKey = fs.readFileSync(
  "/etc/letsencrypt/live/byer.gyanamite.com/privkey.pem",
  "utf8"
);
const certificate = fs.readFileSync(
  "/etc/letsencrypt/live/byer.gyanamite.com/cert.pem",
  "utf8"
);
const ca = fs.readFileSync(
  "/etc/letsencrypt/live/byer.gyanamite.com/chain.pem",
  "utf8"
);

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

//app.use((req, res) => {
//	res.send('Hello there !');
//});
let text;
var current = 1;
var qora = 0;
var limit = 0;
var slno = 0;
function getNextQuestion(current) {
  //let message = req.query.message || req.body.message || 'Hello World!';
  //res.status(200).send(message);
  const client = new MongoClient(
    "mongodb+srv://sumukh1996:Dexler%401234@cluster0-et4eg.gcp.mongodb.net/test?retryWrites=true&w=majority",
    { useNewUrlParser: true }
  );
  return new Promise((resolve, reject) => {
    client.connect((err) => {
      const collection = client.db("chatbot").collection("qna");
      collection
        .find({})
        .sort({ order: 1 })
        .skip(current)
        .limit(1)
        .toArray((err, result) => {
          if (err) {
            console.log("error" + err);
            reject();
          }
          if (result !== null && result !== undefined) {
            text = result;
            console.log("result" + result[0].order);
            resolve();
          }
        });
    });
  });
}

// Handles messages events
async function handleMessage(sender_psid, received_message) {
  let response;
  await console.log(
    "handle message " + received_message.text + " " + received_message.is_echo
  );

  // Check if the message contains text
  if (received_message.text && received_message.is_echo == undefined) {
    // Create the payload for a basic text message
    /*response = {
      "text": ` You sent the message: " ${received_message.text}". Now send me an image!`
    }*/

    if (qora == 0) {
      res = await getNextQuestion(current).catch(() => {
        console.log("error");
      });
      await console.log(
        "inside recieved text message qora =0" + text[0].questions.length
      );
      limit = await text[0].questions.length;
      var cont_len = await text[0].context.length;
      if (cont_len > 0) {
        response = await { text: text[0].context[0] };
        await callSendAPI(sender_psid, response);
      }
      if (cont_len > 1) {
        response = await { text: text[0].context[1] };
        await callSendAPI(sender_psid, response);
      }
      if (cont_len > 2) {
        response = await { text: text[0].context[2] };
        await callSendAPI(sender_psid, response);
      }
      if (cont_len > 3) {
        response = await { text: text[0].context[3] };
        await callSendAPI(sender_psid, response);
      }

      qora = await 1;
    } else if (qora == 1) {
      await console.log(
        "inside recieved text message waited" + text[0].answers[0]
      );
      response = await { text: text[0].questions[slno] };
      await callSendAPI(sender_psid, response);
      qora = 2;
    } else if (qora == 2) {
      //res = await getNextQuestion(current).catch(()=>{console.log("error")})
      await console.log(
        "inside recieved text message waited" + text[0].answers[slno]
      );
      response = await { text: "The expected answer was:" };
      await callSendAPI(sender_psid, response);
      response = await { text: text[0].answers[slno] };
      console.log("waited for first message to be sent in the answer part");
      await callSendAPI(sender_psid, response);
      slno += await 1;
      if (slno == limit) {
        qora = await 0;
        current += await 1;
      } else {
        console.log("inside else condition of answer");
        qora = await 1;
      }
    }
  } else if (received_message.attachments) {
    // Gets the URL of the message attachment
    //text = getNextQuestion(current)
    text = "hi";
    console.log("inside recieved text message" + text);
    let attachment_url = received_message.attachments[0].payload.url;
  }

  // Sends the response message
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  return new Promise((resolve, reject) => {
    request(
      {
        uri: "https://graph.facebook.com/v2.6/me/messages",
        qs: {
          access_token:
            "EAAIqRIa1ZCdkBACGF9Q9z3HYUn8JvQVqDkhQAzgsO8C18u9jJDWo7eZAfU7yU0JIQeMgZCKXJ6QmCJurrs2uve2dbnIXSMyyqSt1gh8fN7oZAItHn6h5O97hyFiUI223jnlU9hNSZBcyExNuaJocZB7O1Gdjn7xHZAt4MZBsSBWgVgZDZD",
        },
        method: "POST",
        json: request_body,
      },
      (err, res, body) => {
        if (!err) {
          // res.status(200).send("success");
          console.log("message sent!");
          resolve();
        } else {
          console.error("Unable to send message:" + err);
          reject();
        }
      }
    );
  });
}
app.post("/webhook", (req, res) => {
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

app.get("/webhook", (req, res) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "verify";
  console.log("in get call");
  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  console.log(mode);
  console.log(token);
  console.log(challenge);
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Starting both http & https servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
  console.log("HTTP Server running on port 80");
});

httpsServer.listen(443, () => {
  console.log("HTTPS Server running on port 443");
});
