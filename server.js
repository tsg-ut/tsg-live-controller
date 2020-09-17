require('dotenv').config();

const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const socketIo = require('socket.io');
const firebase = require('firebase-admin');

const esolang = require('./esolang.js');
const ctfd = require('./ctfd.js');
const youtube = require('./youtube.js');
// const hackerrank = require('./hackerrank.js');
const twitter = require('./twitter.js');
const playerComment = require('./player-comment.js');
const anonymousComment = require('./anonymous-comment.js');
const ai = require('./ai.js');

firebase.initializeApp({
	credential: firebase.credential.applicationDefault(),
	databaseURL: process.env.FIREBASE_ENDPOINT,
});

const db = firebase.firestore();
const io = socketIo();

io.on('connection', (socket) => {
	console.log('Socket connected');

	socket.on('disconnect', () => {
		console.log('Socket disconnected');
	});

	socket.on('start-timer', (countEnd) => {
		io.emit('start-timer', countEnd);
	});
});

const app = express();

const webpackConfig = require('./webpack.config.js');
const compiler = webpack(webpackConfig);

app.use(webpackDevMiddleware(compiler));
if (process.env.NODE_ENV === 'development') {
	app.use(webpackHotMiddleware(compiler));
}

app.use(express.static('.'));

app.set('port', process.env.PORT || 8080);

const server = app.listen(app.get('port'), '0.0.0.0', () => {
	console.log(
		'App is running at http://localhost:%d in %s mode',
		app.get('port'),
		app.get('env')
	);
});

io.attach(server);

esolang(io);
ctfd(io);
youtube(io);
// hackerrank(io);
twitter(io);
playerComment(io, db);
anonymousComment(io, db);
ai(io);

module.exports = app;
