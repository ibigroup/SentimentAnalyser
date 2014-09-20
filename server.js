var http = require('http');
var restify = require('restify');
var sentiment = require('sentiment');

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
   
    // (52.495820 , -1.912715)
    // (52.477893 , -1.863663)
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

    res.send(model);
}

var server = restify.createServer();
server.get('/q/:content', respond);
server.get('/test', getTestData);

server.listen(process.env.PORT || 8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});