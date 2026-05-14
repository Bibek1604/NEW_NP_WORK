const { jest } = require('@jest/globals');

module.exports = {
  User: {
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Job: {
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
  },
  JobApplication: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Kyc: {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  },
  Otp: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Transaction: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Milestone: {
    find: jest.fn(),
  },
  Ticket: {
    findOne: jest.fn(),
  },
  Notification: {
    create: jest.fn(),
  },
  Review: {
    find: jest.fn(),
  },
};
