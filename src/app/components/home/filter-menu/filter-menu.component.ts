import {
  Component,
  OnChanges,
  SimpleChanges,
  ViewChild,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';

@Component({
  selector: 'cos-filter-menu',
  templateUrl: './filter-menu.component.html',
  styleUrls: ['./filter-menu.component.scss'],
})
export class FilterMenuComponent implements OnChanges {
  // ViewChild may not be needed if we go with accordion
  // TODO: Consider switch to static: false https://angular.io/guide/static-query-migration
  @ViewChild('filterMenu', { static: true }) filterMenu;
  @Input() tabList: TabList = [
    { name: 'Tab 1', selected: true },
    { name: 'Tab 2', selected: false },
  ];

  @Output() onTabSelected = new EventEmitter<number>();
  @Output() onTabAdded = new EventEmitter<TabList>();

  filterContainerHeight: number;
  filterMenuIsSticky: boolean;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.tabList && changes.tabList.currentValue) {
      this.onTabAdded.emit(changes.tabList.currentValue);
    }
  }

  onTabClicked = (tabIndex: number) => {
    const { tabList } = this;
    for (const tab of tabList) {
      tab.selected = false;
    }
    tabList[tabIndex].selected = true;
    this.onTabSelected.emit(tabIndex);
  };

  // HELPFUL SELECTORS
  getSelectedTab = (): TabItem => {
    const matchignTabs = this.tabList.filter(item => {
      return item.selected;
    });
    // Not expecting duplicate tabs anyway, so returning 1st element.
    return matchignTabs[0];
  };

  getTabByName = (name: string): TabItem => {
    const matchignTabs = this.tabList.filter(item => {
      return item.name === name;
    });
    // Not expecting duplicate tabs anyway, so returning 1st element.
    return matchignTabs[0];
  };

  isTabSelected = (tabName: string): boolean => {
    const tab: TabItem = this.getTabByName(tabName);
    return tab && tab.selected;
  };

  checkScrollPosition = () => {
    const yCoordinate = window.scrollY;
    if (document.body.clientWidth >= 482) {
      this.filterMenuIsSticky = yCoordinate >= 200 ? true : false;
    } else {
      this.filterMenuIsSticky = true;
    }
  };

  adjustFilterContainerOnResize = () => {
    this.checkScrollPosition();
    this.setFilterContainerHeight();
  };

  setFilterContainerHeight = () => {
    // May not be needed if we go with accordion
    this.filterContainerHeight = this.filterMenu.nativeElement.clientHeight;
  };
}

export interface TabItem {
  name: string;
  selected: boolean;
}

export interface TabList extends Array<TabItem> {}
