const Registration = require('../models/registrationModel');

const Event = require('../models/eventModel')

exports.registerForEvent = async (req, res) => {
    try {
        const {  eventId } = req.params;
        const userId = req.user.userId; // user ID is stored in req.user by the authentication middleware

        // Validate input
        if (!userId || !eventId) {
            return res.status(400).json({ message: 'User ID and Event ID are required.' });
        }

        // Check if registration already exists
        const existingRegistration = await Registration.findOne({ userId, eventId });
        if (existingRegistration) {
            return res.status(409).json({ message: 'You are already registered for this event.' });
        }

        // Create new registration
        const newRegistration = new Registration({ userId: req.user.userId, eventId });
        await newRegistration.save();

        // increment the registered count
        await Event.findByIdAndUpdate(eventId, {$inc: {registered: 1}})

        res.status(201).json({ message: 'Successfully registered for the event.', registration: newRegistration });
        
    } catch (error) {
        console.error('Error registering for event:', error);
        
        
    }
}

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


