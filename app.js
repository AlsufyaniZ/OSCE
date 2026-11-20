window.linksHTML=function(id,open){const L=(window.LINKS||{})[id];if(!L||!L.length)return "";
  const ic=t=>/check/i.test(t)?"✅":/exam/i.test(t)?"📝":"📄";
  return `<details class="lnk"${open?" open":""}><summary>📎 Checklists & cases from Drive <span class="lc">${L.length}</span></summary><ul>${L.map(([t,f])=>`<li><a href="https://drive.google.com/file/d/${f}/view" target="_blank" rel="noopener">${ic(t)} ${t.replace(/</g,"&lt;")}</a></li>`).join("")}</ul><p class="lnote">Opens in Google Drive — requires access to the shared "2026 Exam Study" folder.</p></details>`};
(function(){
const D = window.D, S = window.SKILLS, SS = window.SS||{};
const TP = window.TP||{};
D.forEach(d=>{const s=SS[d.id]||{};const a=(window.AS||{})[d.id];d.sx=(a&&a.ask)||s.sx||[];d.si=(a&&a.see)||s.si||[];const t=TP[d.id]||{};d.tp=t.tp||"";d.ep=(window.EP&&window.EP[d.id])||t.ep||[];});
const $ = s=>document.querySelector(s);
const load=k=>{try{return JSON.parse(localStorage.getItem(k)||"{}")}catch(e){return {}}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let filter="All", src="All", q="", done=load("osceDone"), sdone=load("osceSkills");

// ---------- diseases ----------
const order=["Respiratory","Cardiology","Hematology","Oncology","Neonatology","Metabolic","Endocrine","GI","Renal","Neurology","Infectious","Immunology","Rheumatology","MSK","ENT","Ophthalmology","Developmental","Genetics","Dermatology","Emergency"];
const sysOf=d=>d.sys.split(" / ")[0];
const present=[...new Set(D.map(sysOf))].sort((a,b)=>{const i=x=>{const n=order.indexOf(x);return n<0?99:n};return i(a)-i(b)});
$("#chips").innerHTML=["All",...present].map(s=>`<button class="chip${s==="All"?" on":""}" data-s="${s}">${s}</button>`).join("");
$("#chips").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;filter=b.dataset.s;
  document.querySelectorAll("#chips .chip").forEach(c=>c.classList.toggle("on",c===b));render()};
const inL=d=>d.src.includes("Study lobby"), inP=d=>d.src.includes("Previous");
const nLobby=D.filter(inL).length, nPrev=D.filter(inP).length;
$("#src").innerHTML=[["All",`All (${D.length})`],["lobby",`Study lobby files (${nLobby})`],["prev",`Previous OSCE list (${nPrev})`]]
  .map(([k,l])=>`<button class="chip src${k==="All"?" on":""}" data-k="${k}">${l}</button>`).join("");
$("#src").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;src=b.dataset.k;
  document.querySelectorAll("#src .chip").forEach(c=>c.classList.toggle("on",c===b));render()};

function hl(t){if(!q)return t;const re=new RegExp("("+q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","gi");
  return t.split(/(<[^>]+>)/).map(p=>p.startsWith("<")?p:p.replace(re,"<mark>$1</mark>")).join("")}
const list=a=>"<ul>"+a.map(x=>"<li>"+hl(x)+"</li>").join("")+"</ul>";
const sec=(c,t,a)=>`<div class="sec ${c}"><h3>${t}</h3>${list(a)}</div>`;

function render(){
  const ql=q.toLowerCase();
  const items=D.filter(d=>(filter==="All"||sysOf(d)===filter)&&
    (src==="All"||(src==="lobby"?inL(d):inP(d)))&&
    (!ql||JSON.stringify(d).toLowerCase().replace(/<[^>]+>/g,"").includes(ql)));
  $("#list").innerHTML=items.length?items.map(d=>`
  <details class="card" id="${d.id}" ${q?"open":""}>
    <summary><span class="num">${String(D.indexOf(d)+1).padStart(2,"0")}</span>
      <span class="name">${hl(d.name)}</span><span class="sys">${d.sys}</span><span class="caret">▸</span></summary>
    <div class="body">
      <div class="tpbox"><b>Typical presentation</b><p>${hl(d.tp)}</p></div>
      <div class="pearl"><b>Exam focus:</b> ${hl(d.pearl)} <span class="srcb">${d.src}</span></div>
      <div class="grid">
        ${sec("sx","Important points to ask",d.sx)}
        ${sec("si","Important points to see",d.si)}
        ${sec("ddx","Differential diagnosis",d.ddx)}
        ${sec("inv","Investigations",d.inv)}
        ${sec("mgmt","Management",d.mgmt)}
        ${sec("comp","Complications",d.comp)}
      </div>
      <div class="epbox"><b>★ Exam pearl</b>${list(d.ep)}</div>
      ${linksHTML(d.id)}
      <div class="mark"><label><input type="checkbox" data-id="${d.id}" ${done[d.id]?"checked":""}> Reviewed</label></div>
    </div>
  </details>`).join("")+`<p class="note">Sources: OSCE 2026 › Study lobby case & checklist files, and "List of Previous years OSCE exam 2020" (2010–2020 stations). Content not in the files was completed from standard pediatric references. Double-check drug doses against your local guideline.</p>`
  :`<div class="empty">No match.</div>`;
  $("#nav").innerHTML=items.map(d=>`<a href="#${d.id}" class="${done[d.id]?"done":""}" data-go="${d.id}">${d.name.split(" (")[0]}</a>`).join("");
  prog();
}
function prog(){const n=D.filter(d=>done[d.id]).length;$("#prog").textContent=`${n}/${D.length} diseases reviewed`}
$("#list").addEventListener("change",e=>{const id=e.target.dataset.id;if(!id)return;done[id]=e.target.checked;store("osceDone",done);
  const a=document.querySelector(`nav a[data-go="${id}"]`);if(a)a.classList.toggle("done",e.target.checked);prog()});
$("#nav").addEventListener("click",e=>{const a=e.target.closest("a");if(!a)return;e.preventDefault();
  const el=document.getElementById(a.dataset.go);el.open=true;el.scrollIntoView({behavior:"smooth",block:"start"})});
$("#q").addEventListener("input",e=>{q=e.target.value.trim();render()});
$("#exp").onclick=()=>document.querySelectorAll(".card").forEach(c=>c.open=true);
$("#col").onclick=()=>document.querySelectorAll(".card").forEach(c=>c.open=false);

// ---------- skills ----------
const total=S.reduce((n,g)=>n+g.items.length,0);
function renderSkills(){
  $("#slist").innerHTML=S.map((g,gi)=>{
    const ok=g.items.filter((_,i)=>sdone[gi+"-"+i]).length;
    return `<section class="sgroup"><h2>${g.g}<span>${ok}/${g.items.length}</span></h2><div class="scols">`+
    g.items.map((t,i)=>{const k=gi+"-"+i;return `<label class="sitem${sdone[k]?" ok":""}"><input type="checkbox" data-k="${k}" ${sdone[k]?"checked":""}><span>${t}</span></label>`}).join("")+
    `</div></section>`}).join("");
  sprog();
}
function sprog(){const n=Object.keys(sdone).filter(k=>sdone[k]).length;$("#sprog").textContent=`${n}/${total} skills checked`}
$("#slist").addEventListener("change",e=>{const k=e.target.dataset.k;if(!k)return;sdone[k]=e.target.checked;store("osceSkills",sdone);renderSkills()});

// ---------- tabs ----------
function route(){
  const h=location.hash.slice(1);
  const view=h==="skills"?"skills":h==="study"?"study":"diseases";
  if(view==="diseases"&&h&&h!=="diseases"){const el=document.getElementById(h);if(el&&el.tagName==="DETAILS"){el.open=true;setTimeout(()=>el.scrollIntoView({block:"start"}),0)}}
  $("#dview").hidden=view!=="diseases";$("#sview").hidden=view!=="skills";$("#study").hidden=view!=="study";
  [".srow",".acts","#fpanel"].forEach(s=>$(s).style.display=view==="diseases"?"":"none");
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("on",t.dataset.t===view));
  if(view==="study"&&window.__studyRefresh)window.__studyRefresh();
}
window.addEventListener("hashchange",route);
const hdr=document.getElementById("hdr"),ft=document.getElementById("ftoggle"),tt=document.getElementById("totop");
ft.onclick=()=>{const o=hdr.classList.toggle("fopen");ft.classList.toggle("on",o);ft.setAttribute("aria-expanded",o)};
document.addEventListener("click",e=>{if(e.target.closest("#chips .chip,#src .chip")&&window.innerWidth<=860){hdr.classList.remove("fopen");ft.classList.remove("on")}});
window.addEventListener("scroll",()=>tt.classList.toggle("show",window.scrollY>600),{passive:true});
tt.onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
function updFt(){const n=(filter!=="All")+(src!=="All");ft.textContent=n?`Filters (${n})`:"Filters"}
document.addEventListener("click",e=>{if(e.target.closest(".chip"))setTimeout(updFt,0)});
render();renderSkills();route();
})();
