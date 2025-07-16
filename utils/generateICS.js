const { createEvent } = require("ics");

exports.generateICS = (title, description, location, startDate) => {
  const event = {
    start: [
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes(),
    ],
    duration: { hours: 2 },
    title,
    description,
    location,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
  };

  return new Promise((resolve, reject) => {
    createEvent(event, (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });
};
