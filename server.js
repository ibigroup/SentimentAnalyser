var http = require('http');
var restify = require('restify');
var sentiment = require('sentiment');
var twitter = require('twitter');
var twitterConf = require('./twitterconf');
var conf = require('./conf');
var socketio = require('socket.io');

var util = require('util'),
    twitter = require('twitter');

var twit = new twitter({
    consumer_key: process.env.consumer_key || twitterConf.consumer_key,
    consumer_secret: process.env.consumer_secret || twitterConf.consumer_secret,
    access_token_key: process.env.access_token_key || twitterConf.access_token_key,
    access_token_secret: process.env.access_token_secret || twitterConf.access_token_secret
});

var liveStreamContext,
    io;

function formatResponse(response) {
    // Dump some of the return data to keep the response small.
    return {
        score: response.score,
        positive: response.positive,
        negative: response.negative
    };
}

function cleanContent(content) {
    if (!content) {
        return "";
    }

    // replace underscores with spaces
    return content.replace(/_/g, ' ');
}

function formatTweet(tweet) {
    var id = tweet.id;
    var mood = sentiment(tweet.text);
    var location = tweet.geo.coordinates;

    return {
        id: id,
        mood: formatResponse(mood),
        loc: location
    };
}

function startLiveStream(onDataHandler, onStart) {
    twit.stream('filter', { locations: conf.liveStream.bounding }, function (stream) {
        stream.on('data', onDataHandler);

        if (onStart) {
            onStart(stream);
        }
    });
}

function start(req, res, next) {
    var dataHandler = function (data) {
        var model = formatTweet(data);
        io.emit('livetweet', model);
    };

    startLiveStream(dataHandler, function (pointer) {
        liveStreamContext = pointer;
        res.send("Started");
    });
}

function stop(req, res, next) {
    if (liveStreamContext) {
        liveStreamContext.destroy();
        res.send("Stopped");
    }

    res.send("Not running.");
}

function respond(req, res, next) {
    var text = cleanContent(req.params.content);
    var result = sentiment(text);

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.send(formatResponse(result));

    next();
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTestData(req, res, next) {
    var dataPoints = [];

    for (var i = 0; i < 100; i++) {
        var point = {
            id: getRandomInt(0, 10000000),
            loc: [getRandomArbitrary(52.477893, 52.495820), getRandomArbitrary(-1.912715, -1.863663)],
            mood: getRandomInt(-3, 3)
        };

        dataPoints.push(point);
    }

    var model = {
        name: "Birmingham",
        mood: getRandomInt(-3, 3),
        distribution: {
            "3": getRandomInt(0, 100),
            "2": getRandomInt(0, 100),
            "1": getRandomInt(0, 100),
            "0": getRandomInt(0, 100),
            "-1": getRandomInt(0, 100),
            "-2": getRandomInt(0, 100),
            "-3": getRandomInt(0, 100)
        },
        points: dataPoints
    };

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.send(model);
}

var server = restify.createServer();
server.get('/q/:content', respond);
server.get('/test', getTestData);
server.get('/start', start);
server.get('/stop', stop);

io = socketio.listen(server.server);
io.set( 'origins', '*:*' );
io.sockets.on('connection', function (socket) {
    socket.emit('livetweet', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});

server.listen(process.env.PORT || 8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});