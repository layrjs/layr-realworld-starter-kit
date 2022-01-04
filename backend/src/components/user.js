import {expose, validators} from '@layr/component';
import {secondaryIdentifier, attribute, method, loader} from '@layr/storable';
import {role} from '@layr/with-roles';
import {throwError} from '@layr/utilities';
import bcrypt from 'bcryptjs';

import {Entity} from './entity';
import {generateJWT, verifyJWT} from '../jwt';

const {notEmpty, maxLength, rangeLength, match} = validators;

const TOKEN_DURATION = 31536000000; // 1 year
const USERNAME_PATTERN = '[a-zA-Z0-9]+';
const BCRYPT_SALT_ROUNDS = 5;

@expose({get: {call: true}, prototype: {load: {call: true}, save: {call: 'self'}}})
export class User extends Entity {
  @expose({get: 'self', set: ['creator', 'self']})
  @secondaryIdentifier('string', {
    validators: [rangeLength([3, 100])],

    async beforeSave() {
      const User = this.constructor.fork().detach();

      const existingUser = await User.get({email: this.email}, {}, {throwIfMissing: false});

      if (existingUser !== undefined && existingUser.id !== this.id) {
        throwError('Email already registered', {
          displayMessage: 'This email address is already registered.'
        });
      }
    }
  })
  email = '';

  @expose({get: true, set: ['creator', 'self']})
  @secondaryIdentifier('string', {
    validators: [notEmpty(), maxLength(50), match(new RegExp(`^${USERNAME_PATTERN}$`))],

    async beforeSave() {
      const User = this.constructor.fork().detach();

      const existingUser = await User.get({username: this.username}, {}, {throwIfMissing: false});

      if (existingUser !== undefined && existingUser.id !== this.id) {
        throwError('Username already taken', {displayMessage: 'This username is already taken.'});
      }
    }
  })
  username = '';

  @expose({set: ['creator', 'self']})
  @attribute('string', {
    validators: [notEmpty(), maxLength(100)],

    async beforeSave() {
      this.password = await this.constructor.hashPassword(this.password);
    }
  })
  password = '';

  @expose({get: true, set: 'self'})
  @attribute('string', {validators: [maxLength(200)]})
  bio = '';

  @expose({get: true, set: 'self'})
  @attribute('string', {validators: [maxLength(200)]})
  imageURL = '';

  @attribute('Article[]') favoritedArticles = [];

  @attribute('User[]') followedUsers = [];

  @expose({get: true})
  @loader(async function () {
    const user = await this.constructor.getAuthenticatedUser();

    return user && (await this.isFollowedBy(user));
  })
  @attribute('boolean?')
  isFollowedByAuthenticatedUser;

  @expose({get: true, set: true}) @attribute('string?') static token;

  @role('creator') async creatorRoleResolver() {
    return this.isNew();
  }

  @role('self') async selfRoleResolver() {
    if ((await this.resolveRole('creator')) || (await this.resolveRole('guest'))) {
      return undefined;
    }

    return this === (await this.constructor.getAuthenticatedUser());
  }

  @expose({call: true}) @method() static async getAuthenticatedUser(attributeSelector = {}) {
    if (this.token === undefined) {
      return;
    }

    const userId = this.verifyToken(this.token);

    if (userId === undefined) {
      // The token is invalid or expired
      this.token = undefined;
      return;
    }

    const user = await this.User.get(userId, attributeSelector, {throwIfMissing: false});

    if (user === undefined) {
      // The user doesn't exist anymore
      this.token = undefined;
      return;
    }

    return user;
  }

  static verifyToken(token) {
    const payload = verifyJWT(token);
    const userId = payload?.sub;

    return userId;
  }

  static generateToken(userId, {expiresIn = TOKEN_DURATION} = {}) {
    const token = generateJWT({
      sub: userId,
      exp: Math.round((Date.now() + expiresIn) / 1000)
    });

    return token;
  }

  @expose({call: 'creator'}) @method() async signUp() {
    await this.save();

    this.constructor.token = this.constructor.generateToken(this.id);
  }

  @expose({call: 'creator'}) @method() async signIn() {
    this.validate({email: true, password: true});

    const existingUser = await this.constructor
      .fork()
      .detach()
      .get({email: this.email}, {password: true}, {throwIfMissing: false});

    if (existingUser === undefined) {
      throwError('User not found', {
        displayMessage: 'There is no user registered with that email address.'
      });
    }

    if (!(await this.verifyPassword(existingUser))) {
      throwError('Wrong password', {displayMessage: 'The password you entered is incorrect.'});
    }

    this.constructor.token = this.constructor.generateToken(existingUser.id);
  }

  static async hashPassword(password) {
    return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  async verifyPassword(existingUser) {
    return await bcrypt.compare(this.password, existingUser.password);
  }

  @expose({call: 'self'}) @method() async favorite(article) {
    await this.load({favoritedArticles: {}});

    if (this.favoritedArticles.includes(article)) {
      return;
    }

    try {
      this.favoritedArticles = [...this.favoritedArticles, article];
      await this.save();

      await article.load({favoritesCount: true});
      article.favoritesCount++;
      await article.save();

      article.getAttribute('isFavoritedByAuthenticatedUser').setValue(true, {source: 'store'});
    } catch (error) {
      // Cancel frontend optimistic update
      article.getAttribute('isFavoritedByAuthenticatedUser').setValue(false, {source: 'store'});
      throw error;
    }
  }

  @expose({call: 'self'}) @method() async unfavorite(article) {
    await this.load({favoritedArticles: {}});

    if (!this.favoritedArticles.includes(article)) {
      return;
    }

    try {
      this.favoritedArticles = this.favoritedArticles.filter(
        (favoritedArticle) => favoritedArticle !== article
      );
      await this.save();

      await article.load({favoritesCount: true});
      article.favoritesCount--;
      await article.save();

      article.getAttribute('isFavoritedByAuthenticatedUser').setValue(false, {source: 'store'});
    } catch (error) {
      // Cancel frontend optimistic update
      article.getAttribute('isFavoritedByAuthenticatedUser').setValue(true, {source: 'store'});
      throw error;
    }
  }

  @expose({call: 'self'}) @method() async follow(user) {
    await this.load({followedUsers: {}});

    if (this.followedUsers.includes(user)) {
      return;
    }

    this.followedUsers = [...this.followedUsers, user];
    await this.save();

    user.getAttribute('isFollowedByAuthenticatedUser').setValue(true, {source: 'store'});
  }

  @expose({call: 'self'}) @method() async unfollow(user) {
    await this.load({followedUsers: {}});

    if (!this.followedUsers.includes(user)) {
      return;
    }

    this.followedUsers = this.followedUsers.filter((followedUser) => followedUser !== user);
    await this.save();

    user.getAttribute('isFollowedByAuthenticatedUser').setValue(false, {source: 'store'});
  }

  async isFollowedBy(user) {
    await user.load({followedUsers: {}});

    return user.followedUsers.includes(this);
  }
}
