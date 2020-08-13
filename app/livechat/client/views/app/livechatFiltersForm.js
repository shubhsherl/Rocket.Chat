import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { t, handleError } from '../../../../utils';
import './livechatFiltersForm.html';
import { APIClient } from '../../../../utils/client';

Template.livechatFiltersForm.helpers({
	name() {
		const filter = Template.instance().filter.get();
		return filter && filter.name;
	},
	description() {
		const filter = Template.instance().filter.get();
		return filter && filter.description;
	},
	enabled() {
		const filter = Template.instance().filter.get();
		return filter && filter.enabled;
	},
	regex() {
		const filter = Template.instance().filter.get();
		return filter && filter.regex;
	},
	slug() {
		const filter = Template.instance().filter.get();
		return filter && filter.slug;
	},
});

Template.livechatFiltersForm.events({
	'submit #filter-form'(e, instance) {
		e.preventDefault();
		const $btn = instance.$('button.save');

		const oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		const data = {
			_id: FlowRouter.getParam('_id'),
			name: instance.$('input[name=name]').val(),
			description: instance.$('input[name=description]').val(),
			enabled: instance.$('input[name=enabled]:checked').val() === '1',
			regex: instance.$('input[name=regex]').val(),
			slug: instance.$('input[name=slug]').val(),
		};

		Meteor.call('livechat:saveFilter', data, function(error/* , result*/) {
			$btn.html(oldBtnValue);
			if (error) {
				console.log(error);
				return handleError(error);
			}

			FlowRouter.go('livechat-filters');

			toastr.success(t('Saved'));
		});
	},

	'click button.back'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-filters');
	},
});

Template.livechatFiltersForm.onCreated(async function() {
	this.filter = new ReactiveVar({});
	const id = FlowRouter.getParam('_id');

	if (id) {
		const { filter } = await APIClient.v1.get(`livechat/filters/${ id }`);
		this.filter.set(filter);
	}
});
