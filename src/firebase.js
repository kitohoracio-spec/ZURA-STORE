import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp
} from "firebase/firestore";

// ─── DATA ────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id:1,  name:"Vestido Capulana Modern",   category:"mulher",     price:2850, badge:"new",  emoji:"👗", grad:["#2a1f0e","#5a3d18"] },
  { id:2,  name:"Ténis Urban Canvas",        category:"homem",      price:3200, badge:"hot",  emoji:"👟", grad:["#0e1a2a","#1a3a55"] },
  { id:3,  name:"Colar Artesanal Maputo",    category:"acessorios", price:980,  badge:"new",  emoji:"📿", grad:["#1a0e2a","#3d1a55"] },
  { id:4,  name:"Camisa Linho Premium",      category:"homem",      price:1750, oldPrice:2200, badge:"sale", emoji:"👔", grad:["#0e2a1a","#1a5530"] },
  { id:5,  name:"Bolsa Couro Nampula",       category:"mulher",     price:4200, badge:"hot",  emoji:"👜", grad:["#2a0e0e","#551a1a"] },
  { id:6,  name:"Chapéu Safari Clássico",    category:"acessorios", price:750,  badge:null,   emoji:"🎩", grad:["#2a2a0e","#55551a"] },
  { id:7,  name:"Shorts Praia Ilha",         category:"homem",      price:1100, oldPrice:1500, badge:"sale", emoji:"🩳", grad:["#1a2a2a","#2d5555"] },
  { id:8,  name:"Conjunto Tradicional",      category:"mulher",     price:3600, badge:"new",  emoji:"🥻", grad:["#2a1a0e","#553520"] },
  { id:9,  name:"Bracelete Makonde",         category:"acessorios", price:650,  badge:"new",  emoji:"💎", grad:["#0e1a2a","#1a3555"] },
  { id:10, name:"Casaco Capulana Fusion",    category:"mulher",     price:5200, badge:"hot",  emoji:"🧥", grad:["#2a0e1a","#551a35"] },
  { id:11, name:"Calças Chino Maputo",       category:"homem",      price:2100, badge:null,   emoji:"👖", grad:["#1a1a0e","#35351a"] },
  { id:12, name:"Sandálias Artesanais",      category:"acessorios", price:1350, oldPrice:1800, badge:"sale", emoji:"👡", grad:["#1a0e0e","#35201a"] },
];

const BADGE = {
  new:  { bg:"#c8a96e", color:"#000", label:"Novo" },
  sale: { bg:"#c84e4e", color:"#fff", label:"Sale" },
  hot:  { bg:"#4e7cc8", color:"#fff", label:"Hot"  },
};

