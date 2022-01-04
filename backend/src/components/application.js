import {Component, provide} from '@layr/component';

import {User} from './user';
import {Article} from './article';
import {Comment} from './comment';

export class Application extends Component {
  @provide() static User = User;
  @provide() static Article = Article;
  @provide() static Comment = Comment;
}
