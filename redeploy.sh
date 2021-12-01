#/bin/bash

git fetch origin master
git reset --hard origin/master
git pull origin master --force
npm install

