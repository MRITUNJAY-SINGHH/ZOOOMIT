import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
<<<<<<< HEAD
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
=======
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
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
<<<<<<< HEAD
    from: `"Kuiklo" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Support HTML emails if provided
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email Service] Message sent: ${info.messageId}`);
=======
    from: `${process.env.FROM_NAME || 'Zooom ERP'} <${process.env.FROM_EMAIL || 'noreply@Zooom.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML support
    attachments: options.attachments || []
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
};

export default sendEmail;
