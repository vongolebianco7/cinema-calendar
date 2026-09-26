from pathlib import Path
p=Path('search.html')
s=p.read_text(encoding='utf-8')
old='function screeningKnown(v){return v!==undefined&&v!==null&&v!=="unknown"}\nfunction screeningConfidence(values){const known=values.filter(screeningKnown).length;if(known===values.length&&known>0)return "確認済み";if(known>0)return "一部確認";return "情報不足"}'
new='function screeningKnown(v){return v!==undefined&&v!==null&&v!=="unknown"}\nfunction screeningConfidence(values){const known=values.filter(screeningKnown).length;if(known===values.length&&known>0)return "確認済み";if(known>0)return "一部確認";return "情報不足"}\nfunction formatSources(sources,key){return (sources||[]).filter(s=>Array.isArray(s.formats)&&s.formats.includes(key))}'
if old not in s: raise SystemExit('helper anchor missing')
s=s.replace(old,new,1)
s=s.replace('const e=evidence||{},sources=e.sources||[],imaxExpanded=', 'const e=evidence||{},allSources=e.sources||[],imaxExpanded=',1)
s=s.replace('if(e.dolby_vision_master===true&&e.dolby_atmos_mix===true){dolbyScore=5;dolbyReasons.push("Dolby VisionとDolby Atmosの両方が確認でき、映像と立体音響をセットで活かせるため。")}', 'if(e.dolby_vision_master===true&&e.dolby_atmos_mix===true){dolbyScore=(e.cinematography_notes||e.director_or_dp_intent)?5:4;dolbyReasons.push(dolbyScore===5?"Dolby VisionとDolby Atmosの両方に加え、作品固有の映像・音響設計の根拠も確認できるため。":"Dolby VisionとDolby Atmosの両方が確認できるため。作品固有の演出意図までは確認できないので最高評価にはしない。")}',1)
s=s.replace('confidence:screeningConfidence([e.imax_camera,e.imax_expanded_ratio,e.filmed_for_imax,e.imax_dmr_only]),sources}', 'confidence:screeningConfidence([e.imax_camera,e.imax_expanded_ratio,e.filmed_for_imax,e.imax_dmr_only]),sources:formatSources(allSources,"imax")}',1)
s=s.replace('confidence:screeningConfidence([e.dolby_vision_master,e.dolby_atmos_mix]),sources,sub:', 'confidence:screeningConfidence([e.dolby_vision_master,e.dolby_atmos_mix]),sources:formatSources(allSources,"dolby_cinema"),sub:',1)
s=s.replace('confidence:screeningConfidence([e.official_4dx,e.official_mx4d]),sources}', 'confidence:screeningConfidence([e.official_4dx,e.official_mx4d]),sources:formatSources(allSources,"motion")}',1)
s=s.replace('confidence:screeningConfidence([e.official_screenx]),sources}', 'confidence:screeningConfidence([e.official_screenx]),sources:formatSources(allSources,"screenx")}',1)
p.write_text(s,encoding='utf-8')
print('fixed source scoping and Dolby scoring')
