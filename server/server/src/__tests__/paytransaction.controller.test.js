import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';
import { payTransaction } from '../../controllers/paytransaction.controller.js';
import { Job, Transaction, User } from '../../models/index.js';
import { ApiError } from '../../utils/index.js';

jest.mock('../../models/index.js', () => ({
  Job: { findById: jest.fn() },
  Transaction: { findOne: jest.fn() },
  User: { findById: jest.fn() },
}));

describe('payTransaction Controller', () => {
  let session;
  beforeEach(() => {
    jest.clearAllMocks();
    session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    mongoose.startSession = jest.fn().mockResolvedValue(session);
  });

  const setup = (params, body, user) => {
    const req = httpMocks.createRequest({ params, body });
    req.user = user || { id: 'userId' };
    const res = httpMocks.createResponse();
    res.cookie = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return { req, res };
  };

  test('should throw error if transaction id is invalid', async () => {
    mongoose.isValidObjectId = jest.fn(() => false);
    const { req, res } = setup({ tId: 'invalid' }, { amount: '1000', transactionCode: 'code', transactionUUID: 'uuid' });
    await expect(payTransaction(req, res)).rejects.toThrow("Invalid transaction id");
  });

  test('should throw error if amount is missing', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const { req, res } = setup({ tId: '507f1f77bcf86cd799439011' }, { transactionCode: 'code', transactionUUID: 'uuid' });
    await expect(payTransaction(req, res)).rejects.toThrow("Amount is required");
  });

  test('should throw error if transaction not found', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    Transaction.findOne.mockResolvedValue(null);
    const { req, res } = setup({ tId: '507f1f77bcf86cd799439011' }, { amount: '1,000', transactionCode: 'code', transactionUUID: 'uuid' });
    await expect(payTransaction(req, res)).rejects.toThrow("Transaction not found");
  });

  test('should throw error if transaction already done', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeTransaction = { status: 'done' };
    Transaction.findOne.mockResolvedValue(fakeTransaction);
    const { req, res } = setup({ tId: '507f1f77bcf86cd799439011' }, { amount: '1000', transactionCode: 'code', transactionUUID: 'uuid' });
    await expect(payTransaction(req, res)).rejects.toThrow("Transaction already done");
  });

  test('should process payment successfully', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeTransaction = { 
      _id: 'transId',
      status: 'pending',
      amount: 1000,
      jobId: 'jobId',
      receiver: 'receiverId',
      save: jest.fn().mockResolvedValue(true)
    };
    Transaction.findOne.mockResolvedValue(fakeTransaction);
    const fakeJob = { 
      _id: 'jobId', 
      payment: { done: false }, 
      save: jest.fn().mockResolvedValue(true) 
    };
    const fakeReceiver = { 
      _id: 'receiverId', 
      balance: 0, 
      save: jest.fn().mockResolvedValue(true) 
    };
    Job.findById.mockResolvedValue(fakeJob);
    User.findById.mockResolvedValue(fakeReceiver);
    const { req, res } = setup({ tId: '507f1f77bcf86cd799439011' }, { amount: '1,000', transactionCode: 'code', transactionUUID: 'uuid' });
    await payTransaction(req, res);
    expect(fakeJob.payment.done).toBe(true);
    expect(fakeReceiver.balance).toBe(1000);
    expect(fakeTransaction.status).toBe("done");
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
