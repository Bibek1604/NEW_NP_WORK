import httpMocks from 'node-mocks-http';
import { switchRole } from '../../controllers/switchRole.controller.js';
import { User } from '../../models/index.js';
import { ApiError } from '../../utils/index.js';

jest.mock('../../models/index.js', () => ({
  User: { findById: jest.fn() }
}));

describe('switchRole Controller', () => {
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

  test('should throw error if role not provided', async () => {
    const { req, res } = setup({});
    await expect(switchRole(req, res)).rejects.toThrow("Role not provided");
  });

  test('should throw error if invalid role provided', async () => {
    const { req, res } = setup({ role: 'admin' });
    await expect(switchRole(req, res)).rejects.toThrow("Invalid role");
  });

  test('should throw error if role change is not allowed due to time restriction', async () => {
    const fakeUser = { _id: 'userId', role: 'client', lastRoleChange: new Date(), save: jest.fn() };
    User.findById.mockResolvedValue(fakeUser);
    const { req, res } = setup({ role: 'freelancer' }, { _id: 'userId' });
    await expect(switchRole(req, res)).rejects.toThrow(/You need to wait/);
  });

  test('should throw error if already in the same role', async () => {
    const pastDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
    const fakeUser = { _id: 'userId', role: 'client', lastRoleChange: pastDate, save: jest.fn() };
    User.findById.mockResolvedValue(fakeUser);
    const { req, res } = setup({ role: 'client' }, { _id: 'userId' });
    await expect(switchRole(req, res)).rejects.toThrow("You're already client");
  });

  test('should switch role successfully', async () => {
    const pastDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
    const fakeUser = { _id: 'userId', role: 'client', lastRoleChange: pastDate, save: jest.fn().mockResolvedValue(true) };
    User.findById.mockResolvedValue(fakeUser);
    const { req, res } = setup({ role: 'freelancer' }, { _id: 'userId' });
    await switchRole(req, res);
    expect(fakeUser.role).toEqual('freelancer');
    expect(fakeUser.lastRoleChange).toBeInstanceOf(Date);
    expect(fakeUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
