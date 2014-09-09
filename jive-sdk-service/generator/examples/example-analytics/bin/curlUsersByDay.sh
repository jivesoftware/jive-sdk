#! /bin/bash

#This script prints all user creation events that happened on the given day

YEAR=$1
MONTH=$2
DAY=$3

#replace -'s and +'s with url encoded
PARTIAL_OFFSET=${4//+/%2b}
OFFSET=${PARTIAL_OFFSET//-/%2D}

#Asks api for all create user events happening after the start of the day, before the last ms of the day. After and before are inclusive
curl "https://api.jivesoftware.com/analytics/v1/export/activity?after=${YEAR}-${MONTH}-${DAY}T00:00:00${OFFSET}&before=${YEAR}-${MONTH}-${DAY}T23:59:59.999${OFFSET}&count=all&filter=action(ACTIVITY_CREATE_USER)" -H "Authorization: $SESSION"

