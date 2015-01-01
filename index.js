var nodemailer = require('nodemailer');
var f = require('util').format;
var exec = require('child_process').exec;
var _ = require('lodash');
var Q = require('q');
var moment = require('moment');
var nconf = require('nconf');

nconf.argv();
if (nconf.get('test')) {
  nconf.file('mailConfTest.json');
}
else {
  nconf.file('mailConf.json');
}

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: nconf.get('username'),
    pass: nconf.get('password')
  }
});

var mailOptions = {
  from: nconf.get('from'),
  subject: 'Pray for Tim & Gina Matthews',
  text: "Good Morning %s,\n\n" +
    "We are so thankful that you have committed to pray for us! Pray for God to " +
    "open hearts of the people of Papua New Guinea, that they would see a need " +
    "for Him in their lives and come to know Jesus as Savior. Pray our life " +
    "verse with us: 'But seek first the kingdom and his righteousness, and all " +
    "these things will be given to you as well.' Matthew 6:33\n\n" +
    "Please let us know how we can pray for you.\n\n" +
    "Much love & blessings,\n" +
    "Tim & Gina"
};

// An integer day of the year, from 1 - 366.
var day = moment().format('DDD');

// The name of the CSV file. This will change if --test is passed.
var membersCsv = nconf.get('csv');

/**
 * Read a line from the members file for the current day.
 *
 * @returns {promise|*|Q.promise}
 */
function readLineFromFile() {
  var deferred = Q.defer();
  if (nconf.get('lastSuccess') === day) {
    deferred.reject(new Error("Today's record has already been run."));
  }

  console.log('Finding member for day %d', day);
  // Read in the appropriate line using sed.
  var command = f('sed -n "%dp" %s', day, membersCsv);
  exec(command,
    function (error, stdout, stderr) {
      if (error) {
        deferred.reject(new Error(error));
      }
      else if (_.isEmpty(stdout)) {
        deferred.reject(new Error(f('No line found for day %d.', day)));
      }
      else {
        // Split the CSV, then make sure it has three items in it.
        var record = stdout.split(',');
        if (record.length !== 3) {
          deferred.reject(new Error(record.stringify()));
        }
        var member = {
          email: record[0],
          first: record[1],
          last: record[2]
        };
        deferred.resolve(member);
      }
    });

  return deferred.promise;
}

/**
 * Send mail to the member asking for prayer.
 *
 * @param member
 * @returns {promise|*|Q.promise}
 */
function sendMail(member) {
  var deferred = Q.defer();

  mailOptions.to = member.email;
  mailOptions.text = f(mailOptions.text, member.first);
  transporter.sendMail(mailOptions,
    function(error, info) {
      if (error) {
        deferred.reject(new Error(error));
      }
      else {
        console.log('Message sent to %s %s', member.first, member.last);
        deferred.resolve(member);
      }
    });

  return deferred.promise;
}

/**
 * Send mail to the Matthews reminding them to pray for the member.
 *
 * @param member
 * @returns {promise|*|Q.promise}
 */
function sendMailUs(member) {
  var deferred = Q.defer();
  var mailOptionsUs = {
    to: mailOptions.from,
    from: mailOptions.from,
    subject: f('Prayer for %s %s', member.first, member.last),
    text: f('Today we need to be praying for %s %s - email: %s.', member.first, member.last, member.email)
  };
  transporter.sendMail(mailOptionsUs,
    function(error, info) {
      if (error) {
        deferred.reject(new Error(error));
      }
      else {
        console.log('Message sent to the Matthews.');
        deferred.resolve(member);
      }
    });

  return deferred.promise;
}

/**
 * Finish up, by storing today as a success, and then saving the file.
 */
function finish() {
  nconf.set('lastSuccess', day);
  nconf.save(function(err) {
    if (err) {
      console.error('Unable to save progress to disk!');
      process.exit(1);
    }
    console.log('Saved progress to disk.');
  });
}

// Read the line from the file, and then pass to the other functions.
readLineFromFile()
  .then(sendMail)
  .then(sendMailUs)
  .done(finish);
