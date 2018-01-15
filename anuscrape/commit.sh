#!/bin/sh
# TODO add basic instructions so anyone can replicate the server

# Check if the newly scraped file does not exist. Print meaningful message and exit with failure
if [ ! -e $HOME/timetable.json ]; then
	echo Scraping failed at `date` >> $HOME/updatelog.txt
	exit 1
fi 

# Compare the newly downloaded timetable with the previous one
diff $HOME/timetable.json $HOME/anutimetable/data/timetable.json

# If new one is different or the old one does not exist, commit new one to GitHub
if [ $? -ne 0 ]; then
    echo New update found at `date` >> $HOME/updatelog.txt
    mv -f $HOME/timetable.json $HOME/anutimetable/data/
    cd $HOME/anutimetable/
    python3.6 $HOME/anutimetable/anuscrape/update_date.py
    git add *
    git commit -m "Updated on `date`"
    git push
    exit 0
else 
	echo No changes on `date` >> $HOME/updatelog.txt
	exit 1
fi
