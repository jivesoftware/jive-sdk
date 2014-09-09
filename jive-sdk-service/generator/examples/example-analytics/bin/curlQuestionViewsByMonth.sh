#! /bin/bash

#This command returns a json object for each view on a question in the given month. If there have been a large number of views on questions, this may take a long time and print a very large amount of text.

YEAR=$1
MONTH=$2
DAYS_IN_MONTH=$3

#replace -'s and +'s with url encoded
PARTIAL_OFFSET=${4//+/%2b}
OFFSET=${PARTIAL_OFFSET//-/%2D}

#Note that in Jive, questions are threads where isQuestion is true.
#This command hits the cloud analytics api asking for each view on a thread where isQuestion is true. That returns all views on questions.
curl -XGET "https://api.jivesoftware.com/analytics/v1/export/activity?after=${YEAR}-${MONTH}-01T00:00:00${OFFSET}&before=${YEAR}-${MONTH}-${DAYS_IN_MONTH}T23:59:59.999${OFFSET}&count=all&filter=action(ACTIVITY_VIEW_THREAD)&filter=match(isQuestion,true)" -H "Authorization: $SESSION"

