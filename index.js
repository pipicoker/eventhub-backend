require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const mongoStore = require('connect-mongo');

require('./config/passport'); // Import passport configuration

const authRouter = require('./routes/authRouter');
const eventRouter = require('./routes/eventsRouter');
const registrationRouter = require('./routes/registrationRouter');
const userRouter = require('./routes/userRouter')
const stripeRouter = require('./routes/stripeRouter')

const app = express();
// ✅ Allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true,               
}));



app.use(helmet())
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'temporary_secret',
  resave: false,
  saveUninitialized: false,
  store: mongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
  }),
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    // ✅ Start server only after successful DB connection
    app.listen(process.env.PORT, () => {
      console.log(`listening on port ${process.env.PORT}...`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });


app.use('/api/auth', authRouter)
app.use('/api/events', eventRouter)
app.use('/api/registrations', registrationRouter)
app.use('/api', userRouter)
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));
app.use('/api/stripe', stripeRouter)


app.get('/', (req, res) => {
    res.send('Welcome to the Event Hub Backend!');
})

