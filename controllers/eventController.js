const Event = require('../models/eventModel');

exports.getEvents = async (req, res) => {
  try {
    const { date, category, search } = req.query;
    const query = {};

    // Filter by date
    if (date) {
      const selectedDate = new Date(date); // ✅ Capital D
      selectedDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);

      query.date = {
        $gte: selectedDate,
        $lt: nextDay
      };
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by search term (title or description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query).sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

exports.getEventById = async (req, res) => {
    try {
        const eventId = req.params.id.trim();

        const event = await Event.findById(eventId).populate('organizerId', 'name email');
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.status(200).json(event);
        
    } catch (error) {
        console.error('Error fetching event by ID:', error);
        
        
    }
}

exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, capacity,  category, price } = req.body;

        // Validate required fields
        if (!title || !description || !date || !location || !capacity || !category || price === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
}

        // Create new event
        const newEvent = new Event({
            title,
            description,
            date: new Date(date), // Ensure date is a Date object
            location,
            capacity,
            organizerId: req.user.userId,
            category,
            price
        });

        await newEvent.save();
        res.status(201).json({ event: newEvent });
;
        
    } catch (error) {
        console.error('Error creating event:', error);
        
        
    }
}


exports.updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id.trim();

        // check if the user id is the organizer of the event
        const event = await Event.findById(eventId);
        if (!eventId) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'You are not authorized to update this event' });
        }

        // update only the fields that are provided in the request body
        // if a field is not provided, it will not be updated
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId, 
            {
                $set: {
                    title: req.body.title,
                    description: req.body.description,
                    date: req.body.date ? new Date(req.body.date) : event.date, // Ensure date is a Date object
                    location: req.body.location,
                    capacity: req.body.capacity,
                    category: req.body.category,
                    price: req.body.price
                }
            },
            { new: true } // Return the updated document        
        )
        res.status(200).json(updatedEvent);
        
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
}

exports.deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id.trim();

        // check if the user id is the organizer of the event
        const event = await Event.findById(eventId);
        if(!event){
            return res.status(404).json({ error: 'Event not found' });
        }
        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'You are not authorized to delete this event' });
        }
        await Event.findByIdAndDelete(eventId);
        res.status(200).json({ message: 'Event deleted successfully' });

        
    } catch (error) {
        console.error('Error deleting event:', error);
    
        
    }
}
