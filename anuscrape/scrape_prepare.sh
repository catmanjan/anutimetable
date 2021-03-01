#!/bin/bash


# Start scraping
python3 ./scraper.py

# Check if the newly scraped file does not exist. Print meaningful message and exit with failure
if [ ! -e ./timetable.json ]; then
    echo Scraping failed at `date` >> ./updatelog.txt
    exit 1
fi 

# Compare the newly downloaded timetable with the previous one
set +e
diff ./timetable.json ../data/timetable.json
set -e

# If new one is different or the old one does not exist, commit new one to GitHub
if [ $? -ne 0 ]; then
    echo New update found at `date` >> ./updatelog.txt
    mv -f ./timetable.json ../data/
    python3 ./update_date.py
    exit 0
else 
    echo No changes on `date` >> ./updatelog.txt
    exit 1
fi
