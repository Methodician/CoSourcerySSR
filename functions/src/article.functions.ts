import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ArticleDetailI, ArticlePreviewI } from '../../shared_models/index';
const adminFS = admin.firestore();
const adminDB = admin.database();

export const onCreateArticleDetail = functions.firestore
  .document('articleData/articles/articles/{articleId}')
  .onCreate(async (snap, _) => {
    const article = snap.data();

    const trackArticleAuthorship = () => {
      const { authorId, articleId } = article;
      const createdAt = new Date(article.timestamp.toDate()).getTime();
      const ref = adminDB.ref(
        `userInfo/articlesAuthoredPerUser/${authorId}/${articleId}`,
      );
      return ref.set(createdAt);
    };

    try {
      await trackArticleAuthorship();
    } catch (error) {
      console.error('There was an issue handling article creation', error);
    }
    // TO BE REFACTORED AND ADDED BACK FOR SEARCH FUNCTIONALITY:
    // exports.updateAlgoliaIndex =
    // functions.firestore.document('articleData/articles/articles/{articleId}').onWrite((change, context) => {
    //     const project = process.env.GCP_PROJECT;
    //     let currentEnv;
    //     if (project === Projects.cosourcerytest) {
    //         currentEnv = devEnv;
    //     } else if (project === Projects.cosourcery) {
    //         currentEnv = prodEnv;
    //     } else {
    //         console.error('No valid environment for algolia indexing');
    //         return null;
    //     }
    //     const articleObject = change.after.data();
    //     const index = client.initIndex(currentEnv.algoliaIndex);
    //     if (context.eventType !== 'google.firestore.document.delete') {
    //         const previewObject = {
    //             objectID: articleObject.articleId,
    //             title: articleObject.title,
    //             introduction: articleObject.introduction,
    //             body: articleObject.body,
    //             tags: articleObject.tags
    //         }
    //         return index.saveObject(previewObject);
    //     } else {
    //         return index.deleteObject(articleObject.articleId);
    //     }
    // });
  });

export const onWriteArticleDetail = functions.firestore
  .document('articleData/articles/articles/{articleId}')
  .onWrite(async (change, context) => {
    const article = change.after.data() as ArticleDetailI;
    const { articleId } = context.params;

    const trackArticleHistory = () => {
      const { version } = article;
      const historyRef = adminFS
        .collection('articleData')
        .doc('articles')
        .collection('articles')
        .doc(articleId)
        .collection('history')
        .doc(version.toString());
      return historyRef.set(article).catch(console.error);
    };

    const createArticlePreview = () => {
      const previewFromArticle = (
        articleObject: ArticleDetailI,
      ): ArticlePreviewI => {
        const {
          authorId,
          coverImageId,
          title,
          introduction,
          lastUpdated,
          timestamp,
          version,
          editors,
          commentCount,
          viewCount,
          tags,
          imageUrl,
          imageAlt,
          isFeatured,
          isFlagged,
          slug,
        } = articleObject;
        const previewImageUrl = imageUrl && imageUrl.length > 0 ? 'unset' : '';
        const maybeCoverImageId = coverImageId || false;

        const preview: ArticlePreviewI = {
          articleId,
          authorId,
          coverImageId: maybeCoverImageId,
          title,
          introduction,
          imageAlt,
          lastUpdated,
          timestamp,
          version,
          editors,
          commentCount,
          viewCount,
          tags,
          isFlagged: !!isFlagged,
          isFeatured: !!isFeatured,
          imageUrl: previewImageUrl,
          slug,
        };

        return preview;
      };

      const previewRef = adminFS.doc(
        `articleData/articles/previews/${articleId}`,
      );
      const articlePreview = previewFromArticle(article);

      return previewRef.set(articlePreview).catch(console.error);
    };

    if (context.eventType !== 'google.firestore.document.delete') {
      const setHistory = trackArticleHistory();
      const setPreview = createArticlePreview();
      return Promise.all([setHistory, setPreview]);
    }
    return null;
  });

export const onUpdateArticleDetail = functions.firestore
  .document('articleData/articles/articles/{articleId}')
  .onUpdate(async (change, _) => {
    const article = change.after.data() as ArticleDetailI;

    const trackArticleEditors = () => {
      const { lastEditorId, articleId } = article;

      const updatedAt = new Date(article.lastUpdated.toDate()).getTime();
      const ref = adminDB.ref(
        `userInfo/articlesEditedPerUser/${lastEditorId}/${articleId}/${updatedAt}`,
      );
      return ref.set(true);
    };

    try {
      await trackArticleEditors();
    } catch (error) {
      console.error("can't track editing", error);
    }
    return null;
  });
