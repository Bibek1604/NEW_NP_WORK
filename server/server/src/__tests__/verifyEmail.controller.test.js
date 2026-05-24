import httpMocks from 'node-mocks-http';
import { verifyEmail } from '../../controllers/verifyEmail.controller.js';
import { User, Otp } from '../../models/index.js';
import { ApiError } from '../../utils/index.js';

jest.mock('../../models/index.js', () => ({
  User: { findOne: jest.fn() },
  Otp: { findOne: jest.fn() },
}));

describe('verifyEmail Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (body, user) => {
    const req = httpMocks.createRequest({ body });
    req.user = user || { email: 'john@example.com' };
    const res = httpMocks.createResponse();
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return { req, res };
  };

  test('should return error if email not provided', async () => {
    const { req, res } = setup({ otpCode: 1234 });
    await verifyEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('should return error if email does not match', async () => {
    const { req, res } = setup({ email: 'jane@example.com', otpCode: 1234 }, { email: 'john@example.com' });
    await verifyEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('should return error if OTP not provided', async () => {
    const { req, res } = setup({ email: 'john@example.com' });
    await verifyEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('should return error if OTP not found', async () => {
    Otp.findOne.mockResolvedValue(null);
    const { req, res } = setup({ email: 'john@example.com', otpCode: 1234 });
    await verifyEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('should return error if OTP is invalid', async () => {
    Otp.findOne.mockResolvedValue({ otpCode: 9999 });
    const { req, res } = setup({ email: 'john@example.com', otpCode: 1234 });
    await verifyEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('should return error if user not found', async () => {
    Otp.findOne.mockResolvedValue({ otpCode: 1234 });
    User.findOne.mockResolvedValue(null);
    const { req, res } = setup({ email: 'john@example.com', otpCode: 1234 });
    await verifyEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('should return error if email already verified', async () => {
    Otp.findOne.mockResolvedValue({ otpCode: 1234 });
    User.findOne.mockResolvedValue({ emailVerified: true });
    const { req, res } = setup({ email: 'john@example.com', otpCode: 1234 });
    await verifyEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('should verify email successfully', async () => {
    const fakeOtp = { otpCode: 1234, deleteOne: jest.fn().mockResolvedValue(true) };
    Otp.findOne.mockResolvedValue(fakeOtp);
    const fakeUser = { emailVerified: false, save: jest.fn().mockResolvedValue(true) };
    User.findOne.mockResolvedValue(fakeUser);
    const { req, res } = setup({ email: 'john@example.com', otpCode: 1234 });
    await verifyEmail(req, res);
    expect(fakeUser.emailVerified).toBe(true);
    expect(fakeOtp.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
