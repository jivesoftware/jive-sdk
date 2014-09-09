#! /bin/bash

PLACE=$(perl -MURI::Escape -e 'print uri_escape($ARGV[0]);' "$1")                                                                                       
curl -XGET -H "Authorization: $SESSION" "https://api.jivesoftware.com/analytics/v1/export/activity/csv/content?filter=type(blogpost,document,question,discussion,thread)&filter=activity(view)&filter=place(${PLACE})"

