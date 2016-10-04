/**
 * DISCLAIMER: This is the worst code ever made. Have fun!
 */

'use strict';

const WebSocket = require('faye-websocket');
const http = require('http');
const crypto = require('crypto');

var server = http.createServer();
var connections = {};
var connectionIndex = 0;
var changes = {
	opened: [],
	closed: []
};
var bannedClientPackets = ['changes', 'metadata'];

function sendChanges() {
	if (changes.opened.length < 1 && changes.closed.length < 1)
		return;

	broadcast({
		from: 'server',
		type: 'changes',
		changes: changes
	});

	changes = {
		opened: [],
		closed: []
	};

	sendMetadata();
}

function broadcast(packet) {
	Object.keys(connections).forEach(token => send(token, packet))
}

function send(token, packet) {
	if (token in connections)
		connections[token].sendJson(packet);
}

function sendMetadata(tokenFilter) {
	Object.keys(connections).forEach(token => {
		if (tokenFilter !== undefined && tokenFilter != token)
			return;

		let connection = connections[token];

		connection.sendJson({
			from: 'server',
			type: 'metadata',
			metadata: {
				index: token,
				indexes: Object.keys(connections)
			}
		});
	});
}

server.on('upgrade', (request, socket, body) => {
	if (WebSocket.isWebSocket(request)) {
		var ws = new WebSocket(request, socket, body);

		ws.sendJson = (json) => ws.send(JSON.stringify(json));

		ws.on('open', event => {
			connectionIndex++;

			while (ws.token === undefined || ws.token in connections)
				ws.token = crypto.randomBytes(16).toString('hex');

			connections[ws.token] = ws;
			sendMetadata(ws.token);
			changes['opened'].push(ws.token);
		});

		ws.on('message', event => {
			try {
				let json = JSON.parse(event.data);

				json.to = json.to || [];
				json.packet = json.packet || {};
				json.packet.from = ws.token || null;
				json.packet.type = json.packet.type || 'ping';
				json.packet[json.packet.type] = json.packet[json.packet.type] || {};

				if (bannedClientPackets.indexOf(json.packet.type) !== -1)
					return;

				if (!Array.isArray(json.to))
					json.to = [json.to];

				var receivers = [];
				json.to.forEach(to => {
					if (receivers.indexOf(to) !== -1)
						return;

					receivers.push(to);

					if (to === '*')
						broadcast(json.packet);
					else if (to in connections)
						send(to, json.packet);
				})
			} catch (e) {
				ws.close(1001);
			}
		});

		ws.on('close', event => {
			changes['closed'].push(ws.token);

			delete connections[ws.token];
			ws = null;
		});
	}
});

setInterval(() => sendChanges(), 500);
server.listen(13372);