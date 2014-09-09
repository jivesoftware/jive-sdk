#! /bin/bash

#This script prints all unique users that have used mobile devices

#regex used to grab users names from cloudalytic json objects
USER="\"username\":\"[^\"]*\""

JSON=$(curl "https://api.jivesoftware.com/analytics/v1/export/activity?count=all&filter=activity(View)&filter=match(context.web.appID,jive%20mobile%20web,jiveios)" -H "Authorization: $SESSION")

echo ${JSON} | grep -wo "${USER}" | sort | uniq

