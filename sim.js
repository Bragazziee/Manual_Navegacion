
/**
 * Simulador de balizas IALA
 * Soporta varios ritmos: F, Fl, Fl(n), LFl, Oc, Oc(n), Iso, Mo(A), Quick (Q), VQ
 * Todo en cliente, sin librerías.
 */

const $ = (sel)=>document.querySelector(sel);

const COLORS = {
  "Roja":"#ff2a2a",
  "Verde":"#00d16e",
  "Blanca":"#ffffff",
  "Amarilla":"#ffd54a"
};

// Definiciones ejemplo (puedes agregar más)
const PRESETS = {
  "F 4s (Fijo 4s)": { type:"F", period:4 },
  "Fl 4s (Destello cada 4s)": { type:"Fl", flashes:1, period:4, on:0.5 },
  "Fl(2) 6s (Grupo de 2 cada 6s)": { type:"Fl", flashes:2, period:6, on:0.5, inter:0.5 },
  "LFl 10s (Destello largo cada 10s)": { type:"LFl", period:10, on:2.0 },
  "Oc 4s (Ocultación cada 4s)": { type:"Oc", period:4, off:1.0 },
  "Oc(3) 10s (Grupo de 3)": { type:"Oc", flashes:3, period:10, off:0.7, inter:0.5 },
  "Iso 6s (Isofase)": { type:"Iso", period:6 },
  "Mo(A) 6s (Morse A)": { type:"Mo", period:6, code:".-" },
  "Q (Rápida ~1Hz)": { type:"Q", period:1.0 },
  "VQ (Muy rápida ~2Hz)": { type:"VQ", period:0.5 }
};

let timer = null;
let running = false;

function setLanternColor(hex){
  const el = $("#lantern");
  el.style.background = hex;
  el.style.color = hex; // Para la sombra 'lit'
}

function light(on){
  const el = $("#lantern");
  if(on){
    el.classList.add("lit");
    el.style.opacity = 1;
  }else{
    el.classList.remove("lit");
    el.style.opacity = 0.18;
  }
}

function stop(){
  running = false;
  if(timer) clearTimeout(timer);
  light(false);
  $("#btnStart").disabled = false;
  $("#btnStop").disabled = true;
}

function schedule(fn, ms){
  return setTimeout(fn, ms);
}

function start(){
  stop();
  running = true;
  const presetName = $("#preset").value;
  const colorName = $("#color").value;
  const intensity = parseFloat($("#intensity").value); // 0.2 - 1.0 (visual)
  const p = PRESETS[presetName];

  $("#btnStart").disabled = true;
  $("#btnStop").disabled = false;

  setLanternColor(COLORS[colorName]);
  $("#lantern").style.opacity = Math.max(0.12, intensity);

  // Bucle del período
  const loop = ()=>{
    if(!running) return;
    playPattern(p, ()=>{
      // Resto del período en oscuridad
      const used = lastPatternDuration(p);
      const rest = Math.max(0, (p.period*1000) - used);
      timer = schedule(()=>{
        if(!running) return;
        loop();
      }, rest);
    });
  };
  loop();
}

function lastPatternDuration(p){
  // Calcula cuánto tiempo ocupa la parte "activa" del patrón en ms
  const on = (p.on ?? 0.5)*1000;
  const off = (p.off ?? 0.5)*1000;
  const inter = (p.inter ?? 0.5)*1000;
  switch(p.type){
    case "F": return p.period*1000; // siempre encendido
    case "Fl":
      if(p.flashes>1){
        return (on*p.flashes) + inter*(p.flashes-1);
      }
      return on;
    case "LFl": return on;
    case "Oc":
      if(p.flashes>1){
        return (off*p.flashes) + inter*(p.flashes-1);
      }
      return off;
    case "Iso": return p.period*500; // mitad encendido, mitad apagado
    case "Q":
    case "VQ": return 0; // manejado como parpadeo continuo en todo el período
    case "Mo": 
      // Morse: dot=onShort, dash=onLong con pequeños espacios
      const dot=250, dash=750, gap=150;
      let t=0;
      for(const c of (p.code||"")){
        if(c==="."){ t+=dot+gap; }
        else if(c==="-" ){ t+=dash+gap; }
      }
      return t;
    default: return 0;
  }
}

function playPattern(p, done){
  const on = (p.on ?? 0.5)*1000;
  const off = (p.off ?? 0.5)*1000;
  const inter = (p.inter ?? 0.5)*1000;

  if(p.type==="F"){
    light(true);
    timer = schedule(()=>{ light(true); done(); }, p.period*1000);
    return;
  }
  if(p.type==="Fl"){
    if(p.flashes>1){
      let i=0;
      const step = ()=>{
        if(i>=p.flashes){ light(false); done(); return; }
        light(true);
        timer = schedule(()=>{
          light(false);
          i++;
          timer = schedule(step, i<p.flashes ? inter : 0);
        }, on);
      };
      step();
    }else{
      light(true);
      timer = schedule(()=>{ light(false); done(); }, on);
    }
    return;
  }
  if(p.type==="LFl"){
    light(true);
    timer = schedule(()=>{ light(false); done(); }, on);
    return;
  }
  if(p.type==="Oc"){
    // Ocultaciones: la luz permanece encendida salvo cuando se "oculta"
    light(true);
    if(p.flashes>1){
      let i=0;
      const step = ()=>{
        if(i>=p.flashes){ light(true); done(); return; }
        light(false);
        timer = schedule(()=>{
          light(true);
          i++;
          timer = schedule(step, i<p.flashes ? inter : 0);
        }, off);
      };
      step();
    }else{
      light(false);
      timer = schedule(()=>{ light(true); done(); }, off);
    }
    return;
  }
  if(p.type==="Iso"){
    // 50/50
    light(true);
    timer = schedule(()=>{
      light(false);
      done();
    }, (p.period*1000)/2);
    return;
  }
  if(p.type==="Q" || p.type==="VQ"){
    // Parpadeo rápido durante todo el período
    const blink = p.type==="Q" ? 100 : 50; // ms on/off
    let t=0;
    const step = ()=>{
      if(t >= p.period*1000){ light(false); done(); return; }
      light(true);
      timer = schedule(()=>{
        light(false);
        timer = schedule(()=>{
          t += blink*2;
          step();
        }, blink);
      }, blink);
    };
    step();
    return;
  }
  if(p.type==="Mo"){
    const dot=250, dash=750, gap=150;
    const code = (p.code||".-").split("");
    let idx=0;
    const step = ()=>{
      if(idx>=code.length){ light(false); done(); return; }
      const c = code[idx++];
      const dur = (c==="."?dot:dash);
      light(true);
      timer = schedule(()=>{
        light(false);
        timer = schedule(step, gap);
      }, dur);
    };
    step();
    return;
  }

  // Fallback
  done();
}

// Wire up UI
window.addEventListener("DOMContentLoaded",()=>{
  // Fill presets
  const sel = $("#preset");
  Object.keys(PRESETS).forEach(name=>{
    const opt = document.createElement("option");
    opt.value = name; opt.textContent = name;
    sel.appendChild(opt);
  });
  // defaults
  sel.value = "Fl(2) 6s (Grupo de 2 cada 6s)";
  setLanternColor(COLORS["Roja"]);
  $("#btnStart").addEventListener("click", start);
  $("#btnStop").addEventListener("click", stop);
  $("#color").addEventListener("change", e=> setLanternColor(COLORS[e.target.value]));
});
