-- Connect to the database
\c thedaninfamily

DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS members;

-- Create members table
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20),
    birthdate DATE,
    father_id INTEGER REFERENCES members(id),
    mother_id INTEGER REFERENCES members(id),
    spouse_id INTEGER REFERENCES members(id)
);

-- Create events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id),
    event_date DATE NOT NULL,
    event_type VARCHAR(100) NOT NULL
);

-- First, insert all members with NULL for parent/spouse ids
INSERT INTO members (name, role, birthdate, father_id, mother_id, spouse_id) VALUES
('Alon', 'Parent', '1962-01-12', NULL, NULL, NULL),
('Tova', 'Parent', '1961-12-01', NULL, NULL, NULL),
('Roy', 'Child', '1990-01-02', NULL, NULL, NULL),
('Amit', 'Child', '1994-02-26', NULL, NULL, NULL),
('Maya', 'Child', '1998-12-08', NULL, NULL, NULL),
('Jozi', 'Child-in-law', '1992-08-16', NULL, NULL, NULL),
('Nofar', 'Child-in-law', '1989-11-24', NULL, NULL, NULL),
('Liad', 'Child-in-law', '1994-07-03', NULL, NULL, NULL),
('Yuval', 'Grandchild', '2023-01-13', NULL, NULL, NULL),
('Shaked', 'Grandchild', '2023-08-31', NULL, NULL, NULL),
('Agam', 'Grandchild', '2024-11-20', NULL, NULL, NULL);

-- Then, update parent/spouse ids using subqueries
UPDATE members SET father_id = (SELECT id FROM members WHERE name = 'Alon') WHERE name IN ('Roy', 'Amit', 'Maya');
UPDATE members SET mother_id = (SELECT id FROM members WHERE name = 'Tova') WHERE name IN ('Roy', 'Amit', 'Maya');
UPDATE members SET spouse_id = (SELECT id FROM members WHERE name = 'Tova') WHERE name = 'Alon';
UPDATE members SET spouse_id = (SELECT id FROM members WHERE name = 'Alon') WHERE name = 'Tova';
UPDATE members SET spouse_id = (SELECT id FROM members WHERE name = 'Jozi') WHERE name = 'Roy';
UPDATE members SET spouse_id = (SELECT id FROM members WHERE name = 'Roy') WHERE name = 'Jozi';
UPDATE members SET spouse_id = (SELECT id FROM members WHERE name = 'Nofar') WHERE name = 'Amit';
UPDATE members SET spouse_id = (SELECT id FROM members WHERE name = 'Amit') WHERE name = 'Nofar';
UPDATE members SET spouse_id = (SELECT id FROM members WHERE name = 'Liad') WHERE name = 'Maya';
UPDATE members SET spouse_id = (SELECT id FROM members WHERE name = 'Maya') WHERE name = 'Liad';
UPDATE members SET father_id = (SELECT id FROM members WHERE name = 'Roy') WHERE name = 'Yuval';
UPDATE members SET mother_id = (SELECT id FROM members WHERE name = 'Jozi') WHERE name = 'Yuval';
UPDATE members SET father_id = (SELECT id FROM members WHERE name = 'Amit') WHERE name = 'Shaked';
UPDATE members SET mother_id = (SELECT id FROM members WHERE name = 'Nofar') WHERE name = 'Shaked';
UPDATE members SET father_id = (SELECT id FROM members WHERE name = 'Roy') WHERE name = 'Agam';
UPDATE members SET mother_id = (SELECT id FROM members WHERE name = 'Jozi') WHERE name = 'Agam';

-- Insert data into events table
INSERT INTO events (member_id, event_date, event_type) VALUES
((SELECT id FROM members WHERE name = 'Alon'), '1990-03-21', 'Wedding date'),
((SELECT id FROM members WHERE name = 'Roy'), '2020-05-22', 'Wedding date'),
((SELECT id FROM members WHERE name = 'Amit'), '2022-05-07', 'Wedding date'),
((SELECT id FROM members WHERE name = 'Maya'), '2024-06-07', 'Wedding date'),
((SELECT id FROM members WHERE name = 'Roy'), '2019-03-12', 'University Graduation'),
((SELECT id FROM members WHERE name = 'Maya'), '2023-06-12', 'University Graduation');
