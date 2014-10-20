#!/bin/bash

# Add personal access_token here:
access_token=MTQ4MmZiY2ZhMDc5NDQ1MzIyYzZhZjQ4NGYzMzBlNGRjZjlmOGNkYjJlNWQ1NTY5YmY2ZjlkZDBmYzY0YWMzYw

# Task id
task_id=5444b83bb0fa09cb73000007

# Responsible id
responsible_id=5444a4e2b1fa09787d000005

# Producteev API Endpoint
url="https://www.producteev.com/api/tasks/"$task_id"/responsibles/"$responsible_id

# Assign task
curl -v -X PUT $url --header "Authorization:Bearer "$access_token

# De-assign me
my_user_id=5390f026feca77300e000002
url_2="https://www.producteev.com/api/tasks/"$task_id"/responsibles/"$my_user_id
curl -v -X DELETE $url_2 --header "Authorization:Bearer "$access_token
