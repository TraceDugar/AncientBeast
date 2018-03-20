// Setup basic express server
const compression = require('compression');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const app = express();
const config = require('./webpack.config.js');
const compiler = webpack(config);
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 8080;
const ip = process.env.IP || '127.0.0.1';
// const gameManager = require('./server/gamemanager.js');
const qManager = require('./server/queuemanager.js');

// Enable gzip compression.
app.use(compression());

// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base, but only if we are not in a production environment.
if (process.env.NODE_ENV !== 'production') {
	app.use(
		webpackDevMiddleware(compiler, {
			publicPath: config.output.publicPath
		})
	);
}

let makeId = function() {
	let text = '';
	let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (let i = 0; i < 5; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return text;
};

// Setup the game queue and connection details
io.on('connection', function(session) {
	console.log('a user connected');

	// Store the username in the socket session for this client
	let username = makeId();
	session.username = username;

	// Add user to the queue
	qManager.addToQueue(session);

	session.on('disconnect', function() {
		console.log('user disconnected');
		qManager.removeFromQueue(session);
	});

	// Send user the username
	session.emit('login', session.username);
});

// Listen for server, and use static routing for deploy directory
server.listen(port, ip, function() {
	console.log('Server listening at port %d', port);
});

app.use(
	express.static('./deploy', {
		maxAge: 86400000
	})
);
