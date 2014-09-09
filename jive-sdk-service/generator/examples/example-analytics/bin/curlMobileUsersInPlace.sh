#! /bin/bash

#This script prints all unique users that have used mobile devices in a place

#make place name url safe
PLACE=$(perl -MURI::Escape -e 'print uri_escape($ARGV[0]);' "$1")

#regex used to grab users names from cloudalytic json objects
USER="\"username\":\"[^\"]*\""


JSON=$(curl "https://api.jivesoftware.com/analytics/v1/export/activity?count=all&filter=activity(View)&filter=match(context.web.appID,jive%20mobile%20web,jiveios)&filter=place(${PLACE})" -H "Authorization: $SESSION")

echo ${JSON} | grep -wo "${USER}" | sort | uniq

