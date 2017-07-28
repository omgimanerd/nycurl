# nycurl
This is a web server that formats the latest news from the front page of the
New York Times into a format that can be displayed in most terminals. A link
to each article is included if the user wants to read the full article.
To query news from other sources on the web, check out
[getnews.tech](https://github.com/omgimanerd/getnews.tech).

## Example Output
```
$ curl nycurl.sytes.net?i=5
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│              To find a list of sections to query, use:               │
│                      curl nycurl.sytes.net/help                      │
│                                                                      │
├───┬──────────────┬───────────────────────────────────────────────────┤
│ # │ Section      │ Details                                           │
├───┼──────────────┼───────────────────────────────────────────────────┤
│ 0 │ Arts         │ Canada Debates Whether Gift of Leibovitz Photos   │
│   │              │ Is Also a Tax Dodge                               │
│   │              │ Four years after the donation of 2,070 photos     │
│   │              │ created by Annie Leibovitz to a Nova Scotia       │
│   │              │ museum, a government panel is balking at its $20  │
│   │              │ million valuation.                                │
│   │              │ https://nyti.ms/2tH1g2N                           │
├───┼──────────────┼───────────────────────────────────────────────────┤
│ 1 │ Books        │ What Happens When Liberty Fails to Deliver        │
│   │              │ In “The Retreat of Western Liberalism,” Edward    │
│   │              │ Luce argues that the tradition of liberty is      │
│   │              │ under mortal threat.                              │
│   │              │ https://nyti.ms/2tFDJ2g                           │
├───┼──────────────┼───────────────────────────────────────────────────┤
│ 2 │ Briefing     │ Senate, John McCain, Jeff Sessions: Your Tuesday  │
│   │              │ Evening Briefing                                  │
│   │              │ Here’s what you need to know at the end of the    │
│   │              │ day.                                              │
│   │              │ https://nyti.ms/2tHzEdW                           │
├───┼──────────────┼───────────────────────────────────────────────────┤
│ 3 │ Briefing     │ Donald Trump, Republican Party, Russia: Your      │
│   │              │ Wednesday Briefing                                │
│   │              │ Here’s what you need to know to start your day.   │
│   │              │ https://nyti.ms/2tXFUtp                           │
├───┼──────────────┼───────────────────────────────────────────────────┤
│ 4 │ Business Day │ To Punish Putin, Economic Sanctions Are Unlikely  │
│   │              │ to Do the Trick                                   │
│   │              │ Using economic penalties to achieve diplomatic    │
│   │              │ goals has a poor track record when the target is  │
│   │              │ powerful and autocratic, and workarounds exist.   │
│   │              │ https://nyti.ms/2tGwbwj                           │
├───┴──────────────┴───────────────────────────────────────────────────┤
│              Follow @omgimanerd on Twitter and GitHub.               │
│                Open source contributions are welcome!                │
│                 https://github.com/omgimanerd/nycurl                 │
└──────────────────────────────────────────────────────────────────────┘
```

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
changes. Use [StandardJS](https://standardjs.com/) to format your code.

You will need to acquire a Top Stories API Key from the
[New York Times](http://developer.nytimes.com). Add it to your .bashrc
or other environment variable configuration:
```bash
export NYTIMES_API_KEY=YOUR_KEY_HERE
```

Install the project dependencies:
```
npm install # or yarn install
webpack
```

Run the server:
```
node server.js
```

## License
[MIT](https://github.com/omgimanerd/nycurl/blob/master/LICENSE)
