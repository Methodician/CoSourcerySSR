import {
  Component,
  OnInit,
  Input,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'cos-contributors',
  templateUrl: './contributors.component.html',
  styleUrls: ['./contributors.component.scss'],
})
export class ContributorsComponent implements OnInit {
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.checkWindowSize();
  }
  @Input() creatorKey: string;
  @Input() set editorMap(editorMap: object) {
    if (editorMap && editorMap !== {}) {
      const editorKeys = (this.editorKeys = Object.keys(editorMap));
      this._editorMap = editorMap;
      this._displayEditorsPrev = [];
      this._displayEditors = editorKeys.slice(
        this.displayEditorsPosition,
        this.editorPanelCount
      );
      this._displayEditorsNext = editorKeys.slice(
        this.displayEditorsPosition + this.editorPanelCount,
        this.editorPanelCount * 2
      );
    }
  }

  editorKeys: Array<string>;
  _editorMap: Object;
  _displayEditors: Array<string>;
  _displayEditorsNext: Array<string>;
  _displayEditorsPrev: Array<string>;
  displayEditorsPosition = 0;
  editorPanelCount: number;
  transitionLeft = false;
  transitionRight = false;
  hasTransitioned = false;
  windowMaxWidth = 780;

  constructor(@Inject(PLATFORM_ID) private platform: Object) {
    this.checkWindowSize();
  }

  ngOnInit() {}

  nextEditorPanel() {
    this.transitionLeft = true;
    this.hasTransitioned = true;
    // wait for profile cards to transition
    setTimeout(() => {
      this.transitionLeft = false;
      // move displayed profile card position up three or reset if at the end
      this.displayEditorsPosition += this.editorPanelCount;
      if (this.displayEditorsPosition >= this.editorKeys.length) {
        this.displayEditorsPosition = 0;
      }
      // set and slice editors to get the prev, display and next segments of the editorKeys
      this._displayEditorsPrev = this._displayEditors;
      this._displayEditors = this._displayEditorsNext;
      this._displayEditorsNext = this.editorKeys.slice(
        this.displayEditorsPosition + this.editorPanelCount,
        this.displayEditorsPosition + this.editorPanelCount * 2
      );
      // if next is empty set it to the beginning of editorKeys
      if (this._displayEditorsNext.length <= 0) {
        this._displayEditorsNext = this.editorKeys.slice(
          0,
          this.editorPanelCount
        );
      }
    }, 2000);
  }

  prevEditorPanel() {
    this.transitionRight = true;
    // wait for profile cards to transition
    setTimeout(() => {
      this.transitionRight = false;
      const remainder = this.editorKeys.length % this.editorPanelCount;
      // move displayed profile card position up three or reset if at the end
      this.displayEditorsPosition -= this.editorPanelCount;

      // check that the displayEditorsPosition is still positive
      if (this.displayEditorsPosition < 0 && remainder > 0) {
        // if not positive and if we have a remainder then we want the last remainder(amount) of profile cards from the editorKeys
        this.displayEditorsPosition = this.editorKeys.length - remainder;
      } else if (this.displayEditorsPosition < 0) {
        // if not positive and if we don't have a remainder then we want the last editorPanelCount(amount) of profile cards from the editorKeys
        this.displayEditorsPosition =
          this.editorKeys.length - this.editorPanelCount;
      }

      // set and slice editors to get the prev, display and next segments of the editorKeys
      this._displayEditorsNext = this._displayEditors;
      this._displayEditors = this._displayEditorsPrev;

      // check if prev position is below 0. i.e. if the displayEditorsPosition is less than the amount of cards on display then the prev panel
      // position will be below 0 and thus should get profile cards from the end of the editorKeys array
      if (
        this.displayEditorsPosition < this.editorPanelCount &&
        remainder > 0
      ) {
        // if the editorPanelCount does not divide evenly into the length of the editorKeys array then we take the remainder(number) from the end of the editorKeys array.
        // i.e. if we have 10 editorKeys and are displaying 3 cards per panel. the last panel should only have 1 card be cause 3 + 3 + 3 + 1(our remainder) = 10
        this._displayEditorsPrev = this.editorKeys.slice(
          this.editorKeys.length - remainder,
          this.editorKeys.length
        );
      } else if (this.displayEditorsPosition < this.editorPanelCount) {
        // if the editorPanelCount does divide evenly then we want our last panel to have editorPanelCount amount of profile cards in it from the end of the editorKeys array
        this._displayEditorsPrev = this.editorKeys.slice(
          this.editorKeys.length - this.editorPanelCount,
          this.editorKeys.length
        );
      } else {
        // and if the displayEditorsPosition is greater than the editorPanelCount then you just take the next editorPanelCount amount of profile cards from infront of the displayEditorsPosition index in editorKeys
        this._displayEditorsPrev = this.editorKeys.slice(
          this.displayEditorsPosition - this.editorPanelCount,
          this.displayEditorsPosition
        );
      }
    }, 2000);
  }

  displayText(editorKey) {
    let text = `Edits: ${this._editorMap[editorKey]}`;
    if (editorKey === this.creatorKey) {
      text = text + ' (creator)';
    }
    return text;
  }

  checkWindowSize() {
    if (isPlatformBrowser(this.platform)) {
      window.innerWidth < this.windowMaxWidth
        ? (this.editorPanelCount = 2)
        : (this.editorPanelCount = 3);
    }
  }
}
