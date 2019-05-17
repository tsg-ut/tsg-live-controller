const React = require('react');
const ReactPlayer = require('react-player').default;
const {Howl} = require('howler');
const mapValues = require('lodash/mapValues');
const obs = new global.OBSWebSocket();

require('@babel/polyfill');
require('core-js/stage/4');
require('core-js/stage/3');
require('core-js/stage/2');
require('core-js/stage/1');

require('./App.pcss');

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
	countdown: {
		file: 'countdown.mp3',
		volume: 0.6,
	},
	notify: {
		file: 'notify.mp3',
		volume: 0.6,
	},
	gong: {
		file: 'gong.mp3',
		volume: 1,
	},
}, ({file, volume}) => (
	new Howl({
		src: [file],
		volume,
	})
));

module.exports = class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			mics: [],
			scenes: [],
			nextScene: null,
			endScene: null,
			volume: 0.5,
			playing: true,
			isAutoMode: false,
			loop: true,
			phase: 'wait',
			music: 'waiting.mp3',
			time: 0,
			nextLive: '',
			nextCount: '',
			countEnd: null,
		};

		this.initialize();

		setInterval(() => {
			this.updateTime();
		}, 200);
	}

	async initialize() {
		await obs.connect({address: 'localhost:4444'});
		await Promise.all([
			this.handleUpdateSources(),
			this.handleUpdateScenes(),
		]);

		socket.on('update', () => {
			sounds.notify.play();
		});
	}

	updateTime = () => {
		const prevTime = this.state.time;
		const newTime = Date.now();
		this.setState({
			time: newTime,
		});

		if (prevTime < this.state.countEnd && this.state.countEnd <= newTime) {
			this.handleEndCount();
		}
	}

	getTime = () => (
		new Date(this.state.time).toLocaleTimeString('ja-JP', {timeZone: 'Asia/Tokyo'}).padStart(8, '0')
	)

	getCountDown = () => {
		const countdown = Math.max(0, this.state.countEnd - this.state.time);
		const minutes = (Math.floor(countdown / 60 / 1000)).toString().padStart(2, '0');
		const seconds = (Math.floor(countdown / 1000) % 60).toString().padStart(2, '0');
		return `${minutes}:${seconds}`;
	};

	getIsLive = () => (
		this.state.phase === 'live'|| this.state.phase === 'count'
	)

	getNextLive = () => {
		const [hour, minute] = this.state.nextLive.split(':').map((n) => parseInt(n));
		if ([hour, minute].some((c) => typeof c !== 'number' || Number.isNaN(c))) {
			return 0;
		}

		const now = new Date();
		return new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			hour,
			minute,
		).getTime();
	}

	getNextCount = () => {
		const [hour, minute] = this.state.nextCount.split(':').map((n) => parseInt(n));
		if ([hour, minute].some((c) => typeof c !== 'number' || Number.isNaN(c))) {
			return 0;
		}

		const now = new Date();
		return new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			hour,
			minute,
		).getTime();
	}

	handleUpdateSources = async () => {
		const data = await obs.send('GetSpecialSources');
		const mics = Object.entries(data).filter(([type]) => type.startsWith('mic')).map(([type, name]) => ({type, name, enabled: false}));
		this.setState({mics});
		for (const mic of mics) {
			await obs.send('SetMute', {source: mic.name, mute: true});
		}
	}

	handleUpdateScenes = async () => {
		const data = await obs.send('GetSceneList');
		this.setState({
			scenes: data.scenes,
			nextScene: data.currentScene,
			endScene: data.currentScene,
		});
	}

	handleInputChange = async (type) => {
		const mic = this.state.mics.find((mic) => mic.type === type);
		this.setState({
			mics: this.state.mics.map((mic) => ({
				...mic,
				enabled: mic.type === type ? !mic.enabled : mic.enabled,
			})),
		});
	}

	handleReadyStart = async () => {
		await new Promise((resolve) => {
			this.setState({phase: 'ready'}, resolve);
		});
		let volume = this.state.volume;
		while (volume < 1) {
			volume = Math.min(volume + 0.05, 1);
			await new Promise((resolve) => {
				this.setState({volume}, resolve);
			});
			await wait(500);
		}
		await wait(5000);
		while (volume > 0.5) {
			volume = Math.max(volume - 0.05, 0);
			await new Promise((resolve) => {
				this.setState({volume}, resolve);
			});
			await wait(500);
		}
		while (volume > 0) {
			volume = Math.max(volume - 0.03, 0);
			await new Promise((resolve) => {
				this.setState({volume}, resolve);
			});
			await wait(500);
		}
		this.setState({
			playing: false,
			phase: 'stop',
		});
	}

	handleStartLive = async () => {
		this.setState({
			phase: 'live',
			music: 'before-count.mp3',
			loop: false,
			playing: true,
			volume: 0.6,
		});

		obs.send('SetCurrentScene', {
			'scene-name': this.state.nextScene,
		});
		for (const mic of this.state.mics) {
			await obs.send('SetMute', {
				source: mic.name,
				mute: !mic.enabled,
			});
		}
	}

	handleStartCount = async () => {
		sounds.countdown.play();
		const countEnd = Date.now() + PREROLL + 75 * 60 * 1000;
		setTimeout(() => {
			socket.emit('start-timer', countEnd);
		}, PREROLL);
		await new Promise((resolve) => {
			const handler = () => {
				resolve();
				sounds.countdown.off('end', handler);
			};
			sounds.countdown.on('end', handler);
		});
		await new Promise((resolve) => {
			this.setState({
				phase: 'count',
				music: 'count.mp3',
				loop: true,
				playing: true,
				volume: 0.3,
				countEnd,
			}, resolve);
		});
	}

	handleEndCount = async () => {
		await new Promise((resolve) => {
			this.setState({
				playing: false,
			}, resolve);
		});
		sounds.gong.play();
		await new Promise((resolve) => {
			const handler = () => {
				resolve();
				sounds.gong.off('end', handler);
			};
			sounds.gong.on('end', handler);
		});
		await new Promise((resolve) => {
			this.setState({
				phase: 'countend',
				music: 'countend.mp3',
				loop: true,
				playing: true,
				volume: 0.5,
			}, resolve);
		});
	}

	handleEndLive = async () => {
		await obs.send('SetCurrentScene', {
			'scene-name': this.state.endScene,
		});
		for (const mic of this.state.mics) {
			await obs.send('SetMute', {
				source: mic.name,
				mute: true,
			});
		}
		await new Promise((resolve) => {
			this.setState({
				phase: 'wait',
				music: 'waiting.mp3',
				loop: true,
				playing: true,
				volume: 0.5,
			}, resolve);
		});
	}

	handleChangeNextScene = (event) => {
		this.setState({
			nextScene: event.target.value,
		});
	}

	handleChangeEndScene = (event) => {
		this.setState({
			endScene: event.target.value,
		});
	}

	handleChangeAutoMode = (event) => {
		this.setState(({isAutoMode}) => ({
			isAutoMode: !isAutoMode,
		}));
	}

	handleChangeNextLive = (event) => {
		this.setState({
			nextLive: event.target.value,
		});
	}

	handleChangeNextCount = (event) => {
		this.setState({
			nextCount: event.target.value,
		});
	}

	render() {
		return (
			<div className="app">
				<div className="current-music">再生中: {this.state.music}</div>
				<div style={{height: '50px', position: 'relative'}}>
					<ReactPlayer
						url={`/${this.state.music}`}
						style={{position: 'absolute', bottom: '0'}}
						volume={this.state.volume}
						playing={this.state.playing}
						controls
						loop={this.state.loop}
					/>
				</div>
				<div className="controls">
					<div className="options">
						{this.state.mics.map((mic) => (
							<label className={(mic.enabled && this.getIsLive()) ? 'active' : ''} key={mic.type}>
								{mic.name}
								<input
									name="isGoing"
									type="checkbox"
									checked={mic.enabled}
									onChange={this.handleInputChange.bind(null, mic.type)}
								/>
							</label>
						))}
					</div>
					<div>
						ライブ中シーン
						<br/>
						<select
							value={this.state.nextScene}
							onChange={this.handleChangeNextScene}
						>
							{this.state.scenes.map((scene) => (
								<option
									key={scene.name}
									value={scene.name}
								>
									{scene.name}
								</option>
							))}
						</select>
						<br/>
						ライブ終了シーン
						<br/>
						<select
							value={this.state.endScene}
							onChange={this.handleChangeEndScene}
						>
							{this.state.scenes.map((scene) => (
								<option
									key={scene.name}
									value={scene.name}
								>
									{scene.name}
								</option>
							))}
						</select>
					</div>
					<div>
						ライブ開始時刻
						<br/>
						<input
							type="time"
							value={this.state.nextLive}
							onChange={this.handleChangeNextLive}
							disabled={this.state.isAutoMode}
						/>
						<br/>
						<label>
							<input
								type="checkbox"
								checked={this.state.isAutoMode}
								onChange={this.handleChangeAutoMode}
							/>
							自動モード
						</label>
					</div>
					<div>
						カウント開始時刻
						<br/>
						<input
							type="time"
							value={this.state.nextCount}
							onChange={this.handleChangeNextCount}
							disabled={this.state.isAutoMode}
						/>
					</div>
				</div>
				<div className="buttons">
					<button
						type="button"
						onClick={this.handleReadyStart}
						className={this.state.phase === 'ready' ? 'active' : ''}
					>
						開始<br/>準備
					</button>
					<button
						type="button"
						onClick={this.handleStartLive}
						className={this.state.phase === 'live' ? 'active' : ''}
					>
						ライブ<br/>開始
					</button>
					<button
						type="button"
						onClick={this.handleStartCount}
						className={this.state.phase === 'count' ? 'active' : ''}
					>
						カウント<br/>開始
					</button>
					<button
						type="button"
						onClick={this.handleEndLive}
						className={this.state.phase === 'wait' ? 'active' : ''}
					>
						ライブ<br/>終了
					</button>
				</div>
				<div className="time">
					{this.getTime()}
					<span className="countdown">
						{this.state.countEnd ? this.getCountDown() : '--:--'}
					</span>
				</div>
			</div>
		);
	}
};
