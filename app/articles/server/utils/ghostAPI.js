import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Random } from 'meteor/random';

import { settings } from '../../../settings';

const ADMIN_API = '/ghost/api/v2/admin';

const _baseUrl = function() {
	let url = settings.get('Article_Site_Url');
	if (url) {
		url = url.replace(/\/$/, '');
	}
	return url;
};

const buildUrl = function(type, subtype = '') {
	const dir = `/${ type }/${ subtype }`;
	return _baseUrl() + ADMIN_API + dir;
};

export const ghostAPI = new class {
	authorUrl(slug) {
		return `${ _baseUrl() }/author/${ slug }`;
	}

	isSetup() {
		return HTTP.call('GET', buildUrl('authentication', 'setup'));
	}

	redirectToPublicLink(slug) {
		return {
			link: this.authorUrl(slug),
		};
	}

	redirectToGhostLink() {
		return { link: `${ _baseUrl() }/ghost` };
	}

	setupGhost(loginToken) {
		const rcUrl = Meteor.absoluteUrl().replace(/\/$/, '');
		const blogTitle = settings.get('Article_Site_Title');
		const announceToken = Random.secret(30);
		const settingsToken = Random.secret(30);
		settings.updateById('Announcement_Token', announceToken);
		settings.updateById('Settings_Token', settingsToken);
		const data = {
			setup: [{
				rc_url: rcUrl,
				rc_id: Meteor.userId(),
				rc_token: loginToken,
				announce_token: announceToken,
				settings_token: settingsToken,
				blogTitle,
			}],
		};
		return HTTP.call('POST', buildUrl('authentication', 'setup'), { data, headers: { 'Content-Type': 'application/json' } });
	}

	createUserAccount(loginToken) {
		const { username } = Meteor.user();
		const data = {
			user: [{
				rc_username: username,
				role: 'Author', // User can add itself only as Author, even if he/she is admin in RC
				rc_uid: Meteor.userId(),
				rc_token: loginToken,
			}],
		};
		return HTTP.call('POST', buildUrl('authentication', 'adduser'), { data, headers: { 'Content-Type': 'application/json' } });
	}

	userExistInGhost(_id) {
		const data = {
			user: [{
				rc_uid: _id,
			}],
		};
		const response = HTTP.call('GET', buildUrl('userexist'), { data, headers: { 'Content-Type': 'application/json' } });
		return response.data;
	}

	inviteSettingInGhost() {
		const response = HTTP.call('GET', buildUrl('invitesetting'));
		const { settings } = response.data;

		if (settings && settings[0] && settings[0].key === 'invite_only') {
			return settings[0].value;
		}
		// default value in Ghost
		return false;
	}

	executeTriggerUrl(data, tries = 0) {
		if (!settings.get('Articles_Enabled')) {
			return;
		}

		const retryCount = 5;

		const opts = {
			params: {},
			method: 'POST',
			url: buildUrl('rhooks', settings.get('Settings_Token')),
			data,
			auth: undefined,
			npmRequestOptions: {
				rejectUnauthorized: !settings.get('Allow_Invalid_SelfSigned_Certs'),
				strictSSL: !settings.get('Allow_Invalid_SelfSigned_Certs'),
			},
			headers: {
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36',
			},
		};

		if (!opts.url || !opts.method) {
			return;
		}

		HTTP.call(opts.method, opts.url, opts, (error, result) => {
			// if the result contained nothing or wasn't a successful statusCode
			if (!result) {
				if (tries < retryCount) {
					// 2 seconds, 4 seconds, 8 seconds
					const waitTime = Math.pow(2, tries + 1) * 1000;

					Meteor.setTimeout(() => {
						this.executeTriggerUrl(data, tries + 1);
					}, waitTime);
				}
			}
		});
	}

	deleteSesseion(cookie) {
		const rcUrl = Meteor.absoluteUrl().replace(/\/$/, '');
		HTTP.call('DELETE', buildUrl('session'), { headers: { cookie, referer: rcUrl } });
	}
}();
