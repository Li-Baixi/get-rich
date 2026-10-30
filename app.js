/* app.js — 数据集 · 各图表构建 · 交互(Tab/主题/计分器/计算器) */
"use strict";
/* ---------- 数据集(确定性种子,形态可控) ---------- */
const dsTrend=gen(11,100,[{n:50,d:0.35,v:1.0},{n:30,d:-0.55,v:1.1},{n:55,d:0.8,v:1.1},{n:25,d:0.05,v:0.8},{n:30,d:0.5,v:1.0}]);
const dsRange=gen(7,100,[{n:70,d:0.02,v:0.55,vm:0.7},{n:45,d:0.95,v:1.5,vm:2.6},{n:35,d:0.4,v:1.0,vm:1.3}]);
const dsSAR  =gen(21,100,[{n:75,d:-0.6,v:1.0},{n:12,d:-0.05,v:0.7},{n:45,d:0.7,v:1.0},{n:18,d:0.1,v:0.8}]);
const dsTD   =gen(33,100,[{n:26,d:0.2,v:0.8},{n:70,d:-0.8,v:0.7},{n:34,d:0.85,v:0.9}]);
const dsDiv  =gen(5,100,[{n:55,d:-0.8,v:0.85},{n:30,d:0.55,v:0.9},{n:45,d:-0.45,v:0.7}]);
const dsShort=gen(9,100,[{n:70,d:0.4,v:0.95},{n:20,d:0.05,v:0.8},{n:50,d:-0.7,v:1.1},{n:25,d:0.35,v:1.0}]);
const ALLD=bdays(200);
const dt=bars=>ALLD.slice(-bars.length);
const closes=b=>b.map(x=>x.c),lows=b=>b.map(x=>x.l),highs=b=>b.map(x=>x.h),vols=b=>b.map(x=>x.v);

