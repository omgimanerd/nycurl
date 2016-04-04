#!/usr/bin/python
# This is the app script for running the server.
# Author: alvin.lin.dev@gmail.com (Alvin Lin)

from flask import Flask
from flask import request, render_template

import sys

app = Flask(__name__)

@app.route('/')
def index():
    return '\033[01;31mHi\n'

if __name__ == '__main__':
    app.debug = '--debug' in sys.argv
    app.run()
