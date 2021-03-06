var QUnit = require("steal-qunit");
var F = require("funcunit");

F.attach(QUnit);

QUnit.module("Basics", {
	setup: function(){
		F.open("//tests/basics.html");
	}
});


QUnit.test("Works", function(){
  F("#testing").exists("The instruction was added");
});

QUnit.module("attach", {
	setup: function(){
		F.open("//tests/attach.html");
	}
});

QUnit.test("Swaps a frament into the document", function(){
	F("#testing").exists().text(/Testing/, "Updated to the autorendered content");
	F("iframe").missing("iframe removed");
});


QUnit.module("500 errors", {
	setup: function(){
		F.open("//tests/500.html");
	}
});

QUnit.test("Does not attempt to read bytestream", function(){
	//F("#testing").exists().text(/Testing/, "Updated to the autorendered content");
	F("iframe").missing("iframe removed");
});
