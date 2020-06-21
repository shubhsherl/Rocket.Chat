import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';
import moment from 'moment';

import { t, handleError, APIClient } from '../../../../../utils/client';
import './livechatBusinessHoursForm.html';

Template.livechatBusinessHoursForm.helpers({
	days() {
		return Template.instance().businessHour.get().workHours;
	},
	startName(day) {
		return `${ day.day }_start`;
	},
	finishName(day) {
		return `${ day.day }_finish`;
	},
	openName(day) {
		return `${ day.day }_open`;
	},
	start(day) {
		return Template.instance().dayVars[day.day].start.get();
	},
	finish(day) {
		return Template.instance().dayVars[day.day].finish.get();
	},
	name(day) {
		return TAPi18n.__(day.day);
	},
	open(day) {
		return Template.instance().dayVars[day.day].open.get();
	},
});

const splitDayAndPeriod = (value) => value.split('_');

Template.livechatBusinessHoursForm.events({
	'change .preview-settings, keydown .preview-settings'(e, instance) {
		const [day, period] = splitDayAndPeriod(e.currentTarget.name);

		const newTime = moment(e.currentTarget.value, 'HH:mm');

		// check if start and stop do not cross
		if (period === 'start') {
			if (newTime.isSameOrBefore(moment(instance.dayVars[day].finish.get(), 'HH:mm'))) {
				instance.dayVars[day].start.set(e.currentTarget.value);
			} else {
				e.currentTarget.value = instance.dayVars[day].start.get();
			}
		} else if (period === 'finish') {
			if (newTime.isSameOrAfter(moment(instance.dayVars[day].start.get(), 'HH:mm'))) {
				instance.dayVars[day].finish.set(e.currentTarget.value);
			} else {
				e.currentTarget.value = instance.dayVars[day].finish.get();
			}
		}
	},
	'change .dayOpenCheck input'(e, instance) {
		const [day, period] = splitDayAndPeriod(e.currentTarget.name);
		instance.dayVars[day][period].set(e.target.checked);
	},
	'change .preview-settings, keyup .preview-settings'(e, instance) {
		let { value } = e.currentTarget;
		if (e.currentTarget.type === 'radio') {
			value = value === 'true';
			instance[e.currentTarget.name].set(value);
		}
	},
	'submit .rocket-form'(e, instance) {
		e.preventDefault();

		// convert all times to utc then update them in db
		const days = [];
		for (const d in instance.dayVars) {
			if (instance.dayVars.hasOwnProperty(d)) {
				const day = instance.dayVars[d];
				const start = moment(day.start.get(), 'HH:mm').format('HH:mm');
				const finish = moment(day.finish.get(), 'HH:mm').format('HH:mm');
				days.push({
					day: d,
					start,
					finish,
					open: day.open.get(),
				});
			}
		}
		Meteor.call('livechat:saveBusinessHour', {
			...instance.businessHour.get(),
			workHours: days,
		}, function(err /* ,result*/) {
			if (err) {
				return handleError(err);
			}
			toastr.success(t('Business_hours_updated'));
		});
	},
});

const createDefaultBusinessHour = () => {
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const closedDays = ['Saturday', 'Sunday'];
	return {
		workHours: days.map((day) => ({
			day,
			start: '00:00',
			finish: '00:00',
			open: !closedDays.includes(day),
		})),
	};
};


Template.livechatBusinessHoursForm.onCreated(async function() {
	this.dayVars = createDefaultBusinessHour().workHours.reduce((acc, day) => {
		acc[day.day] = {
			start: new ReactiveVar(day.start),
			finish: new ReactiveVar(day.finish),
			open: new ReactiveVar(day.open),
		};
		return acc;
	}, {});
	this.businessHour = new ReactiveVar({});

	const { businessHour } = await APIClient.v1.get('livechat/business-hour');
	this.businessHour.set({
		...createDefaultBusinessHour(),
	});
	if (businessHour) {
		this.businessHour.set(businessHour);
		businessHour.workHours.forEach((d) => {
			if (businessHour.timezone.name) {
				this.dayVars[d.day].start.set(moment.utc(d.start.utc.time, 'HH:mm').tz(businessHour.timezone.name).format('HH:mm'));
				this.dayVars[d.day].finish.set(moment.utc(d.finish.utc.time, 'HH:mm').tz(businessHour.timezone.name).format('HH:mm'));
			} else {
				this.dayVars[d.day].start.set(moment.utc(d.start.utc.time, 'HH:mm').local().format('HH:mm'));
				this.dayVars[d.day].finish.set(moment.utc(d.finish.utc.time, 'HH:mm').local().format('HH:mm'));
			}
			this.dayVars[d.day].open.set(d.open);
		});
	}
});
