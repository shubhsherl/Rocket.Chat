import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { CachedCollection } from '../../../ui-cached-collection';

export const Users = {
	findOneById(userId, options = {}) {
		const query = {
			_id: userId,
		};

		return this.findOne(query, options);
	},

	isUserInRole(userId, roleName) {
		const user = this.findOneById(userId, { fields: { roles: 1 } });
		return user && Array.isArray(user.roles) && user.roles.includes(roleName);
	},

	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	},
};

// overwrite Meteor.users collection so records on it don't get erased whenever the client reconnects to websocket
Meteor.users = new Mongo.Collection(null);
Meteor.user = () => Meteor.users.findOne({ _id: Meteor.userId() });

// logged user data will come to this collection
const CachedOwnUser = new CachedCollection({ name: 'ownUser' });
const OwnUser = CachedOwnUser.collection;

// register an observer to logged user's collection and populate "original" Meteor.users with it
OwnUser.find().observe({
	added: (record) => Meteor.users.upsert({ _id: record._id }, record),
	changed: (record) => Meteor.users.update({ _id: record._id }, record),
	removed: (_id) => Meteor.users.remove({ _id }),
});
