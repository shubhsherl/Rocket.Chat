import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import EventEmitter from 'wolfy87-eventemitter';

import { isRtl } from '../../../utils';

const sideNavW = 280;
// const map = (x, in_min, in_max, out_min, out_max) => (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;

export const menu = new class extends EventEmitter {
	constructor() {
		super();
		this._open = false;
		this.updateUnreadBars = _.throttle(() => {
			if (this.list == null) {
				return;
			}
			const listOffset = this.list.offset();
			const listHeight = this.list.height();
			let showTop = false;
			let showBottom = false;
			$('li.sidebar-item--unread').each(function() {
				if ($(this).offset().top < listOffset.top - $(this).height()) {
					showTop = true;
				}
				if ($(this).offset().top > listOffset.top + listHeight) {
					showBottom = true;
				}
			});
			if (showTop === true) {
				$('.top-unread-rooms').removeClass('hidden');
			} else {
				$('.top-unread-rooms').addClass('hidden');
			}
			if (showBottom === true) {
				return $('.bottom-unread-rooms').removeClass('hidden');
			}
			return $('.bottom-unread-rooms').addClass('hidden');
		}, 200);
		this.sideNavW = sideNavW;
	}

	get isRtl() {
		return isRtl(Meteor._localStorage.getItem('userLanguage'));
	}

	touchstart(e) {
		this.movestarted = false;
		this.blockmove = false;
		this.touchstartX = undefined;
		this.touchstartY = undefined;
		this.diff = 0;
		if (e.target === this.sidebarWrap[0] || $(e.target).closest('.main-content').length > 0) {
			this.closePopover();
			this.touchstartX = e.touches[0].clientX;
			this.touchstartY = e.touches[0].clientY;
			this.mainContent = $('.main-content');
		}
	}

	touchmove(e) {
		if (this.touchstartX == null) {
			return;
		}
		const [touch] = e.touches;
		const diffX = touch.clientX - this.touchstartX;
		const diffY = touch.clientY - this.touchstartY;
		const absX = Math.abs(diffX);
		const absY = Math.abs(diffY);

		if (!this.movestarted && absY > 5) {
			this.blockmove = true;
		}
		if (this.blockmove) {
			return;
		}
		this.sidebar.css('transition', 'none');
		this.sidebarWrap.css('transition', 'none');
		if (this.movestarted === true || absX > 5) {
			this.movestarted = true;
			if (this.isRtl) {
				if (this.isOpen()) {
					this.diff = -sideNavW + diffX;
				} else {
					this.diff = diffX;
				}
				if (this.diff < -sideNavW) {
					this.diff = -sideNavW;
				}
				if (this.diff > 0) {
					this.diff = 0;
				}
			} else {
				if (this.isOpen()) {
					this.diff = sideNavW + diffX;
				} else {
					this.diff = diffX;
				}
				if (this.diff > sideNavW) {
					this.diff = sideNavW;
				}
				if (this.diff < 0) {
					this.diff = 0;
				}
			}
			this.sidebar.css('box-shadow', '0 0 15px 1px rgba(0,0,0,.3)');
			this.translate(this.diff);
		}
	}

	translate(diff, /* width = sideNavW */) {
		if (diff === undefined) {
			diff = this.isRtl ? -1 * sideNavW : sideNavW;
		}

		this.wrapper.css('overflow', 'hidden');

		// WIDECHAT translate main content
		this.isRtl ? this.mainContent.css('transform', `translate3d(${ diff.toFixed(3) }px, 0 , 0)`) : this.mainContent.css('transform', `translate3d(${ diff.toFixed(3) }px, 0 , 0)`);
	}

	touchend() {
		const [max, min] = [sideNavW * 0.76, sideNavW * 0.24];
		if (this.movestarted !== true) {
			return;
		}
		this.movestarted = false;
		if (this.isRtl) {
			if (this.isOpen()) {
				return this.diff >= -max ? this.close() : this.open();
			} if (this.diff <= -min) {
				return this.open();
			}
			return this.close();
		}
		if (this.isOpen()) {
			if (this.diff >= max) {
				return this.open();
			}
			return this.close();
		}
		if (this.diff >= min) {
			return this.open();
		}
		return this.close();
	}

	init() {
		this.menu = $('.sidebar');
		this.sidebar = this.menu;
		this.sidebarWrap = $('.sidebar-wrap');
		this.wrapper = $('.messages-box > .wrapper');
		this.mainContent = $('.main-content');

		const ignore = (fn) => (event) => document.body.clientWidth <= 780 && fn(event);

		document.body.addEventListener('touchstart', ignore((e) => this.touchstart(e)));
		document.body.addEventListener('touchmove', ignore((e) => this.touchmove(e)));
		document.body.addEventListener('touchend', ignore((e) => this.touchend(e)));
		this.sidebarWrap.on('click', ignore((e) => {
			e.target === this.sidebarWrap[0] && this.isOpen() && this.emit('clickOut', e);
		}));
		this.on('close', () => {
			// WIDECHAT open main content
			this.mainContent.css('transform', 'translate3d( 0, 0 , 0)');
		});
		this.on('open', ignore(() => {
			// WIDECHAT close main content
			this.mainContent.css('transform', 'translate3d( 100%, 0 , 0)');
			FlowRouter.withReplaceState(function() {
				FlowRouter.go('/home');
			});
		}));

		this.list = $('.rooms-list');
		this._open = false;
		Session.set('isMenuOpen', this._open);
	}

	closePopover() {
		return this.menu.find('[data-popover="anchor"]:checked').prop('checked', false).length > 0;
	}

	isOpen() {
		return Session.get('isMenuOpen');
	}

	open() {
		this._open = true;
		Session.set('isMenuOpen', this._open);
		this.emit('open');
	}

	close() {
		this._open = false;
		Session.set('isMenuOpen', this._open);
		this.emit('close');
	}

	toggle() {
		return this.isOpen() ? this.close() : this.open();
	}
}();


let passClosePopover = false;

menu.on('clickOut', function() {
	if (!menu.closePopover()) {
		passClosePopover = true;
		menu.close();
	}
});

menu.on('close', function() {
	if (!menu.sidebar) {
		return;
	}

	menu.sidebar.css('transition', '');
	menu.sidebarWrap.css('transition', '');
	if (passClosePopover) {
		passClosePopover = false;
		return;
	}
	menu.closePopover();
});
