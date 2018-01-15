# anuscrape

## Automated scraping server setup
* TODO

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
