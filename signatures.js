const spicedPg = require("spiced-pg");

const { username, password } = require("./data.json");

const database = "signatures";

const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);

function createSignature({ firstname, lastname, signature }) {
    //console.log(firstname, lastname, signature);
    return db.query(
        /* "INSERT INTO signatures (firstname, lastname, signature) VALUES ($1, $2, $3)",
        [firstname, lastname, signature] */
        "INSERT INTO signatures (firstname, lastname, signature) VALUES ($1, $2, $3) RETURNING id",
        [firstname, lastname, signature]
    );
}

function getSignatures() {
    return db.query("SELECT * FROM signatures").then((result) => result.rows);
}

function getIndividualSignature(id) {
    return db
        .query(`SELECT signature FROM signatures WHERE id = ${id}`)
        .then((result) => result.rows[0].signature)
        .catch((error) => console.log(error));
}

module.exports = { createSignature, getSignatures, getIndividualSignature };
