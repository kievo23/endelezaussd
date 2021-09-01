const express = require('express');
const router = express.Router();
const _ = require('lodash');
const bcrypt = require('bcryptjs');

//MODELS
const Person = require('../models/Person');
const Customer = require('../models/Customer');
const sendSMS = require('../functions/sendSMS');

//functions
const registration = require('../functions/registration');
const mpesaApi = require('../functions/mpesa');
const sendMail = require('../functions/emails');

//configs
const config = require(__dirname + '/../config.json');

router.post('/optin', async (req, res) => {
    if(!req.body.phone){
        res.send("have a phone parameter")
        res.end()
    }
    let customer = await Customer.findOne({ where: { customer_account_msisdn : req.body.phone } });
    console.log(req.body.phone)
    if(customer){
      registration.notifyTwiga(customer);
    }else{
      res.send("customer not found")
    }
  });

router.post('/stkpush', async (req, res) => {
    const testMSISDN = "+254710345130"
    const amount = 100
    const accountRef = Math.random().toString(35).substr(2, 7)
    let result = await mpesaApi.lipaNaMpesaOnline(testMSISDN, amount, config.mpesa.STKCallbackURL + '/lipanampesa/success', accountRef)
    res.send(JSON.stringify(result))
});  

router.get('/sendmail', async (req, res) => {
  sendMail("customer.person.first_name","customer.customer_account_msisdn", "amount").catch(console.error);
})

module.exports = router;