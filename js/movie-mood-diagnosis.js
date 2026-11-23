(function(root){
  'use strict';
  const profiles=[
    {id:'action',name:'爽快に楽しみたい',genre:'アクション',genreId:'28',description:'テンポのよい展開や、大きな見せ場のある作品が合いそうです。'},
    {id:'comedy',name:'気軽に笑いたい',genre:'コメディ',genreId:'35',description:'会話や展開を楽しめる、肩の力を抜いて観られる作品が合いそうです。'},
    {id:'drama',name:'物語に浸りたい',genre:'ドラマ',genreId:'18',description:'登場人物の関係や、観終わった後に残る物語が合いそうです。'},
    {id:'thriller',name:'先の読めない展開が見たい',genre:'スリラー',genreId:'53',description:'謎や緊張感のある展開を楽しめる作品が合いそうです。'}
  ];
  const prompts=[
    ['今夜の映画に求めるものは？','テンポのよさ','笑えること','心に残る物語','先の読めない展開'],
    ['予告で気になるのは？','大きな見せ場','軽快な会話','印象に残る人物','気になる謎'],
    ['2時間の過ごし方なら？','冒険に出る','気楽に笑う','人の人生を追う','手がかりを考える'],
    ['観終わったときに欲しいのは？','爽快感','楽しい気分','余韻','驚き'],
    ['今、選びたいジャンルは？','アクション','コメディ','ドラマ','スリラー']
  ];
  const QUESTIONS=prompts.map(([prompt,...labels])=>({prompt,choices:labels.map((label,index)=>({label,profileId:profiles[index].id}))}));
  function diagnose(answers){
    const scores=Object.fromEntries(profiles.map(profile=>[profile.id,0]));
    QUESTIONS.forEach((question,index)=>{const choice=question.choices[answers?.[index]];if(choice)scores[choice.profileId]++});
    const chosen=profiles.reduce((best,current)=>scores[current.id]>scores[best.id]?current:best,profiles[0]);
    return {...chosen,score:scores[chosen.id]};
  }
  const api={QUESTIONS,profiles,diagnose};
  root.MovieMoodDiagnosis=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
