#! /bin/bash

#This script prints all documents in a given place and the number of times they have been liked, descending

#Turn argument url friendly
PLACE=$(perl -MURI::Escape -e 'print uri_escape($ARGV[0]);' "$1")

SUBJECT="\"subject\":\"[^\"]*\""

#This command asks the cloud analytics api for all like actions taken on documents in the specified place
JSON=$(curl "https://api.jivesoftware.com/analytics/v1/export/activity?count=all&filter=place(${PLACE})&filter=action(ACTIVITY_LIKE_DOCUMENT)" -H "Authorization: $SESSION")


#This grabs specifically the subjects of liked documents and counts duplicates. 
echo ${JSON} | grep -wo "${SUBJECT}" | sort | uniq -c | sort -rn

