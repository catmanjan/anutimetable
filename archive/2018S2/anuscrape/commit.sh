#!/bin/sh
# TODO add basic instructions so anyone can replicate the server

# Start scraping
php ./scrape.php

# Check if the newly scraped file does not exist. Print meaningful message and exit with failure
if [ ! -e ./timetable.json ]; then
    echo Scraping failed at `date` >> ./updatelog.txt
    exit 1
fi 

# Compare the newly downloaded timetable with the previous one
diff ./timetable.json ../data/timetable.json

# If new one is different or the old one does not exist, commit new one to GitHub
if [ $? -ne 0 ]; then
    echo New update found at `date` >> $HOME/updatelog.txt
    mv -f ./timetable.json ../data/
    python3 ./update_date.py
    git add *
    git commit -m "Updated on `date`"
    git push
    exit 0
else 
    echo No changes on `date` >> ./updatelog.txt
    exit 1
fi