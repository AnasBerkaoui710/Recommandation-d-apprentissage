-- Create database if not exists and use it
CREATE DATABASE IF NOT EXISTS ml_education;
USE ml_education;

-- 1. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 2. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    chapter VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL
);

-- 3. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option CHAR(1) NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- 4. RESULTS TABLE
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    quiz_id INT NOT NULL,
    score FLOAT NOT NULL,
    mistakes INT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- 5. RESOURCES TABLE
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chapter VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    link TEXT NOT NULL
);

-- =========================================================================
-- SEED DATA INSERTION
-- =========================================================================

-- Populate Quizzes
INSERT INTO quizzes (id, title, chapter, difficulty) VALUES
(1, 'Algebra & Linear Equations Quiz', 'Algebra', 'Easy'),
(2, 'Physics: Forces & Laws of Motion', 'Physics', 'Medium'),
(3, 'Chemistry: Atomic Structure & Bonding', 'Chemistry', 'Hard')
ON DUPLICATE KEY UPDATE title=VALUES(title), chapter=VALUES(chapter), difficulty=VALUES(difficulty);

-- Populate Quiz Questions
-- Quiz 1: Algebra
INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
(1, 'Solve for x: 3x - 7 = 8', 'x = 3', 'x = 5', 'x = 15', 'x = 1', 'B'),
(1, 'What is the slope of the line y = -2x + 5?', '5', '2', '-2', '-5', 'C'),
(1, 'If x + y = 10 and x - y = 4, what is the value of x?', '7', '6', '3', '14', 'A'),
(1, 'What is the value of 5^0?', '0', '5', '1', '-5', 'C'),
(1, 'Simplify: 2(x + 4) - 3x', '-x + 8', '5x + 8', '-x + 4', 'x + 8', 'A')
ON DUPLICATE KEY UPDATE question_text=VALUES(question_text);

-- Quiz 2: Physics
INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
(2, 'What is the SI unit of force?', 'Joule', 'Newton', 'Watt', 'Pascal', 'B'),
(2, 'According to Newton''s Second Law, Force is equal to mass multiplied by what?', 'Velocity', 'Distance', 'Acceleration', 'Time', 'C'),
(2, 'A car travels 100 meters in 5 seconds. What is its speed?', '20 m/s', '500 m/s', '10 m/s', '25 m/s', 'A'),
(2, 'What force opposes the relative motion of two surfaces in contact?', 'Gravity', 'Friction', 'Tension', 'Centripetal', 'B'),
(2, 'What is the acceleration due to gravity on Earth''s surface (approx.)?', '5.8 m/s^2', '9.8 m/s^2', '1.6 m/s^2', '12 m/s^2', 'B')
ON DUPLICATE KEY UPDATE question_text=VALUES(question_text);

-- Quiz 3: Chemistry
INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
(3, 'What is the center of an atom called?', 'Proton', 'Electron', 'Nucleus', 'Shell', 'C'),
(3, 'Which subatomic particles have a negative charge?', 'Protons', 'Neutrons', 'Electrons', 'Positrons', 'C'),
(3, 'What type of bond is formed by the sharing of electron pairs between atoms?', 'Ionic Bond', 'Covalent Bond', 'Metallic Bond', 'Hydrogen Bond', 'B'),
(3, 'What is the atomic number of Carbon?', '1', '6', '12', '8', 'B'),
(3, 'Which of these is a noble gas?', 'Oxygen', 'Hydrogen', 'Nitrogen', 'Helium', 'D')
ON DUPLICATE KEY UPDATE question_text=VALUES(question_text);

