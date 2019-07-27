import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { DialogService } from '@services/dialog.service';

@Component({
  selector: 'cos-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
})
export class TagsComponent implements OnInit {
  @Input() tags: string[] = [];
  @Input() isActive: boolean;

  @Output() onCtrlToggle = new EventEmitter();

  readonly separatorKeyCodes = [ENTER, COMMA];

  hasInputChanged = false;

  constructor(private dialogSvc: DialogService) {
    for (let tag of this.tags) console.log(tag);
  }

  ngOnInit() {
    for (let tag of this.tags) console.log(tag);
  }

  clickOut = () => console.log('clicked outside tags');

  toggleCtrl = () => this.onCtrlToggle.emit();

  onRemoveClicked = (tag: string) => console.log(tag, 'removed clicked');

  onTagSubmitted = (tag: string) => {
    if (!this.hasInputChanged || tag.length === 0) return;
    if (!this.isInputValid(tag)) {
      this.dialogSvc.openMessageDialog(
        'Invalid Tag',
        'Tags must consist only of letters, numbers, and spaces.',
        'Tags should be short, but can be up to 25 characters long.'
      );
      return;
    }

    console.log('go ahead and submit the tag:', tag);
    this.hasInputChanged = false;
  };

  onInputChange = () => (this.hasInputChanged = true);

  isInputValid = (value: string) => {
    const nonLetterNumberSpace = new RegExp('[^a-zA-Z0-9 ]');
    return !nonLetterNumberSpace.test(value) && !(value.length <= 3);
  };
}
