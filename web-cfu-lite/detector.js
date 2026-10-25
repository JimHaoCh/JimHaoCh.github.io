/* Web-CFU Lite: deterministic, dependency-free image segmentation.
   Experimental teaching heuristic; not a clinical or validated colony detector.
   Equivalent stages to traditional OpenCV pipelines:
   grayscale -> local background subtraction -> binary mask -> connected components.
*/
(function () {
  "use strict";
  function detect(imageData, roi, options = {}) {
    const w = imageData.width | 0, h = imageData.height | 0;
    if (w < 10 || h < 10 || !imageData.data || imageData.data.length !== w*h*4) {
      throw new Error("無效的影像資料。");
    }
    const N = w*h, stride = w+1;
    const light = new Float32Array(N), integral = new Float64Array(stride*(h+1));
    const pixels = imageData.data;
    for (let y=0; y<h; y++) {
      let rowSum = 0;
      for (let x=0; x<w; x++) {
        const p=y*w+x, i=p*4;
        const l=(pixels[i]*77 + pixels[i+1]*150 + pixels[i+2]*29)/256;
        light[p]=l;
        rowSum+=l;
        integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+rowSum;
      }
    }
    const cx=Number(roi.cx), cy=Number(roi.cy), radius=Number(roi.r);
    if (![cx,cy,radius].every(Number.isFinite) || radius < 20) {
      throw new Error("請先確認培養皿圓形範圍。");
    }
    const radiusInside = Math.max(15, radius - Math.max(5, radius * .048));
    const r2 = radiusInside*radiusInside;
    const limit=Number.isFinite(options.threshold)?Number(options.threshold):18;
    const minArea=Math.max(3,Math.floor(Number(options.minArea)||15));
    const maxArea=Math.max(minArea,Math.floor(Number(options.maxArea)||2500));
    const direction=options.mode==="light"?-1:1;
    const windowRadius=Math.max(16,Math.min(34,Math.round(Math.min(w,h)*.033)));
    const mask=new Uint8Array(N);
    const xmin=Math.max(0,Math.floor(cx-radiusInside)),xmax=Math.min(w-1,Math.ceil(cx+radiusInside));
    const ymin=Math.max(0,Math.floor(cy-radiusInside)),ymax=Math.min(h-1,Math.ceil(cy+radiusInside));
    let positivePixels=0;
    for (let y=ymin; y<=ymax; y++) {
      const dy=(y-cy)*(y-cy),y0=Math.max(0,y-windowRadius),y1=Math.min(h,y+windowRadius+1);
      const low=y0*stride,high=y1*stride;
      for (let x=xmin; x<=xmax; x++) {
        if ((x-cx)*(x-cx)+dy>r2) continue;
        const x0=Math.max(0,x-windowRadius),x1=Math.min(w,x+windowRadius+1);
        const sum=integral[high+x1]-integral[low+x1]-integral[high+x0]+integral[low+x0];
        const localMean=sum/((x1-x0)*(y1-y0));
        const contrast=direction*(localMean-light[y*w+x]);
        if(contrast>=limit){mask[y*w+x]=1;positivePixels++;}
      }
    }
    const queue=new Uint32Array(N), candidates=[];
    let areaRejected=0, shapeRejected=0, label=0;
    // 8-neighbor flood fill; consume the mask to mark visited.
    const deltas=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
    for (let y=ymin; y<=ymax; y++){
      for(let x=xmin; x<=xmax; x++){
        const index=y*w+x;
        if(mask[index]===0)continue;
        let head=0,tail=1,area=0,sumX=0,sumY=0;
        let bx0=x,bx1=x,by0=y,by1=y;
        queue[0]=index;mask[index]=0;
        while(head<tail){
          const cur=queue[head++],xx=cur%w,yy=(cur/w)|0;
          area++;sumX+=xx;sumY+=yy;
          if(xx<bx0)bx0=xx;if(xx>bx1)bx1=xx;if(yy<by0)by0=yy;if(yy>by1)by1=yy;
          for(const [dx,dy] of deltas){
            const nx=xx+dx,ny=yy+dy;
            if(nx<0||ny<0||nx>=w||ny>=h)continue;
            const np=ny*w+nx;
            if(mask[np]){mask[np]=0;queue[tail++]=np;}
          }
        }
        if(area<minArea || area>maxArea){areaRejected++;continue;}
        const bw=bx1-bx0+1,bh=by1-by0+1;
        const aspect=Math.max(bw/bh,bh/bw);
        const fill=area/(bw*bh);
        if(aspect>4.5 || fill<.18){shapeRejected++;continue;}
        label++;
        candidates.push({
          x:sumX/area,y:sumY/area,
          r:Math.max(3,Math.min(18,Math.sqrt(area/Math.PI))),
          area,source:"auto",id:label
        });
      }
    }
    return { candidates,diagnostics: {
      positivePixels,areaRejected,shapeRejected,windowRadius,
      evaluatedWidth:w,evaluatedHeight:h
    }};
  }
  window.WebCFUDetector=Object.freeze({detect});
})();
