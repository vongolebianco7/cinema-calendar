(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CinelvaPosterQuiz = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const POINTS_PER_POSTER = 3;

  function pickQuestions(candidates, count, random) {
    const source = (Array.isArray(candidates) ? candidates : []).filter(movie =>
      movie && typeof movie.title === 'string' && movie.title.trim() &&
      typeof movie.poster === 'string' && /^https:\/\/image\.tmdb\.org\/t\/p\/w\d+\//.test(movie.poster)
    );
    const size = Math.max(0, Math.min(source.length, Math.floor(Number(count) || 0)));
    const shuffled = source.slice();
    const rand = typeof random === 'function' ? random : Math.random;
    for (let i = shuffled.length - 1; i > 0; i--) {
      const value = Number(rand());
      const index = Math.min(i, Math.max(0, Math.floor((Number.isFinite(value) ? value : 0) * (i + 1))));
      [shuffled[i], shuffled[index]] = [shuffled[index], shuffled[i]];
    }
    return shuffled.slice(0, size);
  }

  function normalizeTitle(value) {
    return String(value || '').normalize('NFKC').toLocaleLowerCase()
      .replace(/[\s\p{P}\p{S}]+/gu, '');
  }

  function matchesAnswer(answer, movie) {
    return !!movie && normalizeTitle(answer) !== '' &&
      normalizeTitle(answer) === normalizeTitle(movie.title);
  }

  function scoreForAnswer(revealCount, wrongCount) {
    const reveals = Math.max(0, Math.min(POINTS_PER_POSTER, Math.floor(Number(revealCount) || 0)));
    const wrong = Math.max(0, Math.floor(Number(wrongCount) || 0));
    return Math.max(0, POINTS_PER_POSTER - reveals - wrong);
  }

  function mount(container, candidates, options) {
    if (!container || !container.ownerDocument) return null;
    const opts = options || {};
    const count = Math.max(1, Math.floor(Number(opts.count) || 5));
    const random = typeof opts.random === 'function' ? opts.random : Math.random;
    const questions = pickQuestions(candidates, count, random);
    const doc = container.ownerDocument;
    const el = (tag, className, label) => {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      if (label !== undefined) node.textContent = label;
      return node;
    };
    const button = (className, label) => {
      const node = el('button', className, label);
      node.type = 'button';
      return node;
    };

    if (!questions.length) {
      container.textContent = 'ポスターを読み込めませんでした。時間をおいて再度お試しください。';
      return null;
    }

    let questionIndex = 0;
    let totalScore = 0;
    let correctCount = 0;
    let revealCount = 0;
    let wrongCount = 0;
    let answered = false;

    const top = el('div', 'posterQuizTop');
    const counter = el('span', 'posterQuizCounter');
    const scoreLabel = el('span', 'posterQuizScore');
    const progress = el('div', 'posterQuizProgress');
    const progressBar = el('span');
    progress.append(progressBar);
    top.append(counter, scoreLabel, progress);

    const content = el('div', 'posterQuizContent');
    const figure = el('figure', 'posterFrame');
    figure.dataset.stage = '0';
    const image = el('img', 'posterImage');
    image.alt = 'ぼかされた映画ポスター';
    image.loading = 'eager';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    const unavailable = el('span', 'posterUnavailable', 'ポスターを表示できません');
    unavailable.hidden = true;
    figure.append(image, unavailable);

    const controls = el('div', 'posterQuizControls');
    const eyebrow = el('span', 'posterQuizEyebrow', 'MOVIE POSTER QUIZ');
    const prompt = el('h2', 'posterQuizPrompt', 'この映画、わかる？');
    const scoreNote = el('p', 'posterQuizNote', '早く当てるほど高得点。');
    const feedback = el('p', 'posterFeedback', 'ポスターを見せると、少しずつ鮮明になります。');
    feedback.setAttribute('aria-live', 'polite');

    const reveal = button('posterQuizButton revealButton', 'ポスターを見せる');
    reveal.setAttribute('aria-label', 'ポスターを少し見せる');
    const form = el('form', 'posterAnswerForm');
    const input = el('input', 'answerInput');
    input.type = 'text';
    input.autocomplete = 'off';
    input.placeholder = '映画タイトル';
    input.setAttribute('aria-label', '映画タイトル');
    const submit = el('button', 'posterQuizButton answerButton', '答える');
    submit.type = 'submit';
    form.append(input, submit);

    const skip = button('posterQuizTextButton skipButton', 'この問題を飛ばす');
    skip.hidden = true;
    const next = button('posterQuizButton nextButton', '次の問題');
    next.hidden = true;
    const actions = el('div', 'posterQuizActions');
    actions.append(reveal, skip, next);
    controls.append(eyebrow, prompt, scoreNote, feedback, actions, form);
    content.append(figure, controls);

    const attribution = el('p', 'posterQuizAttribution');
    const attributionLink = el('a', '', 'ポスター画像：TMDB');
    attributionLink.href = 'https://www.themoviedb.org/';
    attributionLink.target = '_blank';
    attributionLink.rel = 'noopener noreferrer';
    attribution.append(attributionLink);
    container.replaceChildren(top, content, attribution);

    function updateTop() {
      counter.textContent = (questionIndex + 1) + ' / ' + questions.length + ' 問';
      scoreLabel.textContent = totalScore + ' 点';
      progressBar.style.width = (questionIndex / questions.length * 100) + '%';
    }

    function renderQuestion() {
      const movie = questions[questionIndex];
      revealCount = 0;
      wrongCount = 0;
      answered = false;
      figure.dataset.stage = '0';
      figure.classList.remove('posterLoadFailed');
      image.src = movie.poster;
      image.alt = 'ぼかされた映画ポスター';
      feedback.textContent = 'ポスターを見せると、少しずつ鮮明になります。';
      feedback.className = 'posterFeedback';
      input.value = '';
      input.disabled = false;
      submit.disabled = false;
      form.hidden = false;
      reveal.hidden = false;
      reveal.disabled = false;
      reveal.textContent = 'ポスターを見せる';
      skip.hidden = true;
      next.hidden = true;
      next.textContent = questionIndex === questions.length - 1 ? '結果を見る' : '次の問題';
      updateTop();
    }

    function finishQuestion(correct) {
      if (answered) return;
      answered = true;
      const movie = questions[questionIndex];
      if (correct) {
        const earned = scoreForAnswer(revealCount, wrongCount);
        correctCount++;
        totalScore += earned;
        figure.dataset.stage = '3';
        image.alt = '正解した映画のポスター';
        feedback.textContent = '正解！『' + movie.title + '』 +' + earned + '点';
        feedback.className = 'posterFeedback isCorrect';
      } else {
        feedback.textContent = 'このポスターは表示できませんでした。';
        feedback.className = 'posterFeedback isError';
      }
      form.hidden = true;
      reveal.hidden = true;
      skip.hidden = true;
      next.hidden = false;
      updateTop();
    }

    function showResults() {
      const shareText = 'Cinelva ポスター当て：' + questions.length + '問中' +
        correctCount + '問正解、' + totalScore + '点！';
      container.replaceChildren();
      const result = el('section', 'posterQuizResult');
      const label = el('span', 'posterQuizEyebrow', 'RESULT');
      const heading = el('h2', '', correctCount + ' / ' + questions.length + ' 問正解');
      const total = el('p', 'posterQuizResultScore', totalScore + ' 点');
      const share = button('posterQuizButton shareButton', '結果をシェア');
      const restart = button('posterQuizTextButton restartButton', 'もう一度遊ぶ');
      const status = el('p', 'posterFeedback');
      status.setAttribute('aria-live', 'polite');
      share.addEventListener('click', async () => {
        try {
          if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            await navigator.share({ text: shareText });
          } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            status.textContent = '結果をコピーしました。';
          } else {
            status.textContent = shareText;
          }
        } catch (error) {
          if (!error || error.name !== 'AbortError') status.textContent = '共有できませんでした。';
        }
      });
      restart.addEventListener('click', () => mount(container, candidates, opts));
      result.append(label, heading, total, share, restart, status);
      container.append(result);
    }

    reveal.addEventListener('click', () => {
      if (answered || revealCount >= 3) return;
      revealCount++;
      figure.dataset.stage = String(revealCount);
      reveal.textContent = revealCount === 3 ? 'ポスターを公開中' : 'もう少し見せる';
      if (revealCount === 3) reveal.disabled = true;
      feedback.textContent = '残り' + scoreForAnswer(revealCount, 0) + '点。タイトルを入力してください。';
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (answered) return;
      const movie = questions[questionIndex];
      if (matchesAnswer(input.value, movie)) {
        finishQuestion(true);
        return;
      }
      wrongCount++;
      feedback.textContent = 'まだ違うみたい。もう一度考えてみて。';
      feedback.className = 'posterFeedback isError';
    });

    next.addEventListener('click', () => {
      questionIndex++;
      if (questionIndex >= questions.length) {
        showResults();
        return;
      }
      renderQuestion();
    });

    skip.addEventListener('click', () => finishQuestion(false));
    image.addEventListener('error', () => {
      figure.classList.add('posterLoadFailed');
      unavailable.hidden = false;
      image.hidden = true;
      reveal.hidden = true;
      skip.hidden = false;
    });
    image.addEventListener('load', () => {
      image.hidden = false;
      unavailable.hidden = true;
      figure.classList.remove('posterLoadFailed');
    });

    renderQuestion();
    return { questions, get score() { return totalScore; }, get correctCount() { return correctCount; } };
  }

  return { POINTS_PER_POSTER, pickQuestions, normalizeTitle, matchesAnswer, scoreForAnswer, mount };
});