/* ---------- 图表构建 ---------- */
function buildAll(){
const cT=closes(dsTrend),hT=highs(dsTrend),lT=lows(dsTrend);
const ma10=sma(cT,10),ma20t=sma(cT,20),ma60t=sma(cT,60),atrT=atrCalc(dsTrend);
const macdT=macdCalc(cT),dmiT=dmiCalc(dsTrend),obvT=obvCalc(dsTrend);
const LT=dsTrend.length;

/* MA */
let iMul=null;for(let i=90;i<140;i++){let ok=ma10[i]>ma20t[i]&&ma20t[i]>ma60t[i];
  if(ok)for(let j=i;j<i+8;j++)if(!(ma10[j]>ma20t[j]&&ma20t[j]>ma60t[j]))ok=false;
  if(ok){iMul=i+4;break}}
const iX=findCross(ma10,ma20t,96,LT-5,1);
chart('c-ma',{bars:dsTrend,dates:dt(dsTrend),win:130,mwin:95,tag:'K线 + MA(10/20/60)',
  over:[{name:'MA10',data:ma10,color:'--s1'},{name:'MA20',data:ma20t,color:'--s2'},{name:'MA60',data:ma60t,color:'--s3'}],
  marks:[iMul?{i:iMul,v:hT[iMul],t:'多头排列',color:'--up'}:null,
         iX?{i:iX,v:lT[iX],t:'金叉',dir:'below',color:'--tint'}:null].filter(Boolean)});

/* EMA */
const ema12=emaArr(cT,12),ema26=emaArr(cT,26);
const iPB=argmin(lT,96,120);
chart('c-ema',{bars:dsTrend,dates:dt(dsTrend),win:130,mwin:95,tag:'EMA vs SMA 同为20日',
  over:[{name:'EMA12(快)',data:ema12,color:'--s1'},{name:'EMA26(慢)',data:ema26,color:'--s2'},{name:'SMA20(对比)',data:ma20t,color:'--s3',width:1.4}],
  marks:[{i:iPB,v:lT[iPB],t:'回调:EMA贴价·SMA滞后',dir:'below',color:'--mut'}]});

/* SAR */
const sarD=sarCalc(dsSAR);const LS=dsSAR.length;
let flips=[];for(let i=30;i<LS-1;i++){if(sarD[i]==null||sarD[i-1]==null)continue;
  const a=dsSAR[i-1].c>sarD[i-1],b=dsSAR[i].c>sarD[i];if(a!==b)flips.push(i)}
const flipUp=flips.find(f=>dsSAR[f].c<sarD[f]);
chart('c-sar',{bars:dsSAR,dates:dt(dsSAR),win:120,mwin:92,tag:'SAR(0.02,0.2)',
  over:[{name:'SAR点',data:sarD,color:'--s4',type:'dots',fmtD:1}],
  marks:flips.slice(0,2).map(f=>({i:f,v:sarD[f],t:'翻转',dir:dsSAR[f].c<sarD[f]?'above':'below',color:'--s4'}))});

/* BOLL */
const cR=closes(dsRange);const bol=bollCalc(cR,20,2);const LR=dsRange.length;
const bw=bol.up.map((u,i)=>u==null?null:(u-bol.lo[i])/bol.mid[i]);
const iSq=argmin(bw,56,70);
let iBr=null;for(let i=iSq;i<LR;i++){if(bol.up[i]!=null&&cR[i]>bol.up[i]){iBr=i;break}}
chart('c-boll',{bars:dsRange,dates:dt(dsRange),win:132,mwin:96,tag:'BOLL(20,2)',
  over:[{name:'上/下轨(±2σ)',data:bol.up,bandLo:bol.lo,color:'--s1'},{name:'中轨MA20',data:bol.mid,color:'--s4',width:1.4}],
  marks:[{i:iSq,v:highs(dsRange)[iSq],t:'极度收口',color:'--mut'},
         iBr?{i:iBr,v:highs(dsRange)[iBr],t:'开口·突破',color:'--up'}:null].filter(Boolean)});

/* 神奇九转 */
const tdD=tdCalc(dsTD);let i9=null;for(let i=30;i<dsTD.length;i++){if(tdD.buy[i]===9){i9=i;break}}
chart('c-td',{bars:dsTD,dates:dt(dsTD),win:130,mwin:105,tag:'TD Setup · 下跌计数',
  td:{buy:tdD.buy},
  marks:[i9?{i:i9,v:lows(dsTD)[i9],t:'数到9·动能衰竭',dir:'below',color:'--s4'}:null].filter(Boolean)});

/* MACD */
const iG=findCross(macdT.dif,macdT.dea,96,LT-5,1),iD=findCross(macdT.dif,macdT.dea,96,LT-5,-1);
chart('c-macd',{bars:dsTrend,dates:dt(dsTrend),win:130,mwin:95,tag:'价格',
  subs:[{tag:'MACD(12,26,9)',zero:true,series:[
      {name:'DIF',data:macdT.dif,color:'--s1',fmtD:1},
      {name:'DEA',data:macdT.dea,color:'--s2',fmtD:1},
      {name:'柱(DIF−DEA)',data:macdT.hist,type:'hist',colorBy:'sign',fmtD:1}],
    refs:[{v:0,t:'0'}]}],
  marks:[iG?{i:iG,v:lT[iG],t:'金叉',dir:'below',color:'--up'}:null,
         iD?{i:iD,v:hT[iD],t:'死叉',color:'--dn'}:null].filter(Boolean)});

/* DMI */
const iAp=argmax(dmiT.adx,LT-60,LT-1);
chart('c-dmi',{bars:dsTrend,dates:dt(dsTrend),win:130,mwin:95,tag:'价格',
  subs:[{tag:'DMI(14)',min:0,max:60,series:[
      {name:'+DI(多)',data:dmiT.pdi,color:'--up',fmtD:1},
      {name:'−DI(空)',data:dmiT.mdi,color:'--dn',fmtD:1},
      {name:'ADX(强度)',data:dmiT.adx,color:'--s4',fmtD:1}],
    refs:[{v:20,t:'20'},{v:25,t:'25'}],
    marks:[{i:iAp,v:dmiT.adx[iAp],t:'ADX>25 趋势市',color:'--s4'}]}]});

/* RSI(用九转数据集看超卖) */
const cTD=closes(dsTD);const rsiD=rsiCalc(cTD,14);
const iRo=argmin(rsiD,30,90);const rsiDots=rsiD.map(v=>v!=null&&v<30);
chart('c-rsi',{bars:dsTD,dates:dt(dsTD),win:130,mwin:105,tag:'价格',
  subs:[{tag:'RSI(14)',min:0,max:100,series:[{name:'RSI',data:rsiD,color:'--s1',dots:rsiDots}],
    refs:[{v:30,t:'30'},{v:50,t:'50'},{v:70,t:'70'}],
    marks:[{i:iRo,v:rsiD[iRo],t:'超卖<30',dir:'below',color:'--up'}]}]});

/* KDJ */
const kd=kdjCalc(dsTD);
const iK=findCross(kd.K,kd.D,30,dsTD.length-8,1);
chart('c-kdj',{bars:dsTD,dates:dt(dsTD),win:130,mwin:105,tag:'价格',
  subs:[{tag:'KDJ(9,3,3)',min:0,max:100,series:[
      {name:'K',data:kd.K,color:'--s1',fmtD:1},{name:'D',data:kd.D,color:'--s2',fmtD:1},{name:'J',data:kd.J,color:'--s3',fmtD:0}],
    refs:[{v:20,t:'20'},{v:80,t:'80'}],
    marks:[iK?{i:iK,v:kd.K[iK],t:'低位金叉',dir:'below',color:'--up'}:null].filter(Boolean)}]});

/* CCI */
const cc=cciCalc(dsTD,14);let iC=null;
for(let i=31;i<dsTD.length-8;i++){if(cc[i-1]!=null&&cc[i-1]<-100&&cc[i]>=-100){iC=i;break}}
chart('c-cci',{bars:dsTD,dates:dt(dsTD),win:130,mwin:105,tag:'价格',
  subs:[{tag:'CCI(14)',series:[{name:'CCI',data:cc,color:'--s1',fmtD:0}],
    refs:[{v:-100,t:'-100'},{v:0,t:'0'},{v:100,t:'100'}],
    marks:[iC?{i:iC,v:cc[iC],t:'上穿−100',dir:'below',color:'--up'}:null].filter(Boolean)}]});

/* WMSR */
const wr=wmsrCalc(dsTD,14);let iW=null;
for(let i=31;i<dsTD.length-8;i++){if(wr[i-1]!=null&&wr[i-1]<-80&&wr[i]>=-80){iW=i;break}}
chart('c-wmsr',{bars:dsTD,dates:dt(dsTD),win:130,mwin:105,tag:'价格',
  subs:[{tag:'威廉%R(14)',min:-100,max:0,series:[{name:'W%R',data:wr,color:'--s1',fmtD:0}],
    refs:[{v:-80,t:'-80'},{v:-50,t:'-50'},{v:-20,t:'-20'}],
    marks:[iW?{i:iW,v:wr[iW],t:'穿−80',dir:'below',color:'--up'}:null].filter(Boolean)}]});

/* VOL */
const vR=vols(dsRange),vma5=sma(vR,5);const iVm=argmax(vR,70,112);
chart('c-vol',{bars:dsRange,dates:dt(dsRange),win:132,mwin:96,tag:'量价配合',
  subs:[{tag:'成交量',series:[{name:'成交量',data:vR,type:'hist',big:true},{name:'量MA5',data:vma5,color:'--s1',big:true,fmtD:0}]}],
  marks:[{i:iVm,v:highs(dsRange)[iVm],t:'放量突破',color:'--up'}]});

/* OBV */
const iO=argmax(obvT,LT-60,LT-1);
chart('c-obv',{bars:dsTrend,dates:dt(dsTrend),win:130,mwin:95,tag:'价涨量增=健康',
  subs:[{tag:'OBV(累计能量潮)',series:[{name:'OBV',data:obvT,color:'--s1',big:true}],
    marks:[{i:iO,v:obvT[iO],t:'OBV同步新高',color:'--up'}]}],
  marks:[{i:iO,v:hT[iO],t:'价新高',color:'--mut'}]});

/* PSY */
const ps=psyCalc(cTD,12);const iP=argmin(ps,30,90);
chart('c-psy',{bars:dsTD,dates:dt(dsTD),win:130,mwin:105,tag:'价格',
  subs:[{tag:'PSY(12)',min:0,max:100,series:[{name:'PSY',data:ps,color:'--s1',fmtD:0}],
    refs:[{v:25,t:'25'},{v:75,t:'75'}],
    marks:[{i:iP,v:ps[iP],t:'情绪冰点',dir:'below',color:'--up'}]}]});

/* ATR */
const atrR=atrCalc(dsRange,14);const iAs=argmin(atrR,56,70),iAv=argmax(atrR,70,112);
chart('c-atr',{bars:dsRange,dates:dt(dsRange),win:132,mwin:96,tag:'波动率',
  subs:[{tag:'ATR(14)',series:[{name:'ATR',data:atrR,color:'--s1',fmtD:2}],
    marks:[{i:iAs,v:atrR[iAs],t:'收口·波动缩小',dir:'below',color:'--mut'},
           {i:iAv,v:atrR[iAv],t:'突破·波动放大',color:'--s4'}]}]});

/* 策略A */
let eA=null;for(let i=96;i<LT-12;i++){if(lT[i]<=ma20t[i]*1.008&&cT[i+3]>ma20t[i+3]&&ma20t[i]>ma60t[i]){eA=i+1;break}}
if(eA){const ep=cT[eA],a=atrT[eA];
  chart('c-sa',{bars:dsTrend,dates:dt(dsTrend),win:130,mwin:95,tag:'策略A · 回踩MA20',
    over:[{name:'MA20',data:ma20t,color:'--s2'},{name:'MA60',data:ma60t,color:'--s3'}],
    hlines:[{v:ep-2*a,t:'止损 2×ATR',color:'--mut'},{v:ep+4*a,t:'目标 2R',color:'--tint'}],
    marks:[{i:eA,v:lT[eA],t:'回踩企稳·入场',dir:'below',color:'--up'}]});}
else chart('c-sa',{bars:dsTrend,dates:dt(dsTrend),win:130,mwin:95,tag:'策略A',
  over:[{name:'MA20',data:ma20t,color:'--s2'},{name:'MA60',data:ma60t,color:'--s3'}]});

/* 策略B */
const bolB=bollCalc(cTD,20,2);const atB=atrCalc(dsTD,14);
let eB=null;if(i9!=null)for(let i=i9;i<dsTD.length;i++){if(dsTD[i].c>dsTD[i].o){eB=i;break}}
let stopB=null,tgtB=null;if(eB!=null&&atB[eB]!=null){
  let ml=1e9;for(let j=Math.max(0,(i9||eB)-3);j<=eB+2;j++)ml=Math.min(ml,dsTD[j].l);
  stopB=ml-atB[eB];tgtB=bolB.mid[eB]}
chart('c-sb',{bars:dsTD,dates:dt(dsTD),win:130,mwin:105,tag:'策略B · 七项共振',
  over:[{name:'上/下轨',data:bolB.up,bandLo:bolB.lo,color:'--s1'},{name:'中轨(目标)',data:bolB.mid,color:'--s4',width:1.4}],
  td:{buy:tdD.buy},tdSell:null,
  hlines:[stopB!=null?{v:stopB,t:'止损 低点−1×ATR',color:'--mut'}:null,
          tgtB!=null?{v:tgtB,t:'目标 中轨',color:'--tint'}:null].filter(Boolean),
  marks:[eB!=null?{i:eB,v:dsTD[eB].l,t:'阳线确认·入场',dir:'below',color:'--up'}:null].filter(Boolean)});

/* 策略C */
const cS=closes(dsShort),lS=lows(dsShort),hS=highs(dsShort);
const ma20s=sma(cS,20),ma60s=sma(cS,60);const atS=atrCalc(dsShort,14);const LSM=dsShort.length;
const iR=argmax(hS,142,160);let eC=null;
for(let i=iR+1;i<Math.min(iR+8,LSM-1);i++){if(cS[i]<cS[i-1]&&cS[i]<ma20s[i]){eC=i;break}}
let stopC=null,tgtC=null;
if(eC!=null&&atS[eC]!=null){let hh=-1e9;for(let j=Math.max(0,iR-3);j<=Math.min(LSM-1,eC+3);j++)hh=Math.max(hh,hS[j]);
  stopC=hh+1.5*atS[eC];tgtC=Math.min.apply(null,lS.slice(95,140))}
chart('c-sc',{bars:dsShort,dates:dt(dsShort),win:130,mwin:95,tag:'策略C · 反弹受阻做空',
  over:[{name:'MA20',data:ma20s,color:'--s2'},{name:'MA60',data:ma60s,color:'--s3'}],
  hlines:[stopC!=null?{v:stopC,t:'止损 高点+1.5×ATR',color:'--mut'}:null,
          tgtC!=null?{v:tgtC,t:'目标 前低',color:'--tint'}:null].filter(Boolean),
  marks:[{i:iR,v:hS[iR],t:'缩量反弹受阻',color:'--dn'},
         eC!=null?{i:eC,v:hS[eC],t:'转跌·做空',color:'--dn'}:null].filter(Boolean)});

/* 背离专题 */
const cDv=closes(dsDiv);const rsiV=rsiCalc(cDv,14);const macV=macdCalc(cDv);const LDV=dsDiv.length;
const i1=argmin(cDv,38,55),i2=argmin(cDv,LDV-12,LDV-1);
const r1=argmin(rsiV,Math.max(15,i1-8),i1+8),r2=argmin(rsiV,Math.max(15,i2-8),i2+8);
chart('c-div',{bars:dsDiv,dates:dt(dsDiv),win:120,mwin:96,tag:'底背离 · 三窗对齐',
  trends:[{panel:0,i1,v1:cDv[i1],i2,v2:cDv[i2],color:'--s4'}],
  subs:[
    {tag:'RSI(14)',min:0,max:100,series:[{name:'RSI',data:rsiV,color:'--s1'}],
     refs:[{v:30,t:'30'},{v:70,t:'70'}],
     trends:[{i1:r1,v1:rsiV[r1],i2:r2,v2:rsiV[r2],color:'--s4'}],
     marks:[{i:r2,v:rsiV[r2],t:'RSI抬高',dir:'below',color:'--up'}]},
    {tag:'MACD',zero:true,series:[{name:'DIF',data:macV.dif,color:'--s1',fmtD:1},{name:'DEA',data:macV.dea,color:'--s2',fmtD:1}],refs:[{v:0,t:'0'}],
     marks:[{i:r2,v:macV.dif[r2],t:'DIF抬高',dir:'below',color:'--up'}]}],
  marks:[{i:i1,v:dsDiv[i1].l,t:'低点①',dir:'below',color:'--mut'},
         {i:i2,v:dsDiv[i2].l,t:'低点②(更低)',dir:'below',color:'--mut'}]});
}

