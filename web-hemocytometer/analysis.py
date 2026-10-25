"""OpenCV-based connected-component candidate detection for microscopy education.
No clinical validation; no automatic live/dead inference; source code original.
"""
import json, math
import numpy as np
import cv2

def detect_gray(image, polarity="dark", threshold=7, min_area=18, max_area=1500):
    if image.ndim != 2: raise ValueError("Expected a grayscale image")
    height,width=image.shape
    if width<50 or height<50: raise ValueError("ROI 影像太小，請重新框選。")
    smooth=cv2.GaussianBlur(image,(3,3),0)
    block=min(41,((min(height,width)-1)//2)*2+1)
    if block<15:block=15
    typ=cv2.THRESH_BINARY_INV if polarity=="dark" else cv2.THRESH_BINARY
    thresholded=cv2.adaptiveThreshold(smooth,255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,typ,block,int(threshold))
    # Remove long horizontal/vertical ruling lines; thick or broken grid lines may remain.
    length=max(14,int(min(height,width)*0.11))
    horiz=cv2.getStructuringElement(cv2.MORPH_RECT,(length,1))
    vert=cv2.getStructuringElement(cv2.MORPH_RECT,(1,length))
    hlines=cv2.morphologyEx(thresholded,cv2.MORPH_OPEN,horiz)
    vlines=cv2.morphologyEx(thresholded,cv2.MORPH_OPEN,vert)
    without_lines=cv2.subtract(thresholded,cv2.bitwise_or(hlines,vlines))
    without_lines=cv2.morphologyEx(without_lines,cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2,2)))
    # Candidates are geometrically screened; clusters, debris and border cells
    # still require human confirmation.
    contours,_=cv2.findContours(without_lines,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    cells=[]
    for contour in contours:
        area=float(cv2.contourArea(contour))
        if area<float(min_area) or area>float(max_area):continue
        perimeter=float(cv2.arcLength(contour,True))
        if perimeter<1:continue
        circ=4*math.pi*area/(perimeter*perimeter)
        x,y,w,h=cv2.boundingRect(contour)
        if min(w,h)<=1 or max(w,h)/max(1,min(w,h))>2.3:continue
        if circ<0.35:continue
        moment=cv2.moments(contour)
        if abs(moment["m00"])<1e-8:continue
        cx=float(moment["m10"]/moment["m00"])
        cy=float(moment["m01"]/moment["m00"])
        r=float(max(1.5,math.sqrt(area/math.pi)))
        cells.append({"x":round(cx,2),"y":round(cy,2),
                      "r":round(r,2),"area":round(area,1),
                      "circularity":round(circ,3)})
    cells.sort(key=lambda o:(o["y"],o["x"]))
    return {"cells":cells[:1500],"rawCount":len(cells),
            "limited":len(cells)>1500,"width":width,"height":height}

def detect_from_file(path,options_json):
    opt=json.loads(options_json)
    w,h=int(opt["width"]),int(opt["height"])
    if w<50 or h<50 or w*h>2500000:raise ValueError("影像解析度超出安全範圍。")
    raw=np.fromfile(path,dtype=np.uint8)
    if len(raw)!=w*h:raise ValueError("影像位元組數量不符。")
    result=detect_gray(raw.reshape(h,w),
        polarity=opt.get("polarity","dark"),
        threshold=int(opt.get("threshold",7)),
        min_area=float(opt.get("minArea",18)),
        max_area=float(opt.get("maxArea",1500)))
    return json.dumps(result,ensure_ascii=False)
