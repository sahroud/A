import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

(() => {
  const host = document.getElementById('board');
  if (!host || host.dataset.scene3dReady) return;
  host.dataset.scene3dReady = '1';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;display:block;aspect-ratio:1;width:100%;max-width:390px;margin:14px auto 18px;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 50% 40%,#17365a,#050b1d 72%);box-shadow:0 14px 38px #000a,inset 0 0 28px #38bdf855;touch-action:none;';
  host.parentNode.insertBefore(wrapper,host);
  wrapper.appendChild(host);
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label','میدان سه بعدی حمله تاسی؛ با لمس خانه ها حرکت کنید و با کشیدن انگشت میدان را بچرخانید');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none;';
  wrapper.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050b1d);
  scene.fog = new THREE.FogExp2(0x07142b, 0.035);
  const camera = new THREE.PerspectiveCamera(38,1,0.1,100);
  camera.position.set(0,8.8,10.8);
  camera.lookAt(0,0,0);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'}); }
  catch(error) { wrapper.parentNode.insertBefore(host,wrapper); wrapper.remove(); host.style.display=''; return; }
  host.style.display='none';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  const controls = new OrbitControls(camera,canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .075;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 17;
  controls.minPolarAngle = .55;
  controls.maxPolarAngle = 1.28;
  controls.target.set(0,.25,0);

  scene.add(new THREE.HemisphereLight(0x9acbff,0x10152b,2.05));
  const key = new THREE.DirectionalLight(0xffffff,3.2);
  key.position.set(-4,9,5); key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left=-8; key.shadow.camera.right=8; key.shadow.camera.top=8; key.shadow.camera.bottom=-8;
  scene.add(key);
  const cyan = new THREE.PointLight(0x18bfff,34,13); cyan.position.set(-4,2,1); scene.add(cyan);
  const magenta = new THREE.PointLight(0xa855f7,24,12); magenta.position.set(4,2,-3); scene.add(magenta);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(18,80),new THREE.MeshStandardMaterial({color:0x071126,metalness:.25,roughness:.8}));
  floor.rotation.x=-Math.PI/2; floor.position.y=-.55; floor.receiveShadow=true; scene.add(floor);
  const grid = new THREE.GridHelper(30,60,0x164a79,0x102844);
  grid.position.y=-.53; grid.material.transparent=true; grid.material.opacity=.27; scene.add(grid);

  const platform = new THREE.Group(); scene.add(platform);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.38,3.55,.42,72),new THREE.MeshStandardMaterial({color:0x101f38,metalness:.82,roughness:.28}));
  base.position.y=-.05; base.castShadow=true; base.receiveShadow=true; platform.add(base);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.34,.075,12,96),new THREE.MeshStandardMaterial({color:0x23b7ff,emissive:0x0874c7,emissiveIntensity:1.3,metalness:.7,roughness:.22}));
  rim.rotation.x=Math.PI/2; rim.position.y=.18; platform.add(rim);
  const innerRim = new THREE.Mesh(new THREE.TorusGeometry(3.17,.025,8,96),new THREE.MeshStandardMaterial({color:0x9c55ff,emissive:0x6827cc,emissiveIntensity:1.8}));
  innerRim.rotation.x=Math.PI/2; innerRim.position.y=.2; platform.add(innerRim);

  const tileMeshes=[];
  const tileGroups=[];
  const tileGeo = new THREE.BoxGeometry(1.91,.18,1.91);
  const tileMat = new THREE.MeshStandardMaterial({color:0x172d4b,metalness:.56,roughness:.34,emissive:0x071c37,emissiveIntensity:.42});
  const tileEdgeMat = new THREE.MeshStandardMaterial({color:0x2a9bd0,metalness:.72,roughness:.24,emissive:0x126da4,emissiveIntensity:.75});
  for(let i=0;i<9;i++){
    const row=Math.floor(i/3),col=i%3,x=(col-1)*2.02,z=(row-1)*2.02;
    const g=new THREE.Group(); g.position.set(x,.24,z); platform.add(g);
    const tile=new THREE.Mesh(tileGeo,tileMat.clone()); tile.castShadow=true; tile.receiveShadow=true; tile.userData.index=i; g.add(tile); tileMeshes.push(tile);
    const border=new THREE.Mesh(new THREE.BoxGeometry(1.96,.035,1.96),tileEdgeMat); border.position.y=-.105; g.add(border);
    const inset=new THREE.Mesh(new THREE.BoxGeometry(1.72,.012,1.72),new THREE.MeshStandardMaterial({color:0x0b1c32,metalness:.35,roughness:.48})); inset.position.y=.099; g.add(inset);
    const node=new THREE.Mesh(new THREE.SphereGeometry(.055,12,10),new THREE.MeshBasicMaterial({color:0x55dfff})); node.position.set(-.86,.12,-.86);g.add(node);
    tileGroups.push(g);
  }

  // Holographic orbit rings and distant stars create a deep space arena.
  const orbitA=new THREE.Mesh(new THREE.TorusGeometry(4.05,.012,6,120),new THREE.MeshBasicMaterial({color:0x267bb8,transparent:true,opacity:.42}));
  orbitA.rotation.x=Math.PI/2; orbitA.position.y=-.24; scene.add(orbitA);
  const orbitB=new THREE.Mesh(new THREE.TorusGeometry(4.45,.009,6,120),new THREE.MeshBasicMaterial({color:0x8c49db,transparent:true,opacity:.36}));
  orbitB.rotation.x=Math.PI/2; orbitB.position.y=-.38; scene.add(orbitB);
  const starGeo=new THREE.BufferGeometry(),starCount=450,starPos=new Float32Array(starCount*3);
  for(let i=0;i<starCount;i++){const radius=7+Math.random()*17,angle=Math.random()*Math.PI*2;starPos[i*3]=Math.cos(angle)*radius;starPos[i*3+1]=Math.random()*12-1;starPos[i*3+2]=Math.sin(angle)*radius;}
  starGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));
  const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x8dcfff,size:.045,transparent:true,opacity:.8}));
  scene.add(stars);

  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const pieceRoots=new Map();
  const materialCache=new Map();
  const colorForCode=(code,owner)=>{
    const map={king_green:0x8edb54,king_color:0xc9a5ff,king_black:0x333b4c,king_yellow:0xffca36,king_white:0xe9f4ff,king_blue:0x268dff,king_red:0xf4475d,sp_cream:0xffdfaa,sp_purple:0xb45cff,sp_brown:0x9b613c,sp_orange:0xff832e,sp_stripe:0x29c879,sp_gray:0x9ca9b8,sp_darkgreen:0x087b45,sp_pink:0xff80c5,sp_maroon:0x9d244f,sp_jade:0x36d6b0,pot_green:0x36e66a,pot_red:0xff405d,pot_yellow:0xffd632,pot_blue:0x36caff,normal:0xd8e8f6};
    return map[code]|| (owner===0?0x45df8d:0xff5369);
  };
  const mat=(color,metalness=.55,roughness=.27,emissive=0)=>{
    const key=[color,metalness,roughness,emissive].join(':');
    if(!materialCache.has(key))materialCache.set(key,new THREE.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:emissive?1.25:0}));
    return materialCache.get(key);
  };
  function sphere(parent,r,pos,material,scale=null){
    const m=new THREE.Mesh(new THREE.SphereGeometry(r,20,16),material);
    m.position.set(...pos); if(scale)m.scale.set(...scale); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  function cylinder(parent,r1,r2,h,pos,material,segments=18){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);
    m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function rod(parent,a,b,r,material){
    const v1=new THREE.Vector3(...a),v2=new THREE.Vector3(...b),d=new THREE.Vector3().subVectors(v2,v1);
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),12),material);
    m.position.copy(v1).add(v2).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;parent.add(m);return m;
  }
  function labelSprite(text,color){
    const c=document.createElement('canvas');c.width=128;c.height=64;
    const ctx=c.getContext('2d');ctx.clearRect(0,0,128,64);
    ctx.fillStyle='rgba(3,10,24,.78)';ctx.beginPath();ctx.roundRect(10,8,108,48,14);ctx.fill();
    ctx.strokeStyle='#8ddfff';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle=color;ctx.font='bold 34px Tahoma,Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,64,33);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
    sprite.scale.set(.62,.31,1);sprite.position.y=1.42;return sprite;
  }
  function makeRobot(code,owner,hp,index){
    const root=new THREE.Group();root.userData.index=index;
    const color=colorForCode(code,owner),main=mat(color,.68,.22,color),dark=mat(0x101d32,.78,.24),light=mat(0xdaf6ff,.45,.2,0x174b6c);
    const accent=mat(owner===0?0x36f0a0:0xff476b,.62,.2,owner===0?0x0b8a4e:0x8e102c);
    const baseRing=new THREE.Mesh(new THREE.CylinderGeometry(.48,.52,.13,36),mat(0x152c49,.86,.24));
    baseRing.position.y=.16;baseRing.castShadow=true;root.add(baseRing);
    const ownerRing=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,8,48),accent);
    ownerRing.rotation.x=Math.PI/2;ownerRing.position.y=.235;root.add(ownerRing);
    const torso=sphere(root,.31,[0,.64,0],main,[.88,1.18,.72]);
    sphere(root,.105,[0,.65,.255],light,[1,1,.45]);
    const head=sphere(root,.255,[0,1.08,0],dark,[1,.9,.92]);
    sphere(root,.19,[0,1.11,.075],main,[1,.84,.8]);
    sphere(root,.045,[-.085,1.12,.238],light);
    sphere(root,.045,[.085,1.12,.238],light);
    rod(root,[-.27,.82,0],[-.43,.48,.02],.075,dark);
    rod(root,[.27,.82,0],[.43,.48,.02],.075,dark);
    sphere(root,.09,[-.43,.46,.02],accent);sphere(root,.09,[.43,.46,.02],accent);
    rod(root,[-.13,.38,0],[-.17,.22,.04],.085,dark);
    rod(root,[.13,.38,0],[.17,.22,.04],.085,dark);
    sphere(root,.09,[-.17,.21,.08],main);sphere(root,.09,[.17,.21,.08],main);
    // Individual silhouettes for kings, specialists and support units.
    if(code.startsWith('king_')){
      rod(root,[0,1.31,0],[0,1.52,0],.035,mat(0xffd56a,.8,.18,0xff9c18));
      for(let j=0;j<3;j++){const a=(j-1)*.18;sphere(root,.085,[a,1.52+(j===1?.08:0),0],mat(0xffd56a,.8,.18,0xffa51b));}
      const crown=cylinder(root,.25,.19,.12,[0,1.31,0],mat(0xffc84b,.8,.18,0xff9c18),6);
      crown.rotation.y=Math.PI/6;
    } else if(code==='sp_cream'){
      sphere(root,.19,[-.39,1.05,0],light,[.25,1.2,.7]);sphere(root,.19,[.39,1.05,0],light,[.25,1.2,.7]);
    } else if(code==='sp_purple'){
      const halo=new THREE.Mesh(new THREE.TorusGeometry(.38,.035,8,32),mat(0xe4a6ff,.65,.18,0xa72aff));halo.position.y=1.08;root.add(halo);
    } else if(code==='sp_orange'){
      for(let j=0;j<6;j++){const a=j*Math.PI/3;const spike=new THREE.Mesh(new THREE.ConeGeometry(.085,.25,8),mat(0xffa04a,.6,.2,0xff5418));spike.position.set(Math.cos(a)*.31,.75,Math.sin(a)*.31);spike.rotation.z=Math.cos(a)*-.6;root.add(spike);}
    } else if(code==='sp_stripe'){
      for(let j=0;j<3;j++){const band=new THREE.Mesh(new THREE.TorusGeometry(.3-j*.035,.025,6,28),mat([0x28d77a,0x338dff,0xff435f][j],.55,.2));band.position.y=.55+j*.16;band.rotation.x=Math.PI/2;root.add(band);}
    } else if(code==='sp_brown'||code==='sp_darkgreen'){
      const shield=new THREE.Mesh(new THREE.OctahedronGeometry(.22),mat(code==='sp_brown'?0xc18a54:0x40dd85,.8,.18));shield.position.set(0,1.47,0);root.add(shield);
    } else if(code==='sp_jade'){
      sphere(root,.31,[0,1.08,0],mat(0x46f2c7,.35,.16,0x13b994),[1,1,.5]);
    } else if(code==='sp_gray'){
      const antenna=rod(root,[0,1.3,0],[0,1.58,0],.025,light);sphere(root,.07,[0,1.6,0],light);
    } else if(code==='sp_pink'||code==='sp_maroon'){
      const crest=new THREE.Mesh(new THREE.ConeGeometry(.16,.32,5),main);crest.position.y=1.42;root.add(crest);
    } else if(code==='normal'){
      const cube=new THREE.Mesh(new RoundedBoxGeometry(.42,.42,.42,3,.08),mat(0xc7e7ff,.75,.2));cube.position.set(0,1.48,0);cube.castShadow=true;root.add(cube);
      for(const [x,y] of [[-.1,-.1],[.1,.1],[-.1,.1],[.1,-.1]])sphere(root,.035,[x,1.48+y,.215],dark);
    }
    if(code.startsWith('pot_')){
      const bottleMat=mat(color,.25,.16,color);
      cylinder(root,.13,.17,.36,[0,.62,0],bottleMat,18);
      sphere(root,.17,[0,.83,0],bottleMat,[.9,1.1,.9]);
      cylinder(root,.075,.075,.1,[0,.88,0],mat(0xe5f6ff,.55,.16),12);
      cylinder(root,.105,.105,.07,[0,.97,0],mat(0xffd46a,.75,.18),12);
    }
    if(code==='pot_blue'){
      const bubble=new THREE.Mesh(new THREE.SphereGeometry(.55,24,18),new THREE.MeshPhysicalMaterial({color:0x55cfff,transparent:true,opacity:.17,roughness:.08,metalness:.2,transmission:.35,thickness:.5}));bubble.position.y=.72;root.add(bubble);
    }
    if(code==='pot_red'||code==='pot_yellow'){
      const aura=new THREE.Mesh(new THREE.TorusGeometry(.34,.025,8,36),mat(color,.4,.18,color));aura.position.y=.35;aura.rotation.x=Math.PI/2;root.add(aura);
    }
    root.add(labelSprite(String(hp||''),owner===0?'#7fffc1':'#ff9bab'));
    root.position.set(((index%3)-1)*2.02,.35,(Math.floor(index/3)-1)*2.02);
    root.userData.phase=Math.random()*Math.PI*2;
    root.userData.owner=owner;root.userData.code=code;
    return root;
  }
  function makeShield(index,hp){
    const g=new THREE.Group();
    const bubble=new THREE.Mesh(new THREE.SphereGeometry(.62,24,18),new THREE.MeshPhysicalMaterial({color:0x39caff,transparent:true,opacity:.2,roughness:.08,metalness:.15,transmission:.45,thickness:.7}));
    bubble.position.y=.72;g.add(bubble);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.57,.022,7,36),mat(0x59ddff,.4,.12,0x159bdc));ring.position.y=.3;ring.rotation.x=Math.PI/2;g.add(ring);
    g.position.set(((index%3)-1)*2.02,.35,(Math.floor(index/3)-1)*2.02);return g;
  }
  function syncPieces(){
    const cells=[...host.querySelectorAll('.cell')];
    if(!cells.length)return;
    const present=new Set();
    cells.forEach((cell,index)=>{
      const d=cell.querySelector('.die'); if(!d)return;
      const code=(d.className.match(/unit-([a-z_]+)/)||[])[1]||'normal';
      const owner=d.classList.contains('me')?0:1;
      const hp=(d.textContent||'').replace(/[^\d۰-۹]/g,'').trim()||'';
      const signature=[code,owner,hp,!!cell.querySelector('.shield-mark')].join('|');
      present.add(index);
      const old=pieceRoots.get(index);
      if(old&&old.userData.signature===signature)return;
      if(old){platform.remove(old);if(old.userData.shield)platform.remove(old.userData.shield);pieceRoots.delete(index);}
      const root=makeRobot(code,owner,hp,index);root.userData.signature=signature;
      platform.add(root);pieceRoots.set(index,root);
      const shield=cell.querySelector('.shield-mark');
      if(shield){const sg=makeShield(index,shield.textContent);platform.add(sg);root.userData.shield=sg;}
    });
    for(const [index,root] of [...pieceRoots.entries()])if(!present.has(index)){platform.remove(root);if(root.userData.shield)platform.remove(root.userData.shield);pieceRoots.delete(index);}
  }
  const observer=new MutationObserver(()=>{if(!syncQueued){syncQueued=true;requestAnimationFrame(()=>{syncQueued=false;syncPieces();});}});
  let syncQueued=false;
  observer.observe(host,{childList:true,subtree:true,characterData:true,attributes:true});
  syncPieces();

  let down=null;
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointerup',e=>{
    if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;down=null;
    if(Math.hypot(dx,dy)>9)return;
    const rect=canvas.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(pointer,camera);
    const targets=[...tileMeshes,...[...pieceRoots.values()].flatMap(g=>g.children)];
    const hits=raycaster.intersectObjects(targets,true);
    if(!hits.length)return;
    let obj=hits[0].object,idx=-1;
    while(obj&&idx<0){if(Number.isInteger(obj.userData.index))idx=obj.userData.index;obj=obj.parent;}
    if(idx>=0&&typeof window.__hamle3dTap==='function')window.__hamle3dTap(idx);
  });

  function resize(){
    const w=Math.max(1,wrapper.clientWidth),h=Math.max(1,wrapper.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(wrapper);resize();
  const clock=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t=clock.getElapsedTime();
    controls.update();
    orbitA.rotation.z=t*.045;orbitB.rotation.z=-t*.028;
    stars.rotation.y=t*.006;
    for(const root of pieceRoots.values()){
      root.position.y=.35+Math.sin(t*1.65+root.userData.phase)*.035;
      root.rotation.y=Math.sin(t*.65+root.userData.phase)*.045;
      if(root.userData.shield){root.userData.shield.position.y=root.position.y;root.userData.shield.rotation.y=t*.18;}
    }
    renderer.render(scene,camera);
  }
  animate();
})();
