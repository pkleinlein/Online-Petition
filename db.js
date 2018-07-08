
const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:paul-:postgres@localhost:5432/signatures");
const bcrypt = require("bcryptjs");


exports.signSignature = function (user_id, first, sur, sig){
    return db.query('INSERT INTO signatures (user_id, first, sur, sig) VALUES ($1, $2, $3, $4) RETURNING id', [user_id, first, sur, sig]);
};
exports.updateProfile = function(city, age, pet, userId){
    return db.query('INSERT INTO user_profiles (city, age, pet, user_id) VALUES ($1, $2, $3, $4)', [city, age, pet, userId]);
};
exports.getSignatureById = function (sigId) {
    return db.query(`SELECT sig FROM signatures WHERE id =$1`, [sigId]);
};
exports.getProfile = function(id) {
    return db.query(`
        SELECT *
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE user_id = $1
        `, [id]);
};
exports.updateUser = function (first, sur, email, password, user_id) {
    return db.query (`
        UPDATE users
        SET first = $1, sur = $2, email = $3, password = $4
        WHERE id = $5
        `, [first, sur, email, password, user_id]);
};

exports.updateUserProfile = function (age, city, pet, user_id) {
    return db.query(`
            UPDATE user_profiles
            SET age = $1, city = $2, pet = $3
            WHERE user_id = $4
            `, [age, city, pet, user_id]);
};

exports.getSigners = function () {
    return db.query(`SELECT first, sur FROM signatures`);
};
exports.updateUserOutPassword = function (first, sur, email,  user_id) {
    return db.query (`
        UPDATE users
        SET first = $1, sur = $2, email = $3
        WHERE id = $4
        `, [first, sur, email, user_id]);
};
exports.register = function (first, sur, email, password) {
    return db.query(
        `INSERT INTO users (first, sur, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first, sur`,
        [first, sur, email, password]
    );
};
exports.getUserByEmail = function (email) {
    return db.query(`SELECT * FROM users WHERE email = $1`, [email]);
};
exports.getSigId = function (id) {
    return db.query(`SELECT * FROM signatures WHERE user_id = $1`, [id]);
};
exports.sigFind = function (sigId) {
    return db.query(`SELECT signatures FROM signatures WHERE id = $1`, [sigId]);
};
exports.sigFindNew = function (sigId) {
    return db.query(`SELECT id, sig FROM signatures WHERE user_id = $1`, [
        sigId
    ]);
};
exports.hashPassword = function (plainTextPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
                return reject(err);
            }
            console.log(salt);
            bcrypt.hash(plainTextPassword, salt, function(err, hash) {
                if (err) {
                    return reject(err);
                }

                resolve(hash);
            });
        });
    });
};

// hashPassword("monkey").then(hash => {
//     console.log(hash);
// });

exports.checkPassword = function (textEnteredInLoginForm, hashedPasswordFromDatabase) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(
            textEnteredInLoginForm,
            hashedPasswordFromDatabase,
            function(err, doesMatch) {
                if (err) {
                    reject(err);
                } else {
                    resolve(doesMatch);
                }
            }
        );
    });
};
