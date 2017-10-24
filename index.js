
/**
Author: Seun Matt (smatt382@gmail.com);

Project Name: backup-mongodb

Git repo: https://github.com/SeunMatt/backup-mongodb

Project Desc:

 This module will backup mongodb 
 
 and then archive it into a .zip file which will be saved in the given backup dir.

 The .zip file will be sent as an attachment to the provided email when emailOptions and smtpOptions are provided
 using nodemailer

 The backup folder has the following naming convention
 dbName_day_month_year.hour.minute.seconds
 This will make the backup to be traceable

@param(dbUri) the database uri e.g. mongodb://127.0.0.1:27017/test
@param(bPath) the base dir into which the backup files will be written in .json format
@param(smtpOptions) nodemailer smtpOptions for configuring nodemailer
@param(emailOptions) nodemailer emailOptions for configuring nodemailer

NOTE: For the .zip file to be sent as an email, both smtpOptions and emailOptions have to be provided
see the documentation of nodemailer (https://github.com/nodemailer/nodemailer) to know more about the configuration options available

LICENCE: MIT Licence (backup-mongodb/LICENSE)
*/

var mongodb = require("mongodb");
var mongoClient = require("mongodb").MongoClient;
var fs = require("fs-extra");
var EventEmitter = require("events");
var path = require("path");
var archiver = require("archiver");
var nodemailer = require("nodemailer");
var winston = require("winston");


// ========INIT EVENT EMITTER OBJ =========
var ee = new EventEmitter();

//======== SETUP WINSTON TO USE FILE TRANSPORT AND CONSOLE ============

var collectionNames = [];
var basePath;
var databaseUri;
var dbName;
var smtpConfig;
var emailConfig;
var isEmail = false; //tells whether email option is set or not
var archiveName;
var timestamp; //appended to the final folder name and .zip
var d; //global var for the test done callback



function Backup(dbUri, bPath, smtpOptions, emailOptions ) {

	if(!dbUri || !bPath) {
		winston.error("Database URI and Base directory must be provided. \nGiven Database URI = " + dbUri  + "\n and Base Path = " + bPath);
		throw new Error("Database URI and Base directory must be provided. \nGiven Database URI = " + dbUri  + "\n and Base Path = " + bPath);
	}

	databaseUri = dbUri;
	timestamp = getDateString();

	//extract the database name from the uri and use it to name the output folder
	var tmp = databaseUri.split("/");
	dbName = tmp[tmp.length - 1];
	basePath = bPath +  "/" + dbName + "_" + timestamp;

	if(smtpOptions && emailOptions) {
		isEmail = true;
		smtpConfig = smtpOptions;
		emailConfig = emailOptions;
		winston.info("SMTP and Email Config Detected");
	}
};


//====ENTRY POINT ========
Backup.prototype.backup = function(done) {

	if(done) {
		d = done;
		winston.info("Done callback specified for testing purpose");
	}

	//=====CONNECT TO THE DB========
	mongoClient.connect(databaseUri, function(error, db) {
	if(error) { winston.error("error connecting to the mongodb server:  \nDB_URI: " + databaseUri + " \nERROR_MSG: " + error); }
	else { 
			winston.info("========== BACKUP PROCEDURE INITIATED =============\n\n");
			winston.info("connected successfully to the mongodb server");
	
			//==== CREATE DIR FOR THE BACKUP FILES=========
			fs.mkdirs(basePath, function(error){
				if(error) { winston.error("error making the require base directory " + error); }
				else { 
					winston.info("dir created successfully ... ");

					//======LOAD ALL THE COLLECTIONS AVAILABLE IN THE DB ======
					getAllCollections(db);
				}
			});
		}
	});
}	




function getAllCollections(db) {
	
	// ======== LIST ALL COLLECTIONS IN THE DATABASE ======
			db.collections( function(error, collections){
			if(error) { winston.error("error getting all collections " + error); }
 			else { 
 					for(var i = 0; i < collections.length; i++) { 
 				   		var collectionName =  collections[i].s.name;

 				   		 if(collectionName !== dbName) { //this will remove the db name from the collection
                             collectionNames.push(collectionName);
                         }
 				   		  
 				   		if(i === collections.length - 1) { //the end of the loop
 				   			winston.info("Collection Names = " + collectionNames);
 				   			ee.emit("collectionScanned", db);  //signal end of scanning db for collections
 				   		}
 				   	}
 				}
			});
}



