import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import { Subject } from 'rxjs';
import { AngularFireUploadTask } from '@angular/fire/storage';

// INTERNAL IMPORTS
import { ArticleService } from '@services/article.service';
import { PlatformService } from '@services/platform.service';

//  Super-inspiring codepen: https://codepen.io/dnus/pen/OojaeN
// Lots of quill libraries: https://github.com/quilljs/awesome-quill
// Shared cursor display: https://github.com/reedsy/quill-cursors

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
  @Output() onBodyImageAdded = new EventEmitter<string>();

  isBrowser: boolean;
  // Quill browser-only stuff
  quillDelta: any;
  quillEmitter: any;

  quillModules = null;
  quillEditor = null;
  quillToolbar = null;
  uploadBodyImage$: Subject<{ id: string; file: File }> = new Subject();
  bodyImageUploadTasks: AngularFireUploadTask[] = [];

  constructor(
    private articleSvc: ArticleService,
    platformSvc: PlatformService,
  ) {
    this.isBrowser = platformSvc.isBrowser;
    if (this.isBrowser) {
      import('quill/core/emitter').then(Emitter => {
        this.quillEmitter = Emitter.default;
      });
      import('quill-delta').then(Delta => {
        this.quillDelta = Delta.default;
      });
      Promise.all([
        import('quill-image-resize'),
        import('quill'),
        import('./quill-image'),
      ]).then(([ImageResize, Quill, Image]) => {
        Quill.default.register(Image.default);
        Quill.default.register('modules/imageResize', ImageResize.default);
        this.quillModules = {
          imageResize: {},
          clipboard: { matchVisual: false },
        };
      });
    }

    this.watchBodyImageFiles();
  }

  ngOnDestroy() {
    for (let task of this.bodyImageUploadTasks) {
      task.cancel();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.isActive) {
      const { currentValue } = changes.isActive;
      if (!currentValue) this.quillEditor?.disable();
      if (!!currentValue) this.quillEditor?.enable();
    }
  }

  onEditorCreated = editor => {
    this.quillEditor = editor;
    this.quillToolbar = editor.getModule('toolbar');
    this.quillToolbar.addHandler('image', this.onImageButtonClicked);
    this.quillEditor.disable();
  };

  watchBodyImageFiles = () => {
    this.uploadBodyImage$.subscribe(pendingUpload => {
      this.articleSvc.pendingImageUploadCount++;
      const { id, file } = pendingUpload;
      const { task, storageRef } = this.articleSvc.uploadBodyImage(
        this.articleId,
        id,
        file,
      );
      this.bodyImageUploadTasks.push(task);
      task.then(() => {
        const relevantElement = document.getElementById(id);
        const newElement = document.createElement('img');
        storageRef.getDownloadURL().subscribe(
          imageUrl => {
            newElement.setAttribute('src', imageUrl);
            newElement.setAttribute('id', id);
            relevantElement.replaceWith(newElement);
            this.articleSvc.pendingImageUploadCount--;
            this.onBodyImageAdded.emit(id);
          },
          err => {
            newElement.setAttribute(
              'src',
              'assets/images/noun_upload_error.svg',
            );
            newElement.setAttribute('id', id);
            relevantElement.replaceWith(newElement);
            this.articleSvc.pendingImageUploadCount--;
            // ToDo log some of this stuff using an error logger or Firebase...
            console.error(err);
          },
        );
      });
    });
  };

  onImageButtonClicked = async () => {
    // ToDo: may migrate this to another file
    // !NOTE: much of the below comes paraphrased from Quill internals and uses
    // other Quill internals and frankly goes a bit over my head.
    // For further reference look into Quill repo base.js => search "image" and uploader.js
    if (!this.isBrowser) {
      alert('Please wait for the application to load first');
      return;
    }
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
                  this.uploadBodyImage$.next({
                    id,
                    file,
                  });
                  const reader = new FileReader();
                  reader.onload = e => resolve(e.target.result);
                  reader.readAsDataURL(file);
                }),
            );
            Promise.all(promises).then(images => {
              const update = images.reduce(
                (delta, image) => delta.insert({ image }, { id }),
                new this.quillDelta().retain(range.index).delete(range.length),
              );
              this.quillEditor.updateContents(
                update,
                this.quillEmitter.sources.USER,
              );
              this.quillEditor.setSelection(
                range.index + range.length,
                this.quillEmitter.sources.SILENT,
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
}
