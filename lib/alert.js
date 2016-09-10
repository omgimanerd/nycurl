/**
 * @fileoverview This library file takes care of sending an alert to my email
 *   using the SendGrid API.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

const FROM_EMAIL = 'alert@nycurl.sytes.net';
const TO_EMAIL = 'alvin.lin.dev@gmail.com';

var sendgrid = require('sendgrid');

/**
 * Returns a function that sends an email alert via the SendGrid alert.
 * @param {string} apiKey The SendGrid API key.
 * @return {function()}
 */
module.exports = function(apiKey) {
  return function(subject, content, callback) {
    var helper = sendgrid.mail;
    var mail = new helper.Mail(new helper.Email(FROM_EMAIL), subject,
                               new helper.Email(TO_EMAIL),
                               new helper.Content('text/plain', content));
    sendgrid(apiKey).API(sendgrid(apiKey).emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mail.toJSON()
    }), callback);
  };
};
