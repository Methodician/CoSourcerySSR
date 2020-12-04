import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';

@Component({
  selector: 'cos-field-edit-button',
  templateUrl: './field-edit-button.component.html',
  styleUrls: ['./field-edit-button.component.scss'],
})
export class FieldEditButtonComponent implements OnInit {
  @Input() isActive = false;
  @Input() tooltipName = 'field';

  @Output() clicked = new EventEmitter();

  isParentHovered = false;

  constructor(private elRef: ElementRef) {}

  ngOnInit(): void {
    console.log(this.elRef.nativeElement.parentElement);
    const parentEl: HTMLElement = this.elRef.nativeElement.parentElement;
    parentEl.onmouseenter = () => (this.isParentHovered = true);
    parentEl.onmouseleave = () => (this.isParentHovered = false);
  }
}
