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

var parseSms = function (req, callback) {
    var resp = new twilio.TwimlResponse();
    resp.message('m:' + req.body);

    if (callback) {
        callback(resp);
    }    
};

module.exports = {
    sendText: sendText,
    parseSms: parseSms
};