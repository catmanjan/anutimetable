#!/bin/sh

# Start scraping
python3 ./scraper.py

# Check if the newly scraped file does not exist. Print meaningful message and exit with failure
if [ ! -e ./timetable.json ]; then
    echo Scraping failed at `date` >> ./updatelog.txt
    exit 1
fi 

# Compare the newly downloaded timetable with the previous one
diff ./timetable.json ../data/timetable.json

# If new one is different or the old one does not exist, commit new one to GitHub
if [ $? -ne 0 ]; then
    echo New update found at `date` >> ./updatelog.txt
    mv -f ./timetable.json ../data/
    python3 ./update_date.py
    git add ../data/timetable.json ./updatelog.txt
    git add ../README.md ../js/timetable.js ../manifest.appcache
    git status
    read -p "Are you sure you want to push these changes" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        git commit -m "Updated on `date`"
        git push
        exit 0
    fi
    echo Aborting...
    exit 1
else 
    echo No changes on `date` >> ./updatelog.txt
    exit 1
fi