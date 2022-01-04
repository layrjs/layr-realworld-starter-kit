import {consume} from '@layr/component';
import {Routable} from '@layr/routable';
import React from 'react';
import {view} from '@layr/react-integration';

export const extendComment = (Base) => {
  class Comment extends Routable(Base) {
    @consume() static User;

    @view() ItemView({onDelete}) {
      const {User} = this.constructor;

      return (
        <div className="card">
          <div className="card-block">
            <p className="card-text">{this.body}</p>
          </div>

          <div className="card-footer">
            <this.author.ItemPage.Link className="comment-author">
              <this.author.ProfileImageView className="comment-author-img" />
            </this.author.ItemPage.Link>
            &nbsp;
            <this.author.ItemPage.Link className="comment-author">
              {this.author.username}
            </this.author.ItemPage.Link>
            <span className="date-posted">{this.createdAt.toDateString()}</span>
            {this.author === User.authenticatedUser && (
              <span className="mod-options">
                <i className="ion-trash-a" onClick={onDelete} />
              </span>
            )}
          </div>
        </div>
      );
    }

    @view() FormView({onSubmit}) {
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          autoComplete="off"
          className="card comment-form"
        >
          <div className="card-block">
            <textarea
              className="form-control"
              placeholder="Write a comment..."
              value={this.body}
              onChange={(event) => {
                this.body = event.target.value;
              }}
              rows="3"
            />
          </div>

          <div className="card-footer">
            <this.author.ProfileImageView className="comment-author-img" />
            <button type="submit" className="btn btn-sm btn-primary">
              Post comment
            </button>
          </div>
        </form>
      );
    }
  }

  return Comment;
};
