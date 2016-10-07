# Protocol V2
The second protocol is still based on WebSockets using JSON for packets. This specification contains the server protocol only, clients are free to do what they want as long as it works.

## Connections
### Incoming connection
When a new connection is made the servers does the following things:
1. Create a random token
2. Add the token to changes `{"type": "open", "token": "[TOKEN]"}`
3. Add the token to changes `{"type": "metadata", "token": "[TOKEN]"}`
4. Send the user the `changes` packet containing all data

### Dropped connection
When an user disconnects the following things happen:
1. Remove all data whe know about this user
2. Add the token to changes `{"type": "close", "token": "[TOKEN]"}`

### Ping
Every 20 seconds the server sends a WebSocket "ping" the everyone to keep all connections alive.

## Packets
Packets are send in the JSON format. They are send via plaintext.
### Incoming (client > server)
```json
{
	"to": ["array containing tokens for receivers of this packet, wildcard allowed (*). Can also be 'server'"],
	"type": "The packet type",
	"data": "Can be anything (string, object etc.)"
}
```
#### Changes packet
A user can only change it's own properties, the change packet will be structured as following:
```json
{
	"to": "server",
	"type": "changes",
	"data": {
		"key": "value",
		"key2": "value2"
	}
}
```

### Outgoing (server > client)
```json
{
	"from": "The sender (can be server or an token)",
	"type": "The packet type",
	"data": "Can be anything (string, object etc.)"
}
```
#### Changes packet
The server can sent different types of changes so they will be structured in a different way then the incoming packages.
```json
{
	"from": "server",
	"type": "changes",
	"data": [
		{
			"type": "metadata",
			"token": "xxx"
		},
		{
			"type": "open",
			"token": "xxx"
		},
		{
			"type": "close",
			"token": "xxx"
		},
		{
			"type": "properties",
			"token": "xxx",
			"properties": {
				"key": "value",
				"key2": "value2"
			}
		}
	]
}
```