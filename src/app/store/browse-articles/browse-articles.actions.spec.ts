import * as fromBrowseArticles from './browse-articles.actions';

describe('loadBrowseArticless', () => {
  it('should return an action', () => {
    expect(fromBrowseArticles.loadAllArticlePreviews().type).toBe(
      '[BrowseArticles] Load BrowseArticless',
    );
  });
});
