#!/bin/bash

# Add personal access_token here:
access_token=

# Producteev API Endpoint
url=https://www.producteev.com/api/users/me/default_project

# Fetch default project
curl -v $url --header "Authorization:Bearer "$access_token

# Save project id here: project_id=
