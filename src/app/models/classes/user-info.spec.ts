import { UserInfo } from './user-info';

describe('UserInfo', () => {
  it('should create an instance', () => {
    expect(new UserInfo({ fName: 'Jack', lName: 'Sparrow' })).toBeTruthy();
  });
});
