const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fetch = require('node-fetch');
var admin = require("firebase-admin");
const app = express();

app.use(morgan('tiny'));
app.use(cors());
var serviceAccount = require("crimepract.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://crimepract.firebaseio.com"
});
const url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=UULNgu_OupwoeESgtab33CCw&maxResults=50';
const url2 ='https://www.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&forUsername=GoogleDevelopers&maxResults=10'
const getVideos = (pageToken) => 
  fetch(`${url}&key=AIzaSyDjRsNVBNh2LZ0yc81kyEj7NkNKQeUNY0o` + (pageToken ? `&pageToken=${pageToken}` : ''))
    .then(response => response.json());
const getChannels = (pageToken) => 
  fetch(`${url2}&key=AIzaSyDjRsNVBNh2LZ0yc81kyEj7NkNKQeUNY0o` + (pageToken ? `&pageToken=${pageToken}` : ''))
    .then(response => response.json());

app.get('/videos', async (req, res) => {

  let page = await getVideos();
  let videos = page.items;

  while (page.nextPageToken) {
    page = await getVideos(page.nextPageToken);
    videos = videos.concat(page.items);
  }

  cache = videos;
  res.json(videos[0]);
});
app.get('/channels', async (req, res) => {

  let page = await getChannels();
  let videos = page.items;

  while (page.nextPageToken) {
    page = await getChannels(page.nextPageToken);
    videos = videos.concat(page.items);
  }

  cache = videos;
  res.json(videos[0]);
});
app.post('/api/sendNotification',(req,res)=>{
  let data = req.body
  const message={
      notification: {
          body: data.notification.message,
          title: data.notification.fName
        },
        tokens:data.tokens
  }
  admin.messaging().sendMulticast(message)
.then((response) => {
  // Response is a message ID string.
  res.json({message:'Success'})
  if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(data.tokens[idx]);
        }
      });
      console.log('List of tokens that caused failures: ' + failedTokens);
    }
})
})
function notFound(req, res, next) {
  res.status(404);
  const error = new Error('Not Found');
  next(error);
}

function errorHandler(error, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({
    message: error.message
  });
}

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Listening on port', port);
});