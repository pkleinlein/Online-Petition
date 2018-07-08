CREATE TABLE user_profiles(
    id SERIAL PRIMARY KEY,
    age INTEGER,
    city VARCHAR(200),
    pet VARCHAR(250),
    user_id INTEGER REFERENCES users(id) NOT NULL
);
