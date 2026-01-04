// saveQuestions.js
const { getPool } = require('./db');

function toLabel(i) {
  return String.fromCharCode(65 + i); // 0->A,1->B...
}

async function saveApiQuestions(payload, subject, source = 'sambanova') {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const q of payload.questions) {
      // Upsert question (subject + text unique)
      const [qRows] = await conn.execute(
        `SELECT id FROM questions WHERE subject = ? AND text = ? LIMIT 1`,
        [subject, q.text]
      );

      let questionId;
      if (qRows.length) {
        questionId = qRows[0].id;
        await conn.execute(
          `UPDATE questions SET updated_at = NOW(), source = ? WHERE id = ?`,
          [source, questionId]
        );
        // Optional: clear old options to replace with fresh set
        await conn.execute(`DELETE FROM options WHERE question_id = ?`, [questionId]);
      } else {
        const [insQ] = await conn.execute(
          `INSERT INTO questions (subject, text, source) VALUES (?, ?, ?)`,
          [subject, q.text, source]
        );
        questionId = insQ.insertId;
      }

      // Insert options
      if (!Array.isArray(q.options) || q.options.length === 0) {
        throw new Error(`Question has no options: ${q.text}`);
      }

      let correctCount = 0;
      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i];
        const label = toLabel(i);
        const isCorrect = !!opt.isCorrect;
        if (isCorrect) correctCount++;

        await conn.execute(
          `INSERT INTO options (question_id, label, text, is_correct, explanation)
           VALUES (?, ?, ?, ?, ?)`,
          [questionId, label, opt.text, isCorrect ? 1 : 0, opt.explanation || null]
        );
      }

      if (correctCount === 0) {
        throw new Error(`No correct option for question: ${q.text}`);
      }
    }

    await conn.commit();
    return { ok: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { saveApiQuestions };
