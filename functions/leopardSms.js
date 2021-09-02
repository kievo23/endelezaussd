var http = require("https");
var request = require("request");
var config = require(__dirname + '/../config.json');

const sendLeopardSMS = async function sendMessage(phone, sms){

    var options = { 
        method: 'POST',
        url: 'https://api.smsleopard.com/v1/sms/send',
        headers: 
        { 'postman-token': 'f3b85a79-0035-e343-c38c-884bba115380',
            'cache-control': 'no-cache',
            authorization: 'Basic '+Buffer.from(config.sms.leopardSMS_username+":"+config.sms.leopardSMS_password).toString('base64'),
            accept: 'application/json',
            'content-type': 'application/json' },
        body: 
        { 
            source: 'Endeleza',
            message: sms,
            destination: [ { number: phone } ] 
        },
        json: true 
    };

    request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(response);
    });
}

module.exports = sendLeopardSMS;