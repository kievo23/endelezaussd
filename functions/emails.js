const nodemailer = require("nodemailer");
const config = require(__dirname + '/../config.json');

const Email = async function main(name,phone,amount) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();
  
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "mail.endelezacapital.com",
      port: 465,
      secure: true, // true for 465, false for other ports or 587
      auth: {
        user: config.email.username, // generated ethereal user
        pass: config.email.password, // generated ethereal password
      },
    });
  
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Endeleza System Admin 👻👻👻👻" <systems@endelezacapital.com>', // sender address
      to: config.email.recipient, // list of receivers
      subject: "New Loan Request ✔", // Subject line
      text: "New loan request from "+ name+ " requesting for a loan of KES "+amount, // plain text body
      html: "<b>New Loan Request from</b><h2>"+name+"</h2><p>Phone Number: "+phone+"</p><p> requesting for a loan of KES:" + amount+ "</pre>", // html body
    });
  
    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

module.exports = Email;