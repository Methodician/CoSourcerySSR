import { Component, Input, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-intro-edit',
  templateUrl: './intro-edit.component.html',
  styleUrls: ['./intro-edit.component.scss', '../intro.component.scss'],
})
export class IntroEditComponent {
  @Input() parentForm: FormGroup;
  @HostListener('window:keydown', ['$event'])
  onkeydown($event: KeyboardEvent) {
    if ($event.key === 'Enter') $event.preventDefault();
  }
}
