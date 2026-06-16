require('dotenv').config();
const nodemailer = require('nodemailer');

const args = process.argv.slice(2);
const toEmail = args[0];
const subject = args[1];
const body = args[2];

if (!toEmail || !subject || !body) {
  console.error("Usage: node mailer.js <to_email> <subject> <body>");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const mailOptions = {
  from: `"Pick N Go Admin" <${process.env.EMAIL_USER}>`,
  to: toEmail,
  subject: subject,
  text: body
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error("Error sending email:", error);
    process.exit(1);
  } else {
    console.log("Email sent: " + info.response);
  }
});
