import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-title-edit',
  templateUrl: './title-edit.component.html',
  styleUrls: ['../title.component.scss'],
})
export class TitleEditComponent {
  @Input() parentForm: FormGroup;
}
