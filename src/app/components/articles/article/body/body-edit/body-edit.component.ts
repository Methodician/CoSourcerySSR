import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import InlineEditor from '@ckeditor/ckeditor5-build-inline';
import { ChangeEvent } from '@ckeditor/ckeditor5-angular/ckeditor.component';

@Component({
  selector: 'cos-body-edit',
  templateUrl: './body-edit.component.html',
  styleUrls: ['./body-edit.component.scss'],
})
export class BodyEditComponent implements OnInit {
  @ViewChild('editor', { static: false }) editor;
  @Input() body: string;

  @Output() onBodyChange = new EventEmitter<string>();

  // CKEditor setup
  placeholder =
    "<h2>Creating a New Article</h2><ol><li>Add an eye-catching <strong>Cover Image</strong> above.</li><li>Choose a concise, meaningful, and interesting <strong>Title</strong>.</li><li>Write a brief <strong>Intro</strong> to outline the topic of your article and why it's so cool!</li><li>Add the <strong>Body</strong> of your article by editing this block of content.</li><li>Add some <strong>Tags</strong> below to help people find your article.</li><li>Click <strong>Save Article</strong> when you're done.</li></ol>";
  ckEditorReady = false;

  ckeditor = {
    build: InlineEditor,
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

  constructor() {}

  ngOnInit() {}

  onCKEditorReady = editor => {
    editor.setData(this.body);
    console.log('ckEditor Ready', editor.getData());
  };

  onCKEditorChange = (change: ChangeEvent) => {
    const { editor } = change;
    const data = editor.getData();
    console.log('changed', data);
    console.log('editor', this.editor);
  };

  changeBody = body => this.onBodyChange.emit(body);
}
