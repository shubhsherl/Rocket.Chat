import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import './livechatFilterAction.html';

Template.livechatFilterAction.helpers({
	hiddenValue(current) {
		if (this.name === undefined && Template.instance().firstAction) {
			Template.instance().firstAction = false;
			return '';
		} if (this.name !== current) {
			return 'hidden';
		}
	},
	showCustomName() {
		return Template.instance().sender.get() === 'custom' ? '' : 'hidden';
	},
	senderSelected(current) {
		return !!(this.params && this.params.sender === current);
	},
	disableGetNextAgent() {
		const config = Template.instance().routingConfig.get();
		return !config.enableFilterAction;
	},
});

Template.livechatFilterAction.events({
	'change .filter-action'(e, instance) {
		instance.$('.filter-action-value ').addClass('hidden');
		instance.$(`.${ e.currentTarget.value }`).removeClass('hidden');
	},
	'change [name=send-message-sender]'(e, instance) {
		instance.sender.set(e.currentTarget.value);
	},
});

Template.livechatFilterAction.onCreated(function() {
	this.firstAction = true;

	this.sender = new ReactiveVar('');
	this.routingConfig = new ReactiveVar({});

	Meteor.call('livechat:getRoutingConfig', (err, config) => {
		if (config) {
			this.routingConfig.set(config);
		}
	});

	const data = Template.currentData();
	if (data && data.name === 'send-message') {
		this.sender.set(data.params.sender);
	}
});
