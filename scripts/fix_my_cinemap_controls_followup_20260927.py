from pathlib import Path

art_path=Path('js/my-cinemap-art.js')
art=art_path.read_text(encoding='utf-8')

decl="const shape=artValue('format')||'portrait',layout=artValue('layout')||'single',theme=artValue('theme')||'minimal',p=artPalettes[theme]||artPalettes.minimal;"
if "artValue('fontSize')" not in art:
    art=art.replace(decl, decl+"\n  const fontScale={small:1,medium:1.18,large:1.36}[artValue('fontSize')]||1;")
    old="const nameSize=columns===2?(shape==='portrait'?doublePortraitMovieSize:doubleCompactMovieSize):(shape==='portrait'?(theme==='minimal'?minimalSingleMovieSize:singleMovieSize):shape==='square'?34:28);"
    new="const nameSize=(columns===2?(shape==='portrait'?doublePortraitMovieSize:doubleCompactMovieSize):(shape==='portrait'?(theme==='minimal'?minimalSingleMovieSize:singleMovieSize):shape==='square'?34:28))*fontScale;"
    art=art.replace(old,new)
    art=art.replace("writeLines(ctx,meta,tx,top+nameHeight+9,tw,1,columns===2?doubleMetaSize:singleMetaSize,16,artSans,400)","writeLines(ctx,meta,tx,top+nameHeight+9,tw,1,(columns===2?doubleMetaSize:singleMetaSize)*fontScale,16*fontScale,artSans,400)")
art_path.write_text(art,encoding='utf-8')
