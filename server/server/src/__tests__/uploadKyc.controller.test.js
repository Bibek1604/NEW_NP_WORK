import httpMocks from 'node-mocks-http';
import fs from 'fs';
import { uploadKyc } from '../../controllers/uploadKyc.controller.js';
import { User, Kyc } from '../../models/index.js';
import { cloudinary } from '../../utils/index.js';
import { ApiError } from '../../utils/index.js';

jest.mock('fs');
jest.mock('../../models/index.js', () => ({
  User: { findById: jest.fn() },
  Kyc: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../../utils/index.js', () => ({
  ...jest.requireActual('../../utils/index.js'),
  cloudinary: {
    uploader: {
      upload: jest.fn()
    }
  }
}));

describe('uploadKyc Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (body, file, user) => {
    const req = httpMocks.createRequest({ body });
    req.file = file;
    req.user = user || { id: 'userId' };
    const res = httpMocks.createResponse();
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return { req, res };
  };

  test('should return error if first name is missing', async () => {
    const { req, res } = setup(
      { lastName: 'Doe', gender: 'male', dobYear: 1990, dobMonth: 1, dobDay: 1, phoneNumber: '1234567890', documentId: 123, documentType: 'passport', temporaryCountry: 'usa', temporaryState: 'CA', temporaryCity: 'LA', permanentCountry: 'usa', permanentState: 'CA', permanentCity: 'LA' },
      { path: 'uploads/file.png' }
    );
    await expect(uploadKyc(req, res)).rejects.toThrow("First name not provided");
  });

  test('should return error if gender is invalid', async () => {
    const body = { firstName: 'John', lastName: 'Doe', gender: 'invalid', dobYear: 1990, dobMonth: 1, dobDay: 1, phoneNumber: '1234567890', documentId: 123, documentType: 'passport', temporaryCountry: 'usa', temporaryState: 'CA', temporaryCity: 'LA', permanentCountry: 'usa', permanentState: 'CA', permanentCity: 'LA' };
    const { req, res } = setup(body, { path: 'uploads/file.png' });
    await expect(uploadKyc(req, res)).rejects.toThrow("Invalid gender, [male,female,others] only");
  });

  test('should return error if file is missing', async () => {
    const body = { firstName: 'John', lastName: 'Doe', gender: 'male', dobYear: 1990, dobMonth: 1, dobDay: 1, phoneNumber: '1234567890', documentId: 123, documentType: 'passport', temporaryCountry: 'usa', temporaryState: 'CA', temporaryCity: 'LA', permanentCountry: 'usa', permanentState: 'CA', permanentCity: 'LA' };
    const { req, res } = setup(body, null);
    await expect(uploadKyc(req, res)).rejects.toThrow("Something wen wrong while image was uploading, Try again");
  });

  test('should upload KYC successfully', async () => {
    const body = { 
      firstName: 'John', 
      lastName: 'Doe', 
      gender: 'male', 
      dobYear: 1990, 
      dobMonth: 1, 
      dobDay: 1, 
      phoneNumber: '1234567890', 
      documentId: 123, 
      documentType: 'passport', 
      temporaryCountry: 'usa', 
      temporaryState: 'CA', 
      temporaryCity: 'LA', 
      permanentCountry: 'usa', 
      permanentState: 'CA', 
      permanentCity: 'LA'
    };
    const file = { path: 'uploads/file.png' };
    const fakeUser = { _id: 'userId', email: 'john@example.com', kycStatus: 'none', save: jest.fn() };
    User.findById.mockResolvedValue(fakeUser);
    Kyc.findOne.mockResolvedValue(null);
    cloudinary.uploader.upload.mockResolvedValue({ url: 'http://cloudinary.com/file.png' });
    Kyc.create.mockResolvedValue({ name: { firstName: 'John', lastName: 'Doe' }, user: { email: 'john@example.com' } });
    
    const { req, res } = setup(body, file, { id: 'userId' });
    await uploadKyc(req, res);
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith('uploads/file.png');
    expect(fs.unlink).toHaveBeenCalled();
    expect(fakeUser.kycStatus).toEqual('pending');
    expect(fakeUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
