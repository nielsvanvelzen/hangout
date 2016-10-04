var server = 'wss://hangout.ndat.nl/ws/';
var socket;
var metadata = {
	index: null,
	indexes: [],
	properties: {}
};
var properties = {};

function connect() {
	socket = new WebSocket(server);

	socket.addEventListener('open', function () {
		console.log('Connection opened');

		var props = JSON.parse(window.localStorage.getItem('properties'));
		send('server', 'properties', props);
	});

	socket.addEventListener('message', function (event) {
		try {
			var json = JSON.parse(event.data);

			json.from = json.from || 'undefined';
			json.type = json.type || 'ping';
			json[json.type] = json[json.type] || {};

			handlePacket(json.from, json.type, json[json.type]);

			console.log('IN', json.type);
		} catch (e) {
			console.error(e);
		}
	});

	socket.addEventListener('close', function (event) {
		console.log('Connection closed');

		setTimeout(function () {
			connect();
		}, 100);
	});
}

connect();

function setProperty(property, value) {
	let data = {};
	data[property] = metadata.properties[metadata.index][property] = value;

	send('server', 'properties', data);

	var props = JSON.stringify(metadata.properties[metadata.index]);
	window.localStorage.setItem('properties', props);
}

function getProperty(from, property, fallback) {
	return from in metadata.properties && property in metadata.properties[from] ? metadata.properties[from][property] : fallback;
}

function send(to, type, data) {
	var message = {
		to: to,
		packet: {
			type: type
		}
	};

	message['packet'][type] = data;
	socket.send(JSON.stringify(message));
}

function handlePacket(from, type, data) {
	switch (type) {
		case 'metadata':
			if (metadata.version !== undefined && data.version !== metadata.version)
				window.location.reload(true);

			metadata = data;
			document.getElementById('debug').textContent = JSON.stringify(data, undefined, '    ');
			break;

		case 'draw':
			context.beginPath();
			context.fillStyle = getProperty(from, 'style', 'black');
			var shape = data.shape || 'circle';

			switch (shape) {
				case 'circle':
					context.arc(data.x - 5 || 0, data.y - 5 || 0, 10, 0, 2 * Math.PI);
					break;

				case 'rectangle':
					context.rect(data.x - 5 || 0, data.y - 5 || 0, 10, 10);
			}
			context.fill();
			break;
	}
}

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

window.addEventListener('load', function () {
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	canvas.addEventListener('click', function (event) {
		console.log(event);
		send('*', 'draw', {
			shape: 'circle',
			x: event.pageX,
			y: event.pageY
		})
	});
});