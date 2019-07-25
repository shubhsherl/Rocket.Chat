import { Meteor } from 'meteor/meteor';

import { ghostAPI } from '../utils/ghostAPI';
import { settings } from '../../../settings';

Meteor.methods({
	redirectUserToArticles(loginToken) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'redirectUserToArticles',
			});
		}

		const enabled = settings.get('Articles_Enabled');

		if (!enabled) {
			throw new Meteor.Error('error-articles-disabled', 'Articles are disabled', {
				method: 'redirectUserToArticles',
			});
		}

		let errMsg = 'Ghost is not set up. Setup can be done from Admin Panel';

		try {
			const response = ghostAPI.isSetup();

			if (response.data.setup[0].status) { // Ghost site is already setup
				const u = ghostAPI.userExistInGhost(Meteor.userId()).users[0];

				if (u.exist && u.status === 'active') {
					return ghostAPI.redirectToGhostLink;
				}

				if (u.exist) { // user exist but suspended
					throw new Meteor.Error('error-articles-user-suspended', 'You are suspended from Ghost', {
						method: 'redirectUserToArticles',
					});
				}

				const inviteOnly = ghostAPI.inviteSettingInGhost();

				// create user account in ghost
				if (!inviteOnly && ghostAPI.createUserAccount(loginToken).statusCode === 200) {
					return ghostAPI.redirectToGhostLink;
				}

				errMsg = inviteOnly ? 'You are not a member of Ghost. Ask admin to add' : 'Unable to setup your account';
			}

			// Cannot setup Ghost from sidenav
			throw new Meteor.Error(errMsg);
		} catch (e) {
			throw new Meteor.Error(e.error || 'Unable to connect to Ghost.');
		}
	},

	redirectToUsersArticles(_id) {
		const enabled = settings.get('Articles_Enabled');

		if (!enabled) {
			throw new Meteor.Error('error-articles-disabled', 'Articles are disabled', {
				method: 'redirectToUsersArticles',
			});
		}
		const errMsg = 'User is not a member of Ghost';

		try {
			const response = ghostAPI.userExistInGhost(_id).users[0];

			if (response.exist) {
				return ghostAPI.redirectToPublicLink(response.slug);
			}

			throw new Meteor.Error(errMsg);
		} catch (e) {
			throw new Meteor.Error(e.error || errMsg);
		}
	},
});
