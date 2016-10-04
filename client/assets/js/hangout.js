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
		}, 500);
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
			//handlePacket('local', 'chat', {type: 'code', code: JSON.stringify(data, undefined, '    ')});
			break;

		case 'changes':
			data.opened.forEach(token => handlePacket('local', 'chat', {type: 'code', code: getProperty(token, 'name', token) + ' connected.'}));
			data.closed.forEach(token => handlePacket('local', 'chat', {type: 'code', code: getProperty(token, 'name', token) + ' disconnected.'}));
			data.properties.forEach(token => handlePacket('local', 'chat', {type: 'code', code: getProperty(token, 'name', token) + ' changed some properties.'}));

			break;

		case 'chat':
			var message = document.createElement('div');
			message.classList.add('message');

			if (from === metadata.index)
				message.classList.add('self');

			if (from !== 'local') {
				var username = document.createElement('div');
				username.classList.add('username');
				username.style.color = getProperty(from, 'color', 'black');
				username.textContent = getProperty(from, 'name', 'Unknown user (' + from.substr(0, 6) + ')');
				message.appendChild(username);
			}

			var content;

			switch (data.type || null) {
				case 'text':
					content = document.createElement('div');
					content.classList.add('content');
					content.textContent = data.message;

					var regex = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})([^#]*)/gmi;
					var match;
					var html = content.innerHTML;
					while ((match = regex.exec(content.textContent)) !== null)
						html = html.replace(match[0], '<span style="color: #' + match[1] + ';">' + match[2] + '</span>');

					content.innerHTML = html;
					break;

				case 'image':
					content = document.createElement('img');
					content.classList.add('content');
					content.src = data.src || '';
					break;

				case 'code':
					content = document.createElement('pre');
					content.classList.add('content');
					content.textContent = data.code || '';
					break;

				default:
					content = document.createElement('div');
					content.classList.add('content');
					content.classList.add('unknown');

					content.textContent = 'Unsupported content type';
					break;
			}

			message.appendChild(content);

			var messages = document.getElementById('messages');
			var scrollDown = messages.scrollTop === 0 || messages.scrollTop >= messages.scrollHeight - messages.offsetHeight - 10;

			messages.appendChild(message);

			if (scrollDown)
				messages.scrollTop = messages.scrollHeight;

			break;
	}
}