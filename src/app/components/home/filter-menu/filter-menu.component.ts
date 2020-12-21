import {
  Component,
  OnChanges,
  SimpleChanges,
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
  @Input() tabList: ITabList = [
    { name: 'Tab 1', selected: true },
    { name: 'Tab 2', selected: false },
  ];

  @Output() onTabSelected = new EventEmitter<number>();
  @Output() onTabAdded = new EventEmitter<ITabList>();

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
  getSelectedTab = (): ITabItem => {
    const matchignTabs = this.tabList.filter(item => {
      return item.selected;
    });
    // Not expecting duplicate tabs anyway, so returning 1st element.
    return matchignTabs[0];
  };

  getTabByName = (name: string): ITabItem => {
    const matchignTabs = this.tabList.filter(item => {
      return item.name === name;
    });
    // Not expecting duplicate tabs anyway, so returning 1st element.
    return matchignTabs[0];
  };

  isTabSelected = (tabName: string): boolean => {
    const tab: ITabItem = this.getTabByName(tabName);
    return tab && tab.selected;
  };
}

export interface ITabItem {
  name: string;
  selected: boolean;
}

export interface ITabList extends Array<ITabItem> {}
