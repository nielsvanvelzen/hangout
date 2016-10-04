var server = 'wss://hangout.ndat.nl/ws/';
var socket = new WebSocket(server);
var metadata = {
	index: null,
	indexes: []
};

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

function handlePacket(from, type, data) {
	switch (type) {
		case 'metadata':
			metadata = data;
			break;

		case 'chat':
			var line = document.createElement('div');
			line.textContent = from + ': ' + data.msg;

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