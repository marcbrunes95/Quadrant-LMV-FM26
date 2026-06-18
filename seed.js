const fs=require('fs');
const sheet=fs.readFileSync('_x/xl/worksheets/sheet1.xml','utf8');
const styles=fs.readFileSync('_x/xl/styles.xml','utf8');
const fills=[];
styles.replace(/<fills[^>]*>([\s\S]*?)<\/fills>/,(m,inner)=>{
  inner.replace(/<fill>([\s\S]*?)<\/fill>/g,(mm,f)=>{
    const fg=/<fgColor[^>]*rgb="([0-9A-Fa-f]+)"/.exec(f);
    fills.push(fg?fg[1].toUpperCase():null);
  });
});
const xfFill=[];
const cellxfs=/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles)[1];
cellxfs.replace(/<xf\b([^>]*?)(\/>|>[\s\S]*?<\/xf>)/g,(m,attrs)=>{
  const f=/fillId="(\d+)"/.exec(attrs); xfFill.push(f?parseInt(f[1]):0);
});
const rows={};
sheet.replace(/<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g,(m,rn,cells)=>{
  rn=parseInt(rn); rows[rn]={};
  cells.replace(/<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,(mm,col,r2,attrs,inner)=>{
    const tM=/t="([^"]+)"/.exec(attrs); const sM=/s="(\d+)"/.exec(attrs);
    let val=''; if(inner){const v=/<v>([\s\S]*?)<\/v>/.exec(inner); if(v)val=v[1];}
    let color=''; if(sM){const fid=xfFill[parseInt(sM[1])]; color=fills[fid]||'';}
    rows[rn][col]={val,color};
  });
});
function colorName(hex){
  if(hex==='FFD9EAD3')return'verd';
  if(hex==='FFF4CCCC')return'vermell';
  if(hex==='FFE06666')return'roig';
  if(hex==='FFCCCCCC')return'GRAY';
  return'blanc';
}
function frac(v){ // excel time fraction -> HH:MM
  const t=Math.round(parseFloat(v)*24*60); const h=Math.floor(t/60), m=t%60;
  return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
}
const cols=['C','D','E','F','G','H','I','J','K','L','M'];
const slots=[];
// MAIN TABLE definition: block -> rows with [type,timeLabel]
const main=[
 {block:'Prèvia dissabte 27/06', rows:[
   {r:3,time:'16:00',tag:'Muntatge'},{r:6,time:'23:00-1:15'},{r:7,time:'1:00-3:00'},{r:9,time:'03:00',tag:'Desmuntatge'}]},
 {block:'FM dijous 2/07', rows:[
   {r:11,time:'16:00',tag:'Muntatge'},{r:14,time:'22:30-00:15'},{r:15,time:'00:00-2:15'},{r:16,time:'2:00-4:00'}]},
 {block:'FM divendres 3/07', rows:[
   {r:18,time:'22:30-00:15'},{r:19,time:'00:00-2:15'},{r:20,time:'2:00-4:00'}]},
 {block:'FM dissabte 4/07', rows:[
   {r:22,time:'22:00-00:15'},{r:23,time:'00:00-2:15'},{r:24,time:'2:00-4:00'},{r:26,time:'04:00',tag:'Desmuntatge'}]},
];
let n=0;
for(const blk of main){
  for(const row of blk.rows){
    for(const c of cols){
      const cell=rows[row.r] && rows[row.r][c];
      if(!cell)continue;
      const col=colorName(cell.color);
      const hasNum=cell.val!=='' && !isNaN(parseFloat(cell.val));
      if(hasNum){
        n++;
        slots.push({id:n,table:'FM',block:blk.block,time:row.time,tag:row.tag||null,color:(row.tag?'blanc':col),col:c,oldNum:parseFloat(cell.val)});
      }
    }
  }
}
const mainCount=n;
// FRIGOFIESTA: rows 33,35,38,40,42,43,45 with date(A) and time(B), cols C-F
const fcols=['C','D','E','F'];
const frigoRows=[
 {r:33,date:'26/06',time:'19:00'},{r:35,date:'27/06',time:'09:30'},{r:36,date:'27/06',time:'18:30',force:true},
 {r:38,date:'28/06',time:'16:30'},{r:40,date:'03/07',time:'18:30'},
 {r:42,date:'04/07',time:'12:30'},{r:43,date:'04/07',time:'18:30'},
 {r:45,date:'05/07',time:'19:00'}];
for(const fr of frigoRows){
  for(const c of fcols){
    const cell=rows[fr.r] && rows[fr.r][c];
    if(fr.force || (cell && cell.val!=='' && !isNaN(parseFloat(cell.val)))){
      n++; slots.push({id:n,table:'FRIGO',block:'Frigofiesta '+fr.date,time:fr.time,tag:null,color:'blanc',col:c,oldNum:parseFloat(cell.val)});
    }
  }
}
console.log('MAIN slots:',mainCount,' FRIGO slots:',n-mainCount,' TOTAL:',n);
// uniqueness of oldNum
const olds=slots.map(s=>s.oldNum); const dup=olds.filter((v,i)=>olds.indexOf(v)!==i);
console.log('old duplicates:',[...new Set(dup)]);
console.log('old range:',Math.min(...olds),'-',Math.max(...olds));
fs.writeFileSync('slots.json',JSON.stringify(slots,null,1));
// summary per block
const by={}; for(const s of slots){by[s.block]=(by[s.block]||0)+1;}
console.log(JSON.stringify(by,null,1));
