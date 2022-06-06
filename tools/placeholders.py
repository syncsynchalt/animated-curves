#!/usr/bin/env python3

import sys
import re
import string
import random

def alt_filename(display):
    f = ''.join(random.choices(string.digits, k=6))
    return 'math/%s-%s.svg' % (display[0], f)

for line in sys.stdin:
    matchlist = re.split(r'(<math[^>]*>)', line, 0, re.IGNORECASE)
    for s in matchlist:
        if s[0:5] == '<math' and 'data-alt' not in s:
            if re.search(r'display *= *"?block', s):
                display = 'block'
            else:
                display = 'inline'
            sys.stdout.write(s[0:-1])
            sys.stdout.write(' data-alt="%s 0 0"' % alt_filename(display))
            sys.stdout.write(s[-1:])
        else:
            sys.stdout.write(s)
