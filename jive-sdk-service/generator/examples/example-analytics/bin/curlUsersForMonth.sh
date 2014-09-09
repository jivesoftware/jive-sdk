#! /bin/bash

#This script uses the curlUsersByDay.sh script to get number of created users by day for each day in the given month

YEAR=$1
MONTH=$2
#replace -'s and +'s with url encoded
PARTIAL_OFFSET=${3//+/%2b}
OFFSET=${PARTIAL_OFFSET//-/%2D}

DAYS_IN_MONTH=$(date -d "$MONTH/1 + 1 month - 1 day" "+%d")                                                                                           

for ((DAY=1;$DAY<=$DAYS_IN_MONTH;DAY++))
do
        JSON=$(./curlUsersByDay.sh ${YEAR} ${MONTH} ${DAY} ${OFFSET})
	COUNT=$(echo ${JSON} | grep -wo "ACTIVITY_CREATE_USER" | sort | uniq -c)
	echo "Number of users created on ${DAY}: ${COUNT}"
done

