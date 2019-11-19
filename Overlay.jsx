const qs = require('querystring');
const React = require('react');
const classNames = require('classnames');
const {default: Slider} = require('react-slick');
const configs = require('./live-configs.js');

require('@babel/polyfill');
require('core-js/stage/4');
require('core-js/stage/3');
require('core-js/stage/2');
require('core-js/stage/1');

require('./Overlay.pcss');

const PREROLL = 3000;

const wait = (time) => (
	new Promise((resolve) => {
		setTimeout(resolve, time);
	})
);

const socket = global.io();
socket.on('connect', () => {
	console.log('websocket connected');
});

module.exports = class App extends React.Component {
	constructor(props) {
		super(props);

		const params = qs.parse(location.search.slice(1));
		const timer = params.config ? configs[params.config].timer : 0;
		const staffs = params.config ? configs[params.config].staffs : [];

		this.state = {
			notifications: [],
			chats: [],
			timer: timer === null ? null : ((timer || 75) * 60 * 1000),
			staffs,
		};

		this.timerSatrt = null;

		this.initialize();
	}

	async initialize() {
		socket.on('update', async (data) => {
			const id = Math.random().toString();

			if (data.type === 'esolang') {
				const team = data.to === 'red' ? '本郷' : '駒場';
				const info = data.fromBytes === null ? data.toBytes.toString() : `${data.fromBytes} → ${data.toBytes}`;
				const action = (() => {
					if (data.from === null) {
						return '獲得';
					}
					if (data.from === data.to) {
						return '短縮';
					}
					return '奪取';
				})();

				await new Promise((resolve) => {
					this.setState(({notifications}) => ({
						notifications: notifications.concat({
							id,
							color: data.to,
							text: `${team}チームが【 ${data.language} 】を${action}！`,
							info,
							isTransition: action === '奪取',
						}),
					}), resolve);
				});

				await new Promise((resolve) => {
					setTimeout(resolve, 15 * 1000);
				});
				await new Promise((resolve) => {
					this.setState(({notifications}) => ({
						notifications: notifications.filter((notification) => notification.id !== id),
					}), resolve);
				});

				return;
			}

			if (data.type === 'ctf') {
				const team = data.team === 0 ? '本郷' : '駒場';

				await new Promise((resolve) => {
					this.setState(({notifications}) => ({
						notifications: notifications.concat({
							id,
							color: data.team === 0 ? 'red' : 'blue',
							text: `${team}チームが【 ${data.name} 】を解答！`,
							info: `${data.value}pts`,
							isTransition: false,
						}),
					}), resolve);
				});

				await new Promise((resolve) => {
					setTimeout(resolve, 30 * 1000);
				});

				await new Promise((resolve) => {
					this.setState(({notifications}) => ({
						notifications: notifications.filter((notification) => notification.id !== id),
					}), resolve);
				});
			}

			if (data.type === 'hackerrank') {
				const team = data.team === 0 ? '本郷' : '駒場';
				const statusMap = new Map([
					['Accepted', 'AC'],
					['Compilation error', 'CE'],
					['Wrong Answer', 'WA'],
					['Terminated due to timeout', 'TLE'],
					['Runtime Error', 'RE'],
					['Segmentation Fault', 'RE'],
				]);
				const status = statusMap.get(data.status) || data.status;

				await new Promise((resolve) => {
					this.setState(({notifications}) => ({
						notifications: notifications.concat({
							id,
							color: data.team === 0 ? 'red' : 'blue',
							text: `${team}チームが【 ${data.challenge} 】を提出！`,
							info: status,
							infoColor: status === 'AC' ? 'green' : 'orange',
							isTransition: false,
						}),
					}), resolve);
				});
				

				await new Promise((resolve) => {
					setTimeout(resolve, 30 * 1000);
				});

				await new Promise((resolve) => {
					this.setState(({notifications}) => ({
						notifications: notifications.filter((notification) => notification.id !== id),
					}), resolve);
				});
			}
		});

		socket.on('message', async (data) => {
			const id = Math.random().toString();

			await new Promise((resolve) => {
				this.setState(({chats}) => ({
					chats: chats.concat({
						id,
						text: data.text,
					}),
				}), resolve);
			});

			if (this.chatsNode) {
				this.chatsNode.scrollTop = this.chatsNode.scrollHeight;
			}
		});

		socket.on('player-message', async (data) => {
			const id = Math.random().toString();

			await new Promise((resolve) => {
				this.setState(({notifications}) => ({
					notifications: notifications.concat({
						id,
						color: data.team === 0 ? 'red' : 'blue',
						text: data.text,
						user: data.username,
						isPlayerMessage: true,
					}),
				}), resolve);
			});
			

			await new Promise((resolve) => {
				setTimeout(resolve, 20 * 1000);
			});

			await new Promise((resolve) => {
				this.setState(({notifications}) => ({
					notifications: notifications.filter((notification) => notification.id !== id),
				}), resolve);
			});
		});

		socket.on('start-timer', (countEnd) => {
			this.countEnd = countEnd;
			this.interval = setInterval(this.handleTick, 1000 / 31);
		});
	}

	handleTick = () => {
		const timer = this.countEnd - Date.now();
		this.setState({
			timer: Math.max(0, timer),
		});
		if (timer <= 0) {
			clearInterval(this.interval);
		}
	}

	handleRefChats = (node) => {
		this.chatsNode = node;
	}

	getTimerText = () => {
		const minutes = (Math.floor(this.state.timer / 60 / 1000)).toString().padStart(2, '0');
		const seconds = (Math.floor(this.state.timer / 1000) % 60).toString().padStart(2, '0');
		const milliseconds = (Math.floor(this.state.timer / 10) % 100).toString().padStart(2, '0');
		return `${minutes}:${seconds}.${milliseconds}`;
	}

	render() {
		let offset = 0;

		return (
			<div className="app">
				<div className="notifications">
					{this.state.notifications.map((notification, index) => (
						<div
							key={notification.id}
							className={classNames('notification', notification.color, {
								transition: notification.isTransition,
								bar: !notification.isPlayerMessage,
								balloon: notification.isPlayerMessage,
							})}
							style={{transform: `translateY(${-20 - 90 * index}px)`}}
						>
							{notification.user && (
								<div className="user">
									{notification.user}
								</div>
							)}
							<div className="body">
								{notification.text}
							</div>
							{notification.info && (
								<div className={`info ${notification.infoColor || ''}`}>
									{notification.info}
								</div>
							)}
						</div>
					))}
				</div>
				<div className="carousel">
					<Slider
						infinite
						arrows={false}
						slidesToShow={1}
						slidesToScroll={1}
						autoplay
						speed={2000}
						autoplaySpeed={10000}
						cssEase="linear"
					>
						<div className="staffs">
							{this.state.staffs.map((staff) => (
								<div key={staff.role} className="staff">
									<div className={`role ${staff.color}`}>{staff.role}</div>
									<div className="members">{staff.members.join(' / ')}</div>
								</div>
							))}
						</div>
						<div>
							<img src="images/carousel1.png"/>
						</div>
						<div>
							<img src="images/carousel2.png"/>
						</div>
						<div>
							<img src="images/carousel3.png"/>
						</div>
					</Slider>
				</div>
				{this.state.timer !== null && (
					<div className="timer">
						残り時間
						<span className="time">
							{this.getTimerText()}
						</span>
					</div>
				)}
				<div className="chats" ref={this.handleRefChats}>
					{this.state.chats.map((chat) => (
						<div
							key={chat.id}
							className="chat"
						>
							{chat.text}
						</div>
					))}
				</div>
			</div>
		);
	}
};