function readFromDBAndWriteOut(db, index) {

 //=======LOOP THROUGH ALL THE COLLECTIONS AND WRITE THEM OUT =======
 //    winston.info("readFromDBAndWriteOut called = " + index);
	
	if(index > collectionNames.length - 1) { //terminate the process when the index exceed the limit of the collectionNames
		winston.info("Backup complete...");
		db.close();
		ee.emit("backupComplete");

	} else { //process the collectionNames[index]

		var collectionName = collectionNames[index];
	
		db.collection(collectionName).find({}).toArray( function(error, data) {
		if(error) { winston.error("error getting data from collection " + collectionName + ": " + error); }
		else {

			// DATA FOUND SO WRITE IT OUT INCLUDING EMPTY DATA
			var fileName = basePath + "/" + collectionName + ".json";
			fs.writeJson(fileName, data, function(error){
				if(error) { winston.error("error writing file " + fileName + " " + error); }
				else {
					winston.info("file " + fileName + " written successfully");

				 	//emit signal to progress
					//this will essentially call this method again, recursively until all the collections in collectionNames [] has been processed
				 	var obj = {};
				 	obj.db = db;
                    obj.index = index += 1;
				 	ee.emit("writeNext", obj);
				}
			});
		}
	  });

    } //END else
}


function archive() {

 var fileName = basePath + "/" + dbName + "_" + timestamp + ".zip";
 archiveName = fileName; //for use in sendMailAttach; do not remove!
 var output = fs.createWriteStream(fileName);
 var archive = archiver("zip");

  output.on("close", function() {
  	winston.info(archive.pointer() + " total bytes written");
  	winston.info("zipping complete");

  	winston.info("=====================================");
  	winston.info("ALL OUTPUT FILES CAN BE FOUND IN " + basePath);
  	winston.info("=====================================");

  	ee.emit("zippingComplete");
  });

  archive.on("error", function(error){
  	winston.error("error while zipping " + error);
  });

  archive.pipe(output);

  // archive.bulk([
  // 	{ expand: true, cwd: basePath, src: ["*.json"] }
  // ]);

 archive.glob(basePath + "/*.json");

 archive.finalize();

}


function getDateString() {
	
	//helper function to get a date string in the specified format
	//day_month_year.hour.minute.second

	var date = new Date();
	var year = date.getFullYear() + "";
	
	return date.getDate() + "_" + (date.getMonth() + 1) + "_" + year.charAt(2) + year.charAt(3) + "." + date.getHours() + "." + date.getMinutes() + "." + date.getUTCSeconds();
}


function sendMailAttachment() {

 if(isEmail) {

	winston.info("Preparing to send backup file as email...");

	var smtpTransport = nodemailer.createTransport(smtpConfig);

 // attach the recently backed up .zip file to the email
	emailConfig.attachments = [{path: archiveName}];

	smtpTransport.verify(function(error, success) {
		
		if(error) { winston.error("error in mail connection config " + error); }
		
		else { 
			
			winston.info("connected successfully. Mail Config data OK sending email now ...");
				
			smtpTransport.sendMail(emailConfig, function(error, response) {
				
				if(error) { 
					winston.error("ERROR SENDING MAIL: " + error);
					smtpTransport.close();
					//=== if done callback is specified, call it here to signal end of process
					if(d) { d(); }
				 }
				
				else { 
					winston.info("EMAIL SENT successfully " + JSON.stringify(response));
					smtpTransport.close();
					//=== if done callback is specified, call it here to signal end of process
					if(d) { d(); }
				}				
				
			});

		}
	});
	
 } else {

 	winston.info("Email object is not configured therefore zip file will not be sent as attachment");
 	//=== if done callback is specified, call it here to signal end of process
	if(d) { d(); }
 }

}



//=======LISTENERS OF EVENTS EMITTED AT EACH STAGE

//========ALL COLLECTIONS HAVE BEEN SCANNED =====
ee.on("collectionScanned", function(db) {
	var obj = {};
	obj.db = db;
	obj.index = 0;
	ee.emit("writeNext", obj);
});

//=========SIGNAL TO WRITE A SINGLE COLLECTION TO BACK UP FILE
ee.on("writeNext", function(obj) {
	readFromDBAndWriteOut(obj.db, obj.index);
});


//=======SIGNAL TO ZIP ON BACKUP COMPLETION====
ee.on("backupComplete", function() {
	//once backup is complete, create a zip archive of the files
	archive();
});


ee.on("zippingComplete", function() {
	sendMailAttachment();
});


module.exports = Backup;


