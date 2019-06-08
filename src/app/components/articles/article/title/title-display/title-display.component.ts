import { Component, Input } from '@angular/core';

@Component({
  selector: 'cos-title-display',
  templateUrl: './title-display.component.html',
  styleUrls: ['../title.component.scss'],
})
export class TitleDisplayComponent {
  @Input() title: string;
}
