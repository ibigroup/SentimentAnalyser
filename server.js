var http = require('http');
var restify = require('restify');
var sentiment = require('sentiment');

function formatResponse(response) {
    return {
        score: response.score,
        positive: response.positive,
        negative: response.negative
    };
}

function respond(req, res, next) {
    var result = sentiment(req.params.content);
    res.send(formatResponse(result));
    next();
}

var server = restify.createServer();
server.get('/q/:content', respond);

server.listen(process.env.PORT || 8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});