/* ---------- Tab 切换 ---------- */
const tabBtns=[...document.querySelectorAll('nav.tabs button')];
function showTab(id){
  document.querySelectorAll('section.tab').forEach(s=>s.classList.toggle('on',s.id===id));
  tabBtns.forEach(b=>b.classList.toggle('on',b.dataset.t===id));
  history.replaceState(null,'','#'+id.slice(2));
  window.scrollTo({top:0});
  if(id!=='t-tj')setTimeout(renderAll,30);}
tabBtns.forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.t)));
/* 分类过滤 */
document.querySelectorAll('#catSeg button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#catSeg button').forEach(x=>x.classList.toggle('on',x===b));
  const c=b.dataset.c;
  document.querySelectorAll('.ind').forEach(a=>a.classList.toggle('hidden',!(c==='all'||a.dataset.cat===c)))}));
/* 主题 */
document.getElementById('themeBtn').addEventListener('click',()=>{
  const h=document.documentElement;
  const t=h.dataset.theme==='dark'?'light':'dark';
  h.dataset.theme=t;try{localStorage.setItem('gr-theme',t)}catch(e){}});

/* ---------- 共振计分器 ---------- */
const SCORE_ITEMS=[
 {n:'收盘价在 MA20 上方,且 MA20 走平/向上',w:10,tip:'趋势结构'},
 {n:'MA20 > MA60(中期多头排列)',w:10,tip:'趋势结构'},
 {n:'收盘价在 SMA200 年线上方',w:8,tip:'长周期底色'},
 {n:'ADX≥20 且 +DI > −DI',w:12,tip:'趋势强度'},
 {n:'MACD:DIF > DEA 且柱状放大',w:10,tip:'动量方向'},
 {n:'MACD 零轴上方',w:6,tip:'动量位置'},
 {n:'RSI 在 40~65 多头强势区',w:8,tip:'动量位置'},
 {n:'KDJ 低位金叉(近5日内)',w:10,tip:'入场时机'},
 {n:'价格触及/跌破 BOLL 下轨(超卖)',w:6,tip:'入场时机'},
 {n:'神奇九转出现买入计数 9',w:10,tip:'入场时机'},
 {n:'涨放量、跌缩量(量价配合)',w:10,tip:'量能确认'},
 {n:'OBV 创同期新高',w:8,tip:'量能确认'},
 {n:'PSY < 40%(情绪未过热)',w:5,tip:'情绪'},
 {n:'MACD 或 RSI 底背离',w:15,tip:'拐点信号'}];
