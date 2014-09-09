#! /bin/bash

#This script prints all documents and the number of times they have been liked, descending

SUBJECT="\"subject\":\"[^\"]*\""

#This command asks the cloud analytics api for all like actions taken on documents
JSON=$(curl "https://api.jivesoftware.com/analytics/v1/export/activity?count=all&filter=action(ACTIVITY_LIKE_DOCUMENT)" -H "Authorization: $SESSION")


#This grabs specifically the subjects of liked documents and counts duplicates. 
echo ${JSON} | grep -wo "${SUBJECT}" | sort | uniq -c | sort -rn

