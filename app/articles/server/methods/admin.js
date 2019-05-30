import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { settings } from '../../../settings';

const blogUrl = 'http://localhost:2368/ghost/api/v2/admin/authentication/setup/';
const sessionUrl = 'http://localhost:2368/ghost/api/v2/admin/session/';

Meteor.methods({
	Articles_admin_panel() {
		const enabled = settings.get('Articles_enabled');

		if (!enabled) {
			throw new Meteor.Error('Articles are disabled');
		}
		const user = Meteor.users.findOne(Meteor.userId());
		const options = {
			data: {
				username: user.emails[0].address,
				password: 'qwe123qwe123',
			},
			headers: {
				'Content-Type': 'application/json',
				Referer: 'http://localhost:2368/ghost/',
			},
		};
		let response = HTTP.call('GET', blogUrl);
		if (response.data && response.data.setup && response.data.setup[0]) {
			if (response.data.setup[0].status) { // Ghost site is already setup
				response = HTTP.call('POST', sessionUrl, options);
				console.log(response);
				if (response.statusCode === 201 && response.content === 'Created') {
					console.log(response);
					return {
						link: 'http://localhost:2368/ghost/',
						options,
						message: 'Ghost is Set up. Redirecting...',
					};
				}
			} else { // Setup Ghost Site and set title
				const blogTitle = settings.get('Article_Site_title');
				const data = {
					setup: [{
						name: user.name,
						email: user.emails[0].address,
						password: 'qwe123qwe123',
						blogTitle,
					}],
				};
				response = HTTP.call('POST', blogUrl, { data, headers: { 'Content-Type': 'application/json' } });
				if (response.statusCode === 201 && response.content && response.content.users[0]) {
					response = HTTP.call('POST', sessionUrl, options);
					if (response.status === 201 && response.content === 'Created') {
						return {
							link: 'http://localhost:2368/ghost/',
							options,
							message: 'Ghost is Set up. Redirecting...',
						};
					}
				} else if (response.errors) {
					throw new Meteor.Error(response.errors.message || 'Unable to redirect. Make sure Ghost is running');
				}
			}
		}
		throw new Meteor.Error('Unable to redirect. Make sure Ghost is running');
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