const MAXW=SCORE_ITEMS.reduce((s,x)=>s+x.w,0);
const sState=SCORE_ITEMS.map(()=>0);
(function buildScorer(){
  const host=document.getElementById('scorer');let h='';
  SCORE_ITEMS.forEach((it,idx)=>{
    h+='<div class="srow"><div class="txt"><div class="n">'+it.n+'</div><div class="w">'+it.tip+' · ±'+it.w+'分</div></div>'+
       '<div class="pbtns"><button class="pb l" data-i="'+idx+'" data-v="1">多</button><button class="pb s" data-i="'+idx+'" data-v="-1">空</button></div></div>'});
  host.innerHTML=h;
  host.addEventListener('click',e=>{
    const b=e.target.closest('button.pb');if(!b)return;
    const i=+b.dataset.i,v=+b.dataset.v;
    sState[i]=sState[i]===v?0:v;updateScore()})})();
function updateScore(){
  document.querySelectorAll('#scorer .pb').forEach(b=>{
    b.classList.toggle('on',sState[+b.dataset.i]===+b.dataset.v)});
  const sc=sState.reduce((s,v,i)=>s+v*SCORE_ITEMS[i].w,0);
  const pct=Math.round(sc/MAXW*100);
  const fill=document.getElementById('scoreFill');
  if(pct>=0){fill.className='pos';fill.style.left='50%';fill.style.width=(pct/2)+'%'}
  else{fill.className='neg';fill.style.left=(50+pct/2)+'%';fill.style.width=(-pct/2)+'%'}
  document.getElementById('scoreNum').textContent=(pct>0?'+':'')+pct;
  let v,acts;
  if(pct>=60){v='强烈做多 · 共振充分';acts=['按策略A执行:回踩MA20企稳后进场,不追高','止损 2×ATR 或跌破 MA20,先到为准','仓位=账户1%÷止损距离(工具页计算)','吊灯止盈 3×ATR 跟踪,破MA20减半']}
  else if(pct>=25){v='偏多 · 可分批建仓';acts=['半仓试探,余下等回踩MA20或放量突破加','止损 2×ATR,亏损不摊平','周线确认方向后再加仓']}
  else if(pct>-25){v='中性 · 观望';acts=['先看 ADX 定市况:趋势市等回踩,震荡市做区间','跨类共振≥3类再考虑出手','用工具页预演仓位与止损,先算后做']}
  else if(pct>-60){v='偏空 · 减仓/谨慎做空';acts=['多头减仓,弱势反弹不加仓','做空需策略C四条件齐备,仓位减半','警惕逼空,止损 1.5×ATR 无条件执行']}
  else{v='强烈看空 · 空头共振';acts=['按策略C:反弹受阻转跌处做空','止损反弹高点+1.5×ATR,目标前低/2R','融券成本与逼空风险计入后再决定仓位']}
  document.getElementById('scoreVerdict').textContent=v;
  document.getElementById('scoreActs').innerHTML=acts.map(a=>'<li>'+a+'</li>').join('')}
