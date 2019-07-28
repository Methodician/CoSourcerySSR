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
  @Output() onTagSubmitted = new EventEmitter<string>();
  @Output() onTagRemoved = new EventEmitter<number>();

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

  removeTag = (tag: string) => {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.onTagRemoved.emit(index);
    }
  };

  submitTag = $event => {
    const { value, input }: { value: string; input: HTMLInputElement } = $event;
    if (!this.hasInputChanged || value.length === 0) return;
    if (!this.isInputValid(value)) {
      this.dialogSvc.openMessageDialog(
        'Invalid Tag',
        'Tags must consist only of letters, numbers, and spaces.',
        'Tags should be short, but can be up to 25 characters long.'
      );
      return;
    }

    const tag = value.trim().toUpperCase();
    if (this.isTagDuplicate(tag)) return (input.value = '');

    this.onTagSubmitted.emit(tag);
    input.value = '';
    this.hasInputChanged = false;
  };

  onInputChange = () => (this.hasInputChanged = true);

  isInputValid = (value: string) => {
    const nonLetterNumberSpace = new RegExp('[^a-zA-Z0-9 ]');
    return !nonLetterNumberSpace.test(value) && !(value.length < 3);
  };

  isTagDuplicate = (tag: string) => {
    return this.tags.includes(tag);
  };
}
