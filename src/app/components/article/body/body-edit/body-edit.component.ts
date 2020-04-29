import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ChangeEvent } from '@ckeditor/ckeditor5-angular/ckeditor.component';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { createVanillaStorageRef } from '@helpers/firebase';
import 'firebase/storage';

import { ArticleService } from '@services/article.service';

@Component({
  selector: 'cos-body-edit',
  templateUrl: './body-edit.component.html',
  styleUrls: ['./body-edit.component.scss'],
})
export class BodyEditComponent implements OnInit {
  @Input() body: string;
  @Input() articleId: string;
  @Input() isActive: boolean;

  @Output() onBodyChange = new EventEmitter<string>();

  // CKEditor setup
  isEditorImported = false;
  isCkeditorReady = false;
  placeholder =
    "<h2>Creating a New Article</h2><ol><li>Add an eye-catching <strong>Cover Image</strong> above.</li><li>Choose a concise, meaningful, and interesting <strong>Title</strong>.</li><li>Write a brief <strong>Intro</strong> to outline the topic of your article and why it's so cool!</li><li>Add the <strong>Body</strong> of your article by editing this block of content.</li><li>Add some <strong>Tags</strong> below to help people find your article.</li><li>Click <strong>Save Article</strong> when you're done.</li></ol>";
  content$ = new Subject<string>();

  ckeditor = {
    build: null,
    config: {
      toolbar: {
        items: [
          'heading',
          'bold',
          'italic',
          'link',
          'bulletedList',
          'numberedList',
          'blockQuote',
          'imageUpload',
          'mediaEmbed',
          'insertTable',
        ],
        viewportTopOffset: 70,
      },
      // fbImageStorage is declared here but set after articleId is set.
      fbImageStorage: {},
    },
    content: this.placeholder,
    toggleBtnOffset: 0,
  };

  constructor(private articleSvc: ArticleService) {
    this.importEditor();
  }

  ngOnInit() {
    const storageRef = createVanillaStorageRef(
      `articleBodyImages/${this.articleId}`,
    );
    this.ckeditor.config.fbImageStorage = { storageRef };
    this.content$.pipe(debounceTime(750)).subscribe(content => {
      this.changeBody(content);
    });
  }

  importEditor = async () => {
    const editor = await import('@ckeditor/ckeditor5-build-inline');
    this.ckeditor.build = editor.default;
    this.isEditorImported = true;
  };

  onCKEditorReady = editor => {
    editor.setData(this.body ? this.body : this.placeholder);
    this.isCkeditorReady = true;
  };

  onCKEditorChange = (change: ChangeEvent) => {
    const { editor } = change;
    const content = editor.getData();
    this.content$.next(content);
  };

  changeBody = body => {
    this.onBodyChange.emit(body);
  };
}
