#!/usr/bin/python
# This script handles the fetching of data from the NY Times API.
# Author: alvin.lin.dev@gmail.com (Alvin Lin)

import requests
import os

class ApiAccessor:

    BASE_URL = "http://api.nytimes.com/svc/topstories/v1/%s.json"
    SECTIONS = ['home', 'world', 'national', 'politics', 'nyregion', 'business',
                'opinion', 'technology', 'science', 'health', 'sports', 'arts',
                'fashion', 'dining', 'travel', 'magazine', 'realestate']

    def __init__(self, key):
        self.key = key

    @staticmethod
    def create():
        key = os.environ['NYTIMES_TOP_STORIES_API_KEY']
        return ApiAccessor(key)

    def fetch(self, section='home'):
        if section not in ApiAccessor.SECTIONS:
            raise ValueError('Not a valid section to query')
        params = {
            'api-key': self.key
        }
        response = requests.get(ApiAccessor.BASE_URL % section, params=params)
        return response.json().get('results')

if __name__ == '__main__':
    api = ApiAccessor.create()
    data = api.fetch('technology')
    print [d['section'] + ' ' + d['subsection'] for d in data]
