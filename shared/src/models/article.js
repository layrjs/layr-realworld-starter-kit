import {field, validators} from '@liaison/liaison';

const {notEmpty, maxLength, rangeLength} = validators;

export const Article = Base =>
  class Article extends Base {
    @field('string', {validators: [notEmpty(), maxLength(200)]}) title = '';

    @field('string', {validators: [rangeLength([1, 500])]}) description = '';

    @field('string', {validators: [rangeLength([1, 50000])]}) body = '';

    @field('string[]', {validators: [rangeLength([0, 10]), [rangeLength([1, 30])]]}) tags = [];

    @field('string', {isUnique: true, validators: [rangeLength([8, 300])]}) slug;

    @field('number') favoritesCount;

    @field('boolean?', {isVolatile: true}) isFavoritedBySessionUser;
  };
