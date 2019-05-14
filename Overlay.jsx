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
					text: '本郷チームが言語「ほげ」を獲得！',
				},
				{
					id: 2,
					text: '本郷チームが言語「ほげ」を獲得！',
				},
				{
					id: 3,
					text: '本郷チームが言語「ほげ」を獲得！',
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
						text: '本郷チームが言語「ふが」を獲得！',
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
						className="notification red"
						style={{transform: `translateY(${-10 - 50 * index}px)`}}
					>
						{notification.text}
					</div>
				))}
			</div>
		);
	}
};
