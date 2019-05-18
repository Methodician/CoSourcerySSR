export class AuthInfo {
    constructor(
        public uid: string,
        public emailVerified = false,
        public displayName?: string,
        public email?: string
    ) { }

    isLoggedIn() {
        return !!this.uid;
    }

    isEmailVerified() {
        return !!this.emailVerified;
    }
}
