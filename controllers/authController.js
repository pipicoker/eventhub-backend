const jwt = require('jsonwebtoken');

const User = require('../models/usermodel');
const {dohash, dohasValidation} = require('../utils/hashing');

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const {OAuth2Client} = require('google-auth-library')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ✅ Google login handler
exports.googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ googleId });

    if (!user) {
      user = new User({
        googleId,
        name,
        email,
        avatar: payload.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        isVerified: true, // ✅ Mark Google user as verified
      });

      await user.save();
    }

    // ✅ Ensure the user is verified
    user.isVerified = true;
    await user.save();

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: '8h' }
    );

    // ✅ Set the token as cookie (optional for SSR apps)
    res.cookie('Authorization', `Bearer ${token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 8 * 3600000, // 8 hours
    });

    // ✅ Send token and user to frontend
    return res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    console.error('Google token verification failed:', error);
    return res.status(401).json({ error: 'Google login failed' });
  }
};


const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

   const verificationLink = `${process.env.BACKEND_BASE_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email',
    html: `<p>Please click the link below to verify your email:</p>
           <a href="${verificationLink}">${verificationLink}</a>`,
  });
};

exports.signup = async (req, res) => {
    const {email, password, name} = req.body;

    try {
        

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({error: 'User already exists'});
        }

        // Hash the password
        const hashedPassword = await dohash(password, 12);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        // Create a new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            verificationToken,
            tokenExpiresAt,
        })

        // Save the user to the database
        const savedUser = await newUser.save();

        const verificationLink = `${process.env.BACKEND_BASE_URL}/api/auth/verify-email?token=${verificationToken}&email=${email}`;

    await sendEmail(email, 'Verify your email', `Click to verify: ${verificationLink}`);

        res.status(201).json({
            success:true,
            message: 'User created. Please check your email to verify your account.',
            savedUser
        })

    } catch (error) {
        console.log('Error during signup:', error);
        
    }
}

exports.verifyEmail = async (req, res) => {
  const { token, email } = req.query;

  try {
    const user = await User.findOne({ email, verificationToken: token });

    if (!user || user.tokenExpiresAt < Date.now()) {
      return res.status(400).json({ error: 'Token invalid or expired' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.tokenExpiresAt = undefined;
    await user.save();

   // ✅ Redirect to frontend success page after verification
    return res.redirect(`${process.env.FRONTEND_URL}/verified-success`);
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }

    // Generate a new token and expiry
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    user.verificationToken = verificationToken;
    user.tokenExpiresAt = tokenExpiresAt;
    await user.save();

    const verificationLink = `${process.env.BACKEND_BASE_URL}/api/auth/verify-email?token=${verificationToken}&email=${email}`;
    await sendEmail(email, 'Verify your email', `Click to verify: ${verificationLink}`);

    res.json({ success: true, message: 'Verification email resent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Could not resend verification email' });
  }
};




exports.login = async (req, res) => {
    const {email, password} = req.body;

    try {
        const existingUser = await User.findOne({ email }).select('+password');
        if (!existingUser) {
            return res.status(400).json({error: 'Invalid email or password'});
        }

        if (!existingUser.isVerified) {
            return res.status(403).json({ error: 'Please verify your email before logging in.' });
        }

        // Validate password
        const isPasswordValid = await dohasValidation(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({error: 'Invalid email or password'});
        }
            
        
        const token = jwt.sign(
			{
				userId: existingUser._id,
				email: existingUser.email,
			},
			process.env.TOKEN_SECRET,
			{
				expiresIn: '8h',
			}
		);

		res
			.cookie('Authorization', 'Bearer ' + token, {
				expires: new Date(Date.now() + 8 * 3600000),
				httpOnly: process.env.NODE_ENV === 'production',
				secure: process.env.NODE_ENV === 'production',
			})
			.json({
				success: true,
				token,
				message: 'logged in successfully',
                user: {
                    _id: existingUser._id,
                    name: existingUser.name,
                    email: existingUser.email,
                    role: existingUser.role,
                    avatar: existingUser.avatar
                }
			});
        
    } catch (error) {
        console.log('Error during login:', error);
       
        
    }
}

exports.logout = async (req, res) => {
    try {
        res.clearCookie('Authorization');
        res.status(200).json({message: 'Logged out successfully'});
    } catch (error) {
        console.log('Error during logout:', error);
        res.status(500).json({error: 'Internal server error'});
    }
}

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user ID is stored in req.user
        const user = await user.findById(userId).select('-password'); // Exclude password from response
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }
        res.status(200).json({
            success: true,
             user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              role: user.role
            }
        });
        
    } catch (error) {
        console.log('Error fetching user profile:', error);
    }
}

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password'); // ✅ Capital "User" for the model

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};