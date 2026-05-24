import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';
import { updateJob } from '../../controllers/updateJob.controller.js';
import { Job } from '../../models/index.js';
import { ApiError } from '../../utils/index.js';
import { tags } from '../../constants.js';

jest.mock('../../models/index.js', () => ({
  Job: { findOne: jest.fn() }
}));
jest.mock('../../constants.js', () => ({
  tags: ['tag1', 'tag2', 'tag3']
}));

describe('updateJob Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (body, user) => {
    const req = httpMocks.createRequest({ body });
    req.user = user || { _id: 'userId' };
    const res = httpMocks.createResponse();
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return { req, res };
  };

  test('should throw error if job id is missing', async () => {
    const { req, res } = setup({ title: 'Job', description: 'desc', tags: ['tag1'], rate: 50, status: 'open' });
    await expect(updateJob(req, res)).rejects.toThrow("Job id is required");
  });

  test('should throw error if job id is invalid', async () => {
    const { req, res } = setup({ id: 'invalid', title: 'Job', description: 'desc', tags: ['tag1'], rate: 50, status: 'open' });
    mongoose.isValidObjectId = jest.fn(() => false);
    await expect(updateJob(req, res)).rejects.toThrow("Invalid job id");
  });

  test('should throw error if job not found', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    Job.findOne.mockResolvedValue(null);
    const { req, res } = setup({ id: '507f1f77bcf86cd799439011', title: 'Job', description: 'desc', tags: ['tag1'], rate: 50, status: 'open' });
    await expect(updateJob(req, res)).rejects.toThrow("Job not found");
  });

  test('should throw error if updating finished job', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { status: 'finished' };
    Job.findOne.mockResolvedValue(fakeJob);
    const { req, res } = setup({ id: '507f1f77bcf86cd799439011', title: 'Job', description: 'desc', tags: ['tag1'], rate: 50, status: 'open' });
    await expect(updateJob(req, res)).rejects.toThrow("Cannot update finished job");
  });

  test('should update job successfully for in_progress status', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { 
      _id: 'jobId', 
      status: 'open', 
      acceptedFreelancer: null, 
      title: 'Old Title',
      description: 'Old desc',
      hourlyRate: 30,
      tags: ['tag1'],
      save: jest.fn().mockResolvedValue(true)
    };
    Job.findOne.mockResolvedValue(fakeJob);
    const { req, res } = setup({
      id: 'jobId',
      title: 'Old Title',
      description: 'Old desc',
      tags: ['tag1'],
      rate: 30,
      status: 'in_progress'
    });
    await updateJob(req, res);
    expect(fakeJob.startTime).toBeDefined();
    expect(fakeJob.status).toEqual('in_progress');
    expect(fakeJob.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  test('should update job successfully for finished status', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { 
      _id: 'jobId', 
      status: 'in_progress', 
      acceptedFreelancer: 'freelancerId', 
      title: 'Old Title',
      description: 'Old desc',
      hourlyRate: 30,
      tags: ['tag1'],
      startTime: Date.now() - 3600000, // 1 hour ago
      payment: {},
      save: jest.fn().mockResolvedValue(true)
    };
    Job.findOne.mockResolvedValue(fakeJob);
    const { req, res } = setup({
      id: 'jobId',
      title: 'Old Title',
      description: 'Old desc',
      tags: ['tag1'],
      rate: 30,
      status: 'finished'
    });
    await updateJob(req, res);
    expect(fakeJob.endTime).toBeDefined();
    expect(fakeJob.workedTimeInSec).toBeGreaterThan(0);
    expect(fakeJob.payment.amount).toBeGreaterThan(0);
    expect(fakeJob.status).toEqual('finished');
    expect(fakeJob.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
