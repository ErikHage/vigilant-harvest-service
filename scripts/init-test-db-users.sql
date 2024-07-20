CREATE DATABASE vigilant_harvest;

CREATE USER 'vigilant_ro'@'%' IDENTIFIED BY 'test';

GRANT SELECT ON *.* TO 'vigilant_ro'@'%';

CREATE USER 'vigilant_rw'@'%' IDENTIFIED BY 'testtest';

GRANT SELECT ON *.* TO 'vigilant_rw'@'%';
GRANT INSERT ON *.* TO 'vigilant_rw'@'%';
GRANT UPDATE ON *.* TO 'vigilant_rw'@'%';
GRANT DELETE ON *.* TO 'vigilant_rw'@'%';

GRANT ALTER ON *.* TO 'vigilant_rw'@'%';
GRANT CREATE ON *.* TO 'vigilant_rw'@'%';
GRANT CREATE VIEW ON *.* TO 'vigilant_rw'@'%';
GRANT SHOW VIEW ON *.* TO 'vigilant_rw'@'%';
GRANT CREATE TABLESPACE ON *.* TO 'vigilant_rw'@'%';
GRANT DROP ON *.* TO 'vigilant_rw'@'%';

GRANT EVENT ON *.* TO 'vigilant_rw'@'%';
GRANT INDEX ON *.* TO 'vigilant_rw'@'%';
GRANT TRIGGER ON *.* TO 'vigilant_rw'@'%';

GRANT SUPER ON *.* TO 'vigilant_rw'@'%';
GRANT REFERENCES ON *.* TO 'vigilant_rw'@'%';
GRANT EXECUTE ON *.* TO 'vigilant_rw'@'%';
GRANT CREATE TEMPORARY TABLES ON *.* TO 'vigilant_rw'@'%';
GRANT CREATE ROUTINE ON *.* TO 'vigilant_rw'@'%';
GRANT ALTER ROUTINE ON *.* TO 'vigilant_rw'@'%';
