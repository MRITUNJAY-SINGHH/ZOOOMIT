import dotenv from 'dotenv';
dotenv.config();

import sendEmail from './src/utils/sendEmail.js';

async function runTest() {
  const targetEmail = process.argv[2] || 'bekepo5355@dysonc.com';
  console.log(`Sending test emails to: ${targetEmail}`);
  console.log(`Note: Since we are using Ethereal SMTP, these emails will be intercepted and won't reach your real inbox.`);
  console.log(`Instead, you can click the "Preview URL" links below to view the exact HTML that would have been sent!`);
  console.log('----------------------------------------------------');
  
  try {
    // 1. Welcome Email
    await sendEmail({
      email: targetEmail,
      subject: 'Welcome to Kuiklo ERP',
      message: 'Hello! Welcome to Kuiklo ERP.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4CAF50;">Welcome to Kuiklo ERP!</h2>
          <p>Hello,</p>
          <p>Your account has been successfully created. We are excited to have you on board.</p>
          <br/>
          <p>Best regards,<br/>The Kuiklo Team</p>
        </div>
      `
    });
    console.log('--- Welcome Email Sent ---');

    // 2. Password Reset
    await sendEmail({
      email: targetEmail,
      subject: 'Password Reset Request',
      message: 'Click here to reset your password.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Please click the button below to reset your password:</p>
          <a href="http://localhost:5173/reset-password/fake-token-123" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <br/><br/>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `
    });
    console.log('--- Password Reset Email Sent ---');

    // 3. Invoice / Order Email
    await sendEmail({
      email: targetEmail,
      subject: 'Invoice #INV-2026-00001 from Kuiklo ERP',
      message: 'Please find attached your invoice.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Thank you for your Order!</h2>
          <p>Hello Walk-in Customer,</p>
          <p>Your order <strong>#ORD-2026-00001</strong> has been successfully processed.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #dee2e6;">Item</th>
              <th style="padding: 10px; border: 1px solid #dee2e6;">Qty</th>
              <th style="padding: 10px; border: 1px solid #dee2e6;">Total</th>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6;">Premium Wireless Headphones</td>
              <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">1</td>
              <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">₹4999.00</td>
            </tr>
          </table>
          <p style="text-align: right; margin-top: 10px;"><strong>Grand Total: ₹4999.00</strong></p>
          <p>If you have any questions, feel free to contact us.</p>
        </div>
      `
    });
    console.log('--- Invoice Email Sent ---');

  } catch (err) {
    console.error('Error sending test emails:', err);
  }
}

runTest();