updateScore();

/* ---------- ATR 计算器 ---------- */
let dirLong=true;
const $id=x=>document.getElementById(x);
function calc(){
  const acct=+$id('in-acct').value||0,riskP=+$id('in-risk').value||0,
        px=+$id('in-px').value||0,atr=+$id('in-atr').value||0,k=+$id('in-k').value||0;
  if(!(acct>0&&riskP>0&&px>0&&atr>0&&k>0))return;
  const perRisk=k*atr;
  const shares=Math.floor(acct*riskP/100/perRisk);
  const stop=dirLong?px-perRisk:px+perRisk;
  const t2=dirLong?px+2*perRisk:px-2*perRisk;
  const t3=dirLong?px+3*perRisk:px-3*perRisk;
  $id('o-stop').textContent='$'+stop.toFixed(2);
  $id('o-risk').textContent='$'+perRisk.toFixed(2);
  $id('o-shares').textContent=shares+' 股';
  $id('o-pos').textContent='$'+Math.round(shares*px).toLocaleString()+' <small>('+((shares*px/acct)*100).toFixed(1)+'%)</small>';
  $id('o-t2').textContent='$'+t2.toFixed(2);
  $id('o-t3').textContent='$'+t3.toFixed(2)}
['in-acct','in-risk','in-px','in-atr','in-k'].forEach(id=>{$id(id).addEventListener('input',calc)});
$id('dirL').addEventListener('click',()=>{dirLong=true;$id('dirL').classList.add('on');$id('dirS').classList.remove('on');calc()});
$id('dirS').addEventListener('click',()=>{dirLong=false;$id('dirS').classList.add('on');$id('dirL').classList.remove('on');calc()});
calc();

/* ---------- 启动 ---------- */
buildAll();
updateScore();
const h0=location.hash.replace('#','');
if(['tj','cl','gj','sc'].includes(h0))showTab('t-'+h0);
if('serviceWorker' in navigator&&location.protocol==='https:')
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
