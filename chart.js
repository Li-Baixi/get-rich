/* chart.js — 数据生成 · 指标计算 · SVG 图表引擎 */
"use strict";
/* ---------- 随机数 ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function norm(r){let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
/* ---------- 数据生成:分段漂移 ---------- */
function gen(seed,base,segs){
  const r=mulberry32(seed);let c=base;const bars=[];
  for(const s of segs)for(let i=0;i<s.n;i++){
    const o=c,cl=o+s.d+norm(r)*s.v;
    const hi=Math.max(o,cl)+Math.abs(norm(r))*s.v*0.6;
    const lo=Math.min(o,cl)-Math.abs(norm(r))*s.v*0.6;
    const v=Math.round(2e6*(s.vm||1)*(0.55+r()));
    bars.push({o,h:hi,l:lo,c:cl,v});c=cl;
  }
  return bars;
}
function bdays(n){const out=[];const d=new Date();while(out.length<n){const w=d.getDay();if(w!==0&&w!==6)out.unshift((d.getMonth()+1+'').padStart(2,'0')+'-'+(d.getDate()+'').padStart(2,'0'));d.setDate(d.getDate()-1)}return out}
/* ---------- 指标 ---------- */
function sma(a,n){const o=Array(a.length).fill(null);let s=0;for(let i=0;i<a.length;i++){s+=a[i];if(i>=n)s-=a[i-n];if(i>=n-1)o[i]=s/n}return o}
function emaArr(a,n){const o=Array(a.length).fill(null);const k=2/(n+1);let e=null,s=0,cnt=0;
  for(let i=0;i<a.length;i++){const x=a[i];if(x==null)continue;cnt++;s+=x;
    if(e===null){if(cnt===n){e=s/n;o[i]=e}}else{e=x*k+e*(1-k);o[i]=e}}
  return o}
function macdCalc(c,f,s,g){f=f||12;s=s||26;g=g||9;
  const ef=emaArr(c,f),es=emaArr(c,s);
  const dif=c.map((_,i)=>ef[i]==null||es[i]==null?null:ef[i]-es[i]);
  const dea=emaArr(dif,g);
  const hist=dif.map((d,i)=>d==null||dea[i]==null?null:d-dea[i]);
  return{dif,dea,hist}}
function rsiCalc(c,n){n=n||14;const o=Array(c.length).fill(null);let ag=0,al=0;
  for(let i=1;i<c.length;i++){const ch=c[i]-c[i-1],g=ch>0?ch:0,l=ch<0?-ch:0;
    if(i<=n){ag+=g;al+=l;if(i===n){ag/=n;al/=n;o[i]=al===0?100:100-100/(1+ag/al)}}
    else{ag=(ag*(n-1)+g)/n;al=(al*(n-1)+l)/n;o[i]=al===0?100:100-100/(1+ag/al)}}
  return o}
function kdjCalc(bars,n){n=n||9;const K=[],D=[],J=[];let k=50,d=50;
  for(let i=0;i<bars.length;i++){
    if(i<n-1){K.push(null);D.push(null);J.push(null);continue}
    let hh=-1e18,ll=1e18;for(let j=i-n+1;j<=i;j++){if(bars[j].h>hh)hh=bars[j].h;if(bars[j].l<ll)ll=bars[j].l}
    const rsv=(bars[i].c-ll)/((hh-ll)||1e-9)*100;
    k=k*2/3+rsv/3;d=d*2/3+k/3;K.push(k);D.push(d);J.push(3*k-2*d)}
  return{K,D,J}}
function bollCalc(c,n,k){n=n||20;k=k||2;const m=sma(c,n),up=Array(c.length).fill(null),lo=up.slice();
  for(let i=n-1;i<c.length;i++){let s=0;for(let j=i-n+1;j<=i;j++){const dd=c[j]-m[i];s+=dd*dd}
    const sd=Math.sqrt(s/n);up[i]=m[i]+k*sd;lo[i]=m[i]-k*sd}
  return{mid:m,up,lo}}
