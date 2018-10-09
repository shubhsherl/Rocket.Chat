import _ from 'underscore';

Meteor.methods({
	sendInvitationSMS(phones) {
		const twilioService = RocketChat.SMS.getService('twilio');
		if (!twilioService) {
			throw new Meteor.Error('error-twilio-not-active', 'Twilio service not active', {
				method: 'sendInvitationSMS',
			});
		}
		check(phones, [String]);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendInvitationSMS',
			});
		}

		// to be replaced by a seperate permission specific to SMS later
		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'bulk-register-user')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'sendInvitationSMS',
			});
		}
		const phonePattern = /^\+?[1-9]\d{1,14}$/;
		const validPhones = _.compact(_.map(phones, function(phone) {
			if (phonePattern.test(phone)) {
				return phone;
			}
		}));
		const user = Meteor.user();
		let body;
		if (RocketChat.settings.get('Invitation_SMS_Customized')) {
			body = RocketChat.settings.get('Invitation_SMS_Customized_Body');
		} else {
			const lng = user.language || RocketChat.settings.get('language') || 'en';
			body = TAPi18n.__('Invitation_SMS_Default_Body', {
				lng,
			});
		}
		body = RocketChat.placeholders.replace(body);
		validPhones.forEach((phone) => {
			try {
				// validate response
				twilioService.send(RocketChat.settings.get('Invitation_SMS_Twilio_From'), phone, body);
			} catch ({ message }) {
				throw new Meteor.Error('error-sms-send-failed', `Error trying to send SMS: ${ message }`, {
					method: 'sendInvitationSMS',
					message,
				});
			}
		});
		return validPhones;
	},
});
