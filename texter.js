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

var parseSms = function (req, res) {
    var resp = new twilio.TwimlResponse();
    resp.say({ voice: 'woman' }, 'ahoy hoy! Testing Twilio and node.js');

    res.setHeader('content-type', 'text/xml');
    res.send(resp);
};

module.exports = {
    sendText: sendText,
    parseSms: parseSms
};