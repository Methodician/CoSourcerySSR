import { Component, OnInit, Input, HostListener } from '@angular/core';
import { UserInfo } from '@models/classes/user-info';
import { Observable, Subscription } from 'rxjs';
import { UserService } from '@services/user.service';

@Component({
  selector: 'cos-profile-card',
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
})
export class ProfileCardComponent implements OnInit {
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.checkWindowSize();
  }

  @Input() userKey: string;
  @Input() displayText: string;
  @Input() shouldHighlight = false;
  windowMaxWidth = 435;
  maxUsernameLength;
  userSubscription: Subscription;
  user: UserInfo;

  constructor(private userSvc: UserService) {}

  ngOnInit() {
    this.userSubscription = this.userSvc
      .userRef(this.userKey)
      .valueChanges()
      .subscribe(
        user =>
          // TODO: simplify UserInfo constructor to take interface
          (this.user = new UserInfo(
            user.alias,
            user.fName,
            null,
            user.uid,
            user.imageUrl,
            null,
            null,
            null,
            null,
            null
          ))
      );
  }

  checkWindowSize() {
    window.innerWidth < this.windowMaxWidth
      ? (this.maxUsernameLength = 6)
      : (this.maxUsernameLength = 8);
  }
}
