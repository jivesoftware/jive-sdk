#!/bin/bash

# Add personal access_token here:
access_token=

# Producteev API Endpoint
url=https://www.producteev.com/api/tasks

# Project id
project_id=

# Task title
task_title=Version-1.2

# Task JSON
task_json='{"task":{"title":"'$task_title'","project":{"id":"'$project_id'"}}}'

# Create a task in project
curl -v -X POST --data $task_json $url --header "Content-Type:application/json" --header "Authorization:Bearer "$access_token

# Save task id here: task_id=
