var twilioConf = require('./twilioconf');
var twilio = require('twilio');

var accountSid = process.env.twilioAccountSid || twilioConf.accountSid;
var authToken = process.env.twilioAuthToken || twilioConf.authToken;
var outgoingNumber = process.env.twilioNumber || twilioConf.number;

var client = twilio(accountSid, authToken);


var sendText = function (number, content, callback) {
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
    var message = req.body.Body;

    if (callback) {
        callback(message);
    }
};

module.exports = {
    sendText: sendText,
    parseSms: parseSms,
    formatReply: formatReply
};