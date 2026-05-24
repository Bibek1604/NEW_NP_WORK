import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';
import { getTransaction } from '../../controllers/getTransaction.controller.js';
import { Job } from '../../models/index.js';
import { Transaction } from '../../models/transaction.model.js';
import { ApiError } from '../../utils/index.js';

jest.mock('../../models/index.js', () => ({
  Job: { findOne: jest.fn() },
}));
jest.mock('../../models/transaction.model.js', () => ({
  Transaction: { create: jest.fn(), findById: jest.fn() },
}));

describe('getTransaction Controller', () => {
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

  const setup = (params, user) => {
    const req = httpMocks.createRequest({ params });
    req.user = user || { id: 'userId' };
    const res = httpMocks.createResponse();
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return { req, res };
  };

  test('should throw error if jobId is invalid', async () => {
    const { req, res } = setup({ jobId: 'invalid' });
    await expect(getTransaction(req, res)).rejects.toThrow("Invalid jobId");
  });

  test('should throw error if job not found', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    Job.findOne.mockResolvedValue(null);
    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011' });
    await expect(getTransaction(req, res)).rejects.toThrow("Job not found");
  });

  test('should throw error if job is not finished', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { _id: 'jobId', postedBy: 'userId', status: 'open' };
    Job.findOne.mockResolvedValue(fakeJob);
    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011' });
    await expect(getTransaction(req, res)).rejects.toThrow("Job is not finished yet");
  });

  test('should create transaction if not exists', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { 
      _id: 'jobId', 
      postedBy: 'userId', 
      status: 'finished', 
      transaction: null, 
      acceptedFreelancer: 'freelancerId',
      payment: { amount: 500 },
      save: jest.fn().mockResolvedValue(true)
    };
    Job.findOne.mockResolvedValue(fakeJob);
    Transaction.create.mockResolvedValue({ _id: 'transId' });
    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011' });
    await getTransaction(req, res);
    expect(Transaction.create).toHaveBeenCalled();
    expect(fakeJob.transaction).toBeDefined();
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  test('should fetch existing transaction', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { 
      _id: 'jobId', 
      postedBy: 'userId', 
      status: 'finished', 
      transaction: 'transId'
    };
    Job.findOne.mockResolvedValue(fakeJob);
    Transaction.findById.mockResolvedValue({ _id: 'transId' });
    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011' });
    await getTransaction(req, res);
    expect(Transaction.findById).toHaveBeenCalledWith('transId');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
