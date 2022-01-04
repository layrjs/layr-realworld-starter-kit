import {consume} from '@layr/component';
import {attribute} from '@layr/storable';
import React, {useMemo} from 'react';
import {Routable} from '@layr/routable';
import {page, view, useData, useAction} from '@layr/react-integration';
import classNames from 'classnames';

const PROFILE_IMAGE_PLACEHOLDER = '//static.productionready.io/images/smiley-cyrus.jpg';

export const extendUser = (Base) => {
  class User extends Routable(Base) {
    @consume() static Application;
    @consume() static Article;

    @attribute('string?', {
      getter() {
        return window.localStorage.getItem('token') || undefined;
      },
      setter(token) {
        if (token !== undefined) {
          window.localStorage.setItem('token', token);
        } else {
          window.localStorage.removeItem('token');
        }
      }
    })
    static token;

    static async initializer() {
      this.authenticatedUser = await this.getAuthenticatedUser({
        email: true,
        username: true,
        bio: true,
        imageURL: true
      });
    }

    static ensureGuest(content) {
      const {Application} = this;

      if (this.authenticatedUser !== undefined) {
        Application.HomePage.redirect();
        return null;
      }

      return content();
    }

    static ensureAuthenticatedUser(content) {
      const {Application} = this;

      if (this.authenticatedUser === undefined) {
        Application.HomePage.redirect();
        return null;
      }

      return content(this.authenticatedUser);
    }

    @page('[/]@:username', {params: {articles: 'string?', page: 'number?'}}) ItemPage({
      articles = 'authored',
      page = 1
    }) {
      const {Article} = this.constructor;

      return useData(
        async () => {
          await this.load({
            username: true,
            bio: true,
            imageURL: true,
            isFollowedByAuthenticatedUser: true
          });
        },

        () => {
          const query = articles === 'authored' ? {author: this} : {isFavoritedBy: this};

          return (
            <div className="profile-page">
              <div className="user-info">
                <div className="container">
                  <div className="row">
                    <div className="col-xs-12 col-md-10 offset-md-1">
                      <this.ProfileImageView className="user-img" />
                      <h4>{this.username}</h4>
                      <p>{this.bio}</p>
                      <this.ActionsView />
                    </div>
                  </div>
                </div>
              </div>

              <div className="container">
                <div className="row">
                  <div className="col-xs-12 col-md-10 offset-md-1">
                    <this.TabsView articles={articles} />
                    <Article.ListView
                      query={query}
                      currentPage={page}
                      onPageChange={(page) => {
                        this.ItemPage.navigate({articles, page});
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        }
      );
    }

    @view() ActionsView() {
      if (!this.constructor.authenticatedUser) {
        return null;
      }

      if (this === this.constructor.authenticatedUser) {
        return (
          <this.constructor.SettingsPage.Link className="btn btn-sm btn-outline-secondary action-btn">
            <i className="ion-gear-a" /> Edit profile settingsPage
          </this.constructor.SettingsPage.Link>
        );
      }

      const FollowButton = () => {
        const follow = useAction(async () => {
          await this.constructor.authenticatedUser.follow(this);
        });

        return (
          <button className="btn btn-sm action-btn btn-outline-secondary" onClick={follow}>
            <i className="ion-plus-round" /> Follow {this.username}
          </button>
        );
      };

      const UnfollowButton = () => {
        const unfollow = useAction(async () => {
          await this.constructor.authenticatedUser.unfollow(this);
        });

        return (
          <button className="btn btn-sm action-btn btn-secondary" onClick={unfollow}>
            <i className="ion-plus-round" /> Unfollow {this.username}
          </button>
        );
      };

      return this.isFollowedByAuthenticatedUser ? <UnfollowButton /> : <FollowButton />;
    }

    @view() TabsView({articles}) {
      return (
        <div className="articles-toggle">
          <ul className="nav nav-pills outline-active">
            <li className="nav-item">
              <this.ItemPage.Link
                params={{articles: 'authored'}}
                className={classNames('nav-link', {active: articles === 'authored'})}
              >
                My articles
              </this.ItemPage.Link>
            </li>

            <li className="nav-item">
              <this.ItemPage.Link
                params={{articles: 'favorited'}}
                className={classNames('nav-link', {active: articles === 'favorited'})}
              >
                Favorited articles
              </this.ItemPage.Link>
            </li>
          </ul>
        </div>
      );
    }

    @view() ProfileImageView({className = 'user-pic'}) {
      return (
        <img
          src={this.imageURL || PROFILE_IMAGE_PLACEHOLDER}
          className={className}
          alt="User's profile image"
        />
      );
    }

    @page('[/]sign-up') static SignUpPage() {
      return this.ensureGuest(() => {
        const user = useMemo(() => new (this.fork())(), []);

        return <user.SignUpView />;
      });
    }

    @view() SignUpView() {
      const {Application} = this.constructor;

      const signUp = useAction(async () => {
        await this.signUp();
        Application.HomePage.reload();
      });

      return (
        <div className="auth-page">
          <div className="container page">
            <div className="row">
              <div className="col-md-6 offset-md-3 col-xs-12">
                <h1 className="text-xs-center">Sign Up</h1>

                <p className="text-xs-center">
                  <this.constructor.SignInPage.Link>
                    Have an account?
                  </this.constructor.SignInPage.Link>
                </p>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    signUp();
                  }}
                >
                  <fieldset>
                    <fieldset className="form-group">
                      <input
                        className="form-control form-control-lg"
                        type="text"
                        placeholder="Username"
                        value={this.username}
                        onChange={({target: {value}}) => {
                          if (
                            value === '' ||
                            this.getAttribute('username').getValueType().isValidValue(value)
                          ) {
                            this.username = value;
                          }
                        }}
                        required
                      />
                    </fieldset>

                    <fieldset className="form-group">
                      <input
                        className="form-control form-control-lg"
                        type="email"
                        placeholder="Email"
                        value={this.email}
                        onChange={(event) => {
                          this.email = event.target.value;
                        }}
                        required
                      />
                    </fieldset>

                    <fieldset className="form-group">
                      <input
                        className="form-control form-control-lg"
                        type="password"
                        placeholder="Password"
                        value={this.password}
                        onChange={(event) => {
                          this.password = event.target.value;
                        }}
                        autoComplete="new-password"
                        required
                      />
                    </fieldset>

                    <button className="btn btn-lg btn-primary pull-xs-right" type="submit">
                      Sign up
                    </button>
                  </fieldset>
                </form>
              </div>
            </div>
          </div>
        </div>
      );
    }

    @page('[/]sign-in') static SignInPage() {
      return this.ensureGuest(() => {
        const user = useMemo(() => new (this.fork())(), []);

        return <user.SignInView />;
      });
    }

    @view() SignInView() {
      const {Application} = this.constructor;

      const signIn = useAction(async () => {
        await this.signIn();
        Application.HomePage.reload();
      });

      return (
        <div className="auth-page">
          <div className="container page">
            <div className="row">
              <div className="col-md-6 offset-md-3 col-xs-12">
                <h1 className="text-xs-center">Sign In</h1>

                <p className="text-xs-center">
                  <this.constructor.SignUpPage.Link>
                    Need an account?
                  </this.constructor.SignUpPage.Link>
                </p>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    signIn();
                  }}
                >
                  <fieldset>
                    <fieldset className="form-group">
                      <input
                        className="form-control form-control-lg"
                        type="email"
                        placeholder="Email"
                        value={this.email}
                        onChange={(event) => {
                          this.email = event.target.value;
                        }}
                        required
                      />
                    </fieldset>

                    <fieldset className="form-group">
                      <input
                        className="form-control form-control-lg"
                        type="password"
                        placeholder="Password"
                        value={this.password}
                        onChange={(event) => {
                          this.password = event.target.value;
                        }}
                        required
                      />
                    </fieldset>

                    <button className="btn btn-lg btn-primary pull-xs-right" type="submit">
                      Sign in
                    </button>
                  </fieldset>
                </form>
              </div>
            </div>
          </div>
        </div>
      );
    }

    static signOut() {
      const {Application} = this;

      this.token = undefined;
      Application.HomePage.reload();
    }

    @page('[/]settings') static SettingsPage() {
      const {Application} = this;

      if (!this.authenticatedUser) {
        Application.HomePage.redirect();
        return null;
      }

      const fork = useMemo(() => this.authenticatedUser.fork(), []);

      const update = useAction(async () => {
        await fork.save();
        fork.getAttribute('password').unsetValue();
        this.authenticatedUser.merge(fork);
        Application.HomePage.navigate();
      }, [fork]);

      return (
        <div className="settings-page">
          <div className="container page">
            <div className="row">
              <div className="col-md-6 offset-md-3 col-xs-12">
                <h1 className="text-xs-center">Your Settings</h1>

                <fork.SettingsFormView onSubmit={update} />

                <hr />

                <button
                  className="btn btn-outline-danger"
                  onClick={() => {
                    this.signOut();
                  }}
                >
                  Or click here to logout.
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    @view() SettingsFormView({onSubmit}) {
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          autoComplete="off"
        >
          <fieldset>
            <fieldset className="form-group">
              <input
                className="form-control"
                type="url"
                placeholder="URL of profile picture"
                value={this.imageURL}
                onChange={(event) => {
                  this.imageURL = event.target.value;
                }}
              />
            </fieldset>

            <fieldset className="form-group">
              <input
                className="form-control form-control-lg"
                type="text"
                placeholder="Username"
                value={this.username}
                onChange={({target: {value}}) => {
                  if (
                    value === '' ||
                    this.getAttribute('username').getValueType().isValidValue(value)
                  ) {
                    this.username = value;
                  }
                }}
                required
              />
            </fieldset>

            <fieldset className="form-group">
              <textarea
                className="form-control form-control-lg"
                rows="8"
                placeholder="Short bio about you"
                value={this.bio}
                onChange={(event) => {
                  this.bio = event.target.value;
                }}
              ></textarea>
            </fieldset>

            <fieldset className="form-group">
              <input
                className="form-control form-control-lg"
                type="email"
                placeholder="Email"
                value={this.email}
                onChange={(event) => {
                  this.email = event.target.value;
                }}
                autoComplete="off"
                required
              />
            </fieldset>

            <fieldset className="form-group">
              <input
                className="form-control form-control-lg"
                type="password"
                placeholder="New password"
                value={this.getAttribute('password').getValue({throwIfUnset: false}) || ''}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value) {
                    this.password = value;
                  } else {
                    this.getAttribute('password').unsetValue();
                  }
                }}
                autoComplete="new-password"
              />
            </fieldset>

            <button className="btn btn-lg btn-primary pull-xs-right" type="submit">
              Update settings
            </button>
          </fieldset>
        </form>
      );
    }
  }

  return User;
};
