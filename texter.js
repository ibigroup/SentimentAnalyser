var twilioConf = require('./twilioconf');
var twilio = require('twilio');
var client = twilio(process.env.twilioAccountSid || twilioConf.accountSid, process.env.twilioAuthToken || twilioConf.authToken);

module.exports = {

    sendText: function (number, content, callback) {
        client.messages.create({
            body: content,
            to: number,
            from: process.env.twilioNumber || twilioConf.number
        }, function (err, message) {
            if (callback) {
                callback(message);
            }
        });
    },

    parseSms: function (req, res) {
        //Validate that this request really came from Twilio...
        if (twilio.validateExpressRequest(req, twilioConf.authToken)) {
            var twiml = new twilio.TwimlResponse();

            twiml.say('Hi!  Thanks for checking out my app!');

            res.type('text/xml');
            res.send(twiml.toString());
        }
        else {
            res.send('you are not twilio.  Buzz off.');
        }
    }

};