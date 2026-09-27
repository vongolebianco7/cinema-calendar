from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'js/my-cinemap-art.js'
DIRECTION=ROOT/'js/my-cinemap-art-direction.js'
CINEMA=ROOT/'js/my-cinemap-cinema-templates.js'


def replace_exact(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected text: {label}')
    return text.replace(old,new)


def main():
    art=ART.read_text(encoding='utf-8')
    art=replace_exact(
        art,
        "const fontKey=artValue('fontStyle')||'modern',font=artFonts[fontKey]||artFonts.editorial;",
        "const fontKey=artValue('fontStyle')||'modern',font=artFonts[fontKey]||artFonts.modern;",
        'art font fallback',
    )
    ART.write_text(art,encoding='utf-8')

    direction=DIRECTION.read_text(encoding='utf-8')
    direction=replace_exact(direction,"const FONT_VALUES=['editorial','modern','clean','classic'];","const FONT_VALUES=['modern','clean','classic'];",'font values')
    direction=direction.replace("    {id:'cinema-screening',label:'Screening Room',desc:'上映室と客席のシネマ空間',asset:'assets/AB933939-93EB-43D6-814A-C60BE58B42F6.png'}\n",'')
    direction=replace_exact(direction,'grid-template-columns:22px minmax(0,1fr)!important;','grid-template-columns:22px 42px minmax(0,1fr)!important;','ranking columns')
    direction=replace_exact(direction,'#list .item>:nth-child(2){display:none!important}','#list .item>:nth-child(2){display:block!important;grid-column:2!important;grid-row:1!important;width:42px!important;height:58px!important;object-fit:cover!important;border-radius:5px!important}','poster visibility')
    direction=replace_exact(direction,'#list .item>:nth-child(3){grid-column:2!important;','#list .item>:nth-child(3){grid-column:3!important;','title column')
    direction=replace_exact(direction,'<option value="editorial" selected>Editorial Serif</option><option value="modern">Modern Serif</option>','<option value="modern" selected>Modern Serif</option>','font picker default')
    direction=direction.replace("const hint=document.getElementById('templateHint');if(hint)hint.textContent='元の5デザインに加え、アップロードした映画デザイン5種をそのままテンプレートとして選べます。';","const hint=document.getElementById('templateHint');if(hint)hint.textContent='基本4デザインに加え、映画デザイン4種を選べます。';")
    DIRECTION.write_text(direction,encoding='utf-8')

    cinema=CINEMA.read_text(encoding='utf-8')
    cinema=cinema.replace("    'cinema-screening':'assets/AB933939-93EB-43D6-814A-C60BE58B42F6.png'\n",'')
    cinema=cinema.replace("    'cinema-screening':'dark'\n",'')
    cinema=replace_exact(cinema,"const fontKey=artValue('fontStyle')||'editorial',font=artFonts[fontKey]||artFonts.editorial;","const fontKey=artValue('fontStyle')||'modern',font=artFonts[fontKey]||artFonts.modern;",'cinema font fallback')
    CINEMA.write_text(cinema,encoding='utf-8')

if __name__=='__main__':
    main()
