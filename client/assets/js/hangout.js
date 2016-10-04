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

function setName(name) {
	send('server', 'properties', {name: name});
}

function handlePacket(from, type, data) {
	switch (type) {
		case 'metadata':
			metadata = data;
			document.getElementById('debug').textContent = JSON.stringify(data, undefined, '    ');
			break;

		case 'chat':
			var line = document.createElement('div');
			var username = from;

			if (from in metadata.properties && 'name' in metadata.properties[from])
				username = metadata.properties[from]['name'];

			if (username.trim() < 3 || data.msg < 3) {
				if (from !== metadata.index)
					send(from, 'chat', {msg: '@' + username + ' plz define a message or username...'});

				break;
			}

			line.textContent = username + ': ' + data.msg;
			line.style.color = from in metadata.properties && 'color' in metadata.properties[from] ? metadata.properties[from]['color'] : 'black';
			line.style.fontFamily = from in metadata.properties && 'font' in metadata.properties[from] ? metadata.properties[from]['font'] : 'Arial';

			document.getElementById('messages').appendChild(line);
			document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;

			break;
	}

	//send(metadata.index, type, data);
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