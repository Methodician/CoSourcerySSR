import {
  Component,
  Input,
  Output,
  EventEmitter,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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
    this.modules = { imageResize: {} };
  }

  onQuillCreated = quill => {
    console.log(quill);
    // const toolbar = quill.getModule('toolbar');
    // toolbar.addHandler('image', $e => console.log('image', $e));
  };

  toggleCtrl = () => this.onCtrlToggle.emit();

  clickOut = () => this.onClickOut.emit();

  changeBody = $e => {
    if ($e.delta?.ops[1]?.insert?.image) {
      console.log($e.delta.ops[1].insert.image);
    }
    console.log($e);
    this.onBodyChange.emit($e);
  };

  testEvent = $e => console.log($e);
}

const editor = new Quill('#quill-editor', {
  bounds: '#quill-editor',
  modules: {
    toolbar: this.toolbarOptions,
  },
  placeholder: 'Free Write...',
  theme: 'snow',
});

/**
 * Step1. select local image
 *
 */
function selectLocalImage() {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.click();

  // Listen upload local image and save to server
  input.onchange = () => {
    const file = input.files[0];

    // file type is only image.
    if (/^image\//.test(file.type)) {
      saveToServer(file);
    } else {
      console.warn('You could only upload images.');
    }
  };
}

/**
 * Step2. save to server
 *
 * @param {File} file
 */
function saveToServer(file: File) {
  const fd = new FormData();
  fd.append('image', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:3000/upload/image', true);
  xhr.onload = () => {
    if (xhr.status === 200) {
      // this is callback data: url
      const url = JSON.parse(xhr.responseText).data;
      insertToEditor(url);
    }
  };
  xhr.send(fd);
}

/**
 * Step3. insert image url to rich editor.
 *
 * @param {string} url
 */
function insertToEditor(url: string) {
  // push image url to rich editor.
  const range = editor.getSelection();
  editor.insertEmbed(range.index, 'image', `http://localhost:9000${url}`);
}

// quill editor add image handler
editor.getModule('toolbar').addHandler('image', () => {
  selectLocalImage();
});