function sarCalc(bars){const n=bars.length,out=Array(n).fill(null);if(n<3)return out;
  let up=bars[1].c>=bars[0].c,ep=up?Math.max(bars[0].h,bars[1].h):Math.min(bars[0].l,bars[1].l);
  let sar=up?Math.min(bars[0].l,bars[1].l):Math.max(bars[0].h,bars[1].h);let af=0.02;out[1]=sar;
  for(let i=2;i<n;i++){let s=sar+af*(ep-sar);
    s=up?Math.min(s,bars[i-1].l,bars[i-2].l):Math.max(s,bars[i-1].h,bars[i-2].h);
    if(up){
      if(bars[i].l<s){up=false;out[i]=ep;sar=ep;ep=bars[i].l;af=0.02}
      else{if(bars[i].h>ep){ep=bars[i].h;af=Math.min(af+0.02,0.2)}sar=s;out[i]=s}}
    else{
      if(bars[i].h>s){up=true;out[i]=ep;sar=ep;ep=bars[i].h;af=0.02}
      else{if(bars[i].l<ep){ep=bars[i].l;af=Math.min(af+0.02,0.2)}sar=s;out[i]=s}}}
  return out}
function atrCalc(bars,n){n=n||14;const o=Array(bars.length).fill(null);let a=0;
  for(let i=1;i<bars.length;i++){const tr=Math.max(bars[i].h-bars[i].l,Math.abs(bars[i].h-bars[i-1].c),Math.abs(bars[i].l-bars[i-1].c));
    if(i<=n){a+=tr;if(i===n){a/=n;o[i]=a}}else{a=(a*(n-1)+tr)/n;o[i]=a}}
  return o}
function cciCalc(bars,n){n=n||14;const tp=bars.map(b=>(b.h+b.l+b.c)/3),m=sma(tp,n),o=Array(bars.length).fill(null);
  for(let i=n-1;i<bars.length;i++){let md=0;for(let j=i-n+1;j<=i;j++)md+=Math.abs(tp[j]-m[i]);md/=n;
    o[i]=(tp[i]-m[i])/(0.015*(md||1e-9))}
  return o}
function wmsrCalc(bars,n){n=n||14;const o=Array(bars.length).fill(null);
  for(let i=n-1;i<bars.length;i++){let hh=-1e18,ll=1e18;
    for(let j=i-n+1;j<=i;j++){if(bars[j].h>hh)hh=bars[j].h;if(bars[j].l<ll)ll=bars[j].l}
    o[i]=(hh-bars[i].c)/((hh-ll)||1e-9)*-100}
  return o}
function obvCalc(bars){const o=[0];for(let i=1;i<bars.length;i++)o.push(o[i-1]+(bars[i].c>bars[i-1].c?bars[i].v:bars[i].c<bars[i-1].c?-bars[i].v:0));return o}
function psyCalc(c,n){n=n||12;const o=Array(c.length).fill(null);
  for(let i=n;i<c.length;i++){let u=0;for(let j=i-n+1;j<=i;j++)if(c[j]>c[j-1])u++;o[i]=u/n*100}
  return o}
function dmiCalc(bars,n){n=n||14;const L=bars.length,pdi=Array(L).fill(null),mdi=Array(L).fill(null),adx=Array(L).fill(null);
  let sp=0,sn=0,str=0,sdx=0,cnt=0,pD=0,mD=0;
  for(let i=1;i<L;i++){
    const upM=bars[i].h-bars[i-1].h,dnM=bars[i-1].l-bars[i].l;
    const pdm=upM>dnM&&upM>0?upM:0,mdm=dnM>upM&&dnM>0?dnM:0;
    const tr=Math.max(bars[i].h-bars[i].l,Math.abs(bars[i].h-bars[i-1].c),Math.abs(bars[i].l-bars[i-1].c));
    if(i<=n){sp+=pdm;sn+=mdm;str+=tr;
      if(i===n){pD=100*sp/str;mD=100*sn/str;pdi[i]=pD;mdi[i]=mD}}
    else{sp=sp-sp/n+pdm;sn=sn-sn/n+mdm;str=str-str/n+tr;
      pD=100*sp/str;mD=100*sn/str;pdi[i]=pD;mdi[i]=mD;
      const dx=100*Math.abs(pD-mD)/((pD+mD)||1e-9);
      if(cnt<n){sdx+=dx;cnt++;if(cnt===n)adx[i]=sdx/n}
      else{sdx=(sdx*(n-1)+dx)/n;adx[i]=sdx}}}
  return{pdi,mdi,adx}}
