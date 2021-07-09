import * as fromArticle from './article.actions';

describe('loadArticles', () => {
  it('should return an action', () => {
    expect(fromArticle.loadArticles().type).toBe('[Article] Load Articles');
  });
});
