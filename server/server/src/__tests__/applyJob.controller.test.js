import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';
import { applyJob } from '../../controllers/applyJob.controller.js';
import { Job, JobApplication, User } from '../../models/index.js';
import { ApiError } from '../../utils/index.js';

jest.mock('../../models/index.js', () => ({
  Job: { findById: jest.fn() },
  JobApplication: { findOne: jest.fn(), create: jest.fn() },
  User: { findById: jest.fn() },
}));

describe('applyJob Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (body, user) => {
    const req = httpMocks.createRequest({ body });
    req.user = user || { id: 'userId', _id: 'userId' };
    const res = httpMocks.createResponse();
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return { req, res };
  };

  test('should throw error if jobId is missing', async () => {
    const { req, res } = setup({ message: 'msg' });
    await expect(applyJob(req, res)).rejects.toThrow("Job id is required");
  });

  test('should throw error if jobId is invalid', async () => {
    const { req, res } = setup({ jobId: 'invalid', message: 'msg' });
    await expect(applyJob(req, res)).rejects.toThrow("Invalid job id");
  });

  test('should throw error if job not found', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    Job.findById.mockResolvedValue(null);
    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011', message: 'msg' });
    await expect(applyJob(req, res)).rejects.toThrow("Job not found");
  });

  test('should throw error if applying to self posted job', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { _id: 'jobId', postedBy: 'userId', status: 'open', applications: [] };
    Job.findById.mockResolvedValue(fakeJob);
    User.findById.mockResolvedValue({ _id: 'userId' });
    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011', message: 'msg' }, { id: 'userId', _id: 'userId' });
    await expect(applyJob(req, res)).rejects.toThrow("Cannot apply to self posted job");
  });

  test('should throw error if already applied', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { _id: 'jobId', postedBy: 'otherUser', status: 'open', applications: [] };
    Job.findById.mockResolvedValue(fakeJob);
    User.findById.mockResolvedValue({ _id: 'userId' });
    JobApplication.findOne.mockResolvedValue({ _id: 'appId' });
    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011', message: 'msg' });
    await expect(applyJob(req, res)).rejects.toThrow("You've already applied to this job");
  });

  test('should throw error if job is not open', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { _id: 'jobId', postedBy: 'otherUser', status: 'closed', applications: [] };
    Job.findById.mockResolvedValue(fakeJob);
    User.findById.mockResolvedValue({ _id: 'userId' });
    JobApplication.findOne.mockResolvedValue(null);
    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011', message: 'msg' });
    await expect(applyJob(req, res)).rejects.toThrow("Can only apply to open jobs");
  });

  test('should apply successfully', async () => {
    mongoose.isValidObjectId = jest.fn(() => true);
    const fakeJob = { 
      _id: 'jobId', 
      postedBy: 'otherUser', 
      status: 'open', 
      applications: [], 
      save: jest.fn().mockResolvedValue(true) 
    };
    const fakeUser = { _id: 'userId', jobsApplied: [], save: jest.fn().mockResolvedValue(true) };
    Job.findById.mockResolvedValue(fakeJob);
    User.findById.mockResolvedValue(fakeUser);
    JobApplication.findOne.mockResolvedValue(null);
    const fakeApplication = { _id: 'appId' };
    JobApplication.create.mockResolvedValue(fakeApplication);

    const { req, res } = setup({ jobId: '507f1f77bcf86cd799439011', message: 'msg' });
    await applyJob(req, res);
    expect(JobApplication.create).toHaveBeenCalled();
    expect(fakeJob.applications).toContain('appId');
    expect(fakeUser.jobsApplied).toContain('appId');
    expect(fakeJob.save).toHaveBeenCalled();
    expect(fakeUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
