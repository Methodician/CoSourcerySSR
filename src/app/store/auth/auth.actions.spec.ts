import * as fromAuth from './auth.actions';

describe('yAuths', () => {
  it('should return an action', () => {
    expect(fromAuth.yAuths().type).toBe('[Auth] Y Auths');
  });
});
