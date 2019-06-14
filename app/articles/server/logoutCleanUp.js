import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { settings } from '../../settings';
import { API } from './utils/url';

const api = new API();

export function ghostCleanUp(cookie) {
	const rcUrl = Meteor.absoluteUrl().replace(/\/$/, '');

	if (settings.get('Articles_enabled')) {
		HTTP.call('DELETE', api.session(), { headers: { cookie, referer: rcUrl } });
	}
}
