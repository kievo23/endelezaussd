let express = require('express');
let router = express.Router();
const _ = require('lodash');

const Person = require('../models/Person');
const Agent = require('../models/Sales_Agent');
const Customer = require('../models/Customer');
const Customer_Type = require('../models/Customer_Account_Type');

//SMS send
const sendSMS = require('../functions/sendSMS');

router.get('*', (req, res) => {
  sendSMS("0710345130","funda, amka motherfucker tuchape kazi");
});

router.post('*', (req, res) => {
  let {sessionId, serviceCode, phoneNumber, text} = req.body
  let array = _.split(text,'*')
  let lastString = _.last(array)
  
  if (text == '' || lastString== '00') {
    // This is the first request. Note how we start the response with CON
    let response = `CON Welcome agent to Twiga Payments Platform
    1. Active Deliveries
    2. Pending Deliveries
    3. Make Payments`
    res.send(response)
  } else if (text == '1') {
    // Business logic for first level response
    let response = `CON Choose account information you want to view
    1. Account number
    2. Account balance`
    res.send(response)
  } else if (text == '2') {
    // Business logic for first level response
    let response = `END Your phone number is ${phoneNumber}`
    res.send(response)
  } else if (text == '1*1') {
    // Business logic for first level response
    let accountNumber = 'ACC1001'
    // This is a terminal request. Note how we start the response with END
    let response = `END Your account number is ${accountNumber}`
    res.send(response)
  } else if (text == '1*2') {
    // This is a second level response where the user selected 1 in the first instance
    let balance = 'NGN 10,000'
    // This is a terminal request. Note how we start the response with END
    let response = `END Your balance is ${balance}`
    res.send(response)
  } else {
    res.status(400).send('Bad request!')
  }
})

module.exports = router;
