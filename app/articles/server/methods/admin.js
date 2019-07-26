import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { ghostAPI } from '../utils/ghostAPI';
import { settings } from '../../../settings';

Meteor.methods({
	articlesAdminPanel(loginToken) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'articlesAdminPanel',
			});
		}

		const enabled = settings.get('Articles_Enabled');

		if (!enabled) {
			throw new Meteor.Error('error-articles-disabled', 'Articles are disabled', {
				method: 'articlesAdminPanel',
			});
		}
		let errMsg = 'Unable to connect to Ghost. Make sure Ghost is running';

		try {
			let response = ghostAPI.isSetup();

			if (response.data.setup[0].status) { // Ghost site is already setup
				return ghostAPI.redirectToGhostLink();
			}

			if (!hasPermission(Meteor.userId(), 'setup-ghost')) {
				throw new Meteor.Error('error-action-not-allowed', 'Setting up Ghost is not allowed', {
					method: 'articlesAdminPanel',
				});
			}

			// Setup Ghost Site and set title
			response = ghostAPI.setupGhost(loginToken);

			errMsg = 'Unable to setup. Make sure Ghost is running';

			if (response.statusCode === 201 && response.content) {
				return ghostAPI.redirectToGhostLink();
			}

			throw new Meteor.Error(errMsg);
		} catch (e) {
			throw new Meteor.Error(e.error || errMsg);
		}
	},
});
