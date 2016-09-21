backup-mongodb
==============

This module will backup mongodb into .json files, archive it into .zip file that is then send to provided emil address using nodemailer automatically

Motivation
==========

I wrote this module as a simple straight forward module for backing up mongodb. I also realized that I need the backup file in an external environment other than the server (which of course is the essence of backup). Thus, I added the feature to zip the output .json files and then send them to an email using (nodemailer)[].
From the email, I can access the files and use them for restoration anytime later.

The backup output files are named in the format
dbName_day_month_year.hour.mins.second
e.g. test_21_9_16.4.33.0


This makes it easy to know which file is the latest backup and for reference sake


**After using this module to create a backup, you can use the accompanying module (backup-mongodb-restorer)[https://github.com/SeunMatt/backup-mongodb] to restore the .zip file to the database**

Please read on to get full understanding of how it works.

Installation
============
> npm install -save backup-mongodb


Usage Example
==============

Without Email Configuration
---------------------------

~~~javascript

var dbUri = "mongodb://127.0.0.1:27017/test"; //"mongodb://127.0.0.1:27017/test";
var basePath = "./backup";
var Backup = require("backup-mongodb");

new Backup(dbUri, basePath).backup();

//optionally you can call new Backup(dbUri, basePath).backup(done);
//where done is the callback to be called when done

~~~

With Email Configuration
------------------------

~~~javascript

var dbUri = "mongodb://127.0.0.1:27017/test"; //"mongodb://127.0.0.1:27017/test";
var basePath = "./backup";
var Backup = require("backup-mongodb");

//========= email configs ========

var emailSubject = "DATABASE BACKUP"; 
var emailText = "This email contains an attachment of the backup of your mongodb in zip format";

var smtpOptions = {
 	host: "your.mailserver.hostdomain.com",
	port: "the port on which your mail server is running",
	auth: {
		user: "your.username@your.mailhost.com",
		pass: "your password for the email user above"
	   },
	tls : { 
		rejectUnauthorized: false,
		secureProtocol: "TLSv1_method"
		}
	};


	var emailOptions = {
		from: "sender.email@something.com",
		to: "receiver.email@something.com",
		subject: emailSubject,
		text: emailText
	}

//======== now do the backup ==========

new Backup(dbUri, basePath, smtpOptions, emaiOptions).backup();

//optionally you can call new Backup(dbUri, basePath).backup(done);
//where done is the callback to be called when done

~~~


NOTE:
-----
	* To know more about the smtpOptions and emailOptions, kindly head over to the docs of
 	  (nodemailer)[] project.

	* You have to suplly both the smtpOptions and emailOptions for your zip file to be sent to the 			designated email address.


API Reference
=============

params
------

* dbUri [required]: the uri of the desired database

* basePath: The output folder e.g. "./backup"

* smtpOptions [required for email] {
		host: "your.mailserver.hostdomain.com",
		port: "the port on which your mail server is running",
		auth: {
			user: "your.username@your.mailhost.com",
			pass: "your password for the email user above"
			},
		tls : { 
			//optional but useful config for non-secure/secure connection
			rejectUnauthorized: false,
			secureProtocol: "TLSv1_method"
		}	
	}

* emailOptions [required for email] {
		from: "sender.email@something.com",
		to: "receiver.email@something.com",
		subject: "Email Subject",
		text: "Email Body text"
	}


Note
----
* Always check your spam folder for emails sent as some may end up there. Which you can mark as not spam for future cases

* Please I strongly recommend, if you haven't yet, that you go and read the (nodemailer)[] documentation for more understanding of the email config options


Test
=====
> clone this git repo and cd into it.
>
> then run $ npm install to install all the dependencies
>
> then run the command $ npm test to run the tests

Note:

 * You will need to have [make](http://www.equation.com/servlet/equation.cmd?fa=make) installed on your system to run the test for windows
 
 * If you want to run on other OS other than windows, you might want to 
 Open the makefile in the project root dir and then change the path separator in
 .\node_modules\.bin\mocha


Contributors
============
Author: Seun Matt (twitter @SeunMmatt2)

To contribute to this project kindly create a pull request. Open an issue for discussion for the 
added feature(s)

LICENSE
========
[MIT License](https://github.com/SeunMatt/backup-mongodb/blob/master/LICENSE)

