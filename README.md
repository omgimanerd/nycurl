# nycurl
This is a web server that formats the latest news from the front page of the
New York Times into a format that can be displayed in most terminals. A link
to each article is included if the user wants to read the full article.
To query news from other sources on the web, check out
[getnews.tech](https://github.com/omgimanerd/getnews.tech).

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
Get a list of acceptable sections to query using:
```bash
curl nycurl.sytes.net/help
```
By default, nycurl will format the table to be a max of 72 characters wide.
If you would like to specify a custom width for your terminal, you can do so
using:
```bash
curl nycurl.sytes.net?w=92
curl nycurl.sytes.net/technology?w=100
```
You can also limit the number of articles to display.
```bash
curl nycurl.sytes.net?n=10
curl nycurl.sytes.net?n=12\&w=95
```
Note that when combining the parameters on the command line as query parameters,
you must use `\&` to escape the ampersand character.

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
