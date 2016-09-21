
var expect = require("chai").expect;
var dbUri = "mongodb://127.0.0.1:27017/test"; //"mongodb://127.0.0.1:27017/test";
var basePath = "./backup";
var Backup = require("../index.js");


// var dbAuth = {user: "seun", pass: "matthewE1"}

describe("Backup", function() {

	it("Performs backup of mongodb with no email config", function(done) {
		expect( function() { new Backup(dbUri, basePath).backup(done);  }).to.not.throw(Error);
		
	});


	it("Performs backup with email config", function(done) {

		//=======WITH EMAIL CONFIG ===========
		// UN COMMENT THE FOLLOWING TO USE WITH MAIL CONFIG


		var emailSubject = "DATABASE BACKUP"; 
		var emailText = "This email contains an attachment of the backup of your mongodb in zip format";

		var instruction = "To run the section for backup with email config of the test, open the test/test.js and supply your " +
		" smtpOptions and emailOptions then uncomment the line " +
		" expect( " +
		"	function() { " +
		"		new Backup(dbUri, basePath, smtpOptions, emailOptions).backup(done) " +
		"	}).to.not.throw(Error); " ;

		console.log("\n\n =====================\n" + instruction);
		

		
	// var smtpOptions = {
 // 	host: "your.mailserver.hostdomain.com",
	// port: "the port on which your mail server is running",
	// auth: {
	// 	user: "your.username@your.mailhost.com",
	// 	pass: "your password for the email user above"
	//    },
	// tls : { 
	// 	rejectUnauthorized: false,
	// 	secureProtocol: "TLSv1_method"
	// 	}
	// };


	// var emailOptions = {
	// 	from: "sender.email@something.com",
	// 	to: "receiver.email@something.com",
	// 	subject: emailSubject,
	// 	text: emailText
	// }

		// expect( 
		// 	function() { 
		// 		new Backup(dbUri, basePath, smtpOptions, emailOptions).backup(done)
		// 	}).to.not.throw(Error);


		done();

	});


});