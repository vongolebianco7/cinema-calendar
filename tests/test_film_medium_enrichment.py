import importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('enrich',ROOT/'scripts/enrich_directors.py')
enrich=importlib.util.module_from_spec(spec);spec.loader.exec_module(enrich)

def test_tv_movie_credits_excluded_but_animation_drama_retained():
    rows=[{'id':1,'title':'TV','genre_ids':[10770],'job':'Director'}, {'id':2,'title':'Anime','genre_ids':[16],'job':'Director'}, {'id':3,'title':'Drama','genre_ids':[18],'job':'Director'}]
    result=enrich.enrich_director({'id':7,'name':'Person'},{'id':7,'name':'Person','movie_credits':{'crew':rows}},'2026-10-29')
    assert {w['id'] for w in result['works']}=={2,3}

def test_detail_tv_metadata_is_retained_and_filtered():
    d={'works':[{'id':1,'title':'TV','job':'Director'},{'id':2,'title':'Film','job':'Director'}]}
    result=enrich.verify_director_runtimes(d,lambda path:{'id':int(path.split('/')[-1]),'runtime':100,'genres':[{'id':10770 if path.endswith('/1') else 16,'name':'TV Movie' if path.endswith('/1') else 'Animation'}]})
    assert [w['id'] for w in result['works']]==[2]
    assert result['works'][0]['genres']==[{'id':16,'name':'Animation'}]

if __name__ == '__main__':
    test_tv_movie_credits_excluded_but_animation_drama_retained()
    test_detail_tv_metadata_is_retained_and_filtered()
    print('2 film-medium enrichment tests passed')
