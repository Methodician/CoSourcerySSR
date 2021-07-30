import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { PlatformService } from '@services/platform.service';
import { KeyMapI } from '@shared_models/index';
import {
  dbArticleAuthorId,
  dbArticleEditors,
} from '@store/article/article.selectors';
import { Subject } from 'rxjs';
import { first, startWith, takeUntil, tap } from 'rxjs/operators';

const EDITORS_KEY = makeStateKey<KeyMapI<number>>('editors');
const AUTHOR_ID_KEY = makeStateKey<string>('authorId');

@Component({
  selector: 'cos-contributors',
  templateUrl: './contributors.component.html',
  styleUrls: ['./contributors.component.scss'],
})
export class ContributorsComponent implements OnInit, OnDestroy {
  private unsubscribe$: Subject<void> = new Subject();

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.checkWindowSize();
  }

  authorId: string;

  articleEditors: KeyMapI<number>;
  editorIds: Array<string>;

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

  constructor(
    private platformSvc: PlatformService,
    private store: Store,
    private state: TransferState,
  ) {
    this.checkWindowSize();
  }

  ngOnInit() {
    this.ssrAuthorId$().subscribe(id => (this.authorId = id));
    // For some reason it still loads twice on page load
    this.watchEditors();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ssrEditors$ = () => {
    const preExisting = this.state.get(EDITORS_KEY, {});

    return this.store.select(dbArticleEditors).pipe(
      first(editors => Object.keys(editors).length > 0),
      tap(editors => this.state.set(EDITORS_KEY, editors)),
      startWith(preExisting),
    );
  };

  ssrAuthorId$ = () => {
    const preExisting = this.state.get(AUTHOR_ID_KEY, null);

    return this.store.select(dbArticleAuthorId).pipe(
      first(id => !!id),
      tap(id => this.state.set(AUTHOR_ID_KEY, id)),
      startWith(preExisting),
    );
  };

  watchEditors = () =>
    this.ssrEditors$().subscribe(editorMap => {
      this._editorMap = editorMap;
      const editorIds = (this.editorIds = Object.keys(editorMap));
      this._displayEditorsPrev = [];
      this._displayEditors = editorIds.slice(
        this.displayEditorsPosition,
        this.editorPanelCount,
      );
      this._displayEditorsNext = editorIds.slice(
        this.displayEditorsPosition + this.editorPanelCount,
        this.editorPanelCount * 2,
      );
    });

  nextEditorPanel() {
    this.transitionLeft = true;
    this.hasTransitioned = true;
    // wait for profile cards to transition
    setTimeout(() => {
      this.transitionLeft = false;
      // move displayed profile card position up three or reset if at the end
      this.displayEditorsPosition += this.editorPanelCount;
      if (this.displayEditorsPosition >= this.editorIds.length) {
        this.displayEditorsPosition = 0;
      }
      // set and slice editors to get the prev, display and next segments of the editorIds
      this._displayEditorsPrev = this._displayEditors;
      this._displayEditors = this._displayEditorsNext;
      this._displayEditorsNext = this.editorIds.slice(
        this.displayEditorsPosition + this.editorPanelCount,
        this.displayEditorsPosition + this.editorPanelCount * 2,
      );
      // if next is empty set it to the beginning of editorIds
      if (this._displayEditorsNext.length <= 0) {
        this._displayEditorsNext = this.editorIds.slice(
          0,
          this.editorPanelCount,
        );
      }
    }, 2000);
  }

  prevEditorPanel() {
    this.transitionRight = true;
    // wait for profile cards to transition
    setTimeout(() => {
      this.transitionRight = false;
      const remainder = this.editorIds.length % this.editorPanelCount;
      // move displayed profile card position up three or reset if at the end
      this.displayEditorsPosition -= this.editorPanelCount;

      // check that the displayEditorsPosition is still positive
      if (this.displayEditorsPosition < 0 && remainder > 0) {
        // if not positive and if we have a remainder then we want the last remainder(amount) of profile cards from the editorIds
        this.displayEditorsPosition = this.editorIds.length - remainder;
      } else if (this.displayEditorsPosition < 0) {
        // if not positive and if we don't have a remainder then we want the last editorPanelCount(amount) of profile cards from the editorIds
        this.displayEditorsPosition =
          this.editorIds.length - this.editorPanelCount;
      }

      // set and slice editors to get the prev, display and next segments of the editorIds
      this._displayEditorsNext = this._displayEditors;
      this._displayEditors = this._displayEditorsPrev;

      // check if prev position is below 0. i.e. if the displayEditorsPosition is less than the amount of cards on display then the prev panel
      // position will be below 0 and thus should get profile cards from the end of the editorIds array
      if (
        this.displayEditorsPosition < this.editorPanelCount &&
        remainder > 0
      ) {
        // if the editorPanelCount does not divide evenly into the length of the editorIds array then we take the remainder(number) from the end of the editorIds array.
        // i.e. if we have 10 editorIds and are displaying 3 cards per panel. the last panel should only have 1 card be cause 3 + 3 + 3 + 1(our remainder) = 10
        this._displayEditorsPrev = this.editorIds.slice(
          this.editorIds.length - remainder,
          this.editorIds.length,
        );
      } else if (this.displayEditorsPosition < this.editorPanelCount) {
        // if the editorPanelCount does divide evenly then we want our last panel to have editorPanelCount amount of profile cards in it from the end of the editorIds array
        this._displayEditorsPrev = this.editorIds.slice(
          this.editorIds.length - this.editorPanelCount,
          this.editorIds.length,
        );
      } else {
        // and if the displayEditorsPosition is greater than the editorPanelCount then you just take the next editorPanelCount amount of profile cards from infront of the displayEditorsPosition index in editorIds
        this._displayEditorsPrev = this.editorIds.slice(
          this.displayEditorsPosition - this.editorPanelCount,
          this.displayEditorsPosition,
        );
      }
    }, 2000);
  }

  displayText(editorId) {
    let text = `Edits: ${this._editorMap[editorId]}`;
    if (editorId === this.authorId) {
      text = text + ' (creator)';
    }
    return text;
  }

  checkWindowSize() {
    if (this.platformSvc.isBrowser) {
      window.innerWidth < this.windowMaxWidth
        ? (this.editorPanelCount = 2)
        : (this.editorPanelCount = 3);
    }
  }
}
