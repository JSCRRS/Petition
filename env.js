const express = require("express");
const app = express();

app.get("/", (request, response) => {
    response.end(process.env.MESSAGE || "Hello");
});

app.listen(process.env.PORT || 8080);
