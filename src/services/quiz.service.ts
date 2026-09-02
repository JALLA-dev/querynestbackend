import { getDb, queryAll, queryOne, runExec } from '../db/connection.js';

export async function getAllQuizzes(category?: string) {
  const db = await getDb();
  let sql = 'SELECT * FROM quiz_questions';
  const params: any[] = [];

  if (category && category !== 'All') {
    sql += ' WHERE category = ?';
    params.push(category);
  }

  const rows = queryAll(db, sql, params);
  return rows.map((r: any) => ({
    id: r.id,
    category: r.category,
    question: r.question,
    options: JSON.parse(r.options_json || '[]'),
    correctAnswerIndex: r.correct_answer_index,
    explanation: r.explanation,
    xpPoints: r.xp_points || 25,
  }));
}

export async function submitQuizAnswers(answers: { questionId: string; selectedOption: number }[]) {
  const db = await getDb();
  const allQuizzes = queryAll(db, 'SELECT * FROM quiz_questions');
  const quizMap = new Map<string, any>();
  allQuizzes.forEach((q: any) => quizMap.set(q.id, q));

  let totalPointsEarned = 0;
  let correctCount = 0;
  const review = [];

  for (const ans of answers) {
    const question = quizMap.get(ans.questionId);
    if (!question) continue;

    const isCorrect = ans.selectedOption === question.correct_answer_index;
    if (isCorrect) {
      totalPointsEarned += question.xp_points || 25;
      correctCount++;
    }

    review.push({
      questionId: question.id,
      question: question.question,
      options: JSON.parse(question.options_json || '[]'),
      selectedOption: ans.selectedOption,
      correctOption: question.correct_answer_index,
      isCorrect,
      explanation: question.explanation,
      xpAwarded: isCorrect ? question.xp_points : 0,
    });
  }

  // Update user points
  if (totalPointsEarned > 0) {
    runExec(db, `UPDATE users SET points = points + ?, tasks_solved = tasks_solved + ? WHERE id = 'user-1'`, [totalPointsEarned, correctCount]);
    // Also record activity
    const actId = 'a' + Date.now();
    runExec(db, `
      INSERT INTO activities (id, user_name, action_type, description, time_ago, points_text, badge_type)
      VALUES (?, 'Alex', 'quiz', 'completed SQL Knowledge Check with score ' || ? || '/' || ?, 'Just now', '+' || ? || ' pts', 'quiz')
    `, [actId, correctCount, answers.length, totalPointsEarned]);
  }

  return {
    totalQuestions: answers.length,
    correctCount,
    scorePercentage: answers.length ? Math.round((correctCount / answers.length) * 100) : 0,
    totalPointsEarned,
    review,
  };
}
