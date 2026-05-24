import httpMocks from 'node-mocks-http';
import { adminLogin } from '../../controllers/adminLogin.controller.js';
import { User } from '../../models/user.model.js';
import { generateAccessToken, generateRefreshToken } from '../../controllers/user.controller.js';
import { ApiError } from '../../utils/index.js';

jest.mock('../../models/user.model.js');
jest.mock('../../controllers/user.controller.js');

describe('adminLogin Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (body) => {
    const req = httpMocks.createRequest({ body });
    const res = httpMocks.createResponse();
    // mock cookie, status, and json methods
    res.cookie = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return { req, res };
  };

  test('should throw error if email not provided', async () => {
    const { req, res } = setup({ password: 'test' });
    await expect(adminLogin(req, res)).rejects.toThrow("Email not provided");
  });

  test('should throw error if password not provided', async () => {
    const { req, res } = setup({ email: 'admin@example.com' });
    await expect(adminLogin(req, res)).rejects.toThrow("Password not provided");
  });

  test('should throw error if user not found', async () => {
    User.findOne.mockResolvedValue(null);
    const { req, res } = setup({ email: 'admin@example.com', password: 'admin' });
    await expect(adminLogin(req, res)).rejects.toThrow("No any account with this email address");
  });

  test('should throw error if invalid credentials', async () => {
    const fakeUser = { password: 'different', role: 'admin' };
    User.findOne.mockResolvedValue(fakeUser);
    const { req, res } = setup({ email: 'admin@example.com', password: 'admin' });
    await expect(adminLogin(req, res)).rejects.toThrow("Invalid credentials");
  });

  test('should throw error if user is not admin', async () => {
    const fakeUser = { password: 'admin', role: 'client' };
    User.findOne.mockResolvedValue(fakeUser);
    const { req, res } = setup({ email: 'admin@example.com', password: 'admin' });
    await expect(adminLogin(req, res)).rejects.toThrow("User is not admin");
  });

  test('should login successfully for admin', async () => {
    const fakeUser = { 
      _id: 'userId', 
      password: 'admin', 
      role: 'admin', 
      name: 'Admin', 
      email: 'admin@example.com' 
    };
    User.findOne.mockResolvedValue(fakeUser);
    generateAccessToken.mockResolvedValue('access-token');
    generateRefreshToken.mockResolvedValue('refresh-token');

    const { req, res } = setup({ email: 'ADMIN@example.com', password: 'ADMIN' });
    await adminLogin(req, res);

    expect(generateAccessToken).toHaveBeenCalledWith('userId');
    expect(generateRefreshToken).toHaveBeenCalledWith('userId');
    expect(res.cookie).toHaveBeenCalledWith("accessToken", 'access-token');
    expect(res.cookie).toHaveBeenCalledWith("refreshToken", 'refresh-token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();

    const jsonResponse = res.json.mock.calls[0][0];
    expect(jsonResponse.data.tokens.accessToken).toEqual('access-token');
    expect(jsonResponse.data.tokens.refreshToken).toEqual('refresh-token');
  });
});
