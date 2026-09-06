import dotenv from 'dotenv';
dotenv.config();

import sendEmail from './src/utils/sendEmail.js';

const run = async () => {
  try {
    console.log("Sending demo email...");
    await sendEmail({
      email: "zugija@polkaroad.net",
      subject: "Test Demo Email from Kuiklo",
      message: "Hello! This is a demo email to check if the mailing service is working properly."
    });
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

run();
