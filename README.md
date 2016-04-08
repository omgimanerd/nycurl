# nycurl

This is a web server that formats the latest news from the front page of the
New York Times into a format that can be displayed in most terminals. A link
to each article is included if the user wants to read the full article.

## Usage
You can fetch the latest news simply by typing  
```bash
curl nycurl.herokuapp.com
```
This application also accepts queries to the various sections of the NY Times.
```bash
curl nycurl.herokuapp.com/technology
curl nycurl.herokuapp.com/politics
```

## Contributing
Fork this repository and send me a pull request with any suggestions and
changes.
Use two-space indents and camel-cased variables.

You will need to acquire a Top Stories API Key from the
[New York Times](http://developer.nytimes.com).
and a URL Shortener API Key from
[Google Developers](https://console.developers.google.com)

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

## License
Copyright &copy; Alvin Lin 2016

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sub license, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
