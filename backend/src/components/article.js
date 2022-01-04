import {consume, expose, validators} from '@layr/component';
import {secondaryIdentifier, attribute, method, loader, finder, index} from '@layr/storable';
import slugify from 'slugify';

import {Entity} from './entity';
import {WithAuthor} from './with-author';

const {notEmpty, maxLength, rangeLength, match} = validators;

@expose({
  get: {call: true},
  find: {call: true},
  count: {call: true},
  prototype: {
    load: {call: true},
    save: {call: 'author'},
    delete: {call: 'author'}
  }
})
@index({tags: 'asc', createdAt: 'desc'})
@index({author: 'asc', createdAt: 'desc'})
export class Article extends WithAuthor(Entity) {
  @consume() static User;
  @consume() static Comment;

  @expose({get: true, set: 'author'})
  @attribute('string', {validators: [notEmpty(), maxLength(200)]})
  title = '';

  @expose({get: true})
  @secondaryIdentifier('string', {validators: [rangeLength([8, 300])]})
  slug = this.generateSlug();

  @expose({get: true, set: 'author'})
  @attribute('string', {validators: [rangeLength([1, 500])]})
  description = '';

  @expose({get: true, set: 'author'})
  @attribute('string', {validators: [rangeLength([1, 50000])]})
  body = '';

  @expose({get: true, set: 'author'})
  @index()
  @attribute('string[]', {
    validators: [rangeLength([0, 10])],
    items: {validators: [rangeLength([1, 20]), match(/^[a-z0-9-]+$/)]}
  })
  tags = [];

  @expose({get: true}) @attribute('number') favoritesCount = 0;

  @expose({get: true})
  @loader(async function () {
    const user = await this.constructor.User.getAuthenticatedUser();

    return user && (await this.isFavoritedBy(user));
  })
  @attribute('boolean?')
  isFavoritedByAuthenticatedUser;

  @finder(async function (user) {
    await user.load({favoritedArticles: {}});

    return {$in: user.favoritedArticles};
  })
  @method()
  async isFavoritedBy(user) {
    await user.load({favoritedArticles: {}});

    return user.favoritedArticles.includes(this);
  }

  generateSlug() {
    this.validate({title: true});

    return (
      slugify(this.title, {remove: /[^\w\s-]/g}) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }

  async beforeDelete() {
    const {User, Comment} = this.constructor;

    // Remove references in users' favorited articles

    const users = await User.find({favoritedArticles: this}, {favoritedArticles: {}});

    await Promise.all(
      users.map((user) => {
        user.favoritedArticles = user.favoritedArticles.filter((article) => article !== this);

        return user.save();
      })
    );

    // Remove related comments

    const comments = await Comment.find({article: this}, {});

    await Promise.all(comments.map((comment) => comment.delete()));
  }

  @expose({call: true}) @method() static async findPopularTags() {
    // TODO: Don't use store's internals
    const store = this.getStore();
    const collection = await store._getCollection('Article');
    const popularTags = await collection.distinct('tags');

    // Strangely, `collection.distinct()` returns an `undefined` entry in case there
    // is an empty array of tags and the tags field is indexed
    const popularTagsWithoutUndefined = popularTags.filter((tag) => tag !== undefined);

    return popularTagsWithoutUndefined;
  }
}
