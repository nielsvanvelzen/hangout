# Protocol V1
The protocol is (currently) based on WebSockets only. There is no recommended way to implement it on the client side.

## Incoming connection
When someone connects to the server the server does the following things:
1. Create an random token
2. Add the token to the list of metadata (synced data)
3. Update the change set (add the new token)

After some time (max 1 second) the metadata will be synced to everyone (See the "metadata" part).

## Connection dropped
When someone disconnects the following things happen
1. Remove the token from the metadata
2. Update the change set (remove the token)

After some time (max 1 second) the metadata will be synced to everyone (See the "metadata" part).

## Ping
Every 20 seconds the server sends a WebSocket "ping" the everyone to keep all connections alive.

## Metadata
The server only knows about the following things:
1. Connections
2. Metadata (including properties)

It is unknown for the server what all properties mean, it only knows that is has connections and that those connections have properties assigned to them.
Every 500ms the server checks for new changes and if found broadcasts the changes via the "changes" packet. After that it will send out an metadata packet containing ALL metadata (the users token, all tokens connected & properties for these tokens).

## Packets
Packets are based on JSON and are sent using plaintext.
The server can send packets structured like this:
```json
{
	"to": ["Can be a string or an array containing tokens or wildcard for broadcasts"],
	"packet":{
		"type": "What is the packet type",
		"[type]": "The key is the same as the value of 'type' and the value can be anything"
	}
}
```
And it sends packets like this:
```json
{
	"from": "The sender, can be the token of the user or 'server'",
	"type": "What is the packet type",
	"[type]": "The key is the same as the value of 'type' and the value can be anything"
}
```

The server has 2 "own" packets, the only one that it sends as 'server' (`from` property).
## (OUT) Metadata
Example when only one user is connected that has send us some data.
The 'index' value is the value of the currently connected user.
```json
{
	"from": "server",
	"type": "metadata",
	"metadata": {
		"index": "b2470fc4561bb4a66ca3d3a25172c8df",
		"indexes": [
			"b2470fc4561bb4a66ca3d3a25172c8df"
		],
		"properties": {
			"b2470fc4561bb4a66ca3d3a25172c8df": {
				"example": "Value of 'example' property",
				"example2": "example!"
			}
		},
		"version": "DEV"
	}
}
```
## (OUT) Changes
Example of changes packet.
```json
{
	"from": "server",
	"type": "changes",
	"changes": {
		"opened": ["b2470fc4561bb4a66ca3d3a25172c8df"],
		"closed": [],
		"properties": ["b2470fc4561bb4a66ca3d3a25172c8df"]}
	}
```
## (IN) properties
The only packet that the server understands is "properties". Example:
```json
{
	"to": "server",
	"packet": {
		"type": "properties",
		"properties": {
			"example": "Value of 'example' property️",
			"example2": "example!"
		}
	}
}
```