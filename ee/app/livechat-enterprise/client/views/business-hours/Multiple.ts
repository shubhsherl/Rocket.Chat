import { IBusinessHour } from '../../../../../../app/livechat/client/views/app/business-hours/IBusinessHour';
import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../../../definition/ILivechatBusinessHour';

export class MultipleBusinessHours implements IBusinessHour {
	getView(): string {
		return 'livechatBusinessHours';
	}

	shouldShowCustomTemplate(businessHourData: ILivechatBusinessHour): boolean {
		return !businessHourData._id || businessHourData.type !== LivechatBussinessHourTypes.SINGLE;
	}

	shouldShowBackButton(): boolean {
		return true;
	}
}
