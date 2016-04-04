#!/usr/bin/python
# Author: alvin.lin.dev@gmail.com (Alvin Lin)

import requests
import os

BASE_URL = "http://api.nytimes.com/svc/topstories/v1/%s.json"

class Api:
    def __init__(self, key):
        self.key = key

    @staticmethod
    def create():
        key = os.environ.get('NYTIMES_TOP_STORIES_API_KEY')
        return Api(key)

if __name__ == '__main__':
    Api.create()
