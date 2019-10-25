import {field, method, expose} from '@liaison/liaison';
import {Article as BaseArticle} from '@liaison/react-liaison-realworld-example-app-shared';
import slugify from 'slugify';

import {Entity} from './entity';
import {WithAuthor} from './with-author';

export class Article extends BaseArticle(WithAuthor(Entity)) {
  @expose({get: 'any', set: ['new', 'author']}) title;

  @expose({get: 'any', set: ['new', 'author']}) description;

  @expose({get: 'any', set: ['new', 'author']}) body;

  @expose({get: 'any', set: ['new', 'author']}) tags;

  @expose({get: 'any'}) slug;

  @expose({get: 'any'}) @field() favoritesCount = 0;

  @expose({get: 'any'})
  @field({
    async loader() {
      const {session} = this.$layer;
      return session.user && (await this.isFavoritedBy(session.user));
    }
  })
  isFavoritedBySessionUser;

  @expose({call: 'any'}) static $getId;

  @expose({call: 'any'}) $load;

  @method({
    async finder(user) {
      await user.$load({fields: {favoritedArticles: {}}});
      return {$identity: user.favoritedArticles};
    }
  })
  async isFavoritedBy(user) {
    await user.$load({fields: {favoritedArticles: {}}});
    return user.favoritedArticles.includes(this);
  }

  @expose({call: ['new', 'author']}) $save;

  async $beforeSave() {
    await super.$beforeSave();

    if (this.$isNew()) {
      this.generateSlug();
    }
  }

  @expose({call: 'author'}) $delete;

  async $beforeDelete() {
    const {User, Comment} = this.$layer;

    // Remove related comments
    const comments = await Comment.$find({filter: {article: this}, fields: {}});
    await Comment.$deleteMany(comments);

    // Remove references in users' favorited articles
    const users = await User.$find({
      filter: {favoritedArticles: this},
      fields: {favoritedArticles: {}}
    });
    for (const user of users) {
      user.favoritedArticles = user.favoritedArticles.filter(article => article !== this);
    }
    await User.$saveMany(users);
  }

  @expose({call: 'any'}) static $find;

  @expose({call: 'any'}) static async findPopularTags() {
    const {store} = this.$layer;

    // TODO: Don't use store's internal
    const collection = await store._getCollection('Article');
    const popularTags = await collection.distinct('tags');

    return popularTags;
  }

  generateSlug() {
    this.slug = slugify(this.title) + '-' + ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
  }
}
