(function(){
const D=window.D, $=s=>document.querySelector(s);
const load=k=>{try{return JSON.parse(localStorage.getItem(k)||"{}")}catch(e){return {}}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=s=>String(s).replace(/<(?!\/?(b|span)\b)[^>]*>/g,"");
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const sysOf=d=>d.sys.split(" / ")[0];
const SECS=[["sx","Important points to ask","What are the important points to ask in the history?"],["si","Important points to see","What are the important points to look for on examination?"],["ddx","Differential diagnosis","What is your differential diagnosis?"],["inv","Investigations","Which investigations would you order?"],["mgmt","Management","How would you manage this patient?"],["comp","Complications","What complications would you tell the family about?"],["ep","Exam pearl","Examiner's high-yield follow-up points"]];
const SECNAME=Object.fromEntries(SECS.map(s=>[s[0],s[1]]));
const strip=s=>String(s).replace(/<[^>]+>/g,"");
const stop=new Set("the a an and or of in to for with is are be if on at by as not no vs from all any after".split(" "));
const tok=s=>new Set(strip(s).toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>2&&!stop.has(w)));
const sim=(a,b)=>{const A=tok(a),B=tok(b);if(!A.size)return 0;let c=0;A.forEach(w=>B.has(w)&&c++);return c/Math.min(A.size,B.size||1)};

// ---------- scope ----------
const systems=[...new Set(D.map(sysOf))].sort();
function scopeHTML(id){return `<select id="${id}" class="sel"><option value="All">All systems (${D.length})</option>${systems.map(s=>`<option>${s}</option>`).join("")}<option value="__weak">My weak diseases</option></select>`}
const stats=load("osceStats"); // id -> {r:right,w:wrong}
function bump(id,ok){const s=stats[id]||{r:0,w:0};ok?s.r++:s.w++;stats[id]=s;store("osceStats",stats)}
function pool(sel){return poolV($(sel)?$(sel).value:"All")}
function poolV(v){
  if(v==="__weak"){const w=D.filter(d=>stats[d.id]&&stats[d.id].w>stats[d.id].r);return w.length?w:D}
  return v==="All"?D:D.filter(d=>sysOf(d)===v)}

// ---------- shell ----------
$("#study").innerHTML=`
<div class="modes"><button class="mode on" data-m="osce">🩺 OSCE station</button><button class="mode" data-m="fc">🃏 Flashcards</button><button class="mode" data-m="quiz">✅ Quiz</button></div>
<section id="m-osce" class="mpanel"></section>
<section id="m-fc" class="mpanel" hidden></section>
<section id="m-quiz" class="mpanel" hidden></section>`;
document.querySelectorAll(".mode").forEach(b=>b.onclick=()=>{document.querySelectorAll(".mode").forEach(x=>x.classList.toggle("on",x===b));
  document.querySelectorAll(".mpanel").forEach(p=>p.hidden=p.id!=="m-"+b.dataset.m);if(b.dataset.m==="fc")fcHome()});
const list=a=>"<ul>"+a.map(x=>"<li>"+x+"</li>").join("")+"</ul>";

// ---------- OSCE station ----------
let st=null,timer=null;
function osceHome(){clearInterval(timer);
  $("#m-osce").innerHTML=`<div class="scard">
  <h2>Random OSCE station</h2>
  <p class="muted">You get a scenario and a timer. Answer each examiner question aloud (or on paper), then reveal and mark yourself honestly.</p>
  <div class="row">${scopeHTML("o-scope")}<select id="o-time" class="sel"><option value="300">5 min</option><option value="420" selected>7 min</option><option value="600">10 min</option><option value="0">No timer</option></select></div>
  <button class="btn primary big" id="o-start">Start station</button></div>`;
  $("#o-start").onclick=()=>{oScope=$("#o-scope").value;startStation(pick(poolV(oScope)),+$("#o-time").value)}}
let oScope="All";
function startStation(d,secs){clearInterval(timer);
  st={d,step:0,score:{},left:secs,total:secs};
  $("#m-osce").innerHTML=`<div class="scard">
   <div class="sthead"><span class="badge">${d.sys}</span><span id="o-clock" class="clock">${secs?fmt(secs):""}</span></div>
   <div class="tpbox"><b>Station scenario</b><p>${d.tp}</p></div>
   <div class="q1"><b>Q0.</b> What is your most likely diagnosis? <button class="btn" id="o-dx">Reveal diagnosis</button><div id="o-dxa" hidden class="dxans">${d.name}</div></div>
   <div id="o-steps"></div>
   <div class="row end"><button class="btn" id="o-quit">End station</button></div></div>`;
  $("#o-dx").onclick=()=>{$("#o-dxa").hidden=false;$("#o-dx").remove();if(st.step===0)nextStep()};
  $("#o-quit").onclick=finishStation;
  if(secs){timer=setInterval(()=>{st.left--;const c=$("#o-clock");if(!c){clearInterval(timer);return}c.textContent=fmt(Math.max(st.left,0));c.classList.toggle("warn",st.left<=60);if(st.left<=0){clearInterval(timer);c.textContent="Time's up"}},1000)}}
const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
function nextStep(){const i=st.step;if(i>=SECS.length){finishStation();return}
  const [k,title,q]=SECS[i];st.step++;
  const div=document.createElement("div");div.className="ostep";
  div.innerHTML=`<p class="oq"><b>Q${i+1}.</b> ${q}</p><button class="btn reveal">Reveal answer</button><div class="oans" hidden><h3>${title}</h3>${list(st.d[k])}
   ${k==="ep"?"":`<div class="rate"><span>How did you do?</span><button data-s="2" class="r good">Got it</button><button data-s="1" class="r mid">Partly</button><button data-s="0" class="r bad">Missed</button></div>`}</div>`;
  $("#o-steps").appendChild(div);div.scrollIntoView({behavior:"smooth",block:"nearest"});
  div.querySelector(".reveal").onclick=e=>{e.target.remove();div.querySelector(".oans").hidden=false;if(k==="ep")nextStep()};
  div.querySelectorAll(".r").forEach(b=>b.onclick=()=>{st.score[k]=+b.dataset.s;div.querySelectorAll(".r").forEach(x=>x.classList.toggle("sel",x===b));div.querySelector(".rate").classList.add("done");if(st.step===i+1)nextStep()})}
function finishStation(){clearInterval(timer);const s=st.score,keys=Object.keys(s),got=keys.reduce((a,k)=>a+s[k],0),max=12;
  const pct=Math.round(got/max*100);bump(st.d.id,pct>=60);
  const weak=keys.filter(k=>s[k]<2).map(k=>SECNAME[k]);
  const used=st.total?st.total-Math.max(st.left,0):0;
  $("#m-osce").insertAdjacentHTML("beforeend",`<div class="scard result"><h2>${pct}% <small>${pct>=70?"Clear pass":pct>=60?"Borderline pass":pct>=50?"Borderline fail":"Fail"}</small></h2>
   <p>${st.d.name}${st.total?` · time used ${fmt(used)}`:""}</p>${weak.length?`<p class="muted">Review: ${weak.join(", ")}</p>`:""}
   <div class="row"><button class="btn primary" id="o-again">Next random station</button><a class="btn" href="#${st.d.id}">Open full card</a><button class="btn" id="o-home">Change settings</button></div>${window.linksHTML?linksHTML(st.d.id,true):""}</div>`);
  $("#o-again").onclick=()=>{let d;const p=poolV(oScope);do{d=pick(p)}while(p.length>1&&d===st.d);startStation(d,st.total)};
  $("#o-home").onclick=osceHome;
  document.querySelectorAll("#m-osce .rate:not(.done)").forEach(r=>r.remove());
  $("#m-osce .result").scrollIntoView({behavior:"smooth"})}

// ---------- Flashcards (spaced repetition) ----------
const SR=load("osceSR"); // key -> {box,due}
const INTERVALS=[0,1,3,7,14,30]; // days by box
const today=()=>Math.floor(Date.now()/864e5);
const FTYPES=[["tp","Scenario → Diagnosis"],["sx","Points to ask"],["si","Points to see"],["ddx","DDx"],["inv","Investigations"],["mgmt","Management"],["comp","Complications"],["ep","Exam pearls"]];
let fcSet=load("osceFcSet");if(!fcSet.types)fcSet={types:FTYPES.map(f=>f[0]),scope:"All",newPerDay:20};
const newLog=load("osceNewLog");
function allCards(){const p=fcSet.scope==="All"?D:fcSet.scope==="__weak"?(D.filter(d=>stats[d.id]&&stats[d.id].w>stats[d.id].r).length?D.filter(d=>stats[d.id]&&stats[d.id].w>stats[d.id].r):D):D.filter(d=>sysOf(d)===fcSet.scope);
  const out=[];p.forEach(d=>fcSet.types.forEach(t=>out.push(d.id+"|"+t)));return out}
function dueCards(){const t=today(),cards=allCards();const due=cards.filter(k=>SR[k]&&SR[k].due<=t);
  const doneNew=newLog[t]||0;const fresh=shuffle(cards.filter(k=>!SR[k])).slice(0,Math.max(0,fcSet.newPerDay-doneNew));
  return {due:shuffle(due),fresh}}
let fcQueue=[],fcCur=null;
function fcHome(){const {due,fresh}=dueCards();const seen=Object.keys(SR).length;
  $("#m-fc").innerHTML=`<div class="scard"><h2>Flashcards</h2>
  <p class="muted">Spaced repetition: cards you miss come back today; cards you know come back after 1 → 3 → 7 → 14 → 30 days.</p>
  <div class="stats3"><div><b>${due.length}</b><span>due for review</span></div><div><b>${fresh.length}</b><span>new today</span></div><div><b>${seen}</b><span>cards seen</span></div></div>
  <div class="row"><select id="f-scope" class="sel"><option value="All">All systems</option>${systems.map(s=>`<option ${fcSet.scope===s?"selected":""}>${s}</option>`).join("")}<option value="__weak" ${fcSet.scope==="__weak"?"selected":""}>My weak diseases</option></select>
  <select id="f-new" class="sel">${[10,20,30,50].map(n=>`<option value="${n}" ${fcSet.newPerDay===n?"selected":""}>${n} new/day</option>`).join("")}</select></div>
  <div class="types">${FTYPES.map(([k,l])=>`<label class="tchip"><input type="checkbox" value="${k}" ${fcSet.types.includes(k)?"checked":""}> ${l}</label>`).join("")}</div>
  <button class="btn primary big" id="f-start" ${due.length+fresh.length?"":"disabled"}>${due.length+fresh.length?`Study ${due.length+fresh.length} cards`:"All done for today 🎉"}</button>
  ${due.length+fresh.length?"":`<button class="btn" id="f-extra">Study 10 extra random cards</button>`}</div>`;
  const save=()=>{fcSet.scope=$("#f-scope").value;fcSet.newPerDay=+$("#f-new").value;fcSet.types=[...document.querySelectorAll(".types input:checked")].map(i=>i.value);if(!fcSet.types.length)fcSet.types=["tp"];store("osceFcSet",fcSet);fcHome()};
  $("#f-scope").onchange=save;$("#f-new").onchange=save;document.querySelectorAll(".types input").forEach(i=>i.onchange=save);
  if($("#f-start"))$("#f-start").onclick=()=>{fcQueue=[...due,...fresh];fcNext()};
  if($("#f-extra"))$("#f-extra").onclick=()=>{fcQueue=shuffle(allCards()).slice(0,10);fcNext()}}
function fcNext(){if(!fcQueue.length){fcHome();return}fcCur=fcQueue.shift();const [id,t]=fcCur.split("|");const d=D.find(x=>x.id===id);
  const front=t==="tp"?`<p class="fq">What is the diagnosis?</p><p class="fscen">${d.tp}</p>`:`<p class="fq">${d.name}</p><p class="fsec">${SECNAME[t]||t}?</p><p class="muted small">Try to recall as many points as you can.</p>`;
  const back=t==="tp"?`<p class="dxans">${d.name}</p><p class="muted small">${d.sys}</p>`:list(d[t]);
  $("#m-fc").innerHTML=`<div class="scard fcard"><div class="sthead"><span class="badge">${fcQueue.length+1} left</span><span class="badge">${d.sys}</span></div>
   <div class="fside">${front}</div><button class="btn primary big" id="f-flip">Show answer</button>
   <div id="f-back" hidden><div class="fback">${back}</div>
   <div class="rate4"><button data-g="0" class="r bad">Again<small>today</small></button><button data-g="1" class="r mid">Hard<small>${lbl(id,t,1)}</small></button><button data-g="2" class="r good">Good<small>${lbl(id,t,2)}</small></button><button data-g="3" class="r easy">Easy<small>${lbl(id,t,3)}</small></button></div></div>
   <div class="row end"><button class="btn" id="f-stop">Stop</button></div></div>`;
  $("#f-flip").onclick=()=>{$("#f-flip").remove();$("#f-back").hidden=false};
  $("#f-stop").onclick=fcHome;
  document.querySelectorAll(".rate4 .r").forEach(b=>b.onclick=()=>grade(+b.dataset.g))}
function nextBox(k,g){const box=(SR[k]&&SR[k].box)||0;return g===0?0:g===1?Math.max(1,box):g===2?Math.min(box+1,5):Math.min(box+2,5)}
function lbl(id,t,g){const b=nextBox(id+"|"+t,g);return INTERVALS[b]+"d"}
function grade(g){const k=fcCur,t=today();if(!SR[k]){newLog[t]=(newLog[t]||0)+1;store("osceNewLog",newLog)}
  const box=nextBox(k,g);SR[k]={box,due:t+INTERVALS[box]};store("osceSR",SR);bump(k.split("|")[0],g>=2);
  if(g===0)fcQueue.splice(Math.min(3,fcQueue.length),0,k);fcNext()}

// ---------- Quiz ----------
const QTYPES=[["dx","Scenario → diagnosis"],["which","Which belongs to disease X?"],["who","Which disease is this?"]];
function bulletPool(sec){const out=[];D.forEach(d=>(d[sec]||[]).forEach(b=>{const t=strip(b);if(t.length>=18)out.push({d,b:t})}));return out}
const SECKEYS=["sx","si","ddx","inv","mgmt","comp","ep"];
const POOLS=Object.fromEntries(SECKEYS.map(k=>[k,bulletPool(k)]));
function allText(d){return SECKEYS.flatMap(k=>d[k]||[]).map(strip)}
// document frequency of tokens → a bullet is "specific" if it has at least one uncommon token
const DF={};D.forEach(d=>{const seen=new Set();allText(d).concat([d.tp]).forEach(t=>tok(t).forEach(w=>seen.add(w)));seen.forEach(w=>DF[w]=(DF[w]||0)+1)});
const specific=(b,max=5)=>{const t=[...tok(b)];return t.length>=2&&t.some(w=>(DF[w]||0)<=max)};
const nameWords=d=>[...tok(d.name)].filter(w=>w.length>=4);
const leaks=(b,d)=>{const B=strip(b).toLowerCase();return nameWords(d).some(w=>B.includes(w.slice(0,Math.min(w.length,6))))};
function makeQ(scope){
  for(let tries=0;tries<40;tries++){
    const type=pick(["dx","which","which","who","who"]);const d=pick(scope);
    if(type==="dx"){const same=D.filter(x=>x!==d&&sysOf(x)===sysOf(d));const other=D.filter(x=>x!==d);
      const ds=shuffle(same).slice(0,2);while(ds.length<3){const c=pick(other);if(!ds.includes(c))ds.push(c)}
      return {q:`<span class="qlab">Scenario</span>${d.tp}<br><b>Most likely diagnosis?</b>`,opts:shuffle([d.name,...ds.map(x=>x.name)]),ans:d.name,d,sec:"Typical presentation"}}
    if(type==="which"){const sec=pick(SECKEYS);const own=(d[sec]||[]).map(strip).filter(t=>t.length>=18&&specific(t)&&!leaks(t,d));if(!own.length)continue;
      const right=pick(own);const mine=allText(d);
      const cands=shuffle(POOLS[sec].filter(p=>p.d!==d&&sysOf(p.d)!==sysOf(d)&&specific(p.b,4)&&!leaks(p.b,p.d)&&mine.every(m=>sim(p.b,m)<0.5)&&sim(p.b,right)<0.4));
      const ds=[];for(const c of cands){if(ds.every(x=>sim(x,c.b)<0.5))ds.push(c.b);if(ds.length===3)break}
      if(ds.length<3)continue;
      return {q:`<span class="qlab">${SECNAME[sec]}</span><b>Which of the following belongs to ${d.name}?</b>`,opts:shuffle([right,...ds]),ans:right,d,sec:SECNAME[sec]}}
    if(type==="who"){const sec=pick(["si","sx","ep","mgmt","inv"]);const own=(d[sec]||[]).map(strip).filter(t=>t.length>=25&&specific(t,3)&&!leaks(t,d));if(!own.length)continue;
      const b=pick(own);const others=D.filter(x=>x!==d);
      if(others.some(x=>allText(x).some(t=>sim(t,b)>=0.6)))continue;
      const same=shuffle(D.filter(x=>x!==d&&sysOf(x)===sysOf(d)));const ds=same.slice(0,2);while(ds.length<3){const c=pick(others);if(!ds.includes(c))ds.push(c)}
      return {q:`<span class="qlab">${SECNAME[sec]}</span>“${b}”<br><b>This point belongs to which disease?</b>`,opts:shuffle([d.name,...ds.map(x=>x.name)]),ans:d.name,d,sec:SECNAME[sec]}}
  }
  return null}
let qz=null;
function quizHome(){$("#m-quiz").innerHTML=`<div class="scard"><h2>Quiz</h2>
 <p class="muted">Auto-generated MCQs from every section: scenarios, symptoms, signs, DDx, investigations, management, complications and pearls.</p>
 <div class="row">${scopeHTML("q-scope")}<select id="q-n" class="sel"><option value="10">10 questions</option><option value="20" selected>20 questions</option><option value="40">40 questions</option></select></div>
 <button class="btn primary big" id="q-start">Start quiz</button></div>`;
 $("#q-start").onclick=()=>{const scope=pool("#q-scope");const n=+$("#q-n").value;const qs=[];let guard=0;
   while(qs.length<n&&guard++<n*10){const q=makeQ(scope);if(q&&!qs.some(x=>x.ans===q.ans&&x.q===q.q))qs.push(q)}
   qz={qs,i:0,right:0,wrong:[]};qShow()}}
function qShow(){const q=qz.qs[qz.i];if(!q){qEnd();return}
 $("#m-quiz").innerHTML=`<div class="scard"><div class="sthead"><span class="badge">Q${qz.i+1}/${qz.qs.length}</span><span class="badge">Score ${qz.right}</span></div>
  <div class="qtext">${q.q}</div><div class="opts">${q.opts.map((o,i)=>`<button class="opt" data-i="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join("")}</div>
  <div id="q-fb"></div></div>`;
 document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{const o=q.opts[+b.dataset.i],ok=o===q.ans;
   document.querySelectorAll(".opt").forEach(x=>{x.disabled=true;const v=q.opts[+x.dataset.i];if(v===q.ans)x.classList.add("right");else if(x===b)x.classList.add("wrong")});
   ok?qz.right++:qz.wrong.push(q);bump(q.d.id,ok);
   $("#q-fb").innerHTML=`<div class="fb ${ok?"ok":"no"}">${ok?"Correct ✓":"Not quite ✗"} — <b>${q.d.name}</b> · ${q.sec}<div class="fbmore">${q.d.ep[0]?"★ "+q.d.ep[0]:""}</div></div>
   <div class="row"><button class="btn primary" id="q-next">${qz.i+1<qz.qs.length?"Next":"See results"}</button><a class="btn" href="#${q.d.id}">Open card</a></div>${window.linksHTML?linksHTML(q.d.id):""}`;
   $("#q-next").onclick=()=>{qz.i++;qShow()};$("#q-next").focus()})}
function qEnd(){const n=qz.qs.length,p=Math.round(qz.right/n*100);
 $("#m-quiz").innerHTML=`<div class="scard result"><h2>${qz.right}/${n} <small>${p}%</small></h2>
  ${qz.wrong.length?`<p><b>Review these:</b></p><ul class="wlist">${[...new Set(qz.wrong.map(q=>q.d))].map(d=>`<li><a href="#${d.id}">${d.name}</a></li>`).join("")}</ul>`:"<p>Perfect score 🎉</p>"}
  <div class="row"><button class="btn primary" id="q-again">New quiz</button></div>
  <p class="muted small">Questions are generated automatically from the cards; if one looks ambiguous, trust the card.</p></div>`;
 $("#q-again").onclick=quizHome}

osceHome();quizHome();
window.__studyRefresh=()=>{if(!$("#m-fc").hidden)fcHome()};
})();
