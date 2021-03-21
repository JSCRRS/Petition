const spicedPg = require("spiced-pg");

const database = process.env.DB || "signatures";

function getDatabaseURL() {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }
    const { username, password } = require("./data.json");
    return `postgres:${username}:${password}@localhost:5432/${database}`;
}

const db = spicedPg(getDatabaseURL());

function registerUser({ firstname, lastname, email, password_hash }) {
    return db
        .query(
            "INSERT INTO users (firstname, lastname, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id",
            [firstname, lastname, email, password_hash]
        )
        .then((result) => result.rows[0].id);
}

function createSignature({ user_id, signature }) {
    return db
        .query(
            "INSERT INTO signatures (user_id, signature) VALUES ($1, $2) RETURNING id",
            [user_id, signature]
        )
        .then((result) => result.rows[0].id);
}

function deleteSignature(id) {
    return db.query("DELETE FROM signatures WHERE user_id = $1", [id]);
}

function getAllSignedUsersDetails() {
    return db
        .query(
            `SELECT firstname, lastname, age, city, url 
            FROM users 
            FULL JOIN signatures ON users.id = signatures.user_id 
            FULL JOIN user_profiles ON users.id = user_profiles.user_id 
            WHERE signatures.signature IS NOT NULL`
        )
        .then((result) => result.rows);
}

function getSignaturesByCity(signerCity) {
    return db
        .query(
            `
            SELECT firstname, lastname, age, city, url 
            FROM users 
            JOIN signatures ON users.id = signatures.user_id 
            FULL JOIN user_profiles ON users.id = user_profiles.user_id 
            WHERE signatures.signature IS NOT NULL
            AND city ILIKE $1`,
            [signerCity]
        )
        .then((result) => result.rows);
}

function getNumberOfSignatures() {
    return db
        .query("SELECT COUNT (id) FROM signatures")
        .then((result) => result.rows[0].count)
        .catch((error) => console.log(error));
}

function getIndividualSignature(id) {
    return db
        .query("SELECT signature FROM signatures WHERE user_id = $1", [id]) //hier NICHT id außerhalb von () !!
        .then((result) => result.rows[0].signature)
        .catch((error) => console.log("please sign!:", error));
}

function getUserByEmail(email) {
    return db
        .query("SELECT * FROM users WHERE email = $1", [email])
        .then((result) => result.rows[0]);
}

function createUserProfile({ age, city, url, user_id }) {
    return db
        .query(
            "INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) RETURNING id",
            [age ? age : null, city, url, user_id]
        )
        .then((result) => result.rows[0].id);
}

function getUserById(id) {
    return db
        .query(
            `SELECT firstname, lastname, email, password_hash, age, city, url
            FROM users 
            FULL JOIN user_profiles ON user_profiles.user_id = users.id
            WHERE users.id = $1`,
            [id]
        )
        .then((result) => result.rows[0]);
}

function updateUsersTable({
    newPassword_hash,
    //password,
    firstname,
    lastname,
    email,
    //password_hash,
    user_id,
}) {
    if (newPassword_hash) {
        //vorher: password
        return db
            .query(
                `UPDATE users
            SET firstname = $1, lastname = $2, email = $3, password_hash = $4
            WHERE id = $5`,
                [firstname, lastname, email, newPassword_hash, user_id] //vorher: password
            )
            .then((result) => {
                console.log("das Password wurde AUCH geändert", result);
                result.rows[0];
            });
    }
    return db
        .query(
            `UPDATE users
        SET firstname = $1, lastname = $2, email = $3
        WHERE id = $4`,
            [firstname, lastname, email, user_id]
        )
        .then((result) => {
            console.log("Das Password wurde NICHT geändert", result);
            result.rows[0];
        });
}

function updateUserProfilesTable({ age, city, url, user_id }) {
    return db
        .query(
            `INSERT INTO user_profiles (age, city, url, user_id) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city = $2, url = $3
        RETURNING id`,
            [age ? age : null, city, url, user_id] // ternary operator: gibt es age ? wenn ja-age : wenn nein-null
        )
        .then((result) => result.rows[0].id);
}

module.exports = {
    registerUser,
    createSignature,
    getAllSignedUsersDetails,
    getNumberOfSignatures,
    getIndividualSignature,
    getUserByEmail,
    createUserProfile,
    getSignaturesByCity,
    getUserById,
    updateUsersTable,
    updateUserProfilesTable,
    deleteSignature,
};
