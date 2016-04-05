#!/usr/bin/python
# This is the app script for running the server.
# Author: alvin.lin.dev@gmail.com (Alvin Lin)

from flask import Flask
from flask import redirect, request

from lib.api_accessor import ApiAccessor

import sys

app = Flask(__name__)
api_accessor = ApiAccessor.create()

@app.route('/')
@app.route('/<section>', methods=['GET'])
def index(section='home'):
    if 'curl' in str(request.user_agent):
        return str(api_accessor.fetch(section=section))
    return redirect('http://www.nytimes.com/pages/%s' % section, code=302)

if __name__ == '__main__':
    app.debug = '--debug' in sys.argv
    app.run()
