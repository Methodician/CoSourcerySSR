import { Injectable } from '@angular/core';

// AnguilarFire Stuff
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { ArticlePreview } from '@class/article-info';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  constructor(private afs: AngularFirestore) {}

  allArticlesRef(): AngularFirestoreCollection<ArticlePreview> {
    return this.afs.collection('articleData/articles/previews', ref =>
      ref.orderBy('lastUpdated', 'desc').where('isFlagged', '==', false),
    );
  }
}
