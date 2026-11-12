-- Manual alternative to setup-database.ps1. Run as MySQL root, e.g.
--   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < context\setup\create-database.template.sql
-- Replace CHANGE_ME with a strong password first, and put the same password in
-- config/application.properties (see application.properties.example).
-- Safe to re-run.

CREATE DATABASE IF NOT EXISTS mobinest CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'mobinest_app'@'localhost' IDENTIFIED BY 'CHANGE_ME';
ALTER USER 'mobinest_app'@'localhost' IDENTIFIED BY 'CHANGE_ME';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES ON mobinest.* TO 'mobinest_app'@'localhost';
FLUSH PRIVILEGES;

-- Tables are created by Flyway when the API starts (src/main/resources/db/migration).
-- To reset everything:  DROP DATABASE mobinest;  then run this script again and restart the API.
