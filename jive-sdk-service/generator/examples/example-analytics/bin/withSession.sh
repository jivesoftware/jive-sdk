#! /bin/bash

#This script takes in clientId and clientSecret as arguments, with the optional argument of what command to run with that session.
#Either pass a command to this script or export Session=withSession... for use in other commands

SESSION=$(curl -XPOST "https://api.jivesoftware.com/analytics/v1/auth/login?clientId=$1&clientSecret=$2")
echo $SESSION
export SESSION=$SESSION
exec $3
