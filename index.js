const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const cors = require('cors');
const prisma = new PrismaClient();
const app = express();
const port = 3000;
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Middleware to connect to the database
app.use(async (req, res, next) => {
  try {
    await prisma.$connect();
    next();
  } catch (error) {
    res.status(500).send('Database connection error');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.post('/create', async (req, res, next) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).send('Name and Email are required');
  }

  if (!validateEmail(email)) {
    return res.status(400).send('Invalid email format');
  }

  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    // Send referral email
    sendReferralEmail(name, email);

    res.status(201).json(newUser);
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).send('Email already exists');
    } else {
      next(error);
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Helper function to validate email format
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Function to send referral email using Nodemailer and Gmail
async function sendReferralEmail(name, email) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Thank you for your referral!',
    text: `Hi ${name},\n\nThank you for referring a friend to our service!\n\nBest regards,\nYour Company`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Referral email sent successfully');
  } catch (error) {
    console.error('Error sending referral email:', error);
  }
}
