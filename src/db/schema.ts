import { queryAll } from './connection.js';

export function initSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL DEFAULT 'password123',
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      points INTEGER DEFAULT 1250,
      streak_days INTEGER DEFAULT 7,
      completed_courses INTEGER DEFAULT 2,
      tasks_solved INTEGER DEFAULT 45
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      enrolled_count INTEGER DEFAULT 0,
      progress_percent INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      sort_order INTEGER DEFAULT 1,
      FOREIGN KEY(course_id) REFERENCES courses(id)
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      lesson_tag TEXT,
      duration TEXT,
      video_url TEXT,
      notes TEXT,
      core_concept TEXT,
      syntax_example TEXT,
      initial_query TEXT,
      expected_query TEXT,
      task_description TEXT,
      sort_order INTEGER DEFAULT 1,
      FOREIGN KEY(module_id) REFERENCES modules(id)
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_answer_index INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      xp_points INTEGER DEFAULT 25
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      lesson_name TEXT,
      module_name TEXT,
      duration TEXT NOT NULL,
      size_mb REAL DEFAULT 120.5,
      thumbnail TEXT,
      video_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      time_ago TEXT NOT NULL,
      points_text TEXT,
      badge_type TEXT DEFAULT 'quiz'
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      rank INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      points INTEGER NOT NULL,
      avatar_url TEXT,
      is_current_user INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sandbox_users (
      id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      department TEXT,
      salary INTEGER
    );

    CREATE TABLE IF NOT EXISTS sandbox_orders (
      order_id INTEGER PRIMARY KEY,
      customer_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      order_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sandbox_departments (
      dept_id INTEGER PRIMARY KEY,
      dept_name TEXT NOT NULL,
      location TEXT NOT NULL,
      head_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sandbox_products (
      product_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL,
      supplier TEXT NOT NULL
    );
  `);

  try {
    const lessonCols = queryAll(db, 'PRAGMA table_info(lessons)').map((c: any) => c.name);
    if (!lessonCols.includes('notes')) {
      db.exec('ALTER TABLE lessons ADD COLUMN notes TEXT;');
    }
    const userCols = queryAll(db, 'PRAGMA table_info(users)').map((c: any) => c.name);
    if (!userCols.includes('password')) {
      db.exec("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'password123';");
    }
  } catch (err) {
    console.warn('Migration check:', err);
  }
}

export function seedDatabase(db: any) {
  const existingUsers = queryAll(db, 'SELECT count(*) as count FROM users');
  if (existingUsers.length && Number(existingUsers[0].count) > 0) {
    const quizCount = queryAll(db, 'SELECT count(*) as count FROM quiz_questions');
    if (quizCount.length && Number(quizCount[0].count) === 0) {
      seedQuizzes(db);
    }
    const prodCount = queryAll(db, 'SELECT count(*) as count FROM sandbox_products');
    if (prodCount.length && Number(prodCount[0].count) === 0) {
      seedSandboxProducts(db);
    }
    return;
  }

  db.exec(`
    INSERT OR REPLACE INTO users (id, name, email, password, avatar_url, role, points, streak_days, completed_courses, tasks_solved)
    VALUES 
    ('user-1', 'Alex (Student)', 'alex.dev@querynest.io', 'student123', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'student', 1250, 7, 2, 45),
    ('admin-1', 'Admin Sarah', 'admin@querynest.io', 'admin123', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'admin', 5000, 14, 8, 120);

    INSERT OR REPLACE INTO courses (id, title, slug, description, enrolled_count, progress_percent, status) VALUES 
    ('c1', 'SQL Fundamentals', 'sql-fundamentals', 'Master basic SQL syntax, filtering, joins, and aggregations with real dataset queries.', 840, 75, 'Published'),
    ('c2', 'Advanced JOINs & Relations', 'advanced-joins', 'Deep dive into INNER, LEFT, RIGHT, and FULL OUTER joins and multi-table relationships.', 312, 42, 'Published'),
    ('c3', 'Query Optimization & Indexing', 'query-optimization', 'Learn index tuning, query execution plans, and subquery optimization.', 0, 0, 'Draft');

    INSERT OR REPLACE INTO modules (id, course_id, title, sort_order) VALUES
    ('m1', 'c1', '1. Introduction to DBs', 1),
    ('m2', 'c1', '2. Basic Queries', 2),
    ('m3', 'c1', '3. Aggregations', 3),
    ('m4', 'c2', 'Module 1: Inner Joins', 1),
    ('m5', 'c2', 'Module 2: Outer Joins', 2);

    INSERT OR REPLACE INTO lessons (id, module_id, title, lesson_tag, duration, video_url, notes, core_concept, syntax_example, initial_query, expected_query, task_description, sort_order) VALUES
    (
      'l1', 'm2', 'The SELECT Statement', 'Lesson 2.1', '06:45',
      'https://www.youtube-nocookie.com/embed/HXV3zeRR3h4',
      '# Study Notes: The SELECT Statement\n\n### Key Takeaways:\n- SELECT specifies the columns you wish to retrieve from a table.\n- Use SELECT * only when exploring raw data.\n- Specify exact columns (first_name, email) for faster execution.',
      'The SELECT statement is the most commonly used command in SQL. It is used to retrieve data from a database. The data returned is stored in a result table, called the result-set.',
      'SELECT column1, column2 FROM table_name;',
      '-- Task: Write a query to select the first_name and email\n-- columns from the sandbox_users table.\nSELECT first_name, email FROM sandbox_users;',
      'SELECT first_name, email FROM sandbox_users',
      'Learn how to retrieve specific data columns from a database table.',
      1
    ),
    (
      'l2', 'm2', 'Filtering with WHERE', 'Lesson 2.2', '08:30',
      'https://www.youtube-nocookie.com/embed/HXV3zeRR3h4',
      '# Study Notes: Filtering Records with WHERE\n\n### Comparison Operators:\n- Equal: =\n- Greater/Less: >, <\n- In list: IN (val1, val2)\n- Pattern matching: LIKE %term%',
      'The WHERE clause is used to filter records. It is used to extract only those records that fulfill a specified condition.',
      'SELECT * FROM table_name WHERE condition;',
      '-- Task: Select all users with salary greater than 70000\nSELECT first_name, last_name, salary FROM sandbox_users WHERE salary > 70000;',
      'SELECT first_name, last_name, salary FROM sandbox_users WHERE salary > 70000',
      'Filter data with conditions.',
      2
    ),
    (
      'l3', 'm2', 'Sorting with ORDER BY', 'Lesson 2.3', '05:15',
      'https://www.youtube-nocookie.com/embed/HXV3zeRR3h4',
      '# Study Notes: Sorting with ORDER BY\n\n- By default, ORDER BY sorts ascending (ASC).\n- Use DESC to sort descending.',
      'The ORDER BY keyword is used to sort the result-set in ascending or descending order.',
      'SELECT * FROM table_name ORDER BY column1 ASC|DESC;',
      '-- Task: Order users by salary descending\nSELECT first_name, last_name, salary FROM sandbox_users ORDER BY salary DESC;',
      'SELECT first_name, last_name, salary FROM sandbox_users ORDER BY salary DESC',
      'Sort records in ascending or descending order.',
      3
    ),
    (
      'l4', 'm4', 'INNER JOIN Syntax', 'Lesson 1.2', '08:45',
      'https://www.youtube-nocookie.com/embed/HXV3zeRR3h4',
      '# Study Notes: Relational INNER JOINs\n\n- Combines rows from multiple tables where the join condition matches.\n- Format: FROM tableA INNER JOIN tableB ON tableA.id = tableB.id',
      'Learn how to combine rows from two or more tables based on a related column between them.',
      'SELECT sandbox_users.first_name, sandbox_orders.product_name, sandbox_orders.amount FROM sandbox_users INNER JOIN sandbox_orders ON sandbox_users.first_name = sandbox_orders.customer_name;',
      '-- Task: Join sandbox_users and sandbox_orders\nSELECT sandbox_users.first_name, sandbox_orders.product_name, sandbox_orders.amount\nFROM sandbox_users\nINNER JOIN sandbox_orders ON sandbox_users.first_name = sandbox_orders.customer_name;',
      'SELECT sandbox_users.first_name, sandbox_orders.product_name, sandbox_orders.amount FROM sandbox_users INNER JOIN sandbox_orders ON sandbox_users.first_name = sandbox_orders.customer_name',
      'Combine data across multiple relational tables.',
      1
    );

    INSERT OR REPLACE INTO sandbox_users (id, first_name, last_name, email, department, salary) VALUES
    (1, 'Ada', 'Lovelace', 'ada.lovelace@example.com', 'Engineering', 95000),
    (2, 'Grace', 'Hopper', 'g.hopper@example.com', 'Systems', 88000),
    (3, 'Margaret', 'Hamilton', 'm.hamilton@example.com', 'Software', 92000),
    (4, 'Alan', 'Turing', 'a.turing@example.com', 'Cryptography', 98000),
    (5, 'Katherine', 'Johnson', 'k.johnson@example.com', 'Analytics', 91000);

    INSERT OR REPLACE INTO sandbox_orders (order_id, customer_name, product_name, category, amount, status, order_date) VALUES
    (101, 'Ada', 'Cloud Server Pro', 'Hosting', 249.99, 'Delivered', '2026-08-15'),
    (102, 'Grace', 'Compiler Suite', 'DevTools', 499.00, 'Delivered', '2026-08-18'),
    (103, 'Margaret', 'Apollo Flight OS', 'Software', 1200.00, 'Shipped', '2026-08-20'),
    (104, 'Ada', 'Database License', 'Database', 750.00, 'Processing', '2026-08-25');

    INSERT OR REPLACE INTO sandbox_departments (dept_id, dept_name, location, head_count) VALUES
    (10, 'Engineering', 'San Francisco', 42),
    (20, 'Systems', 'Boston', 28),
    (30, 'Cryptography', 'New York', 15);

    INSERT OR REPLACE INTO videos (id, title, lesson_name, module_name, duration, size_mb, thumbnail, video_url) VALUES
    ('v1', 'Introduction to SELECT Statements', 'SQL Basics', 'Module 1', '12:45', 180.2, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80', 'https://www.youtube-nocookie.com/embed/HXV3zeRR3h4'),
    ('v2', 'Mastering INNER and OUTER Joins', 'Advanced Queries', 'Module 3', '24:10', 340.5, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80', 'https://www.youtube-nocookie.com/embed/HXV3zeRR3h4'),
    ('v3', 'Aggregate Functions Explained', 'Data Analysis', 'Module 4', '08:30', 95.0, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80', 'https://www.youtube-nocookie.com/embed/HXV3zeRR3h4'),
    ('v4', 'Database Normalization Basics', 'Database Design', 'Module 2', '15:05', 210.8, 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&auto=format&fit=crop&q=80', 'https://www.youtube-nocookie.com/embed/HXV3zeRR3h4');

    INSERT OR REPLACE INTO activities (id, user_name, action_type, description, time_ago, points_text, badge_type) VALUES
    ('a1', 'Sarah Jenkins', 'quiz', 'completed SELECT Basics quiz.', '10 mins ago', '+50 pts', 'check'),
    ('a2', 'Mike Chen', 'badge', 'earned the Join Master badge.', '45 mins ago', '', 'trophy'),
    ('a3', 'Alex Rivera', 'enroll', 'enrolled in SQL Fundamentals.', '2 hours ago', '', 'user'),
    ('a4', 'Elena Rostova', 'module', 'completed WHERE Clauses module.', '3 hours ago', '+20 pts', 'check');

    INSERT OR REPLACE INTO leaderboard (rank, name, points, avatar_url, is_current_user) VALUES
    (1, 'Sarah J.', 2450, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', 0),
    (2, 'Alex (You)', 1250, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', 1),
    (3, 'Michael T.', 1100, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', 0);
  `);

  seedQuizzes(db);
  seedSandboxProducts(db);
}

function seedQuizzes(db: any) {
  const q1Opts = JSON.stringify(['SELECT UNIQUE', 'SELECT DISTINCT', 'SELECT DIFFERENT', 'SELECT FILTER']);
  const q2Opts = JSON.stringify(['SELECT * FROM customers WHERE country = "USA"', 'SELECT ALL FROM customers WHERE country IS "USA"', 'EXTRACT customers WHERE country = "USA"', 'FILTER customers BY country == "USA"']);
  const q3Opts = JSON.stringify(['INNER JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN']);
  const q4Opts = JSON.stringify(['Syntax error or Cartesian Product', 'Default to matching primary keys automatically', 'Returns 0 rows', 'Duplicates only first row']);
  const q5Opts = JSON.stringify(['WHERE', 'HAVING', 'ORDER BY', 'FILTER']);

  db.exec(`
    INSERT OR REPLACE INTO quiz_questions (id, category, question, options_json, correct_answer_index, explanation, xp_points) VALUES
    (
      'q1', 'SELECT Basics',
      'Which SQL keyword is used to retrieve unique distinct values only?',
      '${q1Opts}',
      1,
      'The DISTINCT keyword in SQL eliminates duplicate rows from the query result set.',
      25
    ),
    (
      'q2', 'SELECT Basics',
      'What is the correct SQL query to retrieve all columns from the customers table where country is USA?',
      '${q2Opts}',
      0,
      'SELECT * retrieves all columns and WHERE country = "USA" filters records matching that specific condition.',
      25
    ),
    (
      'q3', 'JOINs',
      'Which JOIN type returns all records when there is a match in either left or right table?',
      '${q3Opts}',
      2,
      'FULL OUTER JOIN returns all matched rows, plus all unmatched rows from both left and right tables.',
      35
    ),
    (
      'q4', 'JOINs',
      'What happens if you perform an INNER JOIN without an ON clause in standard SQL?',
      '${q4Opts}',
      0,
      'An INNER JOIN requires an ON condition; omitting it results in a syntax error or behaves as a Cartesian Product.',
      30
    ),
    (
      'q5', 'Aggregations',
      'Which clause is used to filter aggregated grouped data produced by GROUP BY?',
      '${q5Opts}',
      1,
      'HAVING is used to filter groups created by GROUP BY (e.g. HAVING COUNT(*) > 5).',
      30
    );
  `);
}

function seedSandboxProducts(db: any) {
  db.exec(`
    INSERT OR REPLACE INTO sandbox_products (product_id, name, category, price, stock_quantity, supplier) VALUES
    (1, 'PostgreSQL Performance Guide', 'Books', 39.99, 120, 'OReilly Media'),
    (2, 'SQL Query Analyzer Tool', 'Software', 199.00, 50, 'DataTech Systems'),
    (3, 'Mechanical Coding Keyboard', 'Hardware', 129.50, 35, 'Keychron Labs'),
    (4, 'High-Speed NVMe SSD 2TB', 'Hardware', 189.99, 80, 'Samsung Electronics'),
    (5, 'Distributed Systems Architecture', 'Books', 49.99, 45, 'MIT Press');
  `);
}
