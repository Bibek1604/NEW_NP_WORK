import httpMocks from 'node-mocks-http';
import { getAllKyc } from '../../controllers/getAllKyc.controller.js';
import { Kyc } from '../../models/kyc.model.js';
import { ApiResponse } from '../../utils/index.js';

jest.mock('../../models/kyc.model.js', () => ({
  Kyc: { find: jest.fn() },
}));

describe('getAllKyc Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return { req, res };
  };

  test('should fetch all kycs', async () => {
    const fakeKycList = [{ _id: '1' }, { _id: '2' }];
    Kyc.find.mockResolvedValue(fakeKycList);
    const { req, res } = setup();
    await getAllKyc(req, res);
    expect(Kyc.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    const jsonResponse = res.json.mock.calls[0][0];
    expect(jsonResponse.data).toEqual(fakeKycList);
  });
});
