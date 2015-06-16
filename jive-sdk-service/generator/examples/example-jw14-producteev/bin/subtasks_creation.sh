#!/bin/bash

# Add personal access_token here:
access_token=

# Task id
task_id=

# Producteev API Endpoint
url="https://www.producteev.com/api/tasks/"$task_id"/subtasks"

# Subtasks
subtask_1=Login
subtask_2=Signup
subtask_3=Update
subtask_4=Notifications

# array of subtasks
array=( $subtask_1 $subtask_2 $subtask_3 $subtask_4 )

# Create subtasks
for i in "${array[@]}"
do
	subtask_json='{"subtask":{"title":"'$i'","status":1}}'
	curl -v -X POST --data $subtask_json $url --header "Content-Type:application/json" --header "Authorization:Bearer "$access_token
done
