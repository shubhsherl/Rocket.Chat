//import { Meteor } from 'meteor/meteor';
import toastr from 'toastr';

export const redirectToUrl = (url, options) => {
	toastr.success(options, 'Success');
	const redirectWindow = window.open(url, '_blank');
	redirectWindow.location;
};
