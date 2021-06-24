import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { DialogService } from '@services/dialog.service';
import { Store } from '@ngrx/store';
import {
  addArticleTag,
  removeArticleTag,
} from '@store/article/article.actions';
import { currentArticleTags } from '@store/article/article.selectors';
import { map, take } from 'rxjs/operators';

@Component({
  selector: 'cos-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
})
export class TagsComponent {
  @Input() isActive: boolean;
  @Output() onCtrlToggle = new EventEmitter();

  tags$ = this.store.select(currentArticleTags);

  readonly separatorKeyCodes = [ENTER, COMMA];

  hasInputChanged = false;

  constructor(private dialogSvc: DialogService, private store: Store) {}

  clickOut = () => console.log('clicked outside tags');

  toggleCtrl = () => this.onCtrlToggle.emit();

  removeTag = (tag: string) => {
    this.store.dispatch(removeArticleTag({ tag }));
  };

  submitTag = $event => {
    const { value, input }: { value: string; input: HTMLInputElement } = $event;
    if (!this.hasInputChanged || value.length === 0) return;
    if (!this.isInputValid(value)) {
      this.dialogSvc.openMessageDialog(
        'Invalid Tag',
        'Tags must consist only of letters, numbers, and spaces.',
        'Tags should be short, but can be up to 25 characters long.',
      );
      return;
    }

    const tag = value.trim().toUpperCase();

    this.isTagDuplicate$(tag)
      .pipe(take(1))
      .subscribe(isTagDuplicate => {
        if (isTagDuplicate) {
          return (input.value = '');
        }

        this.store.dispatch(addArticleTag({ tag }));
        input.value = '';
        this.hasInputChanged = false;
      });
  };

  onInputChange = () => (this.hasInputChanged = true);

  isInputValid = (value: string) => {
    const nonLetterNumberSpace = new RegExp('[^a-zA-Z0-9 ]');
    return !nonLetterNumberSpace.test(value) && !(value.length < 3);
  };

  isTagDuplicate$ = (tag: string) =>
    this.tags$.pipe(map(tags => tags.includes(tag)));
}
