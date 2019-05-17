import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

const defaults = {
	enable: true,
};

Meteor.startup(() => {
	settings.addGroup('Articles', function() {
		this.add('Articles_enabled', defaults.enable, {
			type: 'boolean',
			i18nLabel: 'Enable',
		});

		this.add('Articles_admin_panel', 'Articles_admin_panel', {
			type: 'action',
			actionText: 'Article_Admin_Panel',
		});
	});
});
