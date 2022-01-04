import {expose} from '@layr/component';
import {attribute, finder} from '@layr/storable';
import {role} from '@layr/with-roles';

export const WithAuthor = (Base) => {
  class WithAuthor extends Base {
    @expose({get: true, set: 'author'}) @attribute('User') author;

    @expose({get: 'user'})
    @finder(async function () {
      const user = await this.constructor.User.getAuthenticatedUser();

      await user.load({followedUsers: {}});

      return {author: {$in: user.followedUsers}};
    })
    @attribute('boolean?')
    authorIsFollowedByAuthenticatedUser;

    @role('author') async authorRoleResolver() {
      if (await this.resolveRole('guest')) {
        return undefined;
      }

      if (this.isNew()) {
        return true;
      }

      await this.getGhost().load({author: {}});

      return (
        this.getGhost().author === (await this.constructor.User.getAuthenticatedUser()).getGhost()
      );
    }
  }

  return WithAuthor;
};
