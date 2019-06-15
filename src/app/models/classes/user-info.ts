export class UserInfo {
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
    public state?: string
  ) {}

  displayName() {
    return this.alias ? this.alias : this.fName;
  }

  displayImageUrl() {
    if (!this.imageUrl || this.imageUrl === '') {
      return 'assets/images/logo.svg';
    }
    return this.imageUrl;
  }

  exists() {
    return !!this.uid;
  }
}
