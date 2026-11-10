'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const diagnosis = require('../js/vivant-diagnosis.js');

test('診断は自然な8問と約18種類の結果を持つ', () => {
  assert.equal(diagnosis.QUESTIONS.length, 8);
  assert.ok(diagnosis.RESULTS.length >= 16 && diagnosis.RESULTS.length <= 20);
  assert.ok(diagnosis.QUESTIONS.every(q => q.choices.length >= 3));
});

test('回答から結果と短い理由を安定して返す', () => {
  const answers = diagnosis.QUESTIONS.map(q => q.choices[0].id);
  const first = diagnosis.getResult(answers);
  assert.equal(diagnosis.getResult(answers).id, first.id);
  assert.ok(first.organization && first.role && first.reason);
});

test('18種類すべてに回答の組み合わせから到達できる', () => {
  const reachable = new Set();
  for (let mask = 0; mask < 4 ** diagnosis.QUESTIONS.length; mask++) {
    let value = mask;
    const answers = diagnosis.QUESTIONS.map(question => {
      const choice = question.choices[value % question.choices.length];
      value = Math.floor(value / question.choices.length);
      return choice.id;
    });
    reachable.add(diagnosis.getResult(answers).id);
  }
  assert.equal(reachable.size, diagnosis.RESULTS.length);
});

test('120本前後の有名映画からジャンルが重ならない3本を推薦する', () => {
  assert.ok(diagnosis.MOVIES.length >= 110 && diagnosis.MOVIES.length <= 130);
  assert.equal(new Set(diagnosis.MOVIES.map(movie => movie.id)).size, diagnosis.MOVIES.length);
  const answers = diagnosis.QUESTIONS.map(q => q.choices[1].id);
  const picks = diagnosis.recommendMovies(answers, []);
  assert.equal(picks.length, 3);
  assert.equal(new Set(picks.map(movie => movie.id)).size, 3);
  assert.equal(new Set(picks.map(movie => movie.title)).size, 3);
  assert.ok(new Set(picks.map(movie => movie.genre)).size >= 2);
  assert.ok(diagnosis.MOVIES.filter(movie => /spy|espionage|スパイ|諜報/i.test(`${movie.genre} ${movie.title}`)).length < 12);
});

test('鑑賞済み指定作品を除外し、同じ3本を繰り返さない', () => {
  const answers = diagnosis.QUESTIONS.map(q => q.choices[2 % q.choices.length].id);
  const first = diagnosis.recommendMovies(answers, []);
  const replaced = diagnosis.recommendMovies(answers, [first[0].id]);
  assert.equal(replaced.length, 3);
  assert.ok(!replaced.some(movie => movie.id === first[0].id));
});
