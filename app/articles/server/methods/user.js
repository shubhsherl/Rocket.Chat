import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings';

Meteor.methods({
	redirectUserToArticles() {
		const enabled = settings.get('Articles_enabled');

		if (!enabled) {
			throw new Meteor.Error('Articles are disabled');
		}

		return {
			message: 'Redirecting to articles admin panel',
		};
	},
});
