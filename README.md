# nycurl

This is a web server that formats the latest news from the front page of the
New York Times into a format that can be displayed in most terminals. A link
to each article is included if the user wants to read the full article.

## Usage
You can fetch the latest news simply by typing  
```bash
curl nycurl.sytes.net
```
This application also accepts queries to the various sections of the NY Times.
```bash
curl nycurl.sytes.net/technology
curl nycurl.sytes.net/politics
```

## Contributing
Fork this repository and send me a pull request with any suggestions and
changes. Use two-space indents and camel-cased variables.

You will need to acquire a Top Stories API Key from the
[New York Times](http://developer.nytimes.com),
a URL Shortener API Key from
[Google Developers](https://console.developers.google.com).

Add them to your .bashrc or other environment variable configuration:
```bash
export NYTIMES_API_KEY=YOUR_KEY_HERE
export URL_SHORTENER_API_KEY=YOUR_KEY_HERE
```

Install the project dependencies:
```
npm install
bower install
```

Run the server in development node:
```
node server.js --dev
```
**IF YOU DON'T USE DEV MODE, YOU WON'T BE ABLE TO GET IT WORKING**

## License
[MIT](https://github.com/omgimanerd/nycurl/blob/master/LICENSE)
