/* ============================================================
   Geometry helpers — pure math shared by scoring, rendering and
   the "show solution" pose search. No DOM, no 3Dmol state beyond
   reading `lig` / `pocket` / `viewer` for camera-relative math.
   ============================================================ */

function centroid(arr){
  let s={x:0,y:0,z:0}; arr.forEach(p=>{s.x+=p.x;s.y+=p.y;s.z+=p.z});
  const n=arr.length||1; return {x:s.x/n,y:s.y/n,z:s.z/n};
}
// rotate a point by Euler angles and translate to the ligand position
function ligWorld(p, t=0){
  const bx = p.x*(1+0.05*Math.sin(t)), by=p.y*(1+0.05*Math.sin(t)); // "breathing"
  let {x,y,z}=rot(bx,by,p.z,lig.rx,lig.ry,lig.rz);
  return {x:x+lig.x, y:y+lig.y, z:z+lig.z};
}
function rot(x,y,z,rx,ry,rz){
  let c,s;
  c=Math.cos(rx);s=Math.sin(rx); [y,z]=[y*c-z*s, y*s+z*c];
  c=Math.cos(ry);s=Math.sin(ry); [x,z]=[x*c+z*s,-x*s+z*c];
  c=Math.cos(rz);s=Math.sin(rz); [x,y]=[x*c-y*s, x*s+y*c];
  return {x,y,z};
}
function dist(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return Math.sqrt(dx*dx+dy*dy+dz*dz)}
function norm(v){const m=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/m,v[1]/m,v[2]/m];}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];}
// camera basis in world coordinates (right/up/forward) — for "screen-relative" movement
function camBasis(){
  try{
    const R=viewer.screenOffsetToModel(1,0), D=viewer.screenOffsetToModel(0,1);
    const right=norm([R.x,R.y,R.z]);
    const up=norm([-D.x,-D.y,-D.z]);      // screen "up" = minus "down"
    const fwd=norm(cross(right,up));      // perpendicular to the screen plane
    if(right.some(Number.isNaN)||up.some(Number.isNaN)) throw 0;
    return {right,up,fwd};
  }catch(e){ return {right:[1,0,0],up:[0,1,0],fwd:[0,0,1]}; }  // fallback: world axes
}

// distance from the ligand centre to the target pocket (zinc site)
function minDistance(t=0){
  const world = LIG_LOCAL.map(p=>ligWorld(p,t));
  const center = centroid(world);
  const mind = pocket ? dist(center, pocket) : 1e9;
  return {mind, world, center};
}

// place the ligand atoms for a given pose (position + Euler angles), without breathing
function poseWorld(pose){
  return LIG_LOCAL.map(p=>{
    const r = rot(p.x, p.y, p.z, pose.rx, pose.ry, pose.rz);
    return {x:r.x+pose.x, y:r.y+pose.y, z:r.z+pose.z};
  });
}

// evenly thin an array down to at most `cap` items (for cheap O(n²) geometry scans)
function downsample(arr, cap){
  if(arr.length<=cap) return arr;
  const st=Math.ceil(arr.length/cap), s=[];
  for(let i=0;i<arr.length;i+=st) s.push(arr[i]);
  return s;
}
