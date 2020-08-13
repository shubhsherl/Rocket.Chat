import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { modal } from '../../../../ui-utils';
import { t, handleError } from '../../../../utils';
import './livechatFilters.html';
import { APIClient } from '../../../../utils/client';

const loadFilters = async (instance) => {
	const { filters } = await APIClient.v1.get('livechat/filters');
	instance.filters.set(filters);
};

Template.livechatFilters.helpers({
	filters() {
		return Template.instance().filters.get();
	},
});

Template.livechatFilters.events({
	'click .remove-filter'(e, instance) {
		e.preventDefault();
		e.stopPropagation();

		modal.open({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false,
		}, () => {
			Meteor.call('livechat:removeFilter', this._id, async function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
				await loadFilters(instance);
				modal.open({
					title: t('Removed'),
					text: t('Filter_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},

	'click .filter-info'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-filter-edit', { _id: this._id });
	},
});

Template.livechatFilters.onCreated(async function() {
	this.filters = new ReactiveVar([]);
	await loadFilters(this);
});
