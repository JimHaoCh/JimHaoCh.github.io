/* Pure coordinate, boundary and chamber-volume calculations for teaching. */
export const MODES={
  culture:{label:"細胞培養｜1 個大格 1 mm²",area:1,dilution:2,guide:"框選計數盤中完整的一個 1 × 1 mm 大格。常見教學做法會連續計數四個大格。"},
  wbc:{label:"白血球｜1 個角落大格 1 mm²",area:1,dilution:20,guide:"每次框選一個角落大格，連續拍攝四角（每個 1 mm²），逐格加入總計。"},
  rbc:{label:"紅血球｜中央 5 個中格，共 0.20 mm²",area:.20,dilution:200,guide:"框選中央完整 1 × 1 mm 大格，程式只計入四個角落及正中央，共五個 0.2 × 0.2 mm 中格。"}
};
export const DEPTH=.1;
export function regions(roi,mode){
 if(!roi||roi.w<=0||roi.h<=0)return [];
 if(mode!=="rbc")return [{x:roi.x,y:roi.y,w:roi.w,h:roi.h}];
 const cells=[[0,0],[4,0],[2,2],[0,4],[4,4]],w=roi.w/5,h=roi.h/5;
 return cells.map(([col,row])=>({x:roi.x+col*w,y:roi.y+row*h,w,h}));
}
export function counted(point,roi,mode){
 const radius=Math.max(0,Number(point.r)||0);
 // Counting convention: INCLUDE upper/left boundary; EXCLUDE lower/right boundary.
 return regions(roi,mode).some(b=>
   point.x>=b.x-radius && point.x < b.x+b.w-radius &&
   point.y>=b.y-radius && point.y < b.y+b.h-radius);
}
export function concentration(n,area,dilution,depth=DEPTH){
 if(!Number.isFinite(n)||n<0||!Number.isFinite(area)||area<=0||
    !Number.isFinite(dilution)||dilution<=0||!Number.isFinite(depth)||depth<=0)return null;
 const perUL=n*dilution/(area*depth);
 return {perUL,perML:perUL*1000,volumeUL:area*depth};
}
export function groupSummary(fields,dilution,depth=DEPTH){
 const total=fields.reduce((n,f)=>n+f.count,0);
 const area=fields.reduce((a,f)=>a+f.area,0);
 return {count:total,area,fields:fields.length,...(concentration(total,area,dilution,depth)||{perUL:null,perML:null,volumeUL:null})};
}
