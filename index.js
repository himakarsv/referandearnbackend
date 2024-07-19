const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const cors=require("cors");
const prisma = new PrismaClient();
const app = express();
const port = 3000;
const dotenv=require("dotenv");

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

app.post('/create', async (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).send('Name and Email are required');
  }

  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
      },
    });
    res.status(201).json(newUser);
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).send('Email already exists');
    } else {
      console.log(error)
      res.status(500).send('Internal Server Error');
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
