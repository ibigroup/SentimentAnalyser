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
    console.log(text);
    var result = sentiment(text);
    res.send(formatResponse(result));
    next();
}

var server = restify.createServer();
server.get('/q/:content', respond);

server.listen(process.env.PORT || 8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});