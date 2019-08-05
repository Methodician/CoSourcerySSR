import { CUserInfo } from './user-info';

describe('CUserInfo', () => {
  it('should create an instance', () => {
    expect(new CUserInfo({ fName: 'Jack', lName: 'Sparrow' })).toBeTruthy();
  });
});
