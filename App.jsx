const React = require('react');
const ReactPlayer = require('react-player').default;
const obs = new global.OBSWebSocket();

require('@babel/polyfill');
require('core-js/stage/4');
require('core-js/stage/3');
require('core-js/stage/2');
require('core-js/stage/1');

require('./App.pcss');

const wait = (time) => (
	new Promise((resolve) => {
		setTimeout(resolve, time);
	})
);

module.exports = class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			mics: [],
			scenes: [],
			nextScene: null,
			volume: 0.5,
			playing: true,
			phase: 'wait',
		};

		this.initialize();
	}

	async initialize() {
		await obs.connect({address: 'localhost:4444'});
		await Promise.all([
			this.handleUpdateSources(),
			this.handleUpdateScenes(),
		]);
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
			nextScene: data.nextScene,
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
		await obs.send('SetMute', {source: mic.name, mute: mic.enabled})
	}

	handleReadyStart = async () => {
		await new promise((resolve) => {
			this.setstate({phase: 'ready'}, resolve);
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
		await new Promise((resolve) => {
			this.setState({phase: 'ready'}, resolve);
		});
	}

	render() {
		return (
			<div className="app">
				<div style={{height: '50px', position: 'relative'}}>
					<ReactPlayer
						url="/waiting.mp3"
						style={{position: 'absolute', bottom: '0'}}
						volume={this.state.volume}
						playing={this.state.playing}
						controls
						loop
					/>
				</div>
				<div className="controls">
					<div className="options">
						{this.state.mics.map((mic) => (
							<label className={(mic.enabled && this.state.phase === 'live') && 'active'} key={mic.type}>
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
					次のシーン
					<br/>
					<select>
						{this.state.scenes.map((scene) => (
							<option
								key={scene.name}
								value={scene.name}
								selected={scene.name === this.state.nextScene}
							>
								{scene.name}
							</option>
						))}
					</select>
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
						className={this.state.phase === 'start' ? 'active' : ''}
					>
						ライブ<br/>開始
					</button>
				</div>
			</div>
		);
	}
};
