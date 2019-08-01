import { Component, OnInit, Input } from '@angular/core';
import { UserInfo } from '@models/interfaces/user-info';
import { timer } from 'rxjs';

@Component({
  selector: 'cos-profile-display',
  templateUrl: './profile-display.component.html',
  styleUrls: ['./profile-display.component.scss'],
})
export class ProfileDisplayComponent {
  @Input('user') user: UserInfo;
}
