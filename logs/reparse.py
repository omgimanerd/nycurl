#!/usr/bin/env python3

import json		
		
with open('analytics.log') as f:		
    with open('out.log', 'w') as f2:		
        for line in f:		
            obj = json.loads(line.strip())
            try:
                obj['responseTime'] = float(obj.get('responseTime', 0))
            except:
                obj['responseTime'] = 0
            f2.write(json.dumps(obj) + '\n')
