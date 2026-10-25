/* Source-attributed team emblems. No image bytes copied; failure is visibly labelled.
 * Organizations retain their marks. A logo is not evidence of roster verification.
 */
(() => {
 'use strict';
 const registry=window.RIVALRY_TEAM_LOGOS||{};
 const norm=window.RIVALRY_LINEUPS?.canonical||((s)=>String(s).toLowerCase().replace(/[^a-z0-9]/g,''));
 const failed=new Set();let scheduled=false,booted=false;
 function lookup(name){return registry[norm(name)]||null;}
 function fallback(node,name){
  node.classList.remove('rvl-real-logo');node.classList.add('rvl-logo-fallback');
  node.textContent=String(name).replace(/\s*·.*$/,'').split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase();
  node.setAttribute('role','img');node.setAttribute('aria-label',`${name}: source logo unavailable`);node.title=`${name} — logo unavailable; neutral initials shown`;
 }
 function paint(node,name,season){
  if(!node||!name)return;
  const item=lookup(name),key=norm(name),url=item?.url;
  if(node.dataset.logoKey===key&&node.querySelector('img.rvl-team-logo'))return;
  if(node.dataset.logoKey===key&&node.classList.contains('rvl-logo-fallback')&&(!url||failed.has(url)))return;
  node.dataset.logoKey=key;
  if(!url||failed.has(url)){fallback(node,name);return;}
  node.replaceChildren();node.classList.add('rvl-real-logo');node.classList.remove('rvl-logo-fallback');node.removeAttribute('role');node.removeAttribute('aria-label');
  const img=document.createElement('img');img.className='rvl-team-logo';img.src=url;img.alt=`${name} team logo`;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
  node.title=`${name}${season?' · '+season:''} — ${item.variant}. Source: ${item.source}`;
  img.onerror=()=>{failed.add(url);fallback(node,name)};
  node.append(img);
  node.dataset.logoSource=item.source;
 }
 function iconBefore(node,name){
  if(!node||!name)return;
  let badge=node.querySelector(':scope > .rvl-inline-logo');
  if(!badge){badge=document.createElement('span');badge.className='rvl-inline-logo';node.prepend(badge)}
  paint(badge,name);
 }
 function decorate(){
  scheduled=false;
  const game=window.RIVALRY_STUDIO?.state();
  if(game)game.teams.forEach((t,i)=>paint(document.getElementById('rv-logo-'+(i?'b':'a')),t.name,t.season));
  for(const side of ['a','b'])paint(document.getElementById('crest-'+side),document.getElementById('name-'+side)?.textContent);
  document.querySelectorAll('.directory-card').forEach(card=>paint(card.querySelector('.dir-crest'),card.querySelector('h3')?.textContent));
  document.querySelectorAll('.era-team').forEach(card=>paint(card.querySelector('.era-crest'),card.querySelector('.era-team-name strong')?.textContent));
  document.querySelectorAll('.rv-roster-preview').forEach(card=>iconBefore(card.querySelector(':scope > strong'),card.querySelector(':scope > strong')?.textContent.replace(/\s*·\s*20\d{2}\s*$/,'')));
  document.querySelectorAll('.rv-bracket-team > span').forEach(span=>{const name=[...span.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent).join('').trim();if(name&&name!=='TBD')iconBefore(span,name)});
  const teams=window.RIVALRY_OWCS||[];
  document.querySelectorAll('.rv-profile-pick').forEach(button=>{const match=teams.find(t=>button.textContent.trim().startsWith(t.name+'  · '));if(match)iconBefore(button,match.name)});
  const profile=document.querySelector('#rv-profile > h2');
  if(profile){const name=[...profile.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent).join('');iconBefore(profile,name)}
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(decorate)}}
 function boot(){
  if(booted)return;booted=true;
  decorate();
  const roots=['.main','#rivalry-studio'];
  roots.forEach(sel=>{const root=document.querySelector(sel);if(root)new MutationObserver(records=>{
   if(records.some(r=>!r.target.closest?.('.rvl-real-logo,.rvl-logo-fallback,.rvl-inline-logo')))schedule();
  }).observe(root,{childList:true,subtree:true,characterData:true});});
  const disclaimer=document.querySelector('.rv-truth');
  if(disclaimer&&!disclaimer.dataset.logoCredits){disclaimer.dataset.logoCredits='1';
   const baseText=disclaimer.firstChild;
   if(baseText?.nodeType===3)baseText.textContent=baseText.textContent.replace('original team crests are used where official logo reuse is not authorized.','team-logo source credits and image-availability fallbacks appear below.');
   disclaimer.append(document.createTextNode(' Team marks: source-linked OWTICS/over.gg archives; rights remain with the organizations. Logo variants are not guaranteed season-exact. '));
   const details=document.createElement('details');details.className='rvl-logo-credits';
   const summary=document.createElement('summary');summary.textContent='Team logo sources';details.append(summary);
   const list=document.createElement('div');
   const seen=new Set();Object.values(registry).forEach(item=>{if(seen.has(item.name))return;seen.add(item.name);const a=document.createElement('a');a.href=item.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent=item.name;list.append(a)});
   details.append(list);disclaimer.append(details);
  }
 }
 window.RIVALRY_LOGOS=Object.freeze({lookup,paint,decorate,boot});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else queueMicrotask(boot);
})();
