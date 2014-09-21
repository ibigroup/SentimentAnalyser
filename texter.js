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
    var outputNumber = process.env.debugOutputNumber;

    //Validate that this request really came from Twilio...
    if (twilio.validateExpressRequest(req, authToken)) {
        var twiml = new twilio.TwimlResponse();
        twiml.say('Hi!  Thanks for checking out my app!');

        
    if (outputNumber) {
        sendText(outputNumber, "Hello mum success!");
    }

        res.type('text/xml');
        res.send(twiml.toString());
    }
    else {
        // res.send('you are not twilio.  Buzz off.');
        var twiml = new twilio.TwimlResponse();
        twiml.say('Not recongised.');

        
    if (outputNumber) {
        sendText(outputNumber, "Hello mum fail!");
    }

        res.type('text/xml');
        res.send(twiml.toString());
    }
};

module.exports = {
    sendText: sendText,
    parseSms: parseSms
};