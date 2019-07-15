import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { API } from '../utils/url';
import { settings } from '../../../settings';

const api = new API();

function addUser(user, accessToken) {
	const data = {
		user: [{
			rc_username: user.username,
			role: 'Author', // User can add itself only as Author, even if he/she is admin in RC
			rc_uid: user._id,
			rc_token: accessToken,
		}],
	};
	return HTTP.call('POST', api.createAccount(), { data, headers: { 'Content-Type': 'application/json' } });
}

function userExist(user, accessToken) {
	const data = {
		user: [{
			rc_uid: user._id,
			rc_token: accessToken,
		}],
	};
	const response = HTTP.call('GET', api.userExist(), { data, headers: { 'Content-Type': 'application/json' } });
	return response.data && response.data.users[0] && response.data.users[0].exist;
}

function inviteSetting() {
	const response = HTTP.call('GET', api.invite());
	const { settings } = response.data;

	if (settings && settings[0] && settings[0].key === 'invite_only') {
		return settings[0].value;
	}
	// default value in Ghost
	return false;
}

function redirectGhost() {
	return {
		link: api.siteUrl(),
		message: 'Ghost is Set up. Redirecting.',
	};
}

Meteor.methods({
	redirectUserToArticles(accessToken) {
		const enabled = settings.get('Articles_enabled');

		if (!enabled) {
			throw new Meteor.Error('Articles are disabled');
		}
		const user = Meteor.users.findOne(Meteor.userId());
		let errMsg = 'Ghost is not set up. Setup can be done from Admin Panel';

		try {
			const response = HTTP.call('GET', api.setup());

			if (response.data.setup[0].status) { // Ghost site is already setup
				// user exist in ghost
				if (userExist(user, accessToken)) {
					return redirectGhost();
				}

				const inviteOnly = inviteSetting();

				// create user account in ghost
				if (!inviteOnly && addUser(user, accessToken).statusCode === 200) {
					return redirectGhost();
				}

				errMsg = inviteOnly ? 'You are not a member of Ghost. Ask admin to add' : 'Unable to setup your account';
			}

			// Cannot setup Ghost from sidenav
			throw new Meteor.Error(errMsg);
		} catch (e) {
			throw new Meteor.Error(e.error || 'Unable to connect to Ghost.');
		}
	},
});
