export class AuthInfoC {
  constructor(
    readonly uid: string,
    readonly emailVerified = false,
    readonly displayName?: string,
    readonly email?: string,
  ) {}

  isLoggedIn() {
    return !!this.uid;
  }

  isEmailVerified() {
    return !!this.emailVerified;
  }
}

export interface AuthInfoI {
  uid: string;
  emailVerified: boolean;
  displayName: string;
  email: string;
}
