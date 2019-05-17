import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'cos-meta',
  templateUrl: './meta.component.html',
  styleUrls: ['./meta.component.scss'],
})
export class MetaComponent implements OnInit {
  constructor(private meta: Meta, private title: Title) {}

  ngOnInit() {
    this.updateMetaData();
  }

  updateMetaData = () => {
    this.title.setTitle('The Meta Component');
    this.meta.updateTag({
      name: 'description',
      content: 'a great description',
    });
  };
}
