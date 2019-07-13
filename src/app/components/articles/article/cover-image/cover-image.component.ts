import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'cos-cover-image',
  templateUrl: './cover-image.component.html',
  styleUrls: ['./cover-image.component.scss'],
})
export class CoverImageComponent implements OnInit {
  @Input() isActive = false;
  @Input() imageUrl: string;
  @Input() imageAlt: string;

  @Output() onCtrlToggle = new EventEmitter();
  @Output() onClickOut = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  toggleCtrl = () => this.onCtrlToggle.emit();
  clickOut = () => this.onClickOut.emit();
}
