const React = require('react');
const ReactPlayer = require('react-player').default;
const {Howl} = require('howler');
const mapValues = require('lodash/mapValues');

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

const sounds = mapValues({
	countdown: 'countdown.mp3',
}, (file) => (
	new Howl({
		src: [file],
		volume: 0.6,
	})
));

module.exports = class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			notifications: [],
			chats: [],
			timer: 75 * 60 * 1000,
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
			}

			await new Promise((resolve) => {
				setTimeout(resolve, 15 * 1000);
			});
			await new Promise((resolve) => {
				this.setState(({notifications}) => ({
					notifications: notifications.filter((notification) => notification.id !== id),
				}), resolve);
			});
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

		socket.on('start-timer', () => {
			this.timerStart = Date.now();
			setInterval(() => {
				this.setState({
					timer: Math.max(0, 75 * 60 * 1000 - (Date.now() - this.timerStart)),
				});
			}, 1000 / 30);
		});
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
		return (
			<div className="app">
				<div className="notifications">
					{this.state.notifications.map((notification, index) => (
						<div
							key={notification.id}
							className={`notification ${notification.color} ${notification.isTransition ? 'transition' : ''}`}
							style={{transform: `translateY(${-20 - 90 * index}px)`}}
						>
							<div className="body">
								{notification.text}
							</div>
							<div className="info">
								{notification.info}
							</div>
						</div>
					))}
				</div>
				<div className="timer">
					残り時間
					<span className="time">
						{this.getTimerText()}
					</span>
				</div>
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
