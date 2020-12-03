const Mpesa = require('mpesa-node')
const config = require(__dirname + '/../config.json');

const mpesaApi = new Mpesa({ 
    consumerKey: config.mpesa.consumer_key, 
    consumerSecret: config.mpesa.consumer_secret,
    environment: config.mpesa.environment,
    shortCode: config.mpesa.TillShortCode,
    lipaNaMpesaShortCode: config.mpesa.BusinessShortCode,
    lipaNaMpesaShortPass: config.mpesa.passkey,
    securityCredential: config.mpesa.securityCredential,
    transactionType : "CustomerBuyGoodsOnline"
})

const {
    accountBalance,
    lipaNaMpesaOnline,
    lipaNaMpesaQuery,
  } = mpesaApi

module.exports = mpesaApi;