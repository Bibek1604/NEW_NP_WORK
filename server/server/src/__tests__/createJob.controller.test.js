import httpMocks from 'node-mocks-http';
import { createJob } from '../../controllers/createJob.controller.js';
import { Job } from '../../models/index.js';
import { ApiError } from '../../utils/index.js';
import { tags } from '../../constants.js';

jest.mock('../../models/index.js', () => ({
  Job: { create: jest.fn() },
}));
jest.mock('../../constants.js', () => ({
  tags: ['tag1', 'tag2', 'tag3']
}));

describe('createJob Controller', () => {
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

  test('should throw error if job title is missing', async () => {
    const { req, res } = setup({ description: 'desc', tags: ['tag1'], rate: 50 });
    await expect(createJob(req, res)).rejects.toThrow("Job title is required");
  });

  test('should throw error if job description is missing', async () => {
    const { req, res } = setup({ title: 'Job', tags: ['tag1'], rate: 50 });
    await expect(createJob(req, res)).rejects.toThrow("Job description is required");
  });

  test('should throw error if tags is not an array', async () => {
    const { req, res } = setup({ title: 'Job', description: 'desc', tags: 'tag1', rate: 50 });
    await expect(createJob(req, res)).rejects.toThrow("Invalid tags format, send in array");
  });

  test('should throw error if no tags provided', async () => {
    const { req, res } = setup({ title: 'Job', description: 'desc', tags: [], rate: 50 });
    await expect(createJob(req, res)).rejects.toThrow("Atleast one tag is required");
  });

  test('should throw error if tags contain invalid values', async () => {
    const { req, res } = setup({ title: 'Job', description: 'desc', tags: ['invalid'], rate: 50 });
    await expect(createJob(req, res)).rejects.toThrow("Tags contains invalid tags");
  });

  test('should throw error if hourly rate is missing', async () => {
    const { req, res } = setup({ title: 'Job', description: 'desc', tags: ['tag1'] });
    await expect(createJob(req, res)).rejects.toThrow("Hourly rate is required");
  });

  test('should throw error if hourly rate is invalid', async () => {
    const { req, res } = setup({ title: 'Job', description: 'desc', tags: ['tag1'], rate: -10 });
    await expect(createJob(req, res)).rejects.toThrow("Invalid hourly rate, must be a positive number");
  });

  test('should create job successfully', async () => {
    const jobData = {
      _id: 'jobId',
      title: 'Job',
      description: 'desc',
      postedBy: 'userId',
      hourlyRate: 50,
      tags: ['tag1']
    };
    Job.create.mockResolvedValue(jobData);
    const { req, res } = setup({ title: 'Job', description: 'desc', tags: ['tag1'], rate: 50 });
    await createJob(req, res);
    expect(Job.create).toHaveBeenCalledWith({
      title: 'Job',
      description: 'desc',
      postedBy: 'userId',
      hourlyRate: 50,
      tags: ['tag1']
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    const jsonResponse = res.json.mock.calls[0][0];
    expect(jsonResponse.message).toContain('Job created');
    expect(jsonResponse.data).toEqual(jobData);
  });
});
