var http = require('http');
var restify = require('restify');
var sentiment = require('sentiment');
var twitter = require('twitter');
var twitterConf = require('./twitterconf');
var conf = require('./conf');
var socketio = require('socket.io');
var texter = require('./texter');
var request = require('superagent');

var util = require('util'),
    twitter = require('twitter');

var twit = new twitter({
    consumer_key: process.env.consumer_key || twitterConf.consumer_key,
    consumer_secret: process.env.consumer_secret || twitterConf.consumer_secret,
    access_token_key: process.env.access_token_key || twitterConf.access_token_key,
    access_token_secret: process.env.access_token_secret || twitterConf.access_token_secret
});

// texter.sendText("+447970512732", "TITTIES!");

var liveStreamContext,
    io;

function formatResponse(response) {
    // Restrict score from -3 to 3
    var score = response.score;
    if (score < -3) {
        score = -3;
    } else if (score > 3) {
        score = 3;
    }

    // Dump some of the return data to keep the response small.
    return {
        score: score,
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

function doSearch(searchText, latLng, callback) {
     var searchParams = {
         count: 100
     };

    if (latLng) {
         searchParams.geocode = latLng.lat + ',' + latLng.lng + ',2km'
    }

    twit.search(searchText, searchParams, function (data) {
        var totalMood = 0,
        dataPoints = [],
        distribution = {};

        if (data.statuses) {
            for (var i = 0; i < data.statuses.length; i++) {
                var item = data.statuses[i];

                var point = createPoint(item);
                if (!point.loc && latLng.lat && latLng.lng) {
                    point.loc = [parseFloat(latLng.lat), parseFloat(latLng.lng)];
                }

                if (point.loc) {
                    dataPoints.push(point);
                    totalMood += point.mood;

                    var valueText = "" + point.mood;
                    distribution[valueText] = distribution[valueText] || 0;
                    distribution[valueText] += 1;
                }
            };
        }

        var averageMood = dataPoints.length > 0 
            ? totalMood / dataPoints.length 
            : 0;

        var model = {
            mood: averageMood,
            distribution: distribution,
            points: dataPoints
        };

        callback(model);
    });
};

function getSearchData(req, res, next){
     var searchText = req.params.searchParamaters;
     var latLng = null;

     if (req.params.lat && req.params.lng) {
         latLng = {
             lat: req.params.lat,
             lng: req.params.lng
         };
     }

     doSearch(searchText, latLng, function (model) {
         res.header("Access-Control-Allow-Origin", "*");
         res.header("Access-Control-Allow-Headers", "X-Requested-With");
         res.send(model);
     });
}

function createPoint(item){
    var point = {
        id: item.id,
        mood: sentiment(item.text).score
    }

    if (item.coordinates && item.coordinates.coordinates) {
        point.loc = [item.coordinates.coordinates[1], item.coordinates.coordinates[0]];
    }

    return point;
}

var splitterWords = ["in", "about"];

var resolveLocation = function (location, callback) {
    var requestUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" + location + "&sensor=false";

    request
    .get(requestUrl)
    .set('Accept', 'application/json')
    .end(function (err, res) {
        var data = JSON.parse(res.text);
        if (data.results && data.results.length > 0) {
            var location = data.results[0].geometry.location;
            callback(location);
        }
    });
};

var textHandler = function (message, callback) {
    for (var i = 0; i <= splitterWords.length; i++) {
        var splitter = splitterWords[i];
        if (message.indexOf(splitter) > 0) {

            var parts = message.split(splitter);
            var query = parts[0];
            var location = parts[1];

            resolveLocation(location, function (latLng) {
                doSearch(query, latLng, function (data) {
                    var text = data.mood + " - " + data.points.length + " points";
                    texter.formatReply(text, callback)
                });
            });

            return;
        }
    }
};

function twilioIncoming(req, res, next) {

    texter.parseSms(req, function (message) {
        textHandler(message, function (resp) {

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");

            res.writeHead(200, {
                'Content-Type': 'text/xml'
            });
            res.end(resp.toString());

            next();
        });
    });
}

var server = restify.createServer();
server.use(restify.bodyParser());

server.get('/q/:content', respond);
server.get('/test', getTestData);
server.get('/search/:searchParamaters/:lat/:lng',getSearchData);
server.get('/start', start);
server.get('/stop', stop);
server.post('/sms', twilioIncoming);
io = socketio.listen(server.server);
io.set( 'origins', '*:*' );


server.listen(process.env.PORT || 8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});