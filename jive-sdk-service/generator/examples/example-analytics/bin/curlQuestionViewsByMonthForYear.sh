#! /bin/bash

#This script will not work on mac's because the date command on mac is not the same as the gnu date command.
#See http://stackoverflow.com/questions/9804966/date-command-does-not-follow-linux-specifications-mac-os-x-lion for information on why and how to fix this

#This script prints the number of views on questions for each month in a year by iterating over the months calling curlQuestionViewsByMonth.sh, grouping the cloudalytics by subject using grep, sort, and uniq commands

YEAR=$1

#regex used for grabbing subject from cloudalytics
SUBJECT="\"subject\":\"[^\"]*\""

for MONTH in {1..12}; do
  DAYS_IN_MONTH=$(date -d "$MONTH/1 + 1 month - 1 day" "+%d")
  JSON=$(./curlQuestionViewsByMonth.sh $YEAR $MONTH $DAYS_IN_MONTH)
  echo "# views | subject for month of $MONTH"
  echo ${JSON} | grep -wo "${SUBJECT}" | sort | uniq -c | sort -rn

done


