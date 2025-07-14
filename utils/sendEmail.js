const nodemailer = require('nodemailer');

module.exports = async function sendEmail(to, subject, html) {
  const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // or 465
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


  await transporter.sendMail({
    from: '"EventHub" <no-reply@eventhub.com>',
    to,
    subject,
    html,
  });

   const info = await transporter.sendMail({
    from: '"EventHub" <no-reply@eventhub.com>',
    to,
    subject,
    html,
  });

  console.log('✅ Email sent: %s', info.messageId);
};
