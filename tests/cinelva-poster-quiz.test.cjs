'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const quiz = require('../js/cinelva-poster-quiz.js');
const diagnosis = require('../js/vivant-diagnosis.js');

test('5問は既存TMDBポスターから重複なく選ぶ', () => {
  const questions = quiz.pickQuestions(diagnosis.FAVORITE_CHOICES, 5, () => 0.4);
  assert.equal(questions.length, 5);
  assert.equal(new Set(questions.map(movie => movie.tmdbId)).size, 5);
  assert.ok(questions.every(movie => movie.poster.startsWith('https://image.tmdb.org/t/p/')));
});

test('タイトル判定は全角・半角や空白の違いを吸収する', () => {
  assert.equal(quiz.matchesAnswer('ＴＯＰＧＵＮ　マーヴェリック', diagnosis.FAVORITE_CHOICES.find(movie => movie.title === 'トップガン マーヴェリック')), true);
  assert.equal(quiz.matchesAnswer('   ', diagnosis.FAVORITE_CHOICES[0]), false);
  assert.equal(quiz.matchesAnswer('別の映画', diagnosis.FAVORITE_CHOICES[0]), false);
});

test('ポスター公開回数と誤答数に応じて得点を減らし、0点を下回らない', () => {
  assert.equal(quiz.scoreForAnswer(0, 0), 3);
  assert.equal(quiz.scoreForAnswer(1, 0), 2);
  assert.equal(quiz.scoreForAnswer(2, 1), 0);
  assert.equal(quiz.scoreForAnswer(3, 5), 0);
});
