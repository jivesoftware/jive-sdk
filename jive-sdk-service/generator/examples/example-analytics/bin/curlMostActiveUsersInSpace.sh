#! /bin/bash

#This script gets all the actions taken in a place from the cloud analytics api, then groups them by user to print the users that have taken actions in this place along with how many actions they have taken in this place, and sorts them in descending order

#make place name url safe
PLACE=$(perl -MURI::Escape -e 'print uri_escape($ARGV[0]);' "$1")

#regex used to grab users names from cloudalytic json objects
USER="\"Username\":\"[^\"]*\""

#Gets all cloudalytic objects filtered by the given space
JSON=$(curl "https://api.jivesoftware.com/analytics/v1/export/activity?count=all&filter=place(${PLACE})&friendly=true" -H "Authorization: $SESSION")

echo "# actions | username"

#use regex to return one line per instance of "username":"<username>", count total instances per user and print that out
echo ${JSON} | grep -wo "${USER}" | sort | uniq -c | sort -rn

