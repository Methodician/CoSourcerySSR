import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'cos-profile-contributions',
  templateUrl: './profile-contributions.component.html',
  styleUrls: ['./profile-contributions.component.scss'],
})
export class ProfileContributionsComponent implements OnInit {
  @Input() profileId: string;

  constructor() {}

  ngOnInit() {}
}
