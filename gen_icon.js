/* 生成 PWA 图标(纯 node,无依赖) */
const zlib=require('zlib'),fs=require('fs');
function crc32(buf){let t=crc32.t;if(!t){t=crc32.t=new Int32Array(256);
  for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c}}
  let c=-1;for(let i=0;i<buf.length;i++)c=t[(c^buf[i])&255]^(c>>>8);return(c^-1)>>>0}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);
  const t=Buffer.from(type,'ascii');const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));
  return Buffer.concat([len,t,data,crc])}
function png(w,h,fn){const raw=Buffer.alloc((w*4+1)*h);
  for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;
    for(let x=0;x<w;x++){const p=fn(x/w,y/w);const o=y*(w*4+1)+1+x*4;
      raw[o]=p[0];raw[o+1]=p[1];raw[o+2]=p[2];raw[o+3]=p[3]}}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))])}
function px(u,v){
  let r=16+(1-v)*12,g=17+(1-v)*12,b=20+(1-v)*14;  // 深色渐变底
  const candle=(cx,bw,t,b)=>Math.abs(u-cx)<bw&&v>t&&v<b;
  const wick=(cx,t,b)=>Math.abs(u-cx)<0.010&&v>t&&v<b;
  if(candle(0.26,0.062,0.30,0.66)||wick(0.26,0.22,0.74))return[25,158,112,255];   // 绿阴线
  if(candle(0.50,0.062,0.44,0.82)||wick(0.50,0.36,0.90))return[25,158,112,255];
  if(candle(0.74,0.070,0.18,0.56)||wick(0.74,0.10,0.64))return[230,103,103,255]; // 红阳线
  return[r,g,b,255]}
fs.writeFileSync('icon-192.png',png(192,192,px));
fs.writeFileSync('icon-512.png',png(512,512,px));
console.log('icons ok');
