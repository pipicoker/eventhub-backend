const Registration = require('../models/registrationModel');

const Event = require('../models/eventModel')
const nodemailer = require("nodemailer");
const { generateICS } = require("../utils/generateICS");

exports.registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    if (!userId || !eventId) {
      return res.status(400).json({ message: 'User ID and Event ID are required.' });
    }

    const existingRegistration = await Registration.findOne({ userId, eventId });
    if (existingRegistration) {
      return res.status(409).json({ message: 'You are already registered for this event.' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const newRegistration = new Registration({ userId, eventId });
    await newRegistration.save();

    await Event.findByIdAndUpdate(eventId, { $inc: { registered: 1 } });

    // === SEND CONFIRMATION EMAIL ===
    const user = req.user; // make sure your auth middleware adds name/email
    const icsContent = await generateICS(
      event.title,
      event.description,
      event.location,
      new Date(event.date)
    );

    const transporter = nodemailer.createTransport({
      service: "gmail", // or use SMTP / SendGrid
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `You're Registered: ${event.title}`,
      html: `
        <p>Hello ${user.name || 'there'},</p>
        <p>You have successfully registered for:</p>
        <ul>
          <li><strong>Event:</strong> ${event.title}</li>
          <li><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</li>
          <li><strong>Location:</strong> ${event.location}</li>
        </ul>
        <p>We've attached a calendar invite for your convenience.</p>
        <p>See you there!</p>
      `,
      attachments: [
        {
          filename: `${event.title}.ics`,
          content: icsContent,
          contentType: "text/calendar",
        },
      ],
    });

    res.status(201).json({
      message: 'Successfully registered. Confirmation email sent.',
      registration: newRegistration
    });

  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getUserRegistrations = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const registrations = await Registration.find({ userId }).populate(
      'eventId',
      'title date location category price'
    );

    // ✅ Always return 200 OK with an array
    return res.status(200).json({
      registrations: registrations || []
    });

  } catch (error) {
    console.error('Error fetching user registrations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


exports.unregisterFromEvent = async (req, res) => {
    try {
        const {eventId } = req.params;
        const userId = req.user.userId; // user ID is stored in req.user by the authentication middleware
        // Validate input
        if ( !eventId) {
            return res.status(400).json({ message: '  Event ID is required.' });
          }

        // Check if registration exists
        const registration = await Registration.findOne({ userId, eventId });
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found.' });
        }
        // Unregister the user from the event
        await Registration.deleteOne({ userId, eventId });  

        // Decrement the registered count (but prevent it from going below zero)
    await Event.findByIdAndUpdate(eventId, { $inc: { registered: -1 } });
        res.status(200).json({ message: 'Successfully unregistered from the event.' });
        
    } catch (error) {
        console.error('Error unregistering from event:', error);
        res.status(500).json({ message: 'Internal server error.' });
        
    }
}


