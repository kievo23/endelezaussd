const express = require('express');
const router = express.Router();
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const last = require('voca/last');

const Person = require('../models/Person');
const Agent = require('../models/Sales_Agent');
const Customer = require('../models/Customer');
const Customer_Type = require('../models/Customer_Account_Type');
const sendSMS = require('../functions/sendSMS');
const sendMail = require('../functions/emails');
const config = require(__dirname + '/../config.json');

//functions
const registration = require('../functions/registration');
const resetPassword = require('../functions/resetPassword');
const customerModule = require('../functions/customer');
const leopardSms = require('../functions/leopardSms');

router.get('/', (req, res) => {
  res.send('Endeleza USSD Application');
});

router.post('/email', function(req, res){
  sendMail("Kelvin Chege Maina","0710345130", 3000).catch(console.error);
})

router.post('/sms', function(req, res){
  leopardSms("0710345130", "Leopard works").catch(console.error);
})

router.post('*', async (req, res) => {
  let {sessionId, serviceCode, phoneNumber, text} = req.body;
  if(phoneNumber == null || text== null){
    res.send("Parameters not set");
  }
  let phone = "+254"+ phoneNumber.substring(phoneNumber.length - 9);
  
  let customer = await Customer.findOne({ include: [Person], where: { customer_account_msisdn : phone } });
  //console.log(customer.person.FIRST_NAME);
  let agent = await Agent.findOne({ include: [Person], where: { agent_msisdn : "+254710345132" } });
  //console.log(agent);
  //if(!customer && !agent){
  if(!customer){
//     let response = `END Thank you for your interest in ${config.app.name}. 
// Kindly contact ${config.app.name} on 
// ${config.app.contact}`
    //res.send(response);
    if(text == ''){
      res.send(`CON Welcome to Endeleza Capital
      Press 1 to register and get loans
      `)
    }else{
      return registration.registration(text,req, res, agent)
    }
  }
  else if(customer){
    return customerUssd(customer,text,req,res);
  }
  // else if(agent){
  //   //console.log("agent")
  //   return agentUssd(agent,text,req, res);
  // }
});


let agentUssd =  async (agent,text,req, res)=>{
  let textnew = _.split(text,'#')
  arraylength = textnew.length - 1
  let array = _.split(textnew[arraylength],'*');
  let size = array.length;
  //let array = _.split(text,'*')
  let lastString = _.last(array)
  let firstString = _.first(array)
  console.log(array)
  if(agent.pin_reset == 1){
    console.log("reset password")
    return resetPassword(agent,text,req,res);
  }else  if(agent.active != 1){
    console.log("not activated")
    let response = `END Agent ${agent.person.first_name}, your account is not yet activated. Kindly contact ${config.app.name} for more details on ${config.app.contact}.`
    res.send(response)
  }else if(text == '' || lastString== '##'){
    console.log("welcome screen")
    let response = `CON Welcome agent ${agent.person.first_name}
  1. Register Customer
  2. Reset a Customer Password
  3. Activate Web Portal`
    res.send(response)
  }else if(firstString == '1'){
    return registration.registration(text,req, res, agent)
  }else if(firstString == '2' && size == 1){
    let response =`CON Enter Customer Number`
    res.send(response)
  }else if(firstString == '2' && size == 2){
    console.log(array)
    if(array[0]== '2'){
      let code = Math.floor(1000 + Math.random() * 9000);
      let salt = bcrypt.genSaltSync(10);
      let hash = bcrypt.hashSync(code.toString(), salt);
      let phone = "+254"+last(lastString.trim(), 9);
      let customer = await Customer.findOne({ include: [Person], where: {customer_account_msisdn: phone} })
      customer.pin = hash
      customer.salt_key = salt
      customer.pin_reset = 1
      customer.save((err, user)=>{
        if(err) console.log(err);
        console.log(user);
      });
      sendSMS(phone,"Your one time password is: "+code);
      let response =`END Customer is reset successfully`
      res.send(response)
    }
  }else if(firstString == '3' && size == 1){
    let response =`CON Enter Your email Address`
    res.send(response)
  }else if(firstString == '3' && size == 2){
    let response =`CON Enter Your Preferred Password`
    res.send(response)
  }else if(firstString == '3' && size == 3){
    //Logic for activation
    let password = bcrypt.hashSync(array[2], 10);
    console.log(array)
    agent.email = array[1]
    agent.password = password    
    agent.save((err, user)=>{
        if(err) console.log(err);
        console.log(user);
    });
    sendSMS(agent.agent_msisdn,"Welcome to "+config.app.name+" web portal. Use your email: "+agent.email+" and your password to login on http://209.97.140.13/agent/login");
    let response =`END Congratulations! You can now use the web portal as our agent.`
    res.send(response)
  }
}


customerUssd : function customerUssd(customer,text,req,res){
  let textnew = _.split(text,'#')
  arraylength = textnew.length - 1
  let firstChar = textnew[arraylength].charAt(0)
  let newtext = "";
  if(firstChar == "*"){
    newtext = textnew[arraylength].substring(1);
  }else{
    newtext = textnew[arraylength]
  }
  
  let array = _.split(newtext,'*');

  //let array = _.split(text,'*')
  console.log(array)
  console.log(newtext)
  let lastString = _.last(array)
  let firstString = _.first(array)
  if(customer.pin_reset == 1) {
    return resetPassword(customer,newtext,req,res);
  }
  else if(customer.active != 1) {
    let response = `END Dear ${customer.person.first_name}, your account is not activated
  Kindly call ${config.app.contact} for more details`
    res.send(response)
  }else  if(customer.blocked == 1){
    let response = `END Dear ${customer.person.first_name}, your account is blocked. 
  Kindly contact ${config.app.name} for more details on ${config.app.contact}.`
    res.send(response)
  }else if (newtext == '' || lastString== '#' || array.length >= 0) {
    // This is the first request. Note how we start the response with CON
    return customerModule(customer,newtext,req,res)
    let response = `CON Welcome ${customer.person.first_name} to ${config.app.name} Payment Platform
    
    Input your password to proceed
    (Forgot password? Call ${config.app.contact})`
    //console.log(req.session);
    res.send(response)
    
  } 
    //else if (firstString.length == 4) {
  //   // Business logic for first level response
  //   // BUSINESS LOGIC FOR
  //   //console.log(array[0])
  //   let rst = bcrypt.compareSync(array[0], customer.pin);
  //   if(rst == true){
  //     return customerModule(customer,newtext,req,res)
  //   }else{
  //     let response = `CON Wrong password.
  //     #. go back to previous menu`
  //     res.send(response)
  //   }   
  // } 
  else {
    let response = `CON Invalid Input
    #. Main Menu
    CANCEL. End USSD`
    res.send(response)
  }
}





module.exports = router;