var express = require("express");
var serveStatic = require('serve-static');
var app = express();
var server = app.listen(90);
app.use(serveStatic("./static", { index: ["index.html"] }));
