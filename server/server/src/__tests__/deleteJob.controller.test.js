import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';
import { deleteJob } from '../../controllers/deleteJob.controller.js';
import { Job } from '../../models/job.model.js';
import { ApiError } from '../../utils/index.js';

jest.mock('../../models/job.model.js');

describe('deleteJob Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    mongoose.isValidObjectId = jest.fn(() => false);
    const { req, res } = setup({ jobId: 'invalid' });
    await expect(deleteJob(req, res)).rejects.toThrow("Invalid job id");
  });

  test('should throw error if job not found', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    Job.findOne.mockResolvedValue(null);
    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011' });
    await expect(deleteJob(req, res)).rejects.toThrow("Job not found");
  });

  test('should throw error if job status is not closed', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { status: 'open' };
    Job.findOne.mockResolvedValue(fakeJob);
    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011' });
    await expect(deleteJob(req, res)).rejects.toThrow("Job can only be deleted if closed");
  });

  test('should delete job successfully', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { 
      status: 'closed', 
      deleteOne: jest.fn().mockResolvedValue(true) 
    };
    Job.findOne.mockResolvedValue(fakeJob);
    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011' });
    await deleteJob(req, res);
    expect(fakeJob.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
