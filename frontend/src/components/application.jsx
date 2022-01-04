import {provide} from '@layr/component';
import {Routable} from '@layr/routable';
import React from 'react';
import {layout, page, view, Customizer} from '@layr/react-integration';
import classNames from 'classnames';

import {extendUser} from './user';
import {extendArticle} from './article';
import {extendComment} from './comment';
import {ErrorMessage, LoadingSpinner} from '../ui';

export const extendApplication = (Base) => {
  class Application extends Routable(Base) {
    @provide() static User = extendUser(Base.User);
    @provide() static Article = extendArticle(Base.Article);
    @provide() static Comment = extendComment(Base.Comment);

    @layout('/') static MainLayout({children}) {
      return (
        <Customizer
          dataPlaceholder={() => <LoadingSpinner />}
          errorRenderer={(error) => <ErrorMessage>{error}</ErrorMessage>}
        >
          <this.HeaderView />
          {children()}
        </Customizer>
      );
    }

    @page('[/]', {params: {feed: 'string?', tag: 'string?', page: 'number?'}}) static HomePage({
      feed,
      tag,
      page = 1
    }) {
      const {User, Article} = this;

      let query;

      if (tag !== undefined) {
        query = {tags: tag};
      } else {
        feed ??= User.authenticatedUser !== undefined ? 'user' : 'global';

        if (feed === 'user') {
          query = {authorIsFollowedByAuthenticatedUser: true};
        } else {
          query = {};
        }
      }

      return (
        <div className="home-page">
          {!User.authenticatedUser && <this.BannerView />}

          <div className="container page">
            <div className="row">
              <div className="col-md-9">
                <this.TabsView feed={feed} tag={tag} />
                <Article.ListView
                  query={query}
                  currentPage={page}
                  onPageChange={(page) => {
                    this.HomePage.navigate({feed, tag, page});
                  }}
                />
              </div>

              <div className="col-md-3">
                <div className="sidebar">
                  <p>Popular tags</p>
                  <Article.PopularTagsView />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    @view() static BannerView() {
      return (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">{process.env.APPLICATION_NAME.toLowerCase()}</h1>
            <p>{process.env.APPLICATION_DESCRIPTION}</p>
          </div>
        </div>
      );
    }

    @view() static TabsView({feed, tag}) {
      const {User} = this;

      return (
        <div className="feed-toggle">
          <ul className="nav nav-pills outline-active">
            {User.authenticatedUser && (
              <li className="nav-item">
                <this.HomePage.Link
                  params={{feed: 'user'}}
                  className={classNames('nav-link', {active: feed === 'user'})}
                >
                  Your feed
                </this.HomePage.Link>
              </li>
            )}

            <li className="nav-item">
              <this.HomePage.Link
                params={{feed: 'global'}}
                className={classNames('nav-link', {active: feed === 'global'})}
              >
                Global feed
              </this.HomePage.Link>
            </li>

            {tag !== undefined && (
              <li className="nav-item">
                <this.HomePage.Link params={{tag}} className="nav-link active">
                  <i className="ion-pound" /> {tag}
                </this.HomePage.Link>
              </li>
            )}
          </ul>
        </div>
      );
    }

    @view() static HeaderView() {
      return (
        <nav className="navbar navbar-light">
          <div className="container">
            <this.HomePage.Link className="navbar-brand">
              {process.env.APPLICATION_NAME.toLowerCase()}
            </this.HomePage.Link>

            <this.MenuView />
          </div>
        </nav>
      );
    }

    @view() static MenuView() {
      const {User, Article} = this;

      const {authenticatedUser} = User;

      if (authenticatedUser !== undefined) {
        return (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <this.HomePage.Link className="nav-link">Home</this.HomePage.Link>
            </li>

            <li className="nav-item">
              <Article.AddPage.Link className="nav-link">
                <i className="ion-compose" /> New post
              </Article.AddPage.Link>
            </li>

            <li className="nav-item">
              <User.SettingsPage.Link className="nav-link">
                <i className="ion-gear-a" /> Settings
              </User.SettingsPage.Link>
            </li>

            <li className="nav-item">
              <authenticatedUser.ItemPage.Link className="nav-link">
                <authenticatedUser.ProfileImageView />
                {authenticatedUser.username}
              </authenticatedUser.ItemPage.Link>
            </li>
          </ul>
        );
      }

      return (
        <ul className="nav navbar-nav pull-xs-right">
          <li className="nav-item">
            <this.HomePage.Link className="nav-link">Home</this.HomePage.Link>
          </li>

          <li className="nav-item">
            <User.SignInPage.Link className="nav-link">Sign in</User.SignInPage.Link>
          </li>

          <li className="nav-item">
            <User.SignUpPage.Link className="nav-link">Sign up</User.SignUpPage.Link>
          </li>
        </ul>
      );
    }

    @page('[/]*') static NotFoundPage() {
      return <ErrorMessage>Sorry, there is nothing there.</ErrorMessage>;
    }
  }

  return Application;
};
