# Description
This script will find the day of the year, extract that line from a file, parse the line
into an e-mail address, first name and last name and then send an e-mail to that person.  The 
script expects the input file to be comma delimited with just the three fields of e-mail  
address, first name and last name.  It will also send an e-mail to the sender telling who to 
be praying for.   

# Installation

```
npm install
```

Then create a `mailConf.json` containing a json object with a username and password for the email account. Sample json object:

```json
{
  "username": "example@gmail.com",
  "password": "mypassword",
  "from": "Example Person <example@gmail.com>",
  "csv": "members_export.csv"
}
```

# Usage

To run in test mode, use a `mailConfTest.json` file with test credentials and test csv file, and pass the `--test` option.

```
node ./ --test
```

To run in live mode

```
node ./
```
