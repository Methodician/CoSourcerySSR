import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'cos-fire-detail',
  templateUrl: './fire-detail.component.html',
  styleUrls: ['./fire-detail.component.scss'],
})
export class FireDetailComponent implements OnInit {
  item: Observable<any>;
  constructor(
    private afs: AngularFirestore,
    private meta: Meta,
    private title: Title,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.getItem();
    this.updateMetaData();
  }

  getItem = () => {
    this.route.params.subscribe(params => {
      if (params.id) {
        const id = params.id;
        this.item = this.afs.doc(`items/${id}`).valueChanges();
      }
    });
  };

  updateMetaData = () => {
    this.item.subscribe(item => {
      this.title.setTitle(item.name);
      this.meta.updateTag({
        name: 'description',
        content: `Details for an item called ${item.name} that has others: ${
          item.other
        }`,
      });
    });
  };
}
