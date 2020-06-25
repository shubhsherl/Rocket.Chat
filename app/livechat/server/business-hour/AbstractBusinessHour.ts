import moment from 'moment';

import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
import {
	IWorkHoursForCreateCronJobs, LivechatBusinessHoursRaw,
} from '../../../models/server/raw/LivechatBusinessHours';
import { UsersRaw } from '../../../models/server/raw/Users';
import { LivechatBusinessHours, Users } from '../../../models/server/raw';

export interface IBusinessHour {
	saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void>;
	allowAgentChangeServiceStatus(agentId: string): Promise<boolean>;
	getBusinessHour(id: string): Promise<ILivechatBusinessHour | undefined>;
	findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]>;
	openBusinessHoursByDayHour(day: string, hour: string): Promise<void>;
	closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void>;
	removeBusinessHoursFromUsers(): Promise<void>;
	removeBusinessHourById(id: string): Promise<void>;
	removeBusinessHourFromUsers(departmentId: string, businessHourId: string): Promise<void>;
	openBusinessHoursIfNeeded(): Promise<void>;
	removeBusinessHourFromUsersByIds(userIds: string[], businessHourId: string): Promise<void>;
	addBusinessHourToUsersByIds(userIds: string[], businessHourId: string): Promise<void>;
	setDefaultToUsersIfNeeded(userIds: string[]): Promise<void>;
}

export abstract class AbstractBusinessHour {
	protected BusinessHourRepository: LivechatBusinessHoursRaw = LivechatBusinessHours;

	protected UsersRepository: UsersRaw = Users;

	async findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]> {
		return this.BusinessHourRepository.findHoursToScheduleJobs();
	}

	async allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
		return this.UsersRepository.isAgentWithinBusinessHours(agentId);
	}

	async removeBusinessHoursFromUsers(): Promise<void> {
		await this.UsersRepository.removeBusinessHoursFromUsers();
		await this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}

	protected async getBusinessHoursThatMustBeOpened(currentTime: any, activeBusinessHours: ILivechatBusinessHour[]): Promise<Record<string, any>[]> {
		return activeBusinessHours
			.filter((businessHour) => businessHour.workHours
				.filter((hour) => hour.open)
				.some((hour) => {
					const localTimeStart = moment(`${ hour.start.cron.dayOfWeek }:${ hour.start.cron.time }`, 'dddd:HH:mm');
					const localTimeFinish = moment(`${ hour.finish.cron.dayOfWeek }:${ hour.finish.cron.time }`, 'dddd:HH:mm');
					return currentTime.isSameOrAfter(localTimeStart) && currentTime.isSameOrBefore(localTimeFinish);
				}))
			.map((businessHour) => ({
				_id: businessHour._id,
				type: businessHour.type,
			}));
	}

	protected convertWorkHoursWithServerTimezone(businessHourData: ILivechatBusinessHour): ILivechatBusinessHour {
		businessHourData.workHours.forEach((hour: any) => {
			hour.start = {
				time: hour.start,
				utc: {
					dayOfWeek: this.formatDayOfTheWeekFromUTC(`${ hour.day }:${ hour.start }`, 'dddd'),
					time: this.formatDayOfTheWeekFromUTC(`${ hour.day }:${ hour.start }`, 'HH:mm'),
				},
				cron: {
					dayOfWeek: this.formatDayOfTheWeekFromServerTimezone(`${ hour.day }:${ hour.start }`, 'dddd'),
					time: this.formatDayOfTheWeekFromServerTimezone(`${ hour.day }:${ hour.start }`, ' HH:mm'),
				},
			};
			hour.finish = {
				time: hour.finish,
				utc: {
					dayOfWeek: this.formatDayOfTheWeekFromUTC(`${ hour.day }:${ hour.finish }`, 'dddd'),
					time: this.formatDayOfTheWeekFromUTC(`${ hour.day }:${ hour.finish }`, 'HH:mm'),
				},
				cron: {
					dayOfWeek: this.formatDayOfTheWeekFromServerTimezone(`${ hour.day }:${ hour.finish }`, 'dddd'),
					time: this.formatDayOfTheWeekFromServerTimezone(`${ hour.day }:${ hour.finish }`, 'HH:mm'),
				},
			};
		});
		return businessHourData;
	}

	protected formatDayOfTheWeekFromServerTimezone(hour: string, format: string): string {
		return moment(hour, 'dddd:HH:mm').format(format);
	}

	protected formatDayOfTheWeekFromUTC(hour: string, format: string): string {
		return moment(hour, 'dddd:HH:mm').utc().format(format);
	}
}
