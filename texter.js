var twilioConf = require('./twilioconf');
var twilio = require('twilio');

var accountSid = process.env.twilioAccountSid || twilioConf.accountSid;
var authToken = process.env.twilioAuthToken || twilioConf.authToken;
var outgoingNumber = process.env.twilioNumber || twilioConf.number;

var client = twilio(accountSid, authToken);

module.exports = {

    sendText: function (number, content, callback) {
        client.messages.create({
            body: content,
            to: number,
            from: outgoingNumber
        }, function (err, message) {
            if (callback) {
                callback(message);
            }
        });
    },

    parseSms: function (req, res) {
        var outputNumber = process.env.debugOutputNumber;
        if (outputNumber) {
            this.sendText(outputNumber, "Hello mum!");
        }

        //Validate that this request really came from Twilio...
        if (twilio.validateExpressRequest(req, authToken)) {
            var twiml = new twilio.TwimlResponse();
            twiml.say('Hi!  Thanks for checking out my app!');

            res.type('text/xml');
            res.send(twiml.toString());
        }
        else {
            // res.send('you are not twilio.  Buzz off.');
            var twiml = new twilio.TwimlResponse();
            twiml.say('Not recongised.');

            res.type('text/xml');
            res.send(twiml.toString());
        }
    }

};