const A = "#c8a96e";
const ROOT = { fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#0d0d0d", color:"#f0ece4", minHeight:"100vh", fontSize:15 };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Btn({ children, onClick, style={}, disabled=false }) {
  return <button disabled={disabled} onClick={onClick} style={{ background:disabled?"#555":A, color:"#000", border:"none", padding:"12px 28px", fontSize:"0.82rem", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", cursor:disabled?"not-allowed":"pointer", borderRadius:2, opacity:disabled?0.7:1, ...style }}>{children}</button>;
}
function GhostBtn({ children, onClick, style={} }) {
  return <button onClick={onClick} style={{ background:"transparent", color:"#f0ece4", border:"1px solid #3a3a3a", padding:"12px 28px", fontSize:"0.82rem", letterSpacing:1.5, textTransform:"uppercase", cursor:"pointer", borderRadius:2, ...style }}>{children}</button>;
}
function BackBtn({ onClick }) {
  return <button onClick={onClick} style={{ background:"none", border:"none", color:"#888", cursor:"pointer", fontSize:"0.82rem", letterSpacing:1, textTransform:"uppercase", marginBottom:32, display:"flex", alignItems:"center", gap:8 }}>← Voltar</button>;
}
function PageWrap({ children }) {
  return <div style={{ padding:"40px 5%", maxWidth:1100, margin:"0 auto" }}>{children}</div>;
}
function SectionTitle({ eyebrow, title }) {
  return <div style={{ marginBottom:32 }}>
    {eyebrow && <div style={{ fontSize:"0.68rem", letterSpacing:3, textTransform:"uppercase", color:A, marginBottom:8 }}>{eyebrow}</div>}
    <h2 style={{ fontFamily:"Georgia,serif", fontSize:"1.9rem", margin:0 }}>{title}</h2>
  </div>;
}
function FieldInput({ label, placeholder, value, onChange, type="text", required=false }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:"0.72rem", letterSpacing:1, textTransform:"uppercase", color:"#888", display:"block", marginBottom:6 }}>
        {label}{required && <span style={{color:A}}> *</span>}
      </label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width:"100%", background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#f0ece4", padding:"11px 14px", borderRadius:2, fontSize:"0.88rem", outline:"none", boxSizing:"border-box" }}/>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ZuraStore() {
  const [filter,   setFilter]   = useState("todos");
  const [cart,     setCart]     = useState([]);
  const [wishlist, setWishlist] = useState(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [toast,    setToast]    = useState(null);
  const [page,     setPage]     = useState("home");
  const [selected, setSelected] = useState(null);
  const [qty,      setQty]      = useState(1);
  const [user,     setUser]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  const filtered = filter==="todos" ? PRODUCTS
    : filter==="sale" ? PRODUCTS.filter(p=>p.badge==="sale")
    : PRODUCTS.filter(p=>p.category===filter);

  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(null),2800); }
  function addToCart(product,q=1){
    setCart(prev=>{ const ex=prev.find(i=>i.id===product.id); if(ex) return prev.map(i=>i.id===product.id?{...i,qty:i.qty+q}:i); return [...prev,{...product,qty:q}]; });
    showToast(`${product.name} adicionado!`);
  }
  function changeQty(id,d){ setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+d)}:i)); }
  function removeFromCart(id){ setCart(prev=>prev.filter(i=>i.id!==id)); }
  function toggleWish(id){ setWishlist(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; }); }
  function openProduct(p){ setSelected(p); setQty(1); setPage("product"); window.scrollTo({top:0}); }
  function goPage(p){ setPage(p); window.scrollTo({top:0}); }
  function navFilter(label){
    const map={"Novidades":"todos","Mulher":"mulher","Homem":"homem","Acessórios":"acessorios","Sale":"sale"};
    setFilter(map[label]||"todos"); goPage("home");
  }
  async function handleLogout(){ await signOut(auth); showToast("Sessão terminada!"); goPage("home"); }

  if(authLoading) return (
    <div style={{ ...ROOT, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:"2rem", color:A, marginBottom:16 }}>ZURA</div>
        <div style={{ color:"#888", fontSize:"0.82rem", letterSpacing:2, textTransform:"uppercase" }}>A carregar...</div>
      </div>
    </div>
  );

  return (
    <div style={ROOT}>
      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(13,13,13,0.95)", backdropFilter:"blur(12px)", borderBottom:"1px solid #2a2a2a", padding:"0 4%", display:"flex", alignItems:"center", justifyContent:"space-between", height:64, gap:16 }}>
        <span onClick={()=>goPage("home")} style={{ fontFamily:"Georgia,serif", fontSize:"1.6rem", color:A, letterSpacing:2, cursor:"pointer", flexShrink:0 }}>ZURA</span>
        <ul style={{ display:"flex", gap:20, listStyle:"none", margin:0, padding:0 }}>
          {["Novidades","Mulher","Homem","Acessórios","Sale"].map(l=>(
            <li key={l}><span onClick={()=>navFilter(l)} style={{ color:"#888", fontSize:"0.8rem", letterSpacing:1, textTransform:"uppercase", cursor:"pointer" }}>{l}</span></li>
          ))}
        </ul>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          {user ? (
            <>
              <span onClick={()=>goPage("conta")} style={{ color:A, fontSize:"0.8rem", cursor:"pointer", letterSpacing:1 }}>👤 {user.displayName||user.email.split("@")[0]}</span>
              <button onClick={handleLogout} style={{ background:"transparent", border:"1px solid #3a3a3a", color:"#888", padding:"6px 14px", borderRadius:2, fontSize:"0.75rem", cursor:"pointer", letterSpacing:1, textTransform:"uppercase" }}>Sair</button>
            </>
          ) : (
            <button onClick={()=>goPage("auth")} style={{ background:"transparent", border:`1px solid ${A}`, color:A, padding:"6px 14px", borderRadius:2, fontSize:"0.78rem", cursor:"pointer", letterSpacing:1, textTransform:"uppercase" }}>Entrar</button>
          )}
          <button onClick={()=>setCartOpen(true)} style={{ background:A, color:"#000", border:"none", padding:"8px 16px", borderRadius:2, fontSize:"0.78rem", fontWeight:700, letterSpacing:1, textTransform:"uppercase", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            🛒 <span style={{ background:"#000", color:A, borderRadius:"50%", width:18, height:18, fontSize:"0.68rem", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{cartCount}</span>
          </button>
        </div>
      </nav>

      {/* PAGES */}
      {page==="home"       && <HomePage filtered={filtered} filter={filter} setFilter={setFilter} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} openProduct={openProduct} goPage={goPage} />}
      {page==="product"    && <ProductPage product={selected} qty={qty} setQty={setQty} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} goBack={()=>goPage("home")} openProduct={openProduct} showToast={showToast} user={user} goPage={goPage} />}
      {page==="catalog"    && <CatalogPage filtered={PRODUCTS} filter={filter} setFilter={setFilter} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} openProduct={openProduct} goBack={()=>goPage("home")} />}
      {page==="auth"       && <AuthPage goBack={()=>goPage("home")} showToast={showToast} goPage={goPage} />}
      {page==="conta"      && <ContaPage user={user} goBack={()=>goPage("home")} showToast={showToast} goPage={goPage} />}
      {page==="entregas"   && <InfoPage title="Entregas" icon="🚚" goBack={()=>goPage("home")} content={ENTREGAS} />}
      {page==="devolucoes" && <InfoPage title="Devoluções" icon="↩️" goBack={()=>goPage("home")} content={DEVOLUCOES} />}
      {page==="tamanhos"   && <TamanhosPage goBack={()=>goPage("home")} />}
      {page==="faq"        && <FaqPage goBack={()=>goPage("home")} />}
      {page==="sobre"      && <InfoPage title="Sobre Nós" icon="🌍" goBack={()=>goPage("home")} content={SOBRE} />}
      {page==="contacto"   && <ContactoPage goBack={()=>goPage("home")} showToast={showToast} />}
      {page==="carreiras"  && <InfoPage title="Carreiras" icon="💼" goBack={()=>goPage("home")} content={CARREIRAS} />}

      {/* CART PANEL */}
      {cartOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:200 }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }} onClick={()=>setCartOpen(false)} />
          <div style={{ position:"absolute", right:0, top:0, bottom:0, width:380, background:"#161616", borderLeft:"1px solid #2a2a2a", display:"flex", flexDirection:"column", zIndex:1 }}>
            <div style={{ padding:"20px 24px", borderBottom:"1px solid #2a2a2a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontFamily:"Georgia,serif", fontSize:"1.2rem" }}>O teu Carrinho</span>
              <button onClick={()=>setCartOpen(false)} style={{ background:"none", border:"none", color:"#888", fontSize:"1.3rem", cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:24 }}>
              {cart.length===0 ? (
                <div style={{ textAlign:"center", padding:"60px 0", color:"#888" }}>
                  <div style={{ fontSize:"3rem", marginBottom:16 }}>🛒</div>
                  <p>O teu carrinho está vazio</p>
                </div>
              ) : cart.map(item=>(
                <div key={item.id} style={{ display:"flex", gap:14, paddingBottom:16, marginBottom:16, borderBottom:"1px solid #2a2a2a" }}>
                  <div style={{ width:68, height:68, borderRadius:4, background:`linear-gradient(135deg,${item.grad[0]},${item.grad[1]})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", flexShrink:0 }}>{item.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"0.88rem", marginBottom:4 }}>{item.name}</div>
                    <div style={{ color:A, fontSize:"0.85rem", fontWeight:600 }}>{item.price.toLocaleString()} MT</div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8 }}>
                      <button onClick={()=>changeQty(item.id,-1)} style={{ width:24,height:24,background:"#1e1e1e",border:"1px solid #3a3a3a",color:"#f0ece4",borderRadius:2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
                      <span style={{ fontSize:"0.85rem", minWidth:20, textAlign:"center" }}>{item.qty}</span>
                      <button onClick={()=>changeQty(item.id,1)} style={{ width:24,height:24,background:"#1e1e1e",border:"1px solid #3a3a3a",color:"#f0ece4",borderRadius:2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
                    </div>
                  </div>
                  <button onClick={()=>removeFromCart(item.id)} style={{ background:"none",border:"none",color:"#555",cursor:"pointer",alignSelf:"flex-start",fontSize:"0.9rem" }}>✕</button>
                </div>
              ))}
            </div>
            {cart.length>0 && (
              <div style={{ padding:24, borderTop:"1px solid #2a2a2a" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16, fontSize:"0.9rem" }}>
                  <span>Total</span>
                  <span style={{ fontFamily:"Georgia,serif", fontSize:"1.2rem", color:A }}>{cartTotal.toLocaleString()} MT</span>
                </div>
                <button onClick={()=>{ setCartOpen(false); setCart([]); showToast("Pedido confirmado! Obrigado 🎉"); }} style={{ width:"100%", background:A, color:"#000", border:"none", padding:16, fontSize:"0.85rem", fontWeight:700, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", borderRadius:2 }}>
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:32, right:32, background:"#161616", border:`1px solid ${A}`, borderRadius:4, padding:"14px 22px", display:"flex", alignItems:"center", gap:10, fontSize:"0.85rem", zIndex:300, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", animation:"slideUp 0.3s ease", maxWidth:300 }}>
          <span style={{ color:"#4caf7d" }}>✓</span> {toast}
        </div>
      )}
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ goBack, showToast, goPage }) {
  const [mode,    setMode]    = useState("login"); // login | register
  const [nome,    setNome]    = useState("");
  const [email,   setEmail]   = useState("");
  const [senha,   setSenha]   = useState("");
  const [senha2,  setSenha2]  = useState("");
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState("");

  async function handleLogin() {
    setErro(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      showToast("Bem-vindo de volta! 👋"); goPage("home");
    } catch(e) {
      setErro(e.code==="auth/invalid-credential"?"Email ou senha incorrectos.":"Erro ao entrar. Tenta novamente.");
    } finally { setLoading(false); }
  }

  async function handleRegister() {
    setErro("");
    if(!nome) return setErro("Insere o teu nome.");
    if(senha!==senha2) return setErro("As senhas não coincidem.");
    if(senha.length<6) return setErro("A senha deve ter pelo menos 6 caracteres.");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(cred.user, { displayName: nome });
      showToast(`Conta criada! Bem-vindo, ${nome}! 🎉`); goPage("home");
    } catch(e) {
      setErro(e.code==="auth/email-already-in-use"?"Este email já está registado.":"Erro ao criar conta. Tenta novamente.");
    } finally { setLoading(false); }
  }

  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <div style={{ maxWidth:440, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:"2rem", color:A, marginBottom:8 }}>ZURA</div>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:"1.8rem", marginBottom:8 }}>{mode==="login"?"Bem-vindo de volta":"Criar conta"}</h1>
          <p style={{ color:"#888", fontSize:"0.88rem" }}>{mode==="login"?"Entra na tua conta ZURA":"Junta-te à família ZURA"}</p>
        </div>

        {/* TOGGLE */}
        <div style={{ display:"flex", background:"#1e1e1e", borderRadius:4, padding:4, marginBottom:28 }}>
          {[["login","Entrar"],["register","Criar Conta"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setErro("");}} style={{ flex:1, padding:"10px", border:"none", background:mode===m?A:"transparent", color:mode===m?"#000":"#888", borderRadius:2, cursor:"pointer", fontSize:"0.82rem", fontWeight:mode===m?700:400, letterSpacing:1, textTransform:"uppercase", transition:"all 0.2s" }}>{l}</button>
          ))}
        </div>

        <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:28 }}>
          {mode==="register" && (
            <FieldInput label="Nome completo" placeholder="Ex: Maria João" value={nome} onChange={e=>setNome(e.target.value)} required/>
          )}
          <FieldInput label="Email" placeholder="exemplo@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} type="email" required/>
          <FieldInput label="Senha" placeholder="Mínimo 6 caracteres" value={senha} onChange={e=>setSenha(e.target.value)} type="password" required/>
          {mode==="register" && (
            <FieldInput label="Confirmar Senha" placeholder="Repete a senha" value={senha2} onChange={e=>setSenha2(e.target.value)} type="password" required/>
          )}

          {erro && <div style={{ background:"rgba(200,78,78,0.1)", border:"1px solid rgba(200,78,78,0.3)", borderRadius:2, padding:"10px 14px", marginBottom:16, fontSize:"0.82rem", color:"#e88" }}>{erro}</div>}

          <Btn disabled={loading} onClick={mode==="login"?handleLogin:handleRegister} style={{ width:"100%", padding:14, marginTop:4 }}>
            {loading ? "A processar..." : mode==="login" ? "Entrar" : "Criar Conta"}
          </Btn>
        </div>

        <p style={{ textAlign:"center", color:"#888", fontSize:"0.82rem", marginTop:20 }}>
          {mode==="login" ? "Não tens conta? " : "Já tens conta? "}
          <span onClick={()=>{setMode(mode==="login"?"register":"login");setErro("");}} style={{ color:A, cursor:"pointer" }}>
            {mode==="login" ? "Cria uma agora" : "Entra aqui"}
          </span>
        </p>
      </div>
    </PageWrap>
  );
}
Add Firebase auth and orders
// ─── CONTA PAGE ──────────────────────────────────
