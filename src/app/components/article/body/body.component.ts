import {
  Component,
  Input,
  Output,
  EventEmitter,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import Quill from 'quill';
import Emitter from 'quill/core/emitter';
import Delta from 'quill-delta';
import ImageResize from 'quill-image-resize';
import { ArticleService } from '@services/article.service';
import { BehaviorSubject } from 'rxjs';
import { KeyMapI } from '@shared_models/index';
Quill.register('modules/imageResize', ImageResize);

// ToDo: This stuff goes in another file!
const BaseImage = Quill.import('formats/image');
const ATTRIBUTES = ['alt', 'height', 'width', 'style', 'id'];
const WHITE_STYLE = ['margin', 'display', 'float'];
class Image extends BaseImage {
  static formats(domNode) {
    return ATTRIBUTES.reduce(function (formats, attribute) {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }

  format(name, value) {
    if (ATTRIBUTES.indexOf(name) > -1) {
      if (value) {
        if (name === 'style') {
          value = this.sanitize_style(value);
        }
        (this as any).domNode.setAttribute(name, value);
      } else {
        (this as any).domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }

  sanitize_style(style) {
    let style_arr = style.split(';');
    let allow_style = '';
    style_arr.forEach((v, i) => {
      if (WHITE_STYLE.indexOf(v.trim().split(':')[0]) !== -1) {
        allow_style += v + ';';
      }
    });
    return allow_style;
  }
}

Quill.register(Image);

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

  quillModules = {};
  quillEditor = null;
  quillToolbar = null;
  bodyImageFiles: BehaviorSubject<KeyMapI<File>> = new BehaviorSubject({});

  constructor(
    private articleSvc: ArticleService,
    @Inject(PLATFORM_ID) platformId: string,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.quillModules = { imageResize: {} };

    this.bodyImageFiles.subscribe(files => console.log(files));
  }

  onEditorCreated = editor => {
    console.log('EDITOR CREATED', editor);
    this.quillEditor = editor;
    this.quillToolbar = editor.getModule('toolbar');
    this.quillToolbar.addHandler('image', this.onImageButtonClicked);
  };

  onImageButtonClicked = async () => {
    // NOTE: much of the below comes paraphrased from Quill internals and uses
    // other Quill internals and frankly goes a bit over my head.
    // For further reference look into Quill repo base.js => search "image" and uploader.js
    console.log('IMAGE CLICKED');
    let fileInput: HTMLInputElement = this.quillToolbar.container.querySelector(
      'input.ql-image[type=file]',
    );
    if (fileInput == null) {
      fileInput = document.createElement('input');
      fileInput.setAttribute('type', 'file');
      // This is way more than what Quill accepts by default.
      // There may be a reason for the default limitations?
      const acceptedFileTypes = [
        'image/png',
        'image/gif',
        'image/jpeg',
        'image/bmp',
        'image/x-icon',
      ];
      fileInput.setAttribute('accept', acceptedFileTypes.join(', '));
      fileInput.classList.add('ql-image');
      fileInput.onchange = () => {
        const range = this.quillEditor.getSelection(true);
        // paraphrased from Quill => uploader.js
        const upload = () => {
          const uploads = Array.from(fileInput.files).map(file => {
            if (file && acceptedFileTypes.includes(file.type)) {
              return file;
            }
          });
          // paraphrased from Quill => uploader.js => DEFAULTS.handler
          const processImages = () => {
            const id = this.articleSvc.createId();

            const promises: Promise<string | ArrayBuffer>[] = uploads.map(
              file =>
                new Promise(resolve => {
                  this.bodyImageFiles.next({
                    ...this.bodyImageFiles.value,
                    [id]: file,
                  });
                  const reader = new FileReader();
                  reader.onload = e => resolve(e.target.result);
                  reader.readAsDataURL(file);
                }),
            );
            Promise.all(promises).then(images => {
              const update = images.reduce(
                (delta, image) =>
                  // delta.insert(
                  //   {
                  //     image: 'https://i.imgur.com/o04KozN.png',
                  //   },
                  //   { id: this.articleSvc.createId() },
                  // ),
                  delta.insert({ image }, { id }),
                new Delta().retain(range.index).delete(range.length),
              );
              console.log('update', update);
              this.quillEditor.updateContents(update, Emitter.sources.USER);
              this.quillEditor.setSelection(
                range.index + range.length,
                Emitter.sources.SILENT,
              );
            });
          };
          if (uploads.length > 0) {
            processImages();
          }
        };

        upload();
        fileInput.value = '';
      };
      this.quillToolbar.container.appendChild(fileInput);
    }
    fileInput.click();
  };

  toggleCtrl = () => this.onCtrlToggle.emit();

  clickOut = () => this.onClickOut.emit();

  changeBody = $e => this.onBodyChange.emit($e);

  testEvent = $e => console.log($e);
}
