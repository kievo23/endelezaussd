const _ = require('lodash');
const express = require('express');
const bcrypt = require('bcryptjs');
const last = require('voca/last');
const request = require("request");
//MODELS
const Person = require('../models/Person');
const Agent = require('../models/Sales_Agent');
const Customer = require('../models/Customer');
//Config
const config = require(__dirname + '/../config.json');
//SMS
const sendSMS = require('../functions/sendSMS');
const leopardSMS = require('../functions/leopardSms');

let registration = async(text,req, res, agent) => {
    
    let array = _.split(text,'*');
    let size = array.length;
    let lastString = _.last(array)
    let firstString = _.first(array)
    console.log(array);
    if(size == 1){
        let response = `CON Enter the customer's Surname`
        res.send(response)
    }else if(size == 2){
        let response = `CON Enter the customer's First Name`
        res.send(response)
    }else if(size == 3){
        let response = `CON Enter the customer's Other Names`
        res.send(response)
    }else if(size == 4){
        let response = `CON Enter the customer's National ID`
        res.send(response)
    }else if(size == 5){
        let response = `CON Enter the name of your Business`
        res.send(response)
    }else if(size == 6){
        let response = `CON Enter the location of the business`
        res.send(response)
    }else if(size == 7){
        let response = `CON Confirm customer's registration?. 
        1. Complete registration`
        res.send(response)
    }else if(size == 8){
        let surname = array[1].trim();
        let firstname = array[2].trim();
        let othernames = array[3].trim();
        let id = array[4].trim();
        let business_name = array[5].trim();
        let location = array[6].trim();
        let phone = "+254"+last(req.body.phoneNumber.trim(), 9);
        
        let person = await Person.findOne({ where: {id_number: id} })
            // project will be the first entry of the Projects table with the title 'aProject' || null
        //console.log(person);
            //console.log(agent);
        if(!person){
            let person = await Person.create({
                surname: surname,
                first_name: firstname,
                other_names: othernames,
                id_number: id,
                primary_msisdn: phone,
                physical_location: location,
                business_name: business_name,
            })
            //console.log(person);
            let code = Math.floor(1000 + Math.random() * 9000);
            let salt = bcrypt.genSaltSync(10);
            let hash = bcrypt.hashSync(code.toString(), salt);
            let customer = await Customer.findOne({ include: [Person], where: {customer_account_msisdn: phone} })
            if(!customer){                
                customer = await Customer.create({
                    customer_account_msisdn: phone,
                    person_id: person.id,
                    pin_reset: 0,
                    pin: hash,
                    salt_key: salt,
                    agent_id: parseInt(agent.id)
                });
                //notifyTwiga(customer);
                console.log("CODE: "+ code);
                leopardSMS(phone, "Dear customer, your application has been received. To review our terms and conditions, click https://tinyurl.com/3ych68bm").catch(console.error);
                let response =`END Registration successful! Please review our terms and conditions sent via SMS`
                res.send(response)
            }else{
                let response =`END Client has been registered!!`
                res.send(response)
            }
            // let response =`CON Registration successful!!`
            // return response
            
        }else{
            let customer = await Customer.findOne({ where: {customer_account_msisdn: phone} })
            if(!customer){
                let code = Math.floor(1000 + Math.random() * 9000);
                let salt = bcrypt.genSaltSync(10);
                let hash = bcrypt.hashSync(code.toString(), salt);
                let customer = await Customer.create({
                    customer_account_msisdn: phone,
                    person_id: person.id,
                    pin_reset: 0,
                    pin: hash,
                    salt_key: salt,
                    agent_id: parseInt(agent.id)
                })
                leopardSMS(phone, "Dear customer, your application has been received. To review our terms and conditions, click https://tinyurl.com/3ych68bm").catch(console.error)
                let response =`END Registration successful! Please review our terms and conditions sent via SMS`
                res.send(response)
            }else{
                let response =`END You are already registered!!`
                res.send(response)
            }
        }       
        leopardSMS(phone, "Dear customer, your application has been received. To review our terms and conditions, click https://tinyurl.com/3ych68bm").catch(console.error)
        let response =`END Registration successful! Please review our terms and conditions sent via SMS`
        return response
    }
}

let notifyTwiga = (user) => {
    Customer.findOne({ include: [Person], where: {customer_account_msisdn: user.customer_account_msisdn} })
    .then(function(customer){
        //console.log("customer")
        //console.log(customer.customer_account_msisdn)
        if(customer){
            var options = { method: 'POST',
            url: config.twiga.url+'opt_in',
            headers:
            {
                'cache-control': 'no-cache',
                'Content-Type' : 'application/json',
                'Authorization': 'Bearer '+config.twiga.bearerToken
            },
            body: 
            {
                opt_in: true,
                phone_number: customer.customer_account_msisdn,
                document_type: 'ID',
                document_number: customer.person.id_number,
                full_name: customer.person.surname +' '+ customer.person.first_name +' '+ customer.person.other_names
            },
            json: true };

            request(options, async function (error, response, body) {
                if (error) throw new Error(error);
                
                let obj = JSON.parse(response.request.body);
                console.log(response.statusCode)
                let customer = await Customer.findOne({ include: [Person], where: {customer_account_msisdn: obj.phone_number} })
                //console.log(customer)
                
                if(response.statusCode == 200){
                    console.log("customer is verified by twiga. And is actually a twiga customer")
                    customer.active = true;
                    customer.account_limit = 5000.00;
                }
                customer.twiga_response = JSON.stringify(body);
                customer.save((err, user)=>{
                    if(err) console.log(err);
                    //console.log(user);
                })
                let res = `Twiga Notified`;
                return res
            });
            return true;
        }else{
            return false;
        }
    });
}

module.exports = {
    registration: registration,
    notifyTwiga: notifyTwiga
}