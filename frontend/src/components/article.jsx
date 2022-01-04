import {consume} from '@layr/component';
import {Routable} from '@layr/routable';
import React, {useState, useMemo, useCallback} from 'react';
import {page, view, useData, useAction, useNavigator} from '@layr/react-integration';
import marked from 'marked';
import DOMPurify from 'dompurify';

const PAGE_SIZE = 10;

export const extendArticle = (Base) => {
  class Article extends Routable(Base) {
    @consume() static Application;
    @consume() static User;

    @page('[/]articles/:slug') ItemPage() {
      return useData(
        async () => {
          await this.load({
            title: true,
            description: true,
            body: true,
            tags: true,
            slug: true,
            author: {username: true, imageURL: true},
            createdAt: true
          });
        },

        () => {
          const bodyHTML = {__html: DOMPurify.sanitize(marked(this.body))};

          return (
            <div className="article-page">
              <div className="banner">
                <div className="container">
                  <h1>{this.title}</h1>
                  <this.MetaView>
                    <this.ActionsView />
                  </this.MetaView>
                </div>
              </div>

              <div className="container page">
                <div className="row article-content">
                  <div className="col-xs-12">
                    <div dangerouslySetInnerHTML={bodyHTML} />
                    <this.TagListView />
                  </div>
                </div>

                <hr />

                <div className="article-actions" />

                <div className="row">
                  <this.CommentListView />
                </div>
              </div>
            </div>
          );
        }
      );
    }

    @view() ListItemView() {
      const {User} = this.constructor;

      const toggleFavorite = useAction(async () => {
        if (!User.authenticatedUser) {
          window.alert('To add an article to your favorites, please sign in.');
          return;
        }

        if (!this.isFavoritedByAuthenticatedUser) {
          this.getAttribute('isFavoritedByAuthenticatedUser').setValue(true, {source: 'server'}); // Optimistic update
          await User.authenticatedUser.favorite(this);
        } else {
          this.getAttribute('isFavoritedByAuthenticatedUser').setValue(false, {source: 'server'}); // Optimistic update
          await User.authenticatedUser.unfavorite(this);
        }
      });

      const favoriteButtonClass = this.isFavoritedByAuthenticatedUser
        ? 'btn btn-sm btn-primary'
        : 'btn btn-sm btn-outline-primary';

      return (
        <div className="article-preview">
          <div className="article-meta">
            <this.author.ItemPage.Link>
              <this.author.ProfileImageView />
            </this.author.ItemPage.Link>

            <div className="info">
              <this.author.ItemPage.Link className="author">
                {this.author.username}
              </this.author.ItemPage.Link>
              <span className="date">{this.createdAt.toDateString()}</span>
            </div>

            <div className="pull-xs-right">
              <button
                className={favoriteButtonClass}
                onClick={async (event) => {
                  event.currentTarget.blur();
                  await toggleFavorite();
                }}
              >
                <i className="ion-heart" /> {this.favoritesCount}
              </button>
            </div>
          </div>

          <this.ItemPage.Link className="preview-link">
            <h1>{this.title}</h1>
            <p>{this.description}</p>
            <span>Read more...</span>
            <this.TagListView />
          </this.ItemPage.Link>
        </div>
      );
    }

    @view() MetaView({children}) {
      return (
        <div className="article-meta">
          <this.author.ItemPage.Link>
            <this.author.ProfileImageView />
          </this.author.ItemPage.Link>

          <div className="info">
            <this.author.ItemPage.Link className="author">
              {this.author.username}
            </this.author.ItemPage.Link>
            <span className="date">{this.createdAt.toDateString()}</span>
          </div>

          {children}
        </div>
      );
    }

    @view() TagListView() {
      return (
        <ul className="tag-list">
          {this.tags.map((tag) => (
            <li key={tag} className="tag-default tag-pill tag-outline">
              {tag}
            </li>
          ))}
        </ul>
      );
    }

    @view() ActionsView() {
      const {Application, User} = this.constructor;

      if (this.author !== User.authenticatedUser) {
        return null;
      }

      const edit = useAction(async () => {
        this.EditPage.navigate();
      });

      const delete_ = useAction(async () => {
        await this.delete();
        Application.HomePage.navigate();
      });

      return (
        <span>
          <button className="btn btn-outline-secondary btn-sm" onClick={edit}>
            <i className="ion-edit" /> Edit article
          </button>

          <button
            className="btn btn-outline-danger btn-sm"
            onClick={delete_}
            style={{marginLeft: '.5rem'}}
          >
            <i className="ion-trash-a" /> Delete article
          </button>
        </span>
      );
    }

    @view() CommentListView() {
      const {User, Comment} = this.constructor;

      return useData(
        async () => {
          const comments = await Comment.find(
            {article: this},
            {body: true, author: {username: true, imageURL: true}, createdAt: true},
            {sort: {createdAt: 'desc'}}
          );

          const newComment =
            User.authenticatedUser && new Comment({author: User.authenticatedUser, article: this});

          return {comments, newComment};
        },

        ({comments, newComment}, refresh) => (
          <div className="col-xs-12 col-md-8 offset-md-2">
            {newComment ? (
              <div>
                <newComment.FormView
                  onSubmit={async () => {
                    await newComment.save();
                    refresh();
                  }}
                />
              </div>
            ) : (
              <p>
                <User.SignInPage.Link>Sign in</User.SignInPage.Link>
                &nbsp;or&nbsp;
                <User.SignUpPage.Link>Sign up</User.SignUpPage.Link>
                &nbsp;to add comments on this article.
              </p>
            )}

            <div>
              {comments.map((comment) => {
                return (
                  <comment.ItemView
                    key={comment.id}
                    onDelete={async () => {
                      await comment.delete();
                      refresh();
                    }}
                  />
                );
              })}
            </div>
          </div>
        )
      );
    }

    @page('[/]articles/add') static AddPage() {
      const {User} = this;

      return User.ensureAuthenticatedUser((authenticatedUser) => {
        const article = useMemo(() => new this({author: authenticatedUser}));

        const save = useAction(async () => {
          await article.save();
          article.ItemPage.navigate();
        }, [article]);

        return <article.FormView onSubmit={save} />;
      });
    }

    @page('[/]articles/:slug/edit') EditPage() {
      return useData(
        async () => {
          await this.load({title: true, description: true, body: true, tags: true});
        },

        () => <this.EditView />
      );
    }

    @view() EditView() {
      const fork = useMemo(() => this.fork(), []);

      const save = useAction(async () => {
        await fork.save();
        this.merge(fork);
        this.ItemPage.navigate();
      }, [fork]);

      return <fork.FormView onSubmit={save} />;
    }

    @view() FormView({onSubmit}) {
      const [tag, setTag] = useState('');

      const addTag = useCallback(() => {
        const trimmedTag = tag.trim();
        if (trimmedTag !== '') {
          if (!this.tags.includes(trimmedTag)) {
            this.tags = [...this.tags, trimmedTag];
          }
          setTag('');
        }
      });

      const removeTag = useCallback((tagToRemove) => {
        this.tags = this.tags.filter((tag) => tag !== tagToRemove);
      });

      const handleTagKeyDown = useCallback((event) => {
        const TAB = 9;
        const ENTER = 13;
        const COMMA = 188;

        const {keyCode} = event;

        if (keyCode === TAB || keyCode === ENTER || keyCode === COMMA) {
          if (keyCode !== TAB) {
            event.preventDefault();
          }
          addTag();
        }
      });

      return (
        <div className="editor-page">
          <div className="container page">
            <div className="row">
              <div className="col-md-10 offset-md-1 col-xs-12">
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
                        className="form-control form-control-lg"
                        type="text"
                        placeholder="Article title"
                        value={this.title}
                        onChange={(event) => {
                          this.title = event.target.value;
                        }}
                        required
                      />
                    </fieldset>

                    <fieldset className="form-group">
                      <input
                        className="form-control"
                        type="text"
                        placeholder="What's this article about?"
                        value={this.description}
                        onChange={(event) => {
                          this.description = event.target.value;
                        }}
                        required
                      />
                    </fieldset>

                    <fieldset className="form-group">
                      <textarea
                        className="form-control"
                        rows="8"
                        placeholder="Write your article (in markdown)"
                        value={this.body}
                        onChange={(event) => {
                          this.body = event.target.value;
                        }}
                        required
                      />
                    </fieldset>

                    <fieldset className="form-group">
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Enter tags"
                        value={tag}
                        onChange={({target: {value}}) => {
                          if (
                            value === '' ||
                            this.getAttribute('tags').getValueType().isValidValue([value])
                          ) {
                            setTag(value);
                          }
                        }}
                        onBlur={addTag}
                        onKeyDown={handleTagKeyDown}
                      />

                      <div className="tag-list">
                        {this.tags.map((tag) => {
                          return (
                            <span className="tag-default tag-pill" key={tag}>
                              <i className="ion-close-round" onClick={() => removeTag(tag)} />
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </fieldset>

                    <button className="btn btn-lg pull-xs-right btn-primary" type="submit">
                      Publish article
                    </button>
                  </fieldset>
                </form>
              </div>
            </div>
          </div>
        </div>
      );
    }

    @view() static ListView({query, currentPage, onPageChange}) {
      return useData(
        async () => {
          const [articles, totalNumberOfArticles] = await Promise.all([
            this.find(
              query,
              {
                title: true,
                description: true,
                tags: true,
                slug: true,
                author: {username: true, imageURL: true},
                createdAt: true,
                favoritesCount: true,
                isFavoritedByAuthenticatedUser: true
              },
              {
                sort: {createdAt: 'desc'},
                skip: (currentPage - 1) * PAGE_SIZE,
                limit: PAGE_SIZE
              }
            ),
            this.count(query)
          ]);

          return {articles, totalNumberOfArticles};
        },

        ({articles, totalNumberOfArticles}) => {
          if (articles.length === 0) {
            return <div className="article-preview">No articles are here... yet.</div>;
          }

          const numberOfPages = Math.floor((totalNumberOfArticles - 1) / PAGE_SIZE) + 1;

          return (
            <div>
              {articles.map((article) => {
                return <article.ListItemView key={article.slug} />;
              })}

              <this.PaginationView {...{currentPage, numberOfPages, onPageChange}} />
            </div>
          );
        },

        [JSON.stringify(query), currentPage]
      );
    }

    @view() static PaginationView({currentPage, numberOfPages, onPageChange}) {
      const navigator = useNavigator();

      if (numberOfPages < 2) {
        return null;
      }

      const pages = [];

      for (let page = 1; page <= numberOfPages; page++) {
        pages.push(page);
      }

      return (
        <nav>
          <ul className="pagination">
            {pages.map((page) => {
              const isCurrentPage = page === currentPage;

              return (
                <li
                  key={page}
                  className={isCurrentPage ? 'page-item active' : 'page-item'}
                  onClick={(event) => {
                    event.preventDefault();

                    if (!isCurrentPage) {
                      onPageChange(page);
                    }
                  }}
                >
                  <a className="page-link" href="">
                    {page}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      );
    }

    @view() static PopularTagsView() {
      const {Application} = this;

      return useData(
        async () => await this.findPopularTags(),

        (tags) => (
          <div className="tag-list">
            {tags.map((tag) => {
              return (
                <Application.HomePage.Link
                  key={tag}
                  params={{tag}}
                  className="tag-default tag-pill"
                >
                  {tag}
                </Application.HomePage.Link>
              );
            })}
          </div>
        )
      );
    }
  }

  return Article;
};
