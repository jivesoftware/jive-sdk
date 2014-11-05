#!/bin/bash

# Add personal access_token here:
access_token=

# Task id
task_id=

# Responsible id
responsible_id=

# Producteev API Endpoint
url="https://www.producteev.com/api/tasks/"$task_id"/responsibles/"$responsible_id

# Assign task
curl -v -X PUT $url --header "Authorization:Bearer "$access_token

# De-assign me
my_user_id=
url_2="https://www.producteev.com/api/tasks/"$task_id"/responsibles/"$my_user_id
curl -v -X DELETE $url_2 --header "Authorization:Bearer "$access_token
