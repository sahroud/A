import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const root=document.getElementById('scene');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x050b18);scene.fog=new THREE.Fog(0x050b18,13,27);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,100);camera.position.set(7.8,10.8,11.5);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;root.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.06;controls.minDistance=7;controls.maxDistance=19;controls.maxPolarAngle=Math.PI*.48;controls.target.set(0,.2,0);
scene.add(new THREE.HemisphereLight(0x9edfff,0x101326,2));
const key=new THREE.DirectionalLight(0xffffff,3.3);key.position.set(5,10,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
const cyan=new THREE.PointLight(0x16bfff,20,15);cyan.position.set(-4,3,-3);scene.add(cyan);
const magenta=new THREE.PointLight(0xff287d,13,14);magenta.position.set(4,2,4);scene.add(magenta);
const floor=new THREE.Mesh(new THREE.CircleGeometry(18,64),new THREE.MeshStandardMaterial({color:0x071426,metalness:.65,roughness:.5}));floor.rotation.x=-Math.PI/2;floor.position.y=-.45;floor.receiveShadow=true;scene.add(floor);
const arena=new THREE.Group();scene.add(arena);
const base=new THREE.Mesh(new THREE.CylinderGeometry(5.1,5.35,.48,8,1),new THREE.MeshStandardMaterial({color:0x142d49,metalness:.85,roughness:.25}));base.position.y=-.12;base.receiveShadow=true;base.castShadow=true;arena.add(base);
const rim=new THREE.Mesh(new THREE.TorusGeometry(4.92,.09,12,8),new THREE.MeshStandardMaterial({color:0x28cfff,emissive:0x0878b8,emissiveIntensity:1.5,metalness:.7,roughness:.2}));rim.rotation.x=Math.PI/2;rim.position.y=.14;arena.add(rim);
const tileMeshes=[];const boardGroup=new THREE.Group();arena.add(boardGroup);
const tileMat=[new THREE.MeshStandardMaterial({color:0x153a5b,metalness:.5,roughness:.32,emissive:0x052b49,emissiveIntensity:.35}),new THREE.MeshStandardMaterial({color:0x1b3455,metalness:.55,roughness:.3,emissive:0x102a49,emissiveIntensity:.3})];
for(let r=0;r<3;r++)for(let c=0;c<3;c++){const g=new THREE.Group();g.position.set((c-1)*2.75,.2,(r-1)*2.75);const slab=new THREE.Mesh(new THREE.BoxGeometry(2.55,.22,2.55),tileMat[(r+c)%2]);slab.castShadow=true;slab.receiveShadow=true;g.add(slab);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.55,.225,2.55)),new THREE.LineBasicMaterial({color:0x3bcfff,transparent:true,opacity:.7}));g.add(edge);const ring=new THREE.Mesh(new THREE.TorusGeometry(.75,.025,8,48),new THREE.MeshBasicMaterial({color:0x2a9bc7,transparent:true,opacity:.25}));ring.rotation.x=Math.PI/2;ring.position.y=.13;g.add(ring);boardGroup.add(g);tileMeshes.push(g);}
const stars=new THREE.Group();scene.add(stars);for(let i=0;i<150;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.018+Math.random()*.025,6,6),new THREE.MeshBasicMaterial({color:i%3?0x5acfff:0xff80c0}));m.position.set((Math.random()-.5)*34,Math.random()*12-1,(Math.random()-.5)*34);stars.add(m);}
const state={board:Array(9).fill(null),owner:0,selected:'king',rolled:null,actions:0,score:[0,0],pieces:[],turns:0};
const colors=[0x34e0a0,0xff466f];
function mat(color,metal=.45,rough=.3,emissive=0){return new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough,emissive,emissiveIntensity:.8});}
function sphere(parent,x,y,z,sx,sy,sz,m){const o=new THREE.Mesh(new THREE.SphereGeometry(1,18,14),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function cyl(parent,x,y,z,rt,rb,h,m,n=12){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function makeWarrior(owner,kind,hp){const group=new THREE.Group(),main=mat(colors[owner],.65,.23,colors[owner]),dark=mat(0x142438,.8,.25),gold=mat(kind==='king'?0xffc65a:0x9bdfff,.7,.2,0x24445a),visor=mat(owner?0xffa1ba:0x8ffff0,.25,.12,owner?0xff1655:0x00dca8);
cyl(group,0,.52,0,.34,.42,.62,main);sphere(group,0,1.03,0,.29,.32,.27,dark);sphere(group,0,1.08,.22,.2,.11,.08,visor);
sphere(group,-.43,.55,0,.13,.3,.14,main);sphere(group,.43,.55,0,.13,.3,.14,main);
cyl(group,-.17,.16,0,.13,.16,.32,dark);cyl(group,.17,.16,0,.13,.16,.32,dark);
if(kind==='king'){cyl(group,0,1.39,0,.22,.29,.16,gold,8);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;sphere(group,Math.cos(a)*.18,1.52,Math.sin(a)*.18,.055,.13,.055,gold);}sphere(group,0,1.48,0,.09,.1,.09,mat(0xffffff,.3,.15,0xffd24d));}
if(kind==='mage'){const staff=cyl(group,.55,.76,0,.045,.055,.95,gold,8);staff.rotation.z=-.12;sphere(group,.55,1.28,0,.13,.13,.13,visor);}
if(kind==='guard'){const shield=new THREE.Mesh(new THREE.BoxGeometry(.12,.62,.48),gold);shield.position.set(.5,.68,.12);shield.rotation.z=-.12;shield.castShadow=true;group.add(shield);}
const hpRing=new THREE.Mesh(new THREE.TorusGeometry(.39,.035,8,32),mat(0x6feaff,.4,.25,0x126bff));hpRing.rotation.x=Math.PI/2;hpRing.position.y=1.65;group.add(hpRing);
const tag=new THREE.Group();for(let i=0;i<Math.min(6,hp);i++){const dot=sphere(tag,(i-2.5)*.12,0,0,.045,.045,.045,mat(0xffd66b,.2,.2,0xff9b00));}tag.position.y=1.85;group.add(tag);
group.userData={owner,kind,hp,baseY:0,phase:Math.random()*6};return group;}
function placePiece(index,owner,kind,hp){const p=makeWarrior(owner,kind,hp);const r=Math.floor(index/3),c=index%3;p.position.set((c-1)*2.75,.34,(r-1)*2.75);arena.add(p);state.pieces.push(p);state.board[index]={owner,kind,hp,mesh:p};return p;}
function updateHud(msg){document.getElementById('message').textContent=msg;document.getElementById('turn').textContent=state.owner===0?'نوبت شما':'نوبت ربات';document.getElementById('score').textContent=state.score.join(' - ');}
function updateButtons(){document.querySelectorAll('.unit').forEach(b=>b.classList.toggle('active',b.dataset.kind===state.selected));document.getElementById('roll').disabled=state.rolled!==null;}
document.querySelectorAll('.unit').forEach(b=>b.onclick=()=>{if(state.owner!==0)return;state.selected=b.dataset.kind;updateButtons();updateHud('نیروی '+b.textContent+' انتخاب شد؛ تاس بیندازید.');});
document.getElementById('roll').onclick=()=>{if(state.owner!==0||state.rolled!==null)return;state.rolled=1+Math.floor(Math.random()*6);updateButtons();updateHud('عدد تاس: '+state.rolled+' — خانه‌ای خالی را انتخاب کنید.');};
function lineCheck(){const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8]];for(const line of lines){const a=line.map(i=>state.board[i]);if(a.every(Boolean)){const sums=[0,0];a.forEach(p=>sums[p.owner]+=p.hp);if(sums[0]!==sums[1]){const win=sums[0]>sums[1]?0:1;state.score[win]++;line.forEach(i=>{const p=state.board[i];arena.remove(p.mesh);state.pieces=state.pieces.filter(x=>x!==p.mesh);state.board[i]=null;});updateHud(win===0?'خط به سود شما تمام شد.':'خط به سود ربات تمام شد.');return true;}}}return false;}
function chooseTile(i){if(state.owner!==0||state.rolled===null||state.board[i])return;placePiece(i,0,state.selected,state.rolled);state.rolled=null;updateButtons();lineCheck();state.owner=1;state.turns++;updateHud('ربات در حال انتخاب حرکت است…');setTimeout(botMove,700);}
function botMove(){const free=state.board.map((p,i)=>p?null:i).filter(i=>i!==null);if(!free.length){state.owner=0;updateHud('زمین پر شد؛ شروع دور تازه.');return;}const i=free[Math.floor(Math.random()*free.length)],kind=['king','die','guard','mage'][Math.floor(Math.random()*4)],hp=1+Math.floor(Math.random()*6);placePiece(i,1,kind,hp);lineCheck();state.owner=0;updateHud('نوبت شماست؛ نیروی بعدی را انتخاب کنید.');}
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();renderer.domElement.addEventListener('pointerup',e=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=-(e.clientY/innerHeight)*2+1;ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(tileMeshes,true);if(hits.length){let o=hits[0].object;while(o.parent&&!tileMeshes.includes(o))o=o.parent;const i=tileMeshes.indexOf(o);if(i>=0)chooseTile(i);}});
document.getElementById('reset').onclick=()=>{state.pieces.forEach(p=>arena.remove(p));state.pieces=[];state.board=Array(9).fill(null);state.owner=0;state.rolled=null;state.score=[0,0];state.turns=0;updateButtons();updateHud('میدان تازه آماده است؛ نیرو انتخاب کنید.');};
function animate(t){requestAnimationFrame(animate);const time=t*.001;state.pieces.forEach(p=>{p.position.y=.34+Math.sin(time*2+p.userData.phase)*.045;p.rotation.y=Math.sin(time*.7+p.userData.phase)*.08;});controls.update();renderer.render(scene,camera);}animate(0);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
updateButtons();updateHud('میدان سه‌بعدی آماده است. برای شروع نیرو انتخاب کنید.');