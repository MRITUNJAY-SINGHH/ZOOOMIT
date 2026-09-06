import Notification from '../models/Notification.js';
import nodemailer from 'nodemailer';

class NotificationService {
  async createNotification({ type, message, product, batch, order, targetUser }) {
    try {
      await Notification.create({
        type,
        message,
        product: product || null,
        batch: batch || null,
        order: order || null,
        targetUser: targetUser || null
      });
    } catch (error) {
      console.error('Notification System Error:', error.message);
    }
  }

  async sendEmailWithAttachment({ to, subject, text, html, attachmentBuffer, attachmentName }) {
    try {
      if (!process.env.SMTP_HOST) {
        console.log('Mock Email sent to:', to);
        console.log('Subject:', subject);
        return true;
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: `"${process.env.STORE_NAME || 'Zooom Store'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
        attachments: attachmentBuffer ? [
          {
            filename: attachmentName || 'Document.pdf',
            content: attachmentBuffer,
            contentType: 'application/pdf'
          }
        ] : []
      };

      const info = await transporter.sendMail(mailOptions);
      if (process.env.SMTP_HOST.includes('ethereal')) {
        console.log('Ethereal Email Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
      return true;
    } catch (error) {
      console.error('Email Sending Error:', error.message);
      throw error;
    }
  }
}

export default new NotificationService();
