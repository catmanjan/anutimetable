# ANU Unofficial Timetable
[![Website status](https://img.shields.io/website?down_color=red&down_message=offline&up_color=success&up_message=online&url=https%3A%2F%2Ftimetable.cssa.club&logo=microsoft-azure&logoColor=white)](https://timetable.cssa.club)
[![Build status](https://img.shields.io/github/workflow/status/anucssa/anutimetable/Build%20and%20deploy?logo=github&logoColor=white)](https://github.com/anucssa/anutimetable/actions/workflows/build_and_deploy.yml)
[![Scraper status](https://img.shields.io/github/workflow/status/anucssa/anutimetable/Scrape%20official%20timetable?logo=github&logoColor=white&label=scraper)](https://github.com/anucssa/anutimetable/actions/workflows/scrape.yml)

## About

This is an unofficial alternative timetable viewer for the Australian National University built by members of the [ANU Computer Science Students' Association](https://cssa.club/). It's available [here](https://timetable.cssa.club/). It serves as an up-to-date (automatically updated each day), fast, easy to use alternative to the [official timetable](http://timetabling.anu.edu.au/sws2022/). It replaces the *old* unofficial timetable [here](https://anutimetable.com/) which has not been updated for 2022.

## Development

**Components:**
* A React.js front-end in `/src` and `/public`. It's hosted as an Azure Static Web App by @pl4nty (free tier). Commits to master are deployed to timetable.cssa.club minutes later via a GitHub Action. Commits to open PR's are pushed to staging URL's for testing.
* A Python scraping script in `scraper` inherited from anutimetable.com that scrapes the official ANU timetable website. It is run once a day by a GitHub Action and the results are saved to `public/timetable*.json`.
* Several Azure functions in `/api` hosted by @pl4nty (free tier plan). These generate useful data on the fly like the calendar exports (`GetICS`) which can be linked to your calendar software (so they automatically update) or downloaded (as an ICS file).

**Local development:**
* First time setup
    * Install `node`
    * Navigate to the root of the repo and run `npm ci`
    * Navigate to the `api` subfolder and run `npm ci` again
* Running it
    * In one terminal navigate to the `api` subfolder and run `npm start`
    * In another terminal navigate to the root and run `npm start`
    * Once it stops showing new information open http://localhost:3000 in your browser

**Future directions:**
* Move away from Azure functions (to client side logic and GitHub Actions where possible)
* The [Class Allocation Project](https://services.anu.edu.au/planning-governance/current-projects/class-allocation-project) team intend to roll out a new timetabling experience in semester 2 2022 or 2023. Once this transition is complete this project will be archived or rewritten as the Python scraper will be obsolete.

**Contributing:**
* If you would like to contribute bug reports or to the development, please join the [CSSA Discord server](https://cssa.club/discord) and chat with us in the #timetable channel

## Changelog

### 2022-01-13
- Another rewrite in React thanks to [@pl4nty](https://github.com/pl4nty)
- Migrated into the [ANU Computer Science Students' Association](https://cssa.club/)'s [GitHub organisation](https://github.com/anucssa) for ongoing maintenance
- Deployed to https://timetable.cssa.club/

### 2021-10-24
- Calendar file generator (ICS/webcal) thanks to [@pl4nty](https://github.com/pl4nty), available at `/api/GetICS` eg `/api/GetICS?COMP2310_S2` or `/api/GetICS?COMP2310_S2=ComA 01,COMP2310_S2=ComB 01`

### 2021-07-17
- Integration with existing scraper and frontend fixes thanks to [@OliverBalfour](https://github.com/OliverBalfour)

### 2021-04-18
- Frontend rewritten in React with ANU's official API and GitHub Actions thanks to [@pl4nty](https://github.com/pl4nty)

See [old_changelog.md](./old_changelog.md) for changes prior to the rewrite
