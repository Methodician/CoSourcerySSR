import { UserInfo as IUserInfo } from '../interfaces/user-info';
export class UserInfo implements IUserInfo {
  public alias: string;
  public fName: string;
  public lName: string;
  public uid?: string;
  public imageUrl?: string;
  public email?: string;
  public zipCode?: string;
  public bio?: string;
  public city?: string;
  public state?: string;

  constructor(public user: IUserInfo) {
    this.alias = user.alias;
    this.fName = user.fName;
    this.lName = user.lName;
    this.uid = user.uid;
    this.imageUrl = user.imageUrl;
    this.email = user.email;
    this.zipCode = user.zipCode;
    this.bio = user.bio;
    this.city = user.city;
    this.state = user.state;
  }

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
