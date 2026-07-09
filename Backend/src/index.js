import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';

import inventoryRoutes from './routes/inventoryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import posRoutes from './routes/posRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

app.use(express.json());
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (
      origin.startsWith('http://localhost') || 
      origin.endsWith('.vercel.app') || 
      origin === process.env.ADMIN_URL
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', (await import('./routes/settingsRoutes.js')).default);

app.get('/', (req, res) => {
  res.send('Kuiklo API is running...');
});

import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

app.get('/api/health', async (req, res) => {
  let dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  let smtpStatus = 'Configured';
  if (!process.env.SMTP_HOST) smtpStatus = 'Not Configured';
  
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    db: dbStatus,
    smtp: smtpStatus,
    cloudinary: process.env.CLOUDINARY_URL ? 'Configured' : 'Not Configured',
    razorpay: process.env.RAZORPAY_KEY_ID ? 'Configured' : 'Not Configured'
  };

  try {
    res.status(dbStatus === 'Connected' ? 200 : 503).json(healthCheck);
  } catch (error) {
    healthCheck.message = error.message;
    res.status(503).json(healthCheck);
  }
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
