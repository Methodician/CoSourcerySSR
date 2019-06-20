import { Component, OnInit, HostListener } from '@angular/core';
import { UserService } from '@services/user.service';

@Component({
  selector: 'cos-contributors',
  templateUrl: './contributors.component.html',
  styleUrls: ['./contributors.component.scss'],
})
export class ContributorsComponent implements OnInit {
  @HostListener('window:resize', ['$event'])
  onWindowResize($event: any) {
    this.checkWindowSize();
  }
  editorPanelCount: number;
  windowMaxWidth = 780;

  constructor() {}

  ngOnInit() {}

  checkWindowSize() {
    window.innerWidth < this.windowMaxWidth
      ? (this.editorPanelCount = 2)
      : (this.editorPanelCount = 3);
  }
}
