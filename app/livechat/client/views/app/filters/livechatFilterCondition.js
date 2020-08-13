import { Template } from 'meteor/templating';
import './livechatFilterCondition.html';

Template.livechatFilterCondition.helpers({
	hiddenValue(current) {
		if (this.name === undefined && Template.instance().firstCondition) {
			Template.instance().firstCondition = false;
			return '';
		} if (this.name !== current) {
			return 'hidden';
		}
	},
	conditionSelected(current) {
		if (this.name === current) {
			return 'selected';
		}
	},
	valueFor(condition) {
		if (this.name === condition) {
			return this.value;
		}
	},
});

Template.livechatFilterCondition.events({
	'change .filter-condition'(e, instance) {
		instance.$('.filter-condition-value ').addClass('hidden');
		instance.$(`.${ e.currentTarget.value }`).removeClass('hidden');
	},
});

Template.livechatFilterCondition.onCreated(function() {
	this.firstCondition = true;
});
