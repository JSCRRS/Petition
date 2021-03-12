const express = require("express");
const handlebars = require("express-handlebars");
const path = require("path");

const app = express();
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.use(express.static(path.join(__dirname, "public")));

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.get("/", (request, response) => {
    response.render("register");
});

app.post("/register", (request, response) => {
    const { firstName, lastName } = request.body;

    let error;
    if (!firstName || !lastName) {
        error = "You forgot some details";
    }
    response.render("signed");
});

app.get("/signed", (request, response) => {
    response.render("signed");
});

app.get("/allSigners", (request, response) => {
    response.render("allSigners");
});

app.listen(8080);
