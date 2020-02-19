import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ChangeEvent } from '@ckeditor/ckeditor5-angular/ckeditor.component';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { createVanillaStorageRef } from '@helpers/firebase';
import { storage } from 'firebase/app';
import 'firebase/storage';
import * as exif from 'exif-js';

import { IBodyImageMeta, IBodyImageMap } from '@models/article-info';

@Component({
  selector: 'cos-body-edit',
  templateUrl: './body-edit.component.html',
  styleUrls: ['./body-edit.component.scss'],
})
export class BodyEditComponent implements OnInit {
  @Input() body: string;
  @Input() articleId: string;
  @Input() isActive: boolean;
  @Input() bodyImages: IBodyImageMap;

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

  constructor() {
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
    this.processCKEditorImages();
  };

  onCKEditorChange = (change: ChangeEvent) => {
    const { editor } = change;
    const content = editor.getData();
    this.content$.next(content);
  };

  changeBody = body => {
    this.onBodyChange.emit(body);
    if (this.isCkeditorReady) {
      // setTimeout with 0 delay still pushes this down the stack so we get the updated body.
      // Otherwise when deleting an image, we'll still process the deleted image.
      setTimeout(() => {
        this.processCKEditorImages();
      }, 0);
    }
  };

  processCKEditorImages = () => {
    // HACKISH: the class name we're using is super generic and likely to cause conflict some day.
    const figures = document.getElementsByClassName('image');
    for (const key in figures) {
      const fig = figures[key];
      const img = fig.firstChild;
      if (img && img instanceof HTMLImageElement) {
        if (img.complete) {
          // Processes image when for one reason or another they are already loaded but may not be rotated
          this.rotateImage(img);
        } else {
          img.onload = _ => {
            this.rotateImage(img);
          };
        }
      }
    }
  };

  rotateImage = async img => {
    if (img.src.includes('data:image')) {
      return;
    }
    const imgPath = storage().refFromURL(img.src).fullPath;
    const imgCode = imgPath.split('/')[imgPath.split('/').length - 1];

    let rotation: orientationDegrees = 0;
    if (img.style.transform && img.style.transform.includes('rotate')) {
      // It has been rotated. Don't do extra stuff
      return;
    } else if (this.bodyImages[imgCode]) {
      // it's in the image map so set the rotation from DB
      rotation = this.exifOrientationToDegrees(
        this.bodyImages[imgCode].orientation,
      );
    } else {
      // Find correct orientation and add it to the map
      let orientation = await this.getExifOrientation(img);
      orientation = orientation || 0;
      rotation = this.exifOrientationToDegrees(orientation);

      const imageMeta: IBodyImageMeta = {
        path: imgPath,
        orientation,
      };
      this.bodyImages[imgCode] = imageMeta;
    }

    img.setAttribute('style', `transform:rotate(${rotation}deg);`);
  };

  getExifOrientation(img) {
    const promise = new Promise<number>((resolve, reject) => {
      try {
        exif.getData(img, function() {
          const orientation = exif.getTag(this, 'Orientation');
          return resolve(orientation);
        });
      } catch (error) {
        return reject(error);
      }
    });
    return promise;
  }

  exifOrientationToDegrees = (orientation): orientationDegrees => {
    switch (orientation) {
      case 1:
      case 2:
        return 0;
      case 3:
      case 4:
        return 180;
      case 5:
      case 6:
        return 90;
      case 7:
      case 8:
        return 270;
      default:
        return 0;
    }
  };
}

export type orientationDegrees = 0 | 90 | 180 | 270;
