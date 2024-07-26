const User = require("../models/userModel");

const getCurrentYear = () => {
  const date = new Date();
  return date.getFullYear();
};

const getLatestIncrementalNumber = async () => {
  const lastUser = await User.findOne().sort({ createdAt: -1 }).exec();
  if (lastUser && lastUser.userId) {
    const lastIncrementalNumber = parseInt(lastUser.userId.split('-')[1], 10);
    return lastIncrementalNumber + 1;
  }
  return 1; // Start with 1 if no users are found
};

const createCustomID = async () => {
  const year = getCurrentYear();
  const incrementalNumber = await getLatestIncrementalNumber();
  return `${year}-${incrementalNumber.toString().padStart(2, '0')}`;
};

module.exports = { createCustomID };
