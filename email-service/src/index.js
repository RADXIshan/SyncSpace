import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', process.env.CLIENT_URL],
  credentials: true
}));

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    socketTimeout: 10000
  });
};

const transporter = createTransporter();

// Verify email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

app.get("/", (_, res)=>{
  res.json({ message: "Email Server is live!" })
})

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  const { to, subject, html, from } = req.body;
  
  if (!to || !subject || !html) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const mailOptions = {
    from: {
      name: from?.name || "SyncSpace",
      address: process.env.EMAIL
    },
    to,
    subject,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
});