function tdCalc(bars){const L=bars.length,buy=Array(L).fill(0),sell=Array(L).fill(0);
  for(let i=4;i<L;i++){
    if(bars[i].c<bars[i-4].c)buy[i]=buy[i-1]+1;
    if(bars[i].c>bars[i-4].c)sell[i]=sell[i-1]+1}
  return{buy,sell}}
/* ---------- 小工具 ---------- */
function argmin(a,from,to){let bi=from;for(let i=from;i<=to;i++)if(a[i]<a[bi])bi=i;return bi}
function argmax(a,from,to){let bi=from;for(let i=from;i<=to;i++)if(a[i]>a[bi])bi=i;return bi}
function findCross(fast,slow,from,to,dir){ // dir=1: fast上穿slow
  for(let i=Math.max(1,from);i<=to;i++){
    if(fast[i]==null||fast[i-1]==null||slow[i]==null||slow[i-1]==null)continue;
    if(dir===1&&fast[i-1]<=slow[i-1]&&fast[i]>slow[i])return i;
    if(dir===-1&&fast[i-1]>=slow[i-1]&&fast[i]<slow[i])return i}
  return null}
function ticks(mn,mx,n){n=n||4;const span=mx-mn||1;const step0=span/n;
  const mag=Math.pow(10,Math.floor(Math.log10(step0)));const nm=step0/mag;
  const st=(nm<1.5?1:nm<3.5?2:nm<7.5?5:10)*mag;const t=[];
  for(let v=Math.ceil(mn/st)*st;v<=mx+st*1e-6;v+=st)t.push(v);return t}
function fmt(x,d){if(x==null||!isFinite(x))return'—';d=d==null?2:d;return x.toFixed(d)}
function fmtK(x){if(x==null)return'—';const ax=Math.abs(x);
  if(ax>=1e9)return(x/1e9).toFixed(2)+'B';if(ax>=1e6)return(x/1e6).toFixed(2)+'M';
  if(ax>=1e3)return(x/1e3).toFixed(1)+'K';return x.toFixed(0)}
/* ---------- 图表引擎 ---------- */
const CHARTS=[];
function chart(id,cfg){
  const el=document.getElementById(id);if(!el)return;
  const wrap=el.parentElement.closest('.card')||el.parentElement;
  let leg=document.querySelector('.legend[data-for="'+id+'"]');
  const st={id,el,leg,cfg};
  CHARTS.push(st);renderChart(st);return st}
function winCfg(st){const c=st.cfg,W=st.el.clientWidth||600;
  const mobile=W<560;const win=Math.min(c.win||130,c.bars.length);
  const n=mobile?Math.min(c.mwin||95,win):win;
  const s=Math.max(0,c.bars.length-n);return{W,mobile,n,s}}
