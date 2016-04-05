# nycurl

This is a web server that formats the latest news from the front page of the
New York Times into a format that can be displayed in Terminal. You can fetch
the latest news simply by typing

`curl nycurl.herokuapp.com`.

## Setup

Acquire a Top Stories API Key from the
[New York Times](http://developer.nytimes.com).

Add this line to your .bashrc or environment configuration:
```bash
export NYTIMES_TOP_STORIES_API_KEY={key}
```

Environment Setup:
```bash
virtualenv environment
source ./environment/bin/activate
pip install -r requirements.txt
```

## Contributing
Please follow the [PEP8](http://pep8.org) standard for any code.

## License
Copyright &copy; Alvin Lin 2016

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
