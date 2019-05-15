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
			notifications: [
				{
					id: 1,
					color: 'red',
					text: '本郷チームが言語「ほげ」を獲得！',
					info: '100',
				},
				{
					id: 2,
					color: 'blue',
					text: '本郷チームが言語「ほげ」を獲得！',
					info: '100',
				},
				{
					id: 3,
					color: 'red',
					text: '本郷チームが言語「ほげ」を獲得！',
					info: '100',
				},
			],
		};

		this.initialize();
	}

	async initialize() {
		while (this.state.notifications.length > 0) {
			await new Promise((resolve) => {
				setTimeout(resolve, 2000);
			});
			await new Promise((resolve) => {
				this.setState(({notifications}) => ({
					notifications: notifications.filter((n, index) => index !== 0),
				}), resolve);
			});
			await new Promise((resolve) => {
				setTimeout(resolve, 2000);
			});
			await new Promise((resolve) => {
				this.setState(({notifications}) => ({
					notifications: notifications.concat({
						id: Math.random(),
						color: Math.random() > .5 ? 'red' : 'blue',
						text: '本郷チームが言語「ふが」を獲得！',
						info: '100 → 89',
					}),
				}), resolve);
			});
		}
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