function renderChart(st){
  const c=st.cfg,{W,mobile,n,s}=winCfg(st);
  const bars=c.bars.slice(s),dates=(c.dates||[]).slice(s);
  const padL=6,padR=52,axH=16,panelGap=8;
  const priceH=mobile?150:190,subH=mobile?78:92;
  const subs=c.subs||[];
  const H=priceH+(panelGap+subH)*subs.length+axH;
  const cw=Math.max(1.4,(W-padL-padR)/n*0.62);
  const step=(W-padL-padR)/n;
  const X=i=>padL+(i+0.5)*step;
  const layers=[];let svg='';
  function domain(series){
    let mn=1e18,mx=-1e18;
    for(const se of series)for(let i=0;i<n;i++){const v=se.data[i+s];if(v==null)continue;if(v<mn)mn=v;if(v>mx)mx=v}
    if(mn>mx){mn=0;mx=1}
    const pad=(mx-mn)*0.06||1;return[mn-pad,mx+pad]}
  function pathOf(data,y,color,width,extra){
    let d='',pen=false;
    for(let i=0;i<n;i++){const v=data[i+s];if(v==null){pen=false;continue}
      const px=X(i).toFixed(1),py=y(v).toFixed(1);
      d+=(pen?'L':'M')+px+' '+py;pen=true}
    return'<path d="'+d+'" fill="none" stroke="var('+color+')" stroke-width="'+(width||1.6)+'" stroke-linecap="round" stroke-linejoin="round"'+(extra||'')+'/>'}
  // ---- 价格面板 ----
  let y0=0;
  // 值域:蜡烛高低 + overlay 线
  let mn=1e18,mx=-1e18;
  for(let i=0;i<n;i++){const b=bars[i];if(b.h>mx)mx=b.h;if(b.l<mn)mn=b.l}
  (c.over||[]).forEach(o=>{for(let i=0;i<n;i++){const v=o.data[i+s];if(v==null)return;if(v>mx)mx=v;if(v<mn)mn=v}
    if(o.bandLo)for(let i=0;i<n;i++){const v=o.bandLo[i+s];if(v==null)continue;if(v<mn)mn=v;if(v>mx)mx=v;o._isBand=true}});
  const pp=(mx-mn)*0.06||1;mn-=pp;mx+=pp;
  const Y=v=>y0+priceH-(v-mn)/(mx-mn)*priceH;
  // 网格
  ticks(mn,mx,4).forEach(t=>{const y=Y(t).toFixed(1);
    svg+='<line x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+'" stroke="var(--grid)" stroke-width="1"/>';
    svg+='<text x="'+(W-padR+5)+'" y="'+(+y+3.5)+'" fill="var(--mut)" font-size="9.5" font-variant-numeric="tabular-nums">'+fmt(t,mx-mx>50?0:1)+'</text>'});
  // BOLL 带填充
  (c.over||[]).forEach(o=>{if(!o.bandLo)return;
    let d1='',d2='';let pen=false;let first=[];const pts=[];
    for(let i=0;i<n;i++){const u=o.data[i+s],l=o.bandLo[i+s];if(u==null||l==null)continue;pts.push([X(i),Y(u),Y(l)])}
    if(pts.length>1){let d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
      for(let k=1;k<pts.length;k++)d+='L'+pts[k][0].toFixed(1)+' '+pts[k][1].toFixed(1);
      for(let k=pts.length-1;k>=0;k--)d+='L'+pts[k][0].toFixed(1)+' '+pts[k][2].toFixed(1);
      d+='Z';
      svg+='<path d="'+d+'" fill="var('+o.color+')" opacity="0.10"/>'}});
  // 蜡烛
  for(let i=0;i<n;i++){const b=bars[i];const up=b.c>=b.o;const col=up?'--up':'--dn';
    const x=X(i).toFixed(1);
    svg+='<line x1="'+x+'" y1="'+Y(b.h).toFixed(1)+'" x2="'+x+'" y2="'+Y(b.l).toFixed(1)+'" stroke="var('+col+')" stroke-width="1"/>';
    const yT=Y(Math.max(b.o,b.c)),yB=Y(Math.min(b.o,b.c));
    const hgt=Math.max(1,yB-yT);
    if(up)svg+='<rect x="'+(x-cw/2)+'" y="'+yT.toFixed(1)+'" width="'+cw.toFixed(1)+'" height="'+hgt.toFixed(1)+'" fill="var(--card)" stroke="var(--up)" stroke-width="1" rx="0.5"/>';
    else svg+='<rect x="'+(x-cw/2)+'" y="'+yT.toFixed(1)+'" width="'+cw.toFixed(1)+'" height="'+hgt.toFixed(1)+'" fill="var(--dn)" rx="0.5"/>'}
  // overlay 线
  (c.over||[]).forEach(o=>{
    layers.push({panel:0,name:o.name,colorV:o.color,data:o.data,fmtD:o.fmtD==null?2:o.fmtD});
    svg+=pathOf(o.data,Y,o.color,o.width||1.6);
    if(o.bandLo)svg+=pathOf(o.bandLo,Y,o.color,o.width||1.6,' opacity="0.75"')});
  // 价格面板趋势线与标记
  (c.trends||[]).filter(t=>t.panel===0||t.panel==null).forEach(t=>{
    svg+='<line x1="'+X(t.i1-s).toFixed(1)+'" y1="'+Y(t.v1).toFixed(1)+'" x2="'+X(t.i2-s).toFixed(1)+'" y2="'+Y(t.v2).toFixed(1)+'" stroke="var('+(t.color||'--s4')+')" stroke-width="1.6"/>'});
  (c.hlines||[]).forEach(h=>{const y=Y(h.v).toFixed(1);
    svg+='<line x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+'" stroke="var('+(h.color||'--mut')+')" stroke-width="1.1" stroke-dasharray="5 4" opacity="0.9"/>';
    if(h.t)svg+='<text x="'+(W-padR-3)+'" y="'+(y-4)+'" text-anchor="end" fill="var('+(h.color||'--mut')+')" font-size="9.5" font-weight="600">'+h.t+'</text>'});
  (c.marks||[]).forEach(m=>{
    const v=m.v!=null?m.v:bars[m.i-s][m.use||'h'];if(v==null)return;
    const x=X(m.i-s),y=Y(v);const above=m.dir!=='below';
    const ty=above?y-26:y+30;
    svg+='<path d="M'+x.toFixed(1)+' '+(above?y-5:y+5).toFixed(1)+'L'+(x-3.5).toFixed(1)+' '+(above?y-13:y+13).toFixed(1)+'L'+(x+3.5).toFixed(1)+' '+(above?y-13:y+13).toFixed(1)+'Z" fill="var('+(m.color||'--s4')+')"/>';
    svg+='<text x="'+x.toFixed(1)+'" y="'+ty+'" text-anchor="middle" fill="var('+(m.color||'--s4')+')" font-size="10.5" font-weight="700" paint-order="stroke" stroke="var(--card)" stroke-width="3">'+m.t+'</text>'});
  // TD 计数文字
  if(c.td){for(let i=0;i<n;i++){const cntv=c.td.buy[i+s];if(!cntv||cntv>9)continue;
    const b=bars[i];const x=X(i).toFixed(1);const y=Y(b.l)+12;
    if(cntv===9){svg+='<circle cx="'+x+'" cy="'+(y+3)+'" r="8" fill="none" stroke="var(--s4)" stroke-width="1.5"/>'}
    svg+='<text x="'+x+'" y="'+(y+6.5)+'" text-anchor="middle" fill="var(--'+(cntv===9?'s4':'mut')+')" font-size="'+(cntv===9?11:8.5)+'" font-weight="'+(cntv===9?800:500)+'"'+(cntv===9?' paint-order="stroke" stroke="var(--card)" stroke-width="3"':'')+'>'+cntv+'</text>'}}
  svg+='<text x="'+(padL+2)+'" y="'+(y0+11)+'" fill="var(--mut)" font-size="9.5" font-weight="600">'+(c.tag||'')+'</text>';
  st.pY=Y;st.dom=[mn,mx];
  // ---- 子面板 ----
  subs.forEach((sub,si)=>{
    y0+=priceH+panelGap;const y00=y0;y0+=0;
    const top=priceH+panelGap*(si+1)+subH*si;
    const[submn,submx]=domain(sub.series);
    let zmn=submn,zmx=submx;
    if(sub.zero&&zmn<0&&zmx>0){const a=Math.max(-zmn,zmx);zmn=-a;zmx=a}
    const pad2=(zmx-zmn)*0.08||1;let lo=zmn-pad2,hi=zmx+pad2;
    if(sub.min!=null)lo=sub.min;if(sub.max!=null)hi=sub.max;
    const SY=v=>top+subH-(v-lo)/(hi-lo)*subH;
    ticks(lo,hi,3).forEach(t=>{const y=SY(t).toFixed(1);
      svg+='<line x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+'" stroke="var(--grid)" stroke-width="1"/>';
      svg+='<text x="'+(W-padR+5)+'" y="'+(+y+3.5)+'" fill="var(--mut)" font-size="9.5" font-variant-numeric="tabular-nums">'+fmt(t,hi-lo>100?0:(hi-lo>20?1:2))+'</text>'});
    sub.series.forEach(se=>{
      layers.push({panel:si+1,name:se.name,colorV:se.color,data:se.data,fmtD:se.fmtD==null?1:se.fmtD});
      if(se.type==='hist'){
        const base=SY(Math.max(lo,Math.min(hi,0)));
        for(let i=0;i<n;i++){const v=se.data[i+s];if(v==null)continue;
          const y=SY(v);const col=se.colorBy==='sign'?(v>=0?'--up':'--dn'):(bars[i].c>=bars[i].o?'--up':'--dn');
          svg+='<line x1="'+X(i).toFixed(1)+'" y1="'+base.toFixed(1)+'" x2="'+X(i).toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="var('+col+')" stroke-width="'+Math.max(1.4,cw)+'" opacity="0.9"/>'}}
      else if(se.type==='dots'){
        let d='';
        for(let i=0;i<n;i++){const v=se.data[i+s];if(v==null)continue;d+='<circle cx="'+X(i).toFixed(1)+'" cy="'+SY(v).toFixed(1)+'" r="1.5" fill="var('+se.color+')"/>'}
        svg+='<g>'+d+'</g>'}
      else{svg+=pathOf(se.data,SY,se.color,se.width||1.5);
        if(se.dots){let d='';for(let i=0;i<n;i++){const v=se.data[i+s];if(v==null||!se.dots[i+s])continue;d+='<circle cx="'+X(i).toFixed(1)+'" cy="'+SY(v).toFixed(1)+'" r="2" fill="var('+se.color+')"/>'}svg+='<g>'+d+'</g>'}}
    });
    (sub.refs||[]).forEach(r=>{const y=SY(r.v).toFixed(1);
      svg+='<line x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+'" stroke="var(--axis)" stroke-width="1"/>';
      svg+='<text x="'+(W-padR+5)+'" y="'+(+y+3.5)+'" fill="var(--mut)" font-size="9">'+r.t+'</text>'});
    (sub.trends||[]).forEach(t=>{
      svg+='<line x1="'+X(t.i1-s).toFixed(1)+'" y1="'+SY(t.v1).toFixed(1)+'" x2="'+X(t.i2-s).toFixed(1)+'" y2="'+SY(t.v2).toFixed(1)+'" stroke="var('+(t.color||'--s4')+')" stroke-width="1.6"/>'});
    (sub.marks||[]).forEach(m=>{
      const v=m.v;if(v==null)return;const x=X(m.i-s),y=SY(v);
      const above=m.dir!=='below';const ty=above?y-14:y+18;
      svg+='<text x="'+x.toFixed(1)+'" y="'+ty+'" text-anchor="middle" fill="var('+(m.color||'--s4')+')" font-size="10" font-weight="700" paint-order="stroke" stroke="var(--card)" stroke-width="3">'+m.t+'</text>'});
    svg+='<text x="'+(padL+2)+'" y="'+(top+11)+'" fill="var(--mut)" font-size="9.5" font-weight="600">'+sub.tag+'</text>';
    st['sY'+(si+1)]=SY});
  // ---- x轴 ----
  const every=Math.max(1,Math.round(n/6));
  for(let i=0;i<n;i+=every){if(!dates[i])continue;
    svg+='<text x="'+X(i).toFixed(1)+'" y="'+(H-4)+'" text-anchor="middle" fill="var(--mut)" font-size="9.5">'+dates[i]+'</text>'}
  // ---- 十字线层 ----
  svg+='<g id="xh-'+st.id+'" style="display:none">';
  svg+='<line x1="0" y1="0" x2="0" y2="'+(H-axH)+'" stroke="var(--mut)" stroke-width="1" opacity="0.7"/>';
  svg+='</g>';
  svg+='<rect id="hl-'+st.id+'" y="'+0+'" width="'+Math.max(3,cw+1)+'" height="'+(H-axH)+'" fill="none" stroke="var(--tint)" stroke-width="1" opacity="0.55" rx="3" style="display:none"/>';
  st.svgH=H-axH;
  st.el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img">'+svg+'</svg><div class="tt" id="tt-'+st.id+'"></div>';
  st.svg=st.el.querySelector('svg');
  bindChart(st,bars,dates,layers,W,X,n,s,cw);
  // 图例
  if(st.leg){
    let h='';
    h+='<span class="lg sw"><i style="background:var(--up)"></i>阳线(涨·空心)</span><span class="lg sw"><i style="background:var(--dn)"></i>阴线(跌·实心)</span>';
    layers.forEach(ly=>{h+='<span class="lg"><i style="background:var('+ly.colorV+')"></i>'+ly.name+'</span>'});
    st.leg.innerHTML=h}
  // 数据表
  const det=st.leg&&st.leg.parentElement.querySelector('details.tbl');
  if(det)det.remove();
  const td=document.createElement('details');td.className='tbl';
  const sum=document.createElement('summary');sum.textContent='展开数据表(近40根)';td.appendChild(sum);
  td.addEventListener('toggle',()=>{if(td.open&&!td.dataset.built){td.dataset.built=1;buildTable(td,st,bars,dates,layers,n,s)}});
  (st.leg||st.el).insertAdjacentElement('afterend',td);
}
function buildTable(td,st,bars,dates,layers,n,s){
  const from=Math.max(0,n-40);let h='<div class="tblwrap"><table><thead><tr><th>日期</th><th>开</th><th>高</th><th>低</th><th>收</th><th>涨跌%</th>';
  layers.forEach(ly=>h+='<th>'+ly.name+'</th>');h+='</tr></thead><tbody>';
  for(let i=n-1;i>=from;i--){const b=bars[i];const chg=i>0?((b.c-bars[i-1].c)/bars[i-1].c*100):0;
    h+='<tr><td>'+(dates[i]||'')+'</td><td>'+fmt(b.o)+'</td><td>'+fmt(b.h)+'</td><td>'+fmt(b.l)+'</td><td>'+fmt(b.c)+'</td><td>'+(chg>=0?'+':'')+chg.toFixed(2)+'%</td>';
    layers.forEach(ly=>{const v=ly.data[i+s];h+='<td>'+(ly.big?fmtK(v):fmt(v,ly.fmtD))+'</td>'});
    h+='</tr>'}
  h+='</tbody></table></div>';
  const dv=document.createElement('div');dv.innerHTML=h;while(dv.firstChild)td.appendChild(dv.firstChild)}
function bindChart(st,bars,dates,layers,W,X,n,s,cw){
  const tt=st.el.querySelector('.tt');
  const xh=st.svg.querySelector('#xh-'+st.id);
  const hl=st.svg.querySelector('#hl-'+st.id);
  let dots=null;
  function ensureDots(){if(dots)return;dots=layers.map((ly,li)=>{
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('r','3.2');c.setAttribute('fill','var('+ly.colorV+')');
      c.setAttribute('stroke','var(--card)');c.setAttribute('stroke-width','1.5');c.style.display='none';
      st.svg.appendChild(c);return c})}
  function show(i){
    i=Math.max(0,Math.min(n-1,i));
    const x=X(i);
    xh.setAttribute('transform','translate('+x+' 0)');xh.style.display='';
    hl.setAttribute('x',(x-Math.max(3,cw+1)/2).toFixed(1));hl.setAttribute('y',0);hl.setAttribute('height',st.svgH);hl.style.display='';
    ensureDots();
    let h='<div class="d">'+(dates[i]||('#'+i))+'</div>';
    h+='<div class="row"><i style="background:var(--up)"></i>开 '+fmt(bars[i].o)+' 高 '+fmt(bars[i].h)+'<b></b></div>';
    h+='<div class="row"><i style="background:var(--dn)"></i>低 '+fmt(bars[i].l)+' 收 '+fmt(bars[i].c)+'<b></b></div>';
    layers.forEach((ly,li)=>{const v=ly.data[i+s];const y=ly.panel===0?st.pY(v):st['sY'+ly.panel](v);
      if(v!=null&&isFinite(y)){dots[li].setAttribute('cx',x);dots[li].setAttribute('cy',y);dots[li].style.display=''}else dots[li].style.display='none';
      h+='<div class="row"><i style="background:var('+ly.colorV+')"></i>'+ly.name+'<b>'+(ly.big?fmtK(v):fmt(v,ly.fmtD))+'</b></div>'});
    tt.innerHTML=h;tt.style.display='block';
    const tw=tt.offsetWidth;
    let lx=x+14;if(lx+tw>W-4)lx=x-tw-14;tt.style.left=Math.max(2,lx)+'px';tt.style.top='8px';
    st.cur=i}
  function hide(){tt.style.display='none';xh.style.display='none';hl.style.display='none';if(dots)dots.forEach(d=>d.style.display='none')}
  function px2i(px){return Math.max(0,Math.min(n-1,Math.round((px-6)/((W-6-52)/n)-0.5)))}
  st.el.onpointermove=e=>{const r=st.el.getBoundingClientRect();
    show(px2i((e.clientX-r.left)*(W/r.width)))};
  st.el.onpointerdown=e=>{const r=st.el.getBoundingClientRect();show(px2i((e.clientX-r.left)*(W/r.width)))};
  st.el.onpointerleave=hide;
  st.el.onkeydown=e=>{if(!st.cur&&st.cur!==0)st.cur=Math.floor(n/2);
    if(e.key==='ArrowLeft'){show(st.cur-1);e.preventDefault()}
    if(e.key==='ArrowRight'){show(st.cur+1);e.preventDefault()}};
  st.show=show;st.hide=hide}
let padLst=6;
function renderAll(){CHARTS.forEach(renderChart)}
let rsT=null;window.addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(renderAll,180)});
