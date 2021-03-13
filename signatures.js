const spicedPg = require("spiced-pg");

const { username, password } = require("./data.json");

const database = "signatures";

const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);

function createSignature({ firstname, lastname, signature }) {
    console.log(firstname, lastname, signature);
    return db.query(
        "INSERT INTO signatures (firstname, lastname, signature) VALUES ($1, $2, $3)",
        [firstname, lastname, signature]
    );
}

function getSignatures() {
    return db.query("SELECT * FROM signatures").then((result) => result.rows);
}

module.exports = { createSignature, getSignatures };
