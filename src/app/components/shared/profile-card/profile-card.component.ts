import {
  Component,
  OnInit,
  Input,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { UserInfo } from '@models/classes/user-info';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserService } from '@services/user.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'cos-profile-card',
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
})
export class ProfileCardComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject();
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
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(user => (this.user = new UserInfo(user)));
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  checkWindowSize() {
    window.innerWidth < this.windowMaxWidth
      ? (this.maxUsernameLength = 6)
      : (this.maxUsernameLength = 8);
  }
}
