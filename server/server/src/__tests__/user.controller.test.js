import httpMocks from 'node-mocks-http';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, signup, login } from '../../controllers/user.controller.js';
import { User } from '../../models/index.js';
import { MailService } from '../../utils/index.js';
import { ApiError } from '../../utils/index.js';

jest.mock('../../models/index.js', () => ({
  User: {
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  }
}));
jest.mock('jsonwebtoken');
jest.mock('../../utils/index.js', () => ({
  ...jest.requireActual('../../utils/index.js'),
  MailService: { welcomeMail: jest.fn() }
}));

describe('user.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    test('should generate token', async () => {
      const fakeUser = { _id: 'userId', name: { firstName: 'John', lastName: 'Doe' }, email: 'john@example.com' };
      User.findById.mockResolvedValue(fakeUser);
      jwt.sign.mockReturnValue('access-token');
      const token = await generateAccessToken('userId');
      expect(jwt.sign).toHaveBeenCalledWith({
        id: 'userId',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }, process.env.AUTH_ACCESS_TOKEN_SECRET_KEY, { expiresIn: process.env.AUTH_ACCESS_TOKEN_EXPIRY });
      expect(token).toEqual('access-token');
    });
  });

  describe('generateRefreshToken', () => {
    test('should generate token', async () => {
      const fakeUser = { _id: 'userId', name: { firstName: 'John', lastName: 'Doe' }, email: 'john@example.com' };
      User.findById.mockResolvedValue(fakeUser);
      jwt.sign.mockReturnValue('refresh-token');
      const token = await generateRefreshToken('userId');
      expect(jwt.sign).toHaveBeenCalledWith({
        id: 'userId',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }, process.env.AUTH_REFRESH_TOKEN_SECRET_KEY, { expiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRY });
      expect(token).toEqual('refresh-token');
    });
  });

  describe('signup', () => {
    const setup = (body) => {
      const req = httpMocks.createRequest({ body });
      const res = httpMocks.createResponse();
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn();
      return { req, res };
    };

    test('should return error if first name is missing', async () => {
      const { req, res } = setup({ name: { lastName: 'Doe' }, email: 'john@example.com', password: 'password', confirmPassword: 'password' });
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should signup successfully', async () => {
      const userData = { _id: 'userId', name: { firstName: 'John', lastName: 'Doe' }, email: 'john@example.com' };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(userData);
      const { req, res } = setup({ name: { firstName: 'John', lastName: 'Doe' }, email: 'john@example.com', password: 'password123', confirmPassword: 'password123' });
      await signup(req, res);
      expect(User.create).toHaveBeenCalled();
      expect(MailService.welcomeMail).toHaveBeenCalledWith('john@example.com', 'John', 'Doe');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('login', () => {
    const setup = (body) => {
      const req = httpMocks.createRequest({ body });
      const res = httpMocks.createResponse();
      res.cookie = jest.fn().mockReturnValue(res);
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn();
      return { req, res };
    };

    test('should return error if email is missing', async () => {
      const { req, res } = setup({ password: 'password123' });
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return error if user not found', async () => {
      User.findOne.mockResolvedValue(null);
      const { req, res } = setup({ email: 'john@example.com', password: 'password123' });
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should return error if incorrect password', async () => {
      const fakeUser = { _id: 'userId', password: 'different', email: 'john@example.com' };
      User.findOne.mockResolvedValue(fakeUser);
      const { req, res } = setup({ email: 'john@example.com', password: 'password123' });
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should login successfully', async () => {
      const fakeUser = { _id: 'userId', password: 'password123', email: 'john@example.com', name: { firstName: 'John', lastName: 'Doe' }, save: jest.fn() };
      User.findOne.mockResolvedValue(fakeUser);
      jwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      const { req, res } = setup({ email: 'john@example.com', password: 'password123' });
      await login(req, res);
      expect(res.cookie).toHaveBeenCalledWith("accessToken", 'access-token');
      expect(res.cookie).toHaveBeenCalledWith("refreshToken", 'refresh-token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
