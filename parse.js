const fs=require('fs');
const sheet=fs.readFileSync('_x/xl/worksheets/sheet1.xml','utf8');
const ss=fs.readFileSync('_x/xl/sharedStrings.xml','utf8');
// shared strings
const strs=[];
ss.replace(/<si>([\s\S]*?)<\/si>/g,(m,inner)=>{
  let txt='';
  inner.replace(/<t[^>]*>([\s\S]*?)<\/t>/g,(mm,t)=>{txt+=t;});
  strs.push(txt.replace(/\n/g,' / '));
});
// styles: map cellXf -> fillId -> color
const styles=fs.readFileSync('_x/xl/styles.xml','utf8');
const fills=[];
styles.replace(/<fills[^>]*>([\s\S]*?)<\/fills>/,(m,inner)=>{
  inner.replace(/<fill>([\s\S]*?)<\/fill>/g,(mm,f)=>{
    let c=null;
    const pf=/<patternFill[^>]*>([\s\S]*?)<\/patternFill>/.exec(f)||/<patternFill[^>]*\/>/.exec(f);
    const fg=/<fgColor[^>]*rgb="([0-9A-Fa-f]+)"/.exec(f);
    const theme=/<fgColor[^>]*theme="(\d+)"/.exec(f);
    if(fg)c=fg[1]; else if(theme)c='theme'+theme[1];
    fills.push(c);
  });
});
// cellXfs -> fillId
const xfFill=[];
const cellxfs=/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles)[1];
cellxfs.replace(/<xf\b([^>]*?)(\/>|>[\s\S]*?<\/xf>)/g,(m,attrs)=>{
  const f=/fillId="(\d+)"/.exec(attrs);
  xfFill.push(f?parseInt(f[1]):0);
});
// parse rows
const rows={};
sheet.replace(/<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g,(m,rn,cells)=>{
  rn=parseInt(rn);
  rows[rn]={};
  cells.replace(/<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,(mm,col,r2,attrs,inner)=>{
    const tMatch=/t="([^"]+)"/.exec(attrs);
    const sMatch=/s="(\d+)"/.exec(attrs);
    let val='';
    if(inner){
      const v=/<v>([\s\S]*?)<\/v>/.exec(inner);
      const isr=/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/.exec(inner);
      if(v){ if(tMatch&&tMatch[1]==='s') val=strs[parseInt(v[1])]; else val=v[1]; }
      else if(isr) val=isr[1];
    }
    let color='';
    if(sMatch){ const fid=xfFill[parseInt(sMatch[1])]; color=fills[fid]||''; }
    rows[rn][col]={val,color};
  });
});
// print grid rows 1..45 cols A..N
const colLetters=['A','B','C','D','E','F','G','H','I','J','K','L','M','N'];
const maxRow=Math.max(...Object.keys(rows).map(Number));
for(let r=1;r<=maxRow;r++){
  if(!rows[r])continue;
  let line=`R${r}: `;
  for(const c of colLetters){
    const cell=rows[r][c];
    if(cell&&(cell.val!==''||cell.color)){
      line+=`[${c}=${cell.val}${cell.color?'§'+cell.color:''}] `;
    }
  }
  console.log(line);
}
