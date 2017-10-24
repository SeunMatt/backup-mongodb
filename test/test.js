
var expect = require("chai").expect;
var basePath = "./backup";
var Backup = require("../index.js");

var dbUri = "mongodb://127.0.0.1:27017/contacts_db";

//example dbUri with username and password for the database test
// var dbUri = "mongodb://username:pwd@127.0.0.1:27017/test";


describe("Backup", function() {

	it("Performs backup of mongodb with no email config", function() {
		expect( function() { new Backup(dbUri, basePath).backup();  }).to.not.throw(Error);
	});

});