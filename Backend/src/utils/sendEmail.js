import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // If SMTP is not configured, fall back to logging
  if (!process.env.SMTP_HOST) {
    console.log(`[Email Service Mock] Sending email to: ${options.email}`);
    console.log(`[Email Service Mock] Subject: ${options.subject}`);
    if (options.attachments) console.log(`[Email Service Mock] Attachments: ${options.attachments.length}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'ZOOOMIT ERP'} <${process.env.FROM_EMAIL || 'noreply@ZOOOMIT.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML support
    attachments: options.attachments || []
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};

export default sendEmail;
