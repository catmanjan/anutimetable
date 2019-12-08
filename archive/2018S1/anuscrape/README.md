# anuscrape

## JavaScript version
* Browse to http://timetabling.anu.edu.au/sws2018/
* Select "Courses"
* Run scrape.js in the browser console

## PHP version
* This version is best for scrapping outside ANU, because when using a non-ANU network the scraping speed will become ridiculously slow.
* This version sets up your own ANU server and scraping internally
* First, `ssh u0000000@partch.anu.edu.au` to login into your ANU Partch server
* Upload `scrape.php` and `simple_html_dom.php` under `~/public_html`
* Execute `php scrape.php` on your server
* Profits!!
* After scraping, a file `timetable.json` will be generated under the same folder as `scrape.php`, remember to give it permission to read if you want to save it through `http://partch.anu.edu.au.virtual.anu.edu.au/~u0000000/`


![PHP Scraping](http://i.imgur.com/73Dfax0.png)


## Automated scraping server setup (Linux setup)

##### (Does not work on Partch)

1. Copy this repo to the HOME directory of your machine (`cd ~` or `cd $HOME`).
2. Configure `crontab` to run the required scripts:
    * Install `crontab` if you need to, but for most machines it should be there by default.
    * Navigate to `anutimetable/anuscrape/` and run `crontab schedule_scraping.bak`
    * You can modify the frequency of scraping by running `crontab -e`, the crontab format is explained nicely [here](http://www.adminschoice.com/crontab-quick-reference). 
 
3. Install Python3.6 and PHP 7.0.25:
    * These versions are confirmed to work fine, but other versions might also be suitable. As long as you can run `update_date.py` and `scrape.php`, you're fine.

4. Give executable permissions to the programs (Optional, if getting permission errors):
    * `chmod +x anutimetable/commit.sh anutimetable/update_date.py`
    
5. Set up git:
    * Ensure you're on the master branch, and it is up to date. Otherwise, the shell script won't be able to commit the changes.
    
These steps should be sufficient to get a server up and running (even though more than one would be redundant). Keep in mind, pull requests still need to be done manually. Contact [@EMorf](https://github.com/EMorf) if you need help.


