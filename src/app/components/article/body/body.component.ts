import {
  Component,
  Input,
  Output,
  EventEmitter,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import Quill, { Delta } from 'quill';
// import ImageResize from 'quill-image-resize-module';

// Quill.register('modules/imageResize', ImageResize);

//  Super-inspiring codepen: https://codepen.io/dnus/pen/OojaeN
// Lots of quill libraries: https://github.com/quilljs/awesome-quill
// Shared cursor display: https://github.com/reedsy/quill-cursors

// Seems that body images and much else is auto-scrubbed by the editor!
// e.g. old body with images:
// <h2><strong>Step 1.</strong></h2><h4>Make Coffee.</h4><figure class="image"><img src="https://fire842915"></figure><p><br><strong>Step 2.</strong> Make Foam.&nbsp;</p><figure class="image"><img src="https://f3a908"></figure><p><br><strong>Step 3.</strong> Pour foam into coffee in intricate way that makes a cool pattern.&nbsp;</p><figure class="image"><img src="https://firebase=b8a0c"></figure><p><br><strong>Step 4.</strong> Done</p><figure class="image"><img src="https://firebasestorage.googleapis.com/v0/b/cosourcerytest.appspot.com/o/articleBodyImages%2FYzkKh52JqqxPVAXwTqr9%2FJlXDb2f?alt=media&amp;token=b7ccf902-cf56-4df5-8f97-8431892c1104"></figure>
// e.g. new body with image:
/*
  <p>How about with an image?</p>
  <p>
    <img src="data:image/jpeg;base64,/9j/4gv4SUNDX1BST0Z7PPRRVNx1Z//Z">
  </p>
  <p>THat's an image...</p>
*/
@Component({
  selector: 'cos-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss'],
})
export class BodyComponent {
  @Input() isActive: boolean;
  @Input() body: string;
  @Input() articleId: string;
  @Input() isEditable = true;

  @Output() onCtrlToggle = new EventEmitter();
  @Output() onClickOut = new EventEmitter();
  @Output() onBodyChange = new EventEmitter<string>();

  isBrowser: boolean;

  modules = {};

  constructor(@Inject(PLATFORM_ID) platformId: string) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.modules = {
      imageResize: {},
    };
  }

  toggleCtrl = () => this.onCtrlToggle.emit();

  clickOut = () => this.onClickOut.emit();

  changeBody = $e => this.onBodyChange.emit($e);

  testEvent = $e => console.log($e);
}
