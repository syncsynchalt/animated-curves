#!/bin/bash -e

dir=$1
tmp=/tmp/brust.$$

find "${dir}" -type f | egrep '(css|js)' | while read f; do
    base=$(basename "$f")
    mtime=$(perl -e '@s=stat "'$f'"; printf "%x\n", $s[9]')
    echo "$base $mtime" >> $tmp
done

# sort by line length so that draw.js doesn't overwrite real-draw.js
cat $tmp | perl -e 'print sort { length $a <=> length $b } <>' | while read line; do
    base=$(echo $line | cut -f1 -d ' ')
    mtime=$(echo $line | cut -f2 -d ' ')
    sed -i '' -re "s/($base)(\?t=[0-9a-f]*)?/\1?t=${mtime}/g" "$dir"/*.html "$dir"/*.js "$dir"/*/*.js
done

rm -rf "$tmp"
