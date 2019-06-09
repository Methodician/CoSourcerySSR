import { Component, Input } from '@angular/core';

@Component({
  selector: 'cos-intro-display',
  templateUrl: './intro-display.component.html',
  styleUrls: ['./intro-display.component.scss', '../intro.component.scss'],
})
export class IntroDisplayComponent {
  @Input() introduction: string;
}