-- Populate Learning Resources (Personalized)
-- Chapter: Algebra
INSERT INTO resources (chapter, level, title, type, link) VALUES
('Algebra', 'weak', 'Introduction to Algebra - Math Antics', 'video', 'https://www.youtube.com/watch?v=NybHckSEQBI'),
('Algebra', 'weak', 'Solving Simple 1-Step Equations Worksheet', 'exercise', 'https://www.math-drills.com/algebra/algebra_missing_numbers_operations_001.php'),
('Algebra', 'weak', 'Pre-Algebra Foundation Course', 'course', 'https://www.khanacademy.org/math/pre-algebra'),
('Algebra', 'medium', 'Solving Multi-Step Equations Explained', 'video', 'https://www.youtube.com/watch?v=LDIiYKyvT20'),
('Algebra', 'medium', 'Systems of Linear Equations Practice Sheet', 'exercise', 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:systems-of-equations'),
('Algebra', 'medium', 'Intermediate Algebra Study Guide', 'course', 'https://openstax.org/books/intermediate-algebra-2e/pages/1-introduction'),
('Algebra', 'strong', 'Advanced Algebra and Quadratic Functions', 'video', 'https://www.youtube.com/watch?v=KzLio-767pY'),
('Algebra', 'strong', 'Challenging Linear Algebra Exercises', 'exercise', 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/'),
('Algebra', 'strong', 'MIT Linear Algebra Lecture Series', 'course', 'https://www.youtube.com/playlist?list=PL49CF3715CB72B319')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Chapter: Physics
INSERT INTO resources (chapter, level, title, type, link) VALUES
('Physics', 'weak', 'Physics 101 - Introduction to Forces', 'video', 'https://www.youtube.com/watch?v=rfeVlNL554A'),
('Physics', 'weak', 'Basic Gravity & Friction Problems', 'exercise', 'https://www.physicsclassroom.com/class/newtlaws/Lesson-2/Drawing-Free-Body-Diagrams'),
('Physics', 'weak', 'Conceptual Physics Crash Course', 'course', 'https://www.khanacademy.org/science/physics'),
('Physics', 'medium', 'Newton''s 3 Laws of Motion with Real Examples', 'video', 'https://www.youtube.com/watch?v=kKKM8Y-g7lk'),
('Physics', 'medium', 'Kinematics Equations Practice Problems', 'exercise', 'https://www.physicsclassroom.com/class/1DKin/Lesson-6/Kinematic-Equations-and-Problem-Solving'),
('Physics', 'medium', 'Classical Mechanics Introduction', 'course', 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/'),
('Physics', 'strong', 'Deep Dive: Lagrangian Mechanics and Advanced Physics', 'video', 'https://www.youtube.com/watch?v=ArfVEsVlT54'),
('Physics', 'strong', 'Newtonian Dynamics Advanced Proofs', 'exercise', 'https://www.physicsclassroom.com/calcpad/newtlaws'),
('Physics', 'strong', 'AP Physics C: Mechanics Course', 'course', 'https://apcentral.collegeboard.org/courses/ap-physics-c-mechanics')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Chapter: Chemistry
INSERT INTO resources (chapter, level, title, type, link) VALUES
('Chemistry', 'weak', 'The Nucleus & Electron Shells Explained Simply', 'video', 'https://www.youtube.com/watch?v=EM13_645m10'),
('Chemistry', 'weak', 'Labeling Atomic Structures Worksheet', 'exercise', 'https://www.sciencegeek.net/Chemistry/taters/directory.shtml'),
('Chemistry', 'weak', 'Introductory General Chemistry Course', 'course', 'https://www.khanacademy.org/science/chemistry'),
('Chemistry', 'medium', 'Types of Chemical Bonds: Covalent vs. Ionic', 'video', 'https://www.youtube.com/watch?v=QXT4OVM4vXI'),
('Chemistry', 'medium', 'Lewis Dot Structures Practice Problems', 'exercise', 'https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:molecular-and-ionic-compound-structure-and-properties'),
('Chemistry', 'medium', 'AP Chemistry Level 1 Preparation', 'course', 'https://www.khanacademy.org/science/ap-chemistry-beta'),
('Chemistry', 'strong', 'Molecular Orbitals & Quantum Chemistry Basics', 'video', 'https://www.youtube.com/watch?v=3g3g_c7x64c'),
('Chemistry', 'strong', 'Advanced Chemical Bonding Calculations', 'exercise', 'https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/'),
('Chemistry', 'strong', 'MIT Chemical Principles Lecture', 'course', 'https://www.youtube.com/playlist?list=PLUl4u3cNGP63GZ85G05m8dE0E9y_C_x1S')
ON DUPLICATE KEY UPDATE title=VALUES(title);
