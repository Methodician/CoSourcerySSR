export class UserInfoOpen {
    constructor(
        public alias: string,
        public fName: string,
        public lName: string,
        public uid?: string,
        public imageUrl?: string,
        public email?: string,
        public zipCode?: string,
        public bio?: string,
        public city?: string,
        public state?: string,
    ) { }

    displayName() {
        return this.alias ? this.alias : this.fName;
    }

    displayImageUrl() {
        if (!this.imageUrl || this.imageUrl === '') {
            return 'assets/images/logo.svg';
        }
        return this.imageUrl;
    }

    // returns true if uid contains a truthy value (is neither null nor an empty string)
    exists() {
        return !!(this.uid);
    }
}



export interface KeyMap<T> { [key: string]: T; }
export interface UserMap extends KeyMap<UserInfoOpen> { }
