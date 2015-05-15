import express = require("express");
import http = require("http");
var serveStatic = require('serve-static');
var app = express();
var server = app.listen(90);

app.use(serveStatic("./static", { index: ["index.html"] }));
