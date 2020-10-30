import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ArticleDetailI, ArticlePreviewI } from '../../shared_models/index';
const adminFS = admin.firestore();
const adminDB = admin.database();

export const onCreateArticleDetail = functions.firestore
  .document('articleData/articles/articles/{articleId}')
  .onCreate(async (snap, _) => {
    const createdArticle = snap.data();

    const trackArticleAuthorship = (article: any) => {
      const authorId = article.authorId;
      const articleId = article.articleId;
      const createdAt = new Date(article.timestamp.toDate()).getTime();
      const ref = adminDB.ref(
        `userInfo/articlesAuthoredPerUser/${authorId}/${articleId}`,
      );
      return ref.set(createdAt);
    };

    try {
      await trackArticleAuthorship(createdArticle);
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
    const writtenArticle = change.after.data();
    const { articleId } = context.params;

    const createArticlePreview = (article: any) => {
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
          slug,
        } = articleObject;
        const previewImageUrl = imageUrl && imageUrl.length > 0 ? 'unset' : '';

        const preview: ArticlePreviewI = {
          articleId,
          authorId,
          coverImageId,
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
          isFlagged: false,
          imageUrl: previewImageUrl,
          slug,
        };

        return preview;
      };

      const previewRef = adminFS.doc(
        `articleData/articles/previews/${articleId}`,
      );
      const articlePreview = previewFromArticle(article);

      return previewRef
        .set(articlePreview)
        .catch(error => console.error(error));
    };

    if (context.eventType !== 'google.firestore.document.delete') {
      return createArticlePreview(writtenArticle);
    }
  });

export const onUpdateArticleDetail = functions.firestore
  .document('articleData/articles/articles/{articleId}')
  .onUpdate(async (change, _) => {
    const updatedArticle = change.after.data() as ArticleDetailI;

    const trackArticleEditors = (article: ArticleDetailI) => {
      const editorId = article.lastEditorId;
      const articleId = article.articleId;
      const updatedAt = new Date(article.lastUpdated.toDate()).getTime();
      const ref = adminDB.ref(
        `userInfo/articlesEditedPerUser/${editorId}/${articleId}/${updatedAt}`,
      );
      return ref.set(true);
    };

    try {
      await trackArticleEditors(updatedArticle);
    } catch (error) {
      console.error("can't track editing", error);
    }
    return null;
  });
