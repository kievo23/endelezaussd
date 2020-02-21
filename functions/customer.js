const _ = require('lodash');
const express = require('express');
const bcrypt = require('bcryptjs');
const request = require("request");
const moment = require('moment');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

//MODELS
const Person = require('../models/Person');
const Agent = require('../models/Sales_Agent');
const Customer = require('../models/Customer');
const Delivery = require('../models/Delivery_Notification');
const Checkout = require('../models/Checkout');
const LoanAccount = require('../models/Loan_Account');
//SMS
const sendSMS = require('../functions/sendSMS');
const mpesaAPI = require('../functions/mpesa');

//configs
const config = require(__dirname + '/../config.json');

let CustomerModule =  async ( customer, text, req, res) => {
    let textnew = _.split(text,'#')
    arraylength = textnew.length - 1
    //console.log(textnew.length)
    // start today
    var start = moment().startOf('day');
    // end today
    var end = moment().endOf('day');

    let loans = await LoanAccount.findAll({include: [Delivery], where: { loan_status : 0, customer_account_id : customer.id } })
    let balance = 0
    let count = 0
    let dates = ''
    //console.log(deliveries)
    for (index = 0; index < loans.length; ++index) {
        balance += Math.ceil(parseFloat(loans[index].loan_balance))
        console.log(loans[index].loan_balance)
        count = count + 1
        dates = dates + loans[index].createdAt+", "
    }
    balance = parseFloat(balance).toFixed(2)
    let array = _.split(textnew[arraylength],'*');
    let size = array.length;
    let lastString = _.last(array)
    let firstString = _.first(array)
    console.log(textnew)
    console.log(array)
    if(firstString == 1 || size == 1){
        //console.log("Main Menu");
        //var m = moment(dates)
        console.log(dates)
        let response = ""
        console.log("Delivery")
            response = `CON Your pending ${config.app.name} balance is ${balance} KES 
1. Request ${config.app.name} facilitation
2. Pay in Full
3. Pay Partially
4. Check Limit
5. Change PIN`
        
        
        res.send(response)
    }else if(size == 2){
        if(lastString == 2){
            //Make Payment
            const testMSISDN = customer.customer_account_msisdn.substring(customer.customer_account_msisdn.length - 12)
            //console.log(testMSISDN)
            const amount = Math.ceil(parseFloat(balance));
            //const accountRef = Math.random().toString(35).substr(2, 7)
            const accountRef = testMSISDN
            //res.send(JSON.stringify(result))
            let result = await mpesaAPI.lipaNaMpesaOnline(testMSISDN, amount, config.mpesa.STKCallbackURL + '/lipanampesa/success', accountRef)
            console.log(result.data)
            let rcd = checkoutFunc(result.data,customer.customer_account_msisdn,amount,config.mpesa.ShortCode)
            console.log(rcd)
            let response = `END Wait for the MPesa prompt`
            res.send(response);
        }else if(lastString == 3){
            //Check loan Limit
            let response = `CON Input Amount To Pay
#. To go back to the main menu`
            res.send(response);
        }
        else if(lastString == 4){
            //Check loan Limit
            let response = `CON Your facilitation limit is ${customer.account_limit} KES
#. To go back to the main menu`
            res.send(response);
        }else if(lastString == 5){
            //Check loan Limit
            let response = `CON Input customer number to reset
#. To go back to the main menu`
            res.send(response);
        }else if(lastString == 1){
            let response = `CON Input loan amount
#. To go back to the main menu`
            res.send(response);
        }
    }else if(size == 3){
        //Make Payment
        if(array[1] == 4 ){
            const testMSISDN = customer.customer_account_msisdn.substring(customer.customer_account_msisdn.length - 12)
            //console.log(testMSISDN)
            const amount = Math.ceil(parseFloat(lastString))
            const accountRef = testMSISDN
            //res.send(JSON.stringify(result))
            let result = await mpesaAPI.lipaNaMpesaOnline(testMSISDN, amount, config.mpesa.STKCallbackURL + '/lipanampesa/success', accountRef)
            console.log(result.data)
            let rcd = checkoutFunc(result.data,customer.customer_account_msisdn,amount,config.mpesa.ShortCode)
            //console.log(rcd)
            let response = `END Wait for the MPesa prompt`
            res.send(response);
        }else if(array[1] == 1 ){
            //Make the delivery a loan entry
            let index = parseInt(lastString)- 1;
            if(Math.ceil(parseFloat(customer.account_limit)) > Math.ceil(parseFloat(balance) + parseFloat(array[2]))){
                let response = `CON Input the tillNumber to receive funds`
                //sendSMS(customer.customer_account_msisdn,msg);
                res.send(response);
            }else{
                let response = `END Sorry, Your request has exceeded your facilitation limit. Your limit is currently at KES ${customer.account_limit}`
                res.send(response);
            }
            
        }else if(array[1] == 6 ){
            let code = Math.floor(1000 + Math.random() * 9000);
            let salt = bcrypt.genSaltSync(10);
            let hash = bcrypt.hashSync(code.toString(), salt)
            let phone = "+254"+lastString.substring(lastString.length - 9);
            let customer = await Customer.findOne({ include: [Person], where: {customer_account_msisdn: phone} })
            console.log("reset password");
            if(customer){
                customer.pin_reset = 1
                customer.pin = hash
                customer.salt_key = salt
                customer.save((err, user)=>{
                    if(err) console.log(err);
                    console.log(user);
                });

                sendSMS(phone,"Welcome "+customer.person.first_name+", Your one time password is: "+code);
                let response =`END Password successfully reset`
                res.send(response)
            }
        }
    }else if(size == 4){
        if(array[1] == 1 ){
            let response =`CON Confirm that you need a loan amount ${array[2]} paid to till number ${array[3]}
    Press 1 to confirm this`
            res.send(response)
        }
    }else if(size == 5){
        if(array[1] == 1 && array[4] == 1 ){
            let amount = array[2];
            let till = array[3];
            let rst = await Delivery.create({
                amount: amount,
                customer_id: customer.id,
                till_number: till,
                phone: req.body.phoneNumber
            })
            let response =`END We have received your loan request of ${array[2]} paid to till number ${array[3]}
    Keep enjoying Endeleza services`
            res.send(response)
        }
    }
}

let checkoutFunc = async (json, phone, amount, shortcode ) =>{
    let rst = await Checkout.create({
        merchant_request_id: json.MerchantRequestID,
        checkout_request_id: json.CheckoutRequestID,
        response_code: json.ResponseCode,
        response_description: json.ResponseDescription,
        customer_message: json.CustomerMessage,
        msisdn: phone,
        amount: amount,
        payer_number: phone,
        paybill: shortcode
    })
    return rst
}

let LoanOfferConfirmation = async (loan,loanedAmount,deliveryAmount,loan_reference_id,receipt_no) => {
    var options = { method: 'POST',
    url: config.twiga.url+'confirm_loan',
    headers: 
    {   'cache-control': 'no-cache',
        'Authorization': 'Bearer '+config.twiga.bearerToken,
        'Content-Type': 'application/json' },
    body: 
    {   loaned_amount: deliveryAmount,
        due_date: '2019-09-13 12:55:00',
        delivery_amount: deliveryAmount,
        due_amount: loanedAmount,
        loan_reference_id: "mweza"+loan_reference_id,
        receipt_no: receipt_no },
    json: true };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
        loan.twiga_response = JSON.stringify(body);
        loan.save((err, loan)=>{
            if(err) console.log(err);
            console.log(loan);
        });

    });
}

module.exports = CustomerModule;