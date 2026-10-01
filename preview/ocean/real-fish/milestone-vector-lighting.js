(function(root){'use strict';
const SVG_NS='http://www.w3.org/2000/svg';
const LIGHTING_PROFILES={
  'manta-ray':{light:'#58798a',mid:'#3d5d70',shadow:'#263e4d'},
  'dolphin':{light:'#a4bfca',mid:'#6f93a4',shadow:'#456574'},
  'hammerhead-shark':{light:'#91a7b2',mid:'#667e8c',shadow:'#465d69'},
  'large-shark':{light:'#869eaa',mid:'#5a7482',shadow:'#3d5561'},
  'dugong':{light:'#b7bbb5',mid:'#8b928d',shadow:'#666d69'},
  'minke-whale':{light:'#8fa9b4',mid:'#607b89',shadow:'#405965'},
  'orca':{light:'#46535a',mid:'#172229',shadow:'#080e12'},
  'humpback-whale':{light:'#91a5ad',mid:'#627780',shadow:'#43555d'},
  'whale-shark':{light:'#7397a2',mid:'#4b7581',shadow:'#315762'},
  'blue-whale':{light:'#8fb5c4',mid:'#5e8799',shadow:'#3d6677'}
};
function addStop(gradient,offset,color,opacity='1'){const stop=document.createElementNS(SVG_NS,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color',color);stop.setAttribute('stop-opacity',opacity);gradient.appendChild(stop)}
function enhance(node,key){const profile=LIGHTING_PROFILES[key];if(!profile||!node?.classList?.contains('milestoneVectorCreature'))return node;const svg=node.querySelector('svg'),primary=svg?.querySelector('path[fill]');if(!svg||!primary||node.dataset.renderQuality==='lit-vector-v1')return node;const gradientId='oceanMilestoneLight-'+key;const defs=document.createElementNS(SVG_NS,'defs');const gradient=document.createElementNS(SVG_NS,'linearGradient');gradient.id=gradientId;gradient.setAttribute('x1','0');gradient.setAttribute('y1','0');gradient.setAttribute('x2','0');gradient.setAttribute('y2','1');gradient.setAttribute('data-ocean-lighting','body');addStop(gradient,'0%',profile.light);addStop(gradient,'48%',profile.mid);addStop(gradient,'100%',profile.shadow);defs.appendChild(gradient);svg.insertBefore(defs,svg.firstChild);primary.setAttribute('fill','url(#'+gradientId+')');node.dataset.renderQuality='lit-vector-v1';return node}
function install(){const atlas=root.CinemapOceanMilestoneAtlas;if(!atlas||atlas.__lightingInstalled)return false;const original=atlas.createCreature.bind(atlas);atlas.createCreature=(key,manifest)=>enhance(original(key,manifest),key);atlas.__lightingInstalled=true;return true}
install();
root.CinemapOceanMilestoneLighting={LIGHTING_PROFILES,enhance,install};
})(window);
