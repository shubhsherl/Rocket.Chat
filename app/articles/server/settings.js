import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(() => {
	settings.addGroup('Articles', function() {
		this.add('Articles_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enable',
			public: true,
		});

		this.add('Article_Site_Url', 'http://localhost:2368', {
			type: 'string',
			enableQuery: {
				_id: 'Articles_Enabled',
				value: true,
			},
			i18nLabel: 'Article_Site_Url',
			public: true,
		});

		this.add('Announcement_Token', 'announcement_token', {
			type: 'string',
			enableQuery: {
				_id: 'Articles_Enabled',
				value: true,
			},
			i18nLabel: 'Announcement_Token',
			public: true,
		});

		this.add('Settings_Token', 'articles_settings_token', {
			type: 'string',
			enableQuery: {
				_id: 'Articles_Enabled',
				value: true,
			},
			i18nLabel: 'Settings_Token',
			public: true,
		});

		this.add('Articles_Admin_Panel', 'articlesAdminPanel', {
			type: 'link',
			enableQuery: {
				_id: 'Articles_Enabled',
				value: true,
			},
			linkText: 'Article_Admin_Panel',
			i18nLabel: 'Article_Admin_Panel',
			i18nDescription: 'Article_Admin_Panel_Description',
		});
	});
});
