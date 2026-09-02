import { getDb, queryAll, runExec } from '../db/connection.js';

export async function getAllCourses() {
  const db = await getDb();
  const courses = queryAll(db, 'SELECT * FROM courses ORDER BY created_at ASC');
  const modules = queryAll(db, 'SELECT * FROM modules ORDER BY sort_order ASC');
  const lessons = queryAll(db, 'SELECT * FROM lessons ORDER BY sort_order ASC');

  return courses.map(course => {
    const courseModules = modules
      .filter(m => m.course_id === course.id)
      .map(module => ({
        ...module,
        lessons: lessons.filter(l => l.module_id === module.id),
      }));

    return {
      ...course,
      modules: courseModules,
    };
  });
}

export async function createCourse(data: {
  title: string;
  description?: string;
  status?: string;
  videoUrl?: string;
  notes?: string;
  moduleTitle?: string;
  lessonTitle?: string;
  expectedQuery?: string;
}) {
  if (!data.title) {
    throw new Error('Course title is required');
  }

  const db = await getDb();
  const courseId = 'c' + Date.now();
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000);

  runExec(db, `
    INSERT INTO courses (id, title, slug, description, enrolled_count, progress_percent, status)
    VALUES (?, ?, ?, ?, 0, 0, ?)
  `, [courseId, data.title, slug, data.description || '', data.status || 'Published']);

  // Create default module
  const moduleId = 'm' + Date.now();
  runExec(db, `
    INSERT INTO modules (id, course_id, title, sort_order)
    VALUES (?, ?, ?, 1)
  `, [moduleId, courseId, data.moduleTitle || '1. Getting Started']);

  // Create initial lesson with video and notes
  const lessonId = 'l' + Date.now();
  const notesContent = data.notes || `# Study Notes: ${data.lessonTitle || 'Introduction'}\n\n- Welcome to ${data.title}.\n- Review the video lecture and practice query execution in the SQL workbench.`;
  const video = data.videoUrl || 'https://www.youtube-nocookie.com/embed/HXV3zeRR3h4';

  runExec(db, `
    INSERT INTO lessons (
      id, module_id, title, lesson_tag, duration, video_url, notes,
      core_concept, syntax_example, initial_query, expected_query, task_description, sort_order
    )
    VALUES (?, ?, ?, 'Lesson 1.1', '10:00', ?, ?, ?, ?, ?, ?, ?, 1)
  `, [
    lessonId,
    moduleId,
    data.lessonTitle || 'Introduction to ' + data.title,
    video,
    notesContent,
    `Learn the fundamental principles of ${data.title}.`,
    'SELECT * FROM sandbox_users LIMIT 5;',
    '-- Write your query below\nSELECT * FROM sandbox_users;',
    data.expectedQuery || 'SELECT * FROM sandbox_users',
    `Master ${data.title} query operations and dataset exploration.`
  ]);

  return { success: true, courseId, moduleId, lessonId };
}

export async function addLessonToModule(moduleId: string, lessonData: {
  title: string;
  videoUrl?: string;
  notes?: string;
  coreConcept?: string;
  syntaxExample?: string;
  initialQuery?: string;
  expectedQuery?: string;
  duration?: string;
}) {
  const db = await getDb();
  const lessonId = 'l' + Date.now();

  runExec(db, `
    INSERT INTO lessons (
      id, module_id, title, lesson_tag, duration, video_url, notes,
      core_concept, syntax_example, initial_query, expected_query, task_description, sort_order
    )
    VALUES (?, ?, ?, 'Lesson', ?, ?, ?, ?, ?, ?, ?, 'Interactive lesson task', 99)
  `, [
    lessonId,
    moduleId,
    lessonData.title,
    lessonData.duration || '08:00',
    lessonData.videoUrl || 'https://www.youtube-nocookie.com/embed/HXV3zeRR3h4',
    lessonData.notes || '',
    lessonData.coreConcept || 'Core SQL principles.',
    lessonData.syntaxExample || 'SELECT * FROM table_name;',
    lessonData.initialQuery || 'SELECT * FROM sandbox_users;',
    lessonData.expectedQuery || 'SELECT * FROM sandbox_users',
  ]);

  return { success: true, lessonId };
}
