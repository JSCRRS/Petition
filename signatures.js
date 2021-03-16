const spicedPg = require("spiced-pg");

const { username, password } = require("./data.json");

const database = "signatures";

const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);

function registerUser({ firstname, lastname, email, password_hash }) {
    return db.query(
        "INSERT INTO users (firstname, lastname, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id",
        [firstname, lastname, email, password_hash]
    );
}

function createSignature({ user_id, signature }) {
    console.log("inside createSignature", user_id);
    return db
        .query(
            "INSERT INTO signatures (user_id, signature) VALUES ($1, $2) RETURNING id", //id muss zurück!
            [user_id, signature]
        )
        .then(
            (result) => result.rows[0].id // gib die ID weiter
        );
}

function getSignatures() {
    return db.query("SELECT * FROM signatures").then((result) => result.rows);
}

function getNumberOfSignatures() {
    return db
        .query("SELECT COUNT (id) FROM signatures")
        .then((result) => result.rows[0].count)
        .catch((error) => console.log(error));
}

function getIndividualSignature(id) {
    return (db.query("SELECT signature FROM signatures WHERE id = $1"), [id])
        .then((result) => result.rows[0].signature)
        .catch((error) => console.log(error));
}

module.exports = {
    registerUser,
    createSignature,
    getSignatures,
    getNumberOfSignatures,
    getIndividualSignature,
};
