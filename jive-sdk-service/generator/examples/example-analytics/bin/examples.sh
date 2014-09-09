#! /bin/bash

CLIENT=$1 
CLIENT_SECRET=$2  

DESTINATION=$3

# set session 
export SESSION=$(./withSession.sh ${CLIENT} ${CLIENT_SECRET})   

# number of user signups per day 
./curlUsersForMonth.sh 2014 1 -07:00 > ${DESTINATION}/usersForJanuary

# signups on a specific day 
./curlUsersByDay.sh 2014 02 24 > ${DESTINATION}/usersFor_2014_02_24

# all liked documents and liked documents in group 
./curlTopLikedDocuments.sh > ${DESTINATION}/topLikeDocs 
./curlTopLikedDocumentsInGroup.sh "anayltics demo group" > ${DESTINATION}/topLikedDocsForDemoGroup 

# mobile vs desktop content views in a community 
./curlMobileUsers.sh > ${DESTINATION}/allMobileUsers 
./curlMobileUsersInPlace.sh "analytics demo group" > ${DESTINATION}/mobileUsersInDemoGroup

# leaderboard of most active users in a space 
./curlMostActiveUsersInSpace.sh "analytics demo group" > ${DESTINATION}/mostActiveUsersInDemoGroup

# monthly report of most viewed questions 
./curlQuestionViewsByMonthForYear.sh 2014 > ${DESTINATION}/questionViewsFor2014

# gets all content views on blogs, documents, questions, discussions, and threads in group
./curlViewContentInPlaceCSV.sh "analytics demo group" > ${DESTINATION}/events.csv

