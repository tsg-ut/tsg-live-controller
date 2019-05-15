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
		};

		this.initialize();
	}

	async initialize() {
		socket.on('update', async (data) => {
			const id = Math.random().toString();
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
		});
	}

	render() {
		return (
			<div className="app">
				{this.state.notifications.map((notification, index) => (
					<div
						key={notification.id}
						className={`notification ${notification.color}`}
						style={{transform: `translateY(${-10 - 50 * index}px)`}}
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
		);
	}
};
