import {Component, consume, expose} from '@layr/component';
import {Storable, primaryIdentifier, attribute, index} from '@layr/storable';
import {WithRoles, role} from '@layr/with-roles';

export class Entity extends WithRoles(Storable(Component)) {
  @consume() static User;

  @expose({get: true, set: true}) @primaryIdentifier() id;

  @expose({get: true}) @index() @attribute('Date') createdAt = new Date();

  @attribute('Date?') updatedAt;

  @role('user') static async userRoleResolver() {
    return (await this.User.getAuthenticatedUser()) !== undefined;
  }

  @role('guest') static async guestRoleResolver() {
    return !(await this.resolveRole('user'));
  }

  async beforeSave() {
    await super.beforeSave();

    this.updatedAt = new Date();
  }
}
