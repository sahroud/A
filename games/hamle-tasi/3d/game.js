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
function makeWarrior(owner,kind,hp){
 const group=new THREE.Group();
 const faction=owner===0;
 const cloth=mat(faction?0x354b58:0x554047,.38,.62);
 const clothLight=mat(faction?0x667b82:0x80636a,.32,.58);
 const skin=mat(faction?0x98745d:0x80614f,.05,.88);
 const skinLight=mat(faction?0xb18b70:0x9b765f,.04,.86);
 const metal=mat(faction?0x89969b:0x897b79,.78,.34);
 const darkMetal=mat(0x202b3a,.8,.25);
 const gold=mat(0xa88b56,.68,.38,0x241606);
 const eyeWhite=mat(0xf5f0dc,.08,.25);
 const iris=mat(faction?0x21c8d8:0xff586b,.28,.16,0x401018);
 const black=mat(0x17131a,.05,.65);
 const beard=mat(kind==='mage'?0xddd4c0:(faction?0x382a25:0x241d2c),.05,.9);
 const glow=mat(faction?0x6b9b9b:0xa07879,.25,.42,faction?0x102b2b:0x301719);
 const armor=kind==='king'?gold:(kind==='mage'?clothLight:metal);
 // Boots, legs, torso and layered shoulder armor
 cyl(group,0,.16,0,.19,.22,.3,darkMetal,10);
 cyl(group,-.17,.28,0,.105,.13,.38,darkMetal,10);
 cyl(group,.17,.28,0,.105,.13,.38,darkMetal,10);
 cyl(group,0,.68,0,.32,.39,.62,cloth,12);
 const breast=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),armor);
 breast.position.set(0,.73,.18);breast.scale.set(.29,.3,.12);breast.castShadow=true;group.add(breast);
 sphere(group,-.36,.83,0,.17,.16,.2,armor);
 sphere(group,.36,.83,0,.17,.16,.2,armor);
 // Neck and sculpted head
 cyl(group,0,1.12,0,.12,.13,.2,skin,12);
 sphere(group,0,1.43,.015,.285,.345,.245,skin);
 // ears
 sphere(group,-.285,1.43,0,.065,.105,.07,skinLight);
 sphere(group,.285,1.43,0,.065,.105,.07,skinLight);
 // cheekbones, nose, eyes facing camera/front (+Z)
 sphere(group,-.13,1.39,.214,.105,.085,.055,skinLight);
 sphere(group,.13,1.39,.214,.105,.085,.055,skinLight);
 sphere(group,0,1.43,.265,.043,.09,.055,skinLight);
 for(const x of [-.105,.105]){
   sphere(group,x,1.51,.226,.075,.048,.035,eyeWhite);
   sphere(group,x,1.51,.257,.028,.034,.018,iris);
   sphere(group,x,1.51,.272,.012,.02,.009,black);
   const brow=sphere(group,x,1.585,.228,.085,.025,.035,kind==='mage'?beard:darkMetal);
   brow.rotation.z=x<0?.13:-.13;
 }
 // mouth and facial hair give each role a recognizable silhouette
 sphere(group,0,1.315,.248,.075,.018,.022,black);
 if(kind==='king'||kind==='mage'){
   sphere(group,0,1.245,.22,.19,.13,.09,beard);
   const beardTip=sphere(group,0,1.105,.205,.105,kind==='mage'?.22:.14,.085,beard);
   beardTip.rotation.z=kind==='mage'?.08:0;
   sphere(group,-.17,1.30,.20,.075,.11,.07,beard);
   sphere(group,.17,1.30,.20,.075,.11,.07,beard);
 } else {
   sphere(group,-.12,1.29,.22,.07,.07,.05,beard);
   sphere(group,.12,1.29,.22,.07,.07,.05,beard);
 }
 if(kind==='king'){
   // jeweled royal crown, five raised points and forehead jewel
   cyl(group,0,1.755,0,.27,.29,.13,gold,10);
   for(let i=0;i<7;i++){const x=-.23+i*.076;const spike=new THREE.Mesh(new THREE.ConeGeometry(.045,.19,5),gold);spike.position.set(x,1.89,.015);spike.castShadow=true;group.add(spike);}
   sphere(group,0,1.78,.27,.065,.07,.035,glow);
   const cape=new THREE.Mesh(new THREE.ConeGeometry(.48,.9,4,1,true),clothLight);cape.position.set(0,.62,-.31);cape.rotation.x=-.16;cape.castShadow=true;group.add(cape);
   // royal shoulder chains
   const chain=new THREE.Mesh(new THREE.TorusGeometry(.24,.025,8,32,Math.PI),gold);chain.position.set(0,.88,.25);chain.rotation.z=Math.PI;group.add(chain);
 } else if(kind==='mage'){
   // tall cloth wizard hat with brim and glowing runic orb
   const brim=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.07,24),cloth);brim.position.y=1.79;group.add(brim);
   const hat=new THREE.Mesh(new THREE.ConeGeometry(.255,.68,20),clothLight);hat.position.set(0,2.12,-.015);hat.rotation.z=-.12;hat.castShadow=true;group.add(hat);
   const band=new THREE.Mesh(new THREE.TorusGeometry(.255,.035,8,24),gold);band.position.y=1.91;group.add(band);
   for(let i=0;i<3;i++){const rune=sphere(group,-.13+i*.13,1.91,.23,.025,.025,.018,glow);}
   const staff=cyl(group,.57,.85,-.02,.045,.06,1.35,darkMetal,10);staff.rotation.z=-.08;
   const orb=sphere(group,.57,1.58,-.02,.16,.16,.16,glow);
   const halo=new THREE.Mesh(new THREE.TorusGeometry(.23,.018,8,32),gold);halo.position.copy(orb.position);halo.rotation.x=.9;group.add(halo);
   for(let i=0;i<4;i++){const star=sphere(group,.57+Math.cos(i*Math.PI/2)*.25,1.58+Math.sin(i*Math.PI/2)*.25,-.02,.035,.035,.035,gold);}
 } else if(kind==='guard'){
   // helmet with nose guard, cheek plates and a visible face opening
   const helmet=new THREE.Mesh(new THREE.SphereGeometry(.31,18,12,0,Math.PI*2,0,Math.PI*.55),metal);helmet.position.set(0,1.58,0);helmet.castShadow=true;group.add(helmet);
   cyl(group,0,1.64,0,.32,.32,.07,darkMetal,16);
   const noseGuard=new THREE.Mesh(new THREE.BoxGeometry(.055,.22,.08),gold);noseGuard.position.set(0,1.43,.29);group.add(noseGuard);
   const shield=new THREE.Mesh(new THREE.CylinderGeometry(.34,.3,.1,6),clothLight);shield.position.set(.52,.72,.1);shield.rotation.z=-.1;shield.rotation.x=.15;shield.castShadow=true;group.add(shield);
   const shieldBoss=sphere(group,.52,.72,.19,.1,.1,.06,gold);
   const sword=cyl(group,-.53,.79,.04,.035,.045,.85,metal,8);sword.rotation.z=-.12;
 } else {
   // dice warrior: angular battle mask, cheek plates and crossed chest straps
   const mask=new THREE.Mesh(new THREE.BoxGeometry(.39,.13,.075),gold);mask.position.set(0,1.46,.25);group.add(mask);
   const strap=cyl(group,0,.7,.245,.035,.035,.65,gold,8);strap.rotation.z=.42;
   const blade=cyl(group,.52,.78,0,.035,.045,.9,metal,8);blade.rotation.z=-.18;
   const pommel=sphere(group,.52,1.27,0,.075,.075,.075,glow);
 }
 // shoulder insignia and faction crest
 const crest=sphere(group,0,.9,.315,.09,.09,.035,gold);
 const hpRing=new THREE.Mesh(new THREE.TorusGeometry(.39,.025,8,32),glow);hpRing.rotation.x=Math.PI/2;hpRing.position.y=2.02;group.add(hpRing);
 const tag=new THREE.Group();
 for(let i=0;i<Math.min(6,hp);i++)sphere(tag,(i-2.5)*.12,0,0,.035,.035,.035,gold);
 tag.position.y=2.19;group.add(tag);
 group.userData={owner,kind,hp,baseY:0,phase:Math.random()*6};
 return group;
}
function placePiece(index,owner,kind,hp){const p=makeWarrior(owner,kind,hp);const r=Math.floor(index/3),c=index%3;p.position.set((c-1)*2.75,.34,(r-1)*2.75);arena.add(p);state.pieces.push(p);state.board[index]={owner,kind,hp,mesh:p};return p;}
const roleGuide={
 king:'پادشاه: فرمانده میدان؛ مهره‌ای ارزشمند برای ساختن خط‌های پیروزی. عدد تاس، قدرت این مهره را تعیین می‌کند.',
 die:'جنگاور: نیروی تهاجمی میدان؛ با قدرت تاس وارد خانه می‌شود و در جمع قدرت خط‌ها اثر می‌گذارد.',
 guard:'سپر‌دار: نگهبان خط؛ زره و سپر او نماد دفاع است. جای‌گذاری هوشمندانه‌اش می‌تواند نتیجه نبرد را عوض کند.',
 mage:'جادوگر: استاد نیروهای اسرارآمیز؛ قدرت عدد تاس او در محاسبه خط‌ها منظور می‌شود.'
};
let voiceEnabled=true;
function sayFa(text){
 if(!voiceEnabled||!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return;
 try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='fa-IR';u.rate=.88;u.pitch=.92;u.volume=1;const voices=window.speechSynthesis.getVoices();const fa=voices.find(v=>(v.lang||'').toLowerCase().startsWith('fa'));if(fa)u.voice=fa;window.speechSynthesis.speak(u);}catch(e){}
}
function guide(text,spoken=true){const el=document.getElementById('subtitle');if(el)el.textContent=text;if(spoken)sayFa(text);}
function updateHud(msg){document.getElementById('message').textContent=msg;document.getElementById('turn').textContent=state.owner===0?'نوبت شما':'نوبت ربات';document.getElementById('score').textContent=state.score.join(' - ');guide(msg);}
function updateButtons(){document.querySelectorAll('.unit').forEach(b=>b.classList.toggle('active',b.dataset.kind===state.selected));document.getElementById('roll').disabled=state.rolled!==null;}
document.getElementById('voice').onclick=()=>{voiceEnabled=!voiceEnabled;document.getElementById('voice').textContent=voiceEnabled?'🔊 راهنمای صوتی: روشن':'🔇 راهنمای صوتی: خاموش';if(voiceEnabled){guide('راهنمای فارسی فعال شد. برای شروع، یک شخصیت انتخاب کنید.');}else if('speechSynthesis' in window){window.speechSynthesis.cancel();}};
document.querySelectorAll('.unit').forEach(b=>b.onclick=()=>{if(state.owner!==0)return;state.selected=b.dataset.kind;updateButtons();const detail=roleGuide[state.selected]||'';updateHud('نیروی '+b.textContent+' انتخاب شد؛ تاس بیندازید.');guide(detail);});
document.getElementById('roll').onclick=()=>{if(state.owner!==0||state.rolled!==null)return;state.rolled=1+Math.floor(Math.random()*6);updateButtons();updateHud('عدد تاس: '+state.rolled+' — خانه‌ای خالی را انتخاب کنید.');guide('عدد تاس '+state.rolled+' است. اکنون یکی از خانه‌های خالی میدان را لمس کنید.');};
function lineCheck(){const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8]];for(const line of lines){const a=line.map(i=>state.board[i]);if(a.every(Boolean)){const sums=[0,0];a.forEach(p=>sums[p.owner]+=p.hp);if(sums[0]!==sums[1]){const win=sums[0]>sums[1]?0:1;state.score[win]++;line.forEach(i=>{const p=state.board[i];arena.remove(p.mesh);state.pieces=state.pieces.filter(x=>x!==p.mesh);state.board[i]=null;});updateHud(win===0?'خط به سود شما تمام شد.':'خط به سود ربات تمام شد.');return true;}}}return false;}
function chooseTile(i){if(state.owner!==0||state.rolled===null||state.board[i])return;placePiece(i,0,state.selected,state.rolled);state.rolled=null;updateButtons();lineCheck();state.owner=1;state.turns++;updateHud('ربات در حال انتخاب حرکت است…');setTimeout(botMove,700);}
function botMove(){const free=state.board.map((p,i)=>p?null:i).filter(i=>i!==null);if(!free.length){state.owner=0;updateHud('زمین پر شد؛ شروع دور تازه.');return;}const i=free[Math.floor(Math.random()*free.length)],kind=['king','die','guard','mage'][Math.floor(Math.random()*4)],hp=1+Math.floor(Math.random()*6);placePiece(i,1,kind,hp);lineCheck();state.owner=0;updateHud('نوبت شماست؛ نیروی بعدی را انتخاب کنید.');}
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();renderer.domElement.addEventListener('pointerup',e=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=-(e.clientY/innerHeight)*2+1;ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(tileMeshes,true);if(hits.length){let o=hits[0].object;while(o.parent&&!tileMeshes.includes(o))o=o.parent;const i=tileMeshes.indexOf(o);if(i>=0)chooseTile(i);}});
document.getElementById('reset').onclick=()=>{state.pieces.forEach(p=>arena.remove(p));state.pieces=[];state.board=Array(9).fill(null);state.owner=0;state.rolled=null;state.score=[0,0];state.turns=0;updateButtons();updateHud('میدان تازه آماده است؛ نیرو انتخاب کنید.');};
function animate(t){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}animate(0);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
updateButtons();updateHud('میدان سه‌بعدی آماده است. برای شروع نیرو انتخاب کنید.');