// Placeholder utility for sending emails.
// Replace with nodemailer or SendGrid in production.
const sendEmail = async (options) => {
  console.log(`[Email Service Mock] Sending email to: ${options.email}`);
  console.log(`[Email Service Mock] Subject: ${options.subject}`);
  console.log(`[Email Service Mock] Message: \n${options.message}`);
};

export default sendEmail;
