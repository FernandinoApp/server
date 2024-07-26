const Counter = require('../models/counterModel'); // Adjust the path as needed

const initializeCounter = async () => {
  try {
    const counter = await Counter.findOne({ id: 'reportId' });
    if (!counter) {
      await new Counter({ id: 'reportId', seq: 0 }).save();
    }
  } catch (error) {
    console.error('Error initializing counter:', error);
    throw error;
  }
};

module.exports = { initializeCounter };
