import {
  Component,
  OnInit,
  Input,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { CUserInfo } from '@models/classes/user-info';
import { Subscription, Subject } from 'rxjs';
import { UserService } from '@services/user.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'cos-profile-card',
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
})
export class ProfileCardComponent implements OnInit, OnDestroy {
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
  user: CUserInfo;

  private unsubscribe: Subject<void> = new Subject();
  constructor(private userSvc: UserService) {}

  ngOnInit() {
    this.userSubscription = this.userSvc
      .userRef(this.userKey)
      .valueChanges()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(user => (this.user = new CUserInfo(user)));
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
