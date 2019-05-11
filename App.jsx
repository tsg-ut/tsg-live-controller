const React = require('react');
const ReactPlayer = require('react-player').default;
const obs = new global.OBSWebSocket();

require('@babel/polyfill');
require('core-js/stage/4');
require('core-js/stage/3');
require('core-js/stage/2');
require('core-js/stage/1');

module.exports = class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			mics: [],
		};

		this.initialize();
	}

	async initialize() {
		await obs.connect({address: 'localhost:4444'});
		const data = await obs.send('GetSpecialSources');
		const mics = Object.entries(data).filter(([type]) => type.startsWith('mic')).map(([type, name]) => ({type, name, enabled: false}));
		this.setState({mics});
		for (const mic of mics) {
			await obs.send('SetMute', {source: mic.name, mute: true});
		}
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

	render() {
		return (
			<div className="app">
				<ReactPlayer
					url="/waiting.mp3"
					playing
					controls
					loop
				/>
				{this.state.mics.map((mic) => (
					<label key={mic.type}>
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
		);
	}
};
