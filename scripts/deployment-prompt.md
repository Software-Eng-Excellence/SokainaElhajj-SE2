
# Current Deployment Steps

- Pull from github repo
- run `npm run build`
- reload application using `pm2 start ecosystem.config.js --env production`
- check pm2 status

# Steps for Deployment

## Pre Deployment

- Create a backup of the current build
  - for the first time where there is no backups, create the backup an name it current_backup
  - for the rest of the times rename the current_backup into previous_backup and the newly built application becomes the new current_backup
- Check storage availability make sure we have at least 2GB free
- Show the health of the current deployment running

## Deployment

- pull the git updates from the main branch
- run `npm run build`
- reload the running application using `pm2` to launch the updates

## Post Deployment

- await for 10 seconds
- run a health check
- if success then output success
- else apply a rollback and run the previous_backup

## Rollback script

- check pm2 status
- safely shutdown current pm2 deployment
- restores the previous backup
- handles the pm2 management to run the backup again
- verifies the rollback is successful via health checks

## To Consider

- the output logs should be colored with emogis and verbose
- use absolute paths to prevent directory traversal issues
- backups should be stored in the app directory and not publicaly available
- Handle proper pm2 process cleanups on failure
- the scripts should be executable and not writable by others
