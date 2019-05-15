const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const dotenv = require('dotenv');
const socketIo = require('socket.io');

const esolang = require('./esolang.js');
const youtube = require('./youtube.js');

const io = socketIo();

io.on('connection', (socket) => {
	console.log('Socket connected');

	socket.on('disconnect', () => {
		console.log('Socket disconnected');
	});
});

dotenv.config();

const app = express();

const webpackConfig = require('./webpack.config.js');
const compiler = webpack(webpackConfig);

app.use(webpackDevMiddleware(compiler));
if (process.env.NODE_ENV === 'development') {
	app.use(webpackHotMiddleware(compiler));
}

app.use(express.static('.'));

app.set('port', process.env.PORT || 8080);

const server = app.listen(app.get('port'), () => {
	console.log(
		'App is running at http://localhost:%d in %s mode',
		app.get('port'),
		app.get('env')
	);
});

io.attach(server);

esolang(io);
youtube(io);

module.exports = app;
