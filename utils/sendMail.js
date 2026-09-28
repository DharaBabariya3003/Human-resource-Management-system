const APIError = require("./APIError");
const sgMail = require('@sendgrid/mail');
const { sendGridKey, emailID } = require("../config");

/**
 * set configuration api key
 */ 
sgMail.setApiKey(sendGridKey.api_key);

exports.sendMail = async (mailOptions) => { 
	try { 
    if (mailOptions) {
			let msg = {
        to: mailOptions.toEmail,
        from: {
            email: emailID,
            name: 'Bigscal'
        },
        subject: mailOptions.emailSubject,
        html: mailOptions.emailText
      }		
      if (mailOptions.attachments) msg.attachments = mailOptions.attachments;

      const resData = await sgMail.send(msg);
      resData.send_at = new Date();
      let messageHeader = { ...resData[0].headers };
      // resData.MessageId = messageHeader?.['x-message-id'];
      return resData;
    }
    else {
      throw new APIError({ message: "No email data found to be send." });
    }
  }
  catch (error) {throw new APIError({ message: "There is some issue while sending emails." }); }
};