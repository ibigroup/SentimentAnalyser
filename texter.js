var twilioConf = require('./twilioconf');
var twilio = require('twilio');

var accountSid = process.env.twilioAccountSid || twilioConf.accountSid;
var authToken = process.env.twilioAuthToken || twilioConf.authToken;
var outgoingNumber = process.env.twilioNumber || twilioConf.number;

var sendText = function (number, content, callback) {
    var client = twilio(accountSid, authToken);
    client.messages.create({
        body: content,
        to: number,
        from: outgoingNumber
    }, function (err, message) {
        if (callback) {
            callback(message);
        }
    });
};

var formatReply = function(message, callback) {
    var resp = new twilio.TwimlResponse();
    resp.message(message);

    if (callback) {
        callback(resp);
    }
}

var parseSms = function (req, callback) {
    var bodyString = req.body;
    var values = {};
    var keyValuePairs = bodyString.split('&');

    for (var i = 0; i < keyValuePairs.length; i++) {
        var pair = keyValuePairs[i];
        var parts = pair.split("=");
        var key = parts[0];
        var value = parts[1];

        values[key] = value;
    }

    var message = values["Body"];

    if (callback) {
        callback(message);
    }
};

module.exports = {
    sendText: sendText,
    parseSms: parseSms,
    formatReply: formatReply
};