import {
  Component,
  Input,
  Output,
  EventEmitter,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Subject } from 'rxjs';

import Quill from 'quill';
import ImageResize from 'quill-image-resize';
Quill.register('modules/imageResize', ImageResize);

import { ArticleService } from '@services/article.service';
import { DialogService } from '@services/dialog.service';
import { AngularFireUploadTask } from '@angular/fire/storage';

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
  imageUploadTask: AngularFireUploadTask;

  constructor(
    @Inject(PLATFORM_ID) platformId: string,
    private articleSvc: ArticleService,
    private dialogSvc: DialogService,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.quillModules = { imageResize: {} };
  }

  ngOnDestroy() {
    if (this.imageUploadTask) this.imageUploadTask.cancel();
  }

  onEditorCreated = editor => {
    console.log('EDITOR CREATED', editor);
    this.quillEditor = editor;
    const toolbar = editor.getModule('toolbar');
    toolbar.addHandler('image', this.onImageButtonClicked);
  };

  onImageButtonClicked = () => {
    const promptImageSelection = () => {
      const subject$ = new Subject<File>();

      try {
        const imgInput = document.createElement('input');
        imgInput.setAttribute('type', 'file');
        imgInput.setAttribute(
          'accept',
          'image/png, image/gif, image/jpeg, image/bmp, image/x-icon',
        );
        imgInput.click();

        imgInput.onchange = () => {
          const file = imgInput.files[0];
          subject$.next(file);

          subject$.complete();
        };
      } catch (error) {
        console.error(error);
        subject$.complete();
      }

      return subject$;
    };

    const insertBodyImage = (url: string) => {
      const range = this.quillEditor.getSelection();
      console.log('RANGE', range);
      this.quillEditor.insertEmbed(range.index, 'image', url);
    };

    promptImageSelection().subscribe(file => {
      const { task, storageRef } = this.articleSvc.uploadBodyImage(
        this.articleId,
        file,
      );

      this.imageUploadTask = task;

      task.then(() => {
        storageRef
          .getDownloadURL()
          .subscribe(imageUrl => insertBodyImage(imageUrl));
        this.imageUploadTask = null;
      });

      this.dialogSvc
        .openProgressDialog(
          'Uploading body image',
          `If you exit or attempt to save while this is happening there may be errors. 
          We'll work to improve this experience with time. You may cancel the process 
          or hide this dialog and continue to work.`,
          task.percentageChanges(),
        )
        .afterClosed()
        .subscribe(shouldCancel => {
          if (shouldCancel && task) {
            task.cancel();
          }
        });
    });
  };

  toggleCtrl = () => this.onCtrlToggle.emit();

  clickOut = () => this.onClickOut.emit();

  changeBody = $e => this.onBodyChange.emit($e);

  testEvent = $e => console.log($e);
}
