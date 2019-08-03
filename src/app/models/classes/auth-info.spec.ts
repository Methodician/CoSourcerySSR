import { CAuthInfo } from './auth-info';

describe('CAuthInfo', () => {
  it('should create an instance', () => {
    expect(new CAuthInfo(null, false, null, null)).toBeTruthy();
  });
});
