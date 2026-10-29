"""Apply the browser/backend film-medium policy to offline Python batches."""
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MEDIUM_FIELDS = ('type', 'media_type', 'mediaType', 'format', 'work_type', 'workType',
                 'genre_ids', 'genres', 'genre_names', 'is_tv', 'isTV', 'is_episode',
                 'isEpisode', 'is_series', 'isSeries', 'number_of_episodes',
                 'number_of_seasons', 'first_air_date', 'episode_number', 'season_number',
                 'release_dates', 'theatrical_release_verified', 'theatrical_release_source')

def film_works(works):
    """One local Node invocation per batch; no network or independent policy copy."""
    if not works:
        return []
    program = "const fs=require('node:fs'),p=require('./js/cinelva-film-medium.js');process.stdout.write(JSON.stringify(JSON.parse(fs.readFileSync(0,'utf8')).filter(p.isFilmMedium)))"
    result = subprocess.run(['node', '-e', program], input=json.dumps(works),
                            capture_output=True, text=True, check=True, cwd=ROOT)
    return json.loads(result.stdout)

def detail_medium(detail):
    return {key: detail[key] for key in MEDIUM_FIELDS if key in detail}
