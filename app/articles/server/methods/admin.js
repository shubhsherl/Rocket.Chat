import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { API } from '../utils/url';
import { settings } from '../../../settings';

const api = new API();

function setupGhost(user, token, rcUrl) {
	const blogTitle = settings.get('Article_Site_title');
	const data = {
		setup: [{
			rc_url: rcUrl,
			rc_id: user._id,
			rc_token: token,
			name: user.name,
			email: user.emails[0].address,
			password: 'qwe123qwe123', // TODO send random password; remove password field
			blogTitle,
		}],
	};
	return HTTP.call('POST', api.setup(), { data, headers: { 'Content-Type': 'application/json' } });
}

function createSession(options) {
	const response = HTTP.call('POST', api.session(), options);
	if (response.statusCode === 201 && response.content === 'Created' && response.headers && response.headers['set-cookie']) {
		let cookie = response.headers['set-cookie'][0].split(';');
		cookie = `${ cookie[0] };${ cookie[1] };${ cookie[2] };${ cookie[4] }`;
		return {
			link: api.siteUrl(),
			cookie,
			message: 'Ghost is Set up. Redirecting.',
		};
	}
}

Meteor.methods({
	Articles_admin_panel(token) {
		const enabled = settings.get('Articles_enabled');

		if (!enabled) {
			throw new Meteor.Error('Articles are disabled');
		}
		const user = Meteor.users.findOne(Meteor.userId());
		const rcUrl = Meteor.absoluteUrl().replace(/\/$/, '');
		const options = {
			data: {
				rc_id: user._id,
				rc_token: token,
			},
			headers: {
				'Content-Type': 'application/json',
				Referer: api.siteUrl(),
			},
		};
		try {
			let response = HTTP.call('GET', api.setup());

			if (response.data && response.data.setup && response.data.setup[0]) {
				if (response.data.setup[0].status) { // Ghost site is already setup
					return createSession(options);
				} // Setup Ghost Site and set title
				response = setupGhost(user, token, rcUrl);
				if (response.statusCode === 201 && response.content) {
					return createSession(options);
				} if (response.errors) {
					throw new Meteor.Error(response.errors.message || 'Unable to redirect. Make sure Ghost is running');
				}
			} else {
				throw new Meteor.Error('Unable to redirect. Make sure Ghost is running.');
			}
		} catch (e) {
			throw new Meteor.Error(e.error || 'Unable to connect to Ghost. Make sure Ghost is running.');
		}
	},
});

/*
 *function getVerifiedEmail(emails) {
 *    const email = emails[0].address;
 *    emails.forEach((e) => {
 *        if (e.verified) { return e.address; }
 *        return email;
 *    });
 *}
 */
