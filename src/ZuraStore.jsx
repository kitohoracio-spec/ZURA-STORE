import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, setDoc
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
  sale: { bg:"#c84e4e", color:"#fff", label:"Vendidos" },
  hot:  { bg:"#4e7cc8", color:"#fff", label:"Mais Vendido"  },
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

// ─── ADMIN ─────────────────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = "kitohoracio@gmail.com"; // único admin principal — não pode ser alterado por ninguém

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ZuraStore() {
  const [filter,   setFilter]   = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cart,     setCart]     = useState([]);
  const [wishlist, setWishlist] = useState(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [toast,    setToast]    = useState(null);
  const [page,     setPage]     = useState("home");
  const [selected, setSelected] = useState(null);
  const [qty,      setQty]      = useState(1);
  const [user,     setUser]     = useState(null);
  const [userRole, setUserRole] = useState("cliente"); // cliente | trabalhador | admin
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState(PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(true);
  const [pedidosNaoVistos, setPedidosNaoVistos] = useState(0);

  const isSuperAdmin = !!(user && user.email === SUPER_ADMIN_EMAIL);
  const isStaff = isSuperAdmin || userRole === "admin" || userRole === "trabalhador"; // tem acesso ao painel

  // Listen to auth state + fetch role from Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u){
        try {
          const snap = await getDocs(query(collection(db,"users"), where("__name__","==",u.uid)));
          if(!snap.empty) setUserRole(snap.docs[0].data().role || "cliente");
          else if(u.email===SUPER_ADMIN_EMAIL) setUserRole("admin");
          else setUserRole("cliente");
        } catch(e){ console.log(e); }
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Load products from Firestore (fallback to local PRODUCTS if empty/error)
  useEffect(() => {
    async function loadProducts(){
      try {
        const snap = await getDocs(collection(db,"produtos"));
        if(!snap.empty){
          const docs = snap.docs.map(d=>({...d.data(), docId:d.id}));
          docs.sort((a,b)=>(a.id||0)-(b.id||0));
          setProducts(docs);
        }
      } catch(e){ console.log("Usando produtos locais:", e.message); }
      finally { setProductsLoading(false); }
    }
    loadProducts();
  }, []);

  async function refreshProducts(){
    try {
      const snap = await getDocs(collection(db,"produtos"));
      const docs = snap.docs.map(d=>({...d.data(), docId:d.id}));
      docs.sort((a,b)=>(a.id||0)-(b.id||0));
      setProducts(docs);
    } catch(e){ console.error(e); }
  }

  // Check for order status changes the client hasn't seen yet (notification badge)
  useEffect(() => {
    if(!user) { setPedidosNaoVistos(0); return; }
    async function checkNotificacoes(){
      try {
        const q = query(collection(db,"pedidos"), where("userId","==",user.uid));
        const snap = await getDocs(q);
        const naoVistos = snap.docs.filter(d => {
          const data = d.data();
          return data.status && data.status!=="pendente" && !data.clienteViu;
        });
        setPedidosNaoVistos(naoVistos.length);
      } catch(e){ console.log(e); }
    }
    checkNotificacoes();
  }, [user, page]);

  const filtered = filter==="todos" ? products
    : filter==="sale" ? products.filter(p=>p.badge==="sale")
    : filter==="novidades" ? products
    : products.filter(p=>p.category===filter);

  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(null),2800); }
  function addToCart(product,q=1){
    if(!user){ showToast("Cria uma conta ou entra para poder comprar 🔒"); goPage("auth"); return; }
    setCart(prev=>{ const ex=prev.find(i=>i.id===product.id); if(ex) return prev.map(i=>i.id===product.id?{...i,qty:i.qty+q}:i); return [...prev,{...product,qty:q}]; });
    showToast(`${product.name} adicionado!`);
  }
  function changeQty(id,d){ setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+d)}:i)); }
  function removeFromCart(id){ setCart(prev=>prev.filter(i=>i.id!==id)); }
  function toggleWish(id){ setWishlist(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; }); }
  function openProduct(p){ setSelected(p); setQty(1); setPage("product"); window.scrollTo({top:0}); }
  function goPage(p){ setPage(p); window.scrollTo({top:0}); }
  function navFilter(label){
    const map={"Novidades":"novidades","Mulher":"mulher","Homem":"homem","Acessórios":"acessorios","Vendidos":"sale"};
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
          {["Novidades","Mulher","Homem","Acessórios","Vendidos"].map(l=>(
            <li key={l}><span onClick={()=>navFilter(l)} style={{ color:"#888", fontSize:"0.8rem", letterSpacing:1, textTransform:"uppercase", cursor:"pointer" }}>{l}</span></li>
          ))}
        </ul>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          {searchOpen ? (
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"#1e1e1e", border:`1px solid ${A}`, borderRadius:2, padding:"4px 8px" }}>
              <input autoFocus type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter" && searchQuery.trim()){ goPage("search"); } if(e.key==="Escape"){ setSearchOpen(false); setSearchQuery(""); } }}
                placeholder="Procurar produtos..." style={{ background:"none", border:"none", color:"#f0ece4", fontSize:"0.82rem", outline:"none", width:140 }}/>
              <span onClick={()=>{ if(searchQuery.trim()) goPage("search"); }} style={{ cursor:"pointer", color:A }}>🔍</span>
              <span onClick={()=>{ setSearchOpen(false); setSearchQuery(""); }} style={{ cursor:"pointer", color:"#888", fontSize:"0.9rem" }}>✕</span>
            </div>
          ) : (
            <span onClick={()=>setSearchOpen(true)} style={{ cursor:"pointer", fontSize:"1rem", color:"#888" }}>🔍</span>
          )}
          {user ? (
            <>
              <span onClick={()=>goPage("conta")} style={{ color:A, fontSize:"0.8rem", cursor:"pointer", letterSpacing:1, position:"relative" }}>
                👤 {user.displayName||user.email.split("@")[0]}
                {pedidosNaoVistos>0 && <span style={{ position:"absolute", top:-6, right:-10, background:"#c84e4e", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:"0.6rem", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{pedidosNaoVistos}</span>}
              </span>
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
      {page==="product"    && <ProductPage product={selected} qty={qty} setQty={setQty} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} goBack={()=>goPage("home")} openProduct={openProduct} showToast={showToast} user={user} goPage={goPage} products={products} />}
      {page==="catalog"    && <CatalogPage filtered={products} filter={filter} setFilter={setFilter} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} openProduct={openProduct} goBack={()=>goPage("home")} />}
      {page==="search"     && <SearchPage products={products} query={searchQuery} setQuery={setSearchQuery} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} openProduct={openProduct} goBack={()=>goPage("home")} />}
      {page==="auth"       && <AuthPage goBack={()=>goPage("home")} showToast={showToast} goPage={goPage} />}
      {page==="conta"      && <ContaPage user={user} isStaff={isStaff} userRole={userRole} goBack={()=>goPage("home")} showToast={showToast} goPage={goPage} />}
      {page==="admin"      && <AdminPage user={user} isStaff={isStaff} isSuperAdmin={isSuperAdmin} userRole={userRole} goBack={()=>goPage("home")} showToast={showToast} products={products} refreshProducts={refreshProducts} />}
      {page==="entregas"   && <InfoPage title="Entregas" icon="🚚" goBack={()=>goPage("home")} content={ENTREGAS} />}
      {page==="devolucoes" && <InfoPage title="Devoluções" icon="↩️" goBack={()=>goPage("home")} content={DEVOLUCOES} />}
      {page==="tamanhos"   && <TamanhosPage goBack={()=>goPage("home")} />}
      {page==="faq"        && <FaqPage goBack={()=>goPage("home")} />}
      {page==="sobre"      && <InfoPage title="Sobre Nós" icon="🌍" goBack={()=>goPage("home")} content={SOBRE} />}
      {page==="contacto"   && <ContactoPage goBack={()=>goPage("home")} goPage={goPage} user={user} />}
      {page==="carreiras"  && <InfoPage title="Carreiras" icon="💼" goBack={()=>goPage("home")} content={CARREIRAS} />}

      {/* CART PANEL */}
      {cartOpen && (
        <CartPanel
          cart={cart} cartTotal={cartTotal} user={user}
          changeQty={changeQty} removeFromCart={removeFromCart}
          setCart={setCart} setCartOpen={setCartOpen} showToast={showToast}
        />
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

// ─── CART PANEL ───────────────────────────────────────────────────────────────
function CartPanel({ cart, cartTotal, user, changeQty, removeFromCart, setCart, setCartOpen, showToast }) {
  const [step, setStep] = useState(1); // 1=carrinho, 2=entrega, 3=sucesso
  const [saving, setSaving] = useState(false);
  const [dados, setDados] = useState({ nome:user?.displayName||"", telefone:"", provincia:"", cidade:"", bairro:"", referencia:"", pagamento:"mpesa" });
  const [cupomInput, setCupomInput] = useState("");
  const [cupom, setCupom] = useState(null); // {codigo, desconto, tipo}
  const [checandoCupom, setCheckandoCupom] = useState(false);

  const PROVINCIAS = ["Nampula","Maputo","Beira","Quelimane","Tete","Nacala","Lichinga","Pemba","Xai-Xai","Inhambane","Chimoio","Mocuba"];
  const PAGAMENTOS = [
    { id:"mpesa",   label:"M-Pesa",               icon:"📱" },
    { id:"emola",   label:"e-Mola",               icon:"💳" },
    { id:"banco",   label:"Transferência BCI",     icon:"🏦" },
    { id:"entrega", label:"Pagamento na Entrega",  icon:"💵" },
  ];

  const descontoValor = cupom ? (cupom.tipo==="percentagem" ? Math.round(cartTotal * cupom.desconto/100) : Math.min(cupom.desconto, cartTotal)) : 0;
  const totalComDesconto = Math.max(0, cartTotal - descontoValor);

  async function aplicarCupom(){
    const codigo = cupomInput.trim().toUpperCase();
    if(!codigo) return;
    setCheckandoCupom(true);
    try {
      const snap = await getDocs(query(collection(db,"cupoes"), where("codigo","==",codigo)));
      if(snap.empty){ showToast("Cupão inválido."); setCupom(null); return; }
      const data = snap.docs[0].data();
      if(data.ativo===false){ showToast("Este cupão já não está activo."); setCupom(null); return; }
      if(data.validade && data.validade.toDate && data.validade.toDate() < new Date()){ showToast("Este cupão expirou."); setCupom(null); return; }
      setCupom({ codigo, desconto:data.desconto, tipo:data.tipo||"percentagem" });
      showToast(`Cupão "${codigo}" aplicado! 🎉`);
    } catch(e){ console.error(e); showToast("Erro ao validar cupão."); }
    finally { setCheckandoCupom(false); }
  }

  function removerCupom(){ setCupom(null); setCupomInput(""); }

  function close(){ setCartOpen(false); setStep(1); }

  function avancar(){
    if(!dados.nome||!dados.telefone||!dados.provincia||!dados.cidade){
      showToast("Preenche todos os campos obrigatórios!"); return;
    }
    setStep(2.5);
  }

  async function confirmar(){
    setSaving(true);
    try {
      const fatorDesconto = cartTotal>0 ? totalComDesconto/cartTotal : 1;
      for(const item of cart){
        const totalItem = item.price*item.qty;
        const pedido = {
          userId:    user ? user.uid : "anonimo",
          userEmail: user ? user.email : "anonimo",
          produto:   item.name,
          emoji:     item.emoji,
          grad:      item.grad||null,
          imageUrl:  item.imageUrl||null,
          preco:     item.price,
          quantidade:item.qty,
          total:     Math.round(totalItem * fatorDesconto),
          totalOriginal: totalItem,
          cupom:     cupom ? cupom.codigo : null,
          tamanho:   "padrão",
          medidas:   null,
          nome:      dados.nome,
          telefone:  dados.telefone,
          provincia: dados.provincia,
          cidade:    dados.cidade,
          bairro:    dados.bairro,
          referencia:dados.referencia,
          pagamento: dados.pagamento,
          status:    "pendente",
          criadoEm:  serverTimestamp(),
        };
        await addDoc(collection(db,"pedidos"), pedido);
      }
      setStep(3);
      setCart([]);
    } catch(e){
      console.error(e);
      showToast("Erro ao guardar pedido. Tenta novamente.");
    } finally { setSaving(false); }
  }

  const PAGAMENTO_LABEL = PAGAMENTOS.find(x=>x.id===dados.pagamento)?.label;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }} onClick={close} />
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:380, maxWidth:"100vw", background:"#161616", borderLeft:"1px solid #2a2a2a", display:"flex", flexDirection:"column", zIndex:1 }}>
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #2a2a2a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"Georgia,serif", fontSize:"1.2rem" }}>
            {step===1?"O teu Carrinho":step===2.5?"Confirmar Pedido":step===3?"Pedido Feito":"Detalhes de Entrega"}
          </span>
          <button onClick={close} style={{ background:"none", border:"none", color:"#888", fontSize:"1.3rem", cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:24 }}>

          {/* STEP 1 — Carrinho */}
          {step===1 && (
            cart.length===0 ? (
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
            ))
          )}

          {/* STEP 2 — Entrega */}
          {step===2 && (
            <div>
              {!user && (
                <div style={{ background:"rgba(200,169,110,0.06)", border:"1px solid rgba(200,169,110,0.2)", borderRadius:4, padding:"10px 14px", marginBottom:18, fontSize:"0.8rem", color:"#aaa" }}>
                  💡 Estás a comprar como visitante. Os teus pedidos não ficarão guardados na tua conta.
                </div>
              )}
              <FieldInput label="Nome completo" placeholder="Ex: Maria João" value={dados.nome} onChange={e=>setDados({...dados,nome:e.target.value})} required/>
              <FieldInput label="Telefone / WhatsApp" placeholder="Ex: 84 123 4567" value={dados.telefone} onChange={e=>setDados({...dados,telefone:e.target.value})} type="tel" required/>

              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:"0.72rem", letterSpacing:1, textTransform:"uppercase", color:"#888", display:"block", marginBottom:6 }}>Província <span style={{color:A}}>*</span></label>
                <select value={dados.provincia} onChange={e=>setDados({...dados,provincia:e.target.value})}
                  style={{ width:"100%", background:"#1e1e1e", border:"1px solid #2a2a2a", color:dados.provincia?"#f0ece4":"#666", padding:"11px 14px", borderRadius:2, fontSize:"0.88rem", outline:"none", boxSizing:"border-box" }}>
                  <option value="">Selecciona a província</option>
                  {PROVINCIAS.map(pr=><option key={pr} value={pr}>{pr}</option>)}
                </select>
              </div>

              <FieldInput label="Cidade / Distrito" placeholder="Ex: Nampula cidade" value={dados.cidade} onChange={e=>setDados({...dados,cidade:e.target.value})} required/>
              <FieldInput label="Bairro / Zona" placeholder="Ex: Muhala Expansão" value={dados.bairro} onChange={e=>setDados({...dados,bairro:e.target.value})}/>
              <FieldInput label="Ponto de referência" placeholder="Ex: Perto do Mercado Central" value={dados.referencia} onChange={e=>setDados({...dados,referencia:e.target.value})}/>

              <div style={{ marginTop:6, marginBottom:6 }}>
                <div style={{ fontSize:"0.72rem", letterSpacing:2, textTransform:"uppercase", color:A, marginBottom:12 }}>Forma de pagamento</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {PAGAMENTOS.map(pg=>(
                    <button key={pg.id} onClick={()=>setDados({...dados,pagamento:pg.id})}
                      style={{ padding:"10px 12px", border:`1px solid ${dados.pagamento===pg.id?A:"#2a2a2a"}`, background:dados.pagamento===pg.id?"rgba(200,169,110,0.08)":"transparent", color:dados.pagamento===pg.id?A:"#888", borderRadius:2, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:"0.78rem" }}>
                      <span>{pg.icon}</span><span>{pg.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2.5 — Confirmação */}
          {step===2.5 && (
            <div>
              <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:18, marginBottom:16 }}>
                <div style={{ fontSize:"0.7rem", letterSpacing:2, textTransform:"uppercase", color:A, marginBottom:14 }}>Produtos</div>
                {cart.map(item=>(
                  <div key={item.id} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.85rem", marginBottom:8 }}>
                    <span style={{color:"#aaa"}}>{item.emoji} {item.name} x{item.qty}</span>
                    <span>{(item.price*item.qty).toLocaleString()} MT</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:18, marginBottom:16 }}>
                <div style={{ fontSize:"0.7rem", letterSpacing:2, textTransform:"uppercase", color:A, marginBottom:14 }}>Entrega</div>
                {[["Cliente",dados.nome],["Telefone",dados.telefone],["Localização",`${dados.bairro?dados.bairro+", ":""}${dados.cidade}, ${dados.provincia}`],dados.referencia&&["Referência",dados.referencia],["Pagamento",PAGAMENTO_LABEL]].filter(Boolean).map(([k,v])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.85rem", marginBottom:8, gap:12 }}>
                    <span style={{color:"#888",flexShrink:0}}>{k}</span><span style={{textAlign:"right"}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(200,169,110,0.06)", border:"1px solid rgba(200,169,110,0.2)", borderRadius:4, padding:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"0.85rem", color:"#aaa" }}>{cupom?`Total (cupão ${cupom.codigo})`:"Total"}</span>
                <span style={{ fontFamily:"Georgia,serif", fontSize:"1.3rem", color:A, fontWeight:700 }}>{totalComDesconto.toLocaleString()} MT</span>
              </div>
            </div>
          )}

          {/* STEP 3 — Sucesso */}
          {step===3 && (
            <div style={{ textAlign:"center", padding:"40px 10px" }}>
              <div style={{ fontSize:"3.5rem", marginBottom:16 }}>🎉</div>
              <h3 style={{ fontFamily:"Georgia,serif", fontSize:"1.4rem", marginBottom:12, color:A }}>Pedido Confirmado!</h3>
              <p style={{ color:"#888", fontSize:"0.88rem", lineHeight:1.8, marginBottom:8 }}>Obrigado, <strong style={{color:"#f0ece4"}}>{dados.nome}</strong>!</p>
              <p style={{ color:"#888", fontSize:"0.85rem", lineHeight:1.8 }}>Entraremos em contacto via WhatsApp para <strong style={{color:"#f0ece4"}}>{dados.telefone}</strong>.</p>
              {user && <p style={{ color:"#888", fontSize:"0.8rem", marginTop:16 }}>💡 Podes acompanhar este pedido na tua <span onClick={close} style={{color:A,cursor:"pointer",textDecoration:"underline"}}>conta</span>.</p>}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        {step===1 && cart.length>0 && (
          <div style={{ padding:24, borderTop:"1px solid #2a2a2a" }}>
            {/* CUPÃO */}
            {!cupom ? (
              <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                <input type="text" value={cupomInput} onChange={e=>setCupomInput(e.target.value)} placeholder="Código de cupão"
                  onKeyDown={e=>{ if(e.key==="Enter") aplicarCupom(); }}
                  style={{ flex:1, background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#f0ece4", padding:"9px 12px", borderRadius:2, fontSize:"0.82rem", outline:"none", textTransform:"uppercase" }}/>
                <button onClick={aplicarCupom} disabled={checandoCupom||!cupomInput.trim()} style={{ background:"transparent", border:`1px solid ${A}`, color:A, padding:"9px 16px", borderRadius:2, cursor:"pointer", fontSize:"0.78rem", fontWeight:600 }}>
                  {checandoCupom?"...":"Aplicar"}
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(76,175,125,0.08)", border:"1px solid rgba(76,175,125,0.3)", borderRadius:2, padding:"8px 12px", marginBottom:16 }}>
                <span style={{ color:"#7ed9af", fontSize:"0.8rem" }}>✓ Cupão "{cupom.codigo}" aplicado</span>
                <span onClick={removerCupom} style={{ color:"#888", fontSize:"0.75rem", cursor:"pointer", textDecoration:"underline" }}>Remover</span>
              </div>
            )}

            {descontoValor>0 && (
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:"0.82rem" }}>
                <span style={{color:"#888"}}>Subtotal</span>
                <span style={{color:"#888", textDecoration:"line-through"}}>{cartTotal.toLocaleString()} MT</span>
              </div>
            )}
            {descontoValor>0 && (
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:"0.82rem" }}>
                <span style={{color:"#7ed9af"}}>Desconto</span>
                <span style={{color:"#7ed9af"}}>− {descontoValor.toLocaleString()} MT</span>
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16, fontSize:"0.9rem" }}>
              <span>Total</span>
              <span style={{ fontFamily:"Georgia,serif", fontSize:"1.2rem", color:A }}>{totalComDesconto.toLocaleString()} MT</span>
            </div>
            <Btn style={{ width:"100%", padding:16 }} onClick={()=>setStep(2)}>Finalizar Compra</Btn>
          </div>
        )}
        {step===2 && (
          <div style={{ padding:24, borderTop:"1px solid #2a2a2a", display:"flex", gap:10 }}>
            <GhostBtn onClick={()=>setStep(1)}>← Voltar</GhostBtn>
            <Btn style={{ flex:1, padding:14 }} onClick={avancar}>Rever Pedido →</Btn>
          </div>
        )}
        {step===2.5 && (
          <div style={{ padding:24, borderTop:"1px solid #2a2a2a", display:"flex", gap:10 }}>
            <GhostBtn onClick={()=>setStep(2)}>← Editar</GhostBtn>
            <Btn style={{ flex:1, padding:14 }} disabled={saving} onClick={confirmar}>{saving?"A guardar...":"✓ Confirmar Pedido"}</Btn>
          </div>
        )}
        {step===3 && (
          <div style={{ padding:24, borderTop:"1px solid #2a2a2a" }}>
            <Btn style={{ width:"100%", padding:14 }} onClick={close}>Continuar a comprar</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
function AdminPage({ user, isStaff, isSuperAdmin, userRole, goBack, showToast, products, refreshProducts }) {
  const [tab, setTab] = useState("pedidos"); // pedidos | produtos | mensagens | usuarios | seed
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [editing, setEditing] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [cupoes, setCupoes] = useState([]);
  const [loadingCupoes, setLoadingCupoes] = useState(true);
  const [editingCupom, setEditingCupom] = useState(null);

  const STATUS_OPTS = ["pendente","processando","enviado","entregue","cancelado"];
  const STATUS_COLOR = { pendente:"#c8a96e", processando:"#4e7cc8", enviado:"#7ed9af", entregue:"#4caf7d", cancelado:"#c84e4e" };

  useEffect(()=>{
    if(!isStaff) return;
    fetchPedidos();
    if(isSuperAdmin){ fetchMensagens(); fetchUsuarios(); fetchCupoes(); }
  },[isStaff]);

  async function fetchPedidos(){
    setLoadingPedidos(true);
    try {
      const snap = await getDocs(collection(db,"pedidos"));
      const docs = snap.docs.map(d=>({id:d.id,...d.data()}));
      docs.sort((a,b)=>(b.criadoEm?.seconds||0)-(a.criadoEm?.seconds||0));
      setPedidos(docs);
    } catch(e){ console.error(e); }
    finally { setLoadingPedidos(false); }
  }

  async function fetchMensagens(){
    setLoadingMsgs(true);
    try {
      const snap = await getDocs(collection(db,"mensagens"));
      const docs = snap.docs.map(d=>({id:d.id,...d.data()}));
      docs.sort((a,b)=>(b.criadoEm?.seconds||0)-(a.criadoEm?.seconds||0));
      setMensagens(docs);
    } catch(e){ console.error(e); }
    finally { setLoadingMsgs(false); }
  }

  async function marcarLida(msgId){
    try {
      await updateDoc(doc(db,"mensagens",msgId), { lida:true });
      setMensagens(prev=>prev.map(m=>m.id===msgId?{...m,lida:true}:m));
    } catch(e){ console.error(e); }
  }

  async function responderMensagem(msgId, resposta){
    if(!resposta.trim()){ showToast("Escreve uma resposta antes de enviar."); return; }
    try {
      await updateDoc(doc(db,"mensagens",msgId), { resposta: resposta.trim(), respondida:true, lida:true, respondidoEm: serverTimestamp() });
      setMensagens(prev=>prev.map(m=>m.id===msgId?{...m,resposta:resposta.trim(),respondida:true,lida:true}:m));
      showToast("Resposta enviada ao cliente! 📩");
    } catch(e){ console.error(e); showToast("Erro ao enviar resposta."); }
  }

  async function fetchUsuarios(){
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db,"users"));
      const docs = snap.docs.map(d=>({uid:d.id,...d.data()}));
      setUsuarios(docs);
    } catch(e){ console.error(e); }
    finally { setLoadingUsers(false); }
  }

  async function changeRole(uid, email, novoRole){
    if(email===SUPER_ADMIN_EMAIL){ showToast("Este é o admin principal — o role não pode ser alterado."); return; }
    try {
      await updateDoc(doc(db,"users",uid), { role: novoRole });
      setUsuarios(prev=>prev.map(u=>u.uid===uid?{...u,role:novoRole}:u));
      showToast("Permissão actualizada!");
    } catch(e){ console.error(e); showToast("Erro ao actualizar permissão."); }
  }

  async function fetchCupoes(){
    setLoadingCupoes(true);
    try {
      const snap = await getDocs(collection(db,"cupoes"));
      const docs = snap.docs.map(d=>({id:d.id,...d.data()}));
      docs.sort((a,b)=>(b.criadoEm?.seconds||0)-(a.criadoEm?.seconds||0));
      setCupoes(docs);
    } catch(e){ console.error(e); }
    finally { setLoadingCupoes(false); }
  }

  async function saveCupom(cupom){
    try {
      const codigo = cupom.codigo.trim().toUpperCase();
      if(!codigo){ showToast("O código do cupão é obrigatório."); return; }
      const data = {
        codigo,
        desconto: Number(cupom.desconto),
        tipo: cupom.tipo,
        ativo: cupom.ativo!==false,
        criadoEm: cupom.id ? cupom.criadoEm : serverTimestamp(),
      };
      if(cupom.id){
        await updateDoc(doc(db,"cupoes",cupom.id), data);
      } else {
        await addDoc(collection(db,"cupoes"), data);
      }
      showToast("Cupão guardado!");
      setEditingCupom(null);
      await fetchCupoes();
    } catch(e){ console.error(e); showToast("Erro ao guardar cupão."); }
  }

  async function toggleCupomAtivo(cupomId, ativo){
    try {
      await updateDoc(doc(db,"cupoes",cupomId), { ativo: !ativo });
      setCupoes(prev=>prev.map(c=>c.id===cupomId?{...c,ativo:!ativo}:c));
    } catch(e){ console.error(e); showToast("Erro ao actualizar cupão."); }
  }

  async function deleteCupom(cupomId){
    if(!window.confirm("Apagar este cupão definitivamente?")) return;
    try {
      await deleteDoc(doc(db,"cupoes",cupomId));
      showToast("Cupão apagado.");
      await fetchCupoes();
    } catch(e){ console.error(e); showToast("Erro ao apagar cupão."); }
  }

  async function changeStatus(pedidoId, novoStatus){
    try {
      await updateDoc(doc(db,"pedidos",pedidoId), { status: novoStatus, clienteViu: false });
      setPedidos(prev=>prev.map(p=>p.id===pedidoId?{...p,status:novoStatus,clienteViu:false}:p));
      showToast("Status actualizado!");
    } catch(e){ console.error(e); showToast("Erro ao actualizar status."); }
  }

  async function seedProducts(){
    setSeeding(true);
    try {
      for(const p of PRODUCTS){ await setDoc(doc(db,"produtos",String(p.id)), p); }
      showToast("Produtos importados para o Firestore! 🎉");
      await refreshProducts();
    } catch(e){ console.error(e); showToast("Erro ao importar produtos."); }
    finally { setSeeding(false); }
  }

  async function saveProduct(produto){
    try {
      const docId = produto.docId || String(produto.id);
      const { docId:_, ...data } = produto;
      await setDoc(doc(db,"produtos",docId), data);
      showToast("Produto guardado!");
      setEditing(null);
      await refreshProducts();
    } catch(e){
      console.error("ERRO ao guardar produto:", e.code, e.message);
      showToast(`Erro: ${e.code||e.message}`);
    }
  }

  async function deleteProduct(docId){
    if(!window.confirm("Apagar este produto definitivamente?")) return;
    try {
      await deleteDoc(doc(db,"produtos",docId));
      showToast("Produto apagado.");
      await refreshProducts();
    } catch(e){ console.error(e); showToast("Erro ao apagar produto."); }
  }

  if(!user) return <PageWrap><BackBtn onClick={goBack}/><p style={{color:"#888"}}>Precisas de fazer login primeiro.</p></PageWrap>;
  if(!isStaff) return <PageWrap><BackBtn onClick={goBack}/><p style={{color:"#888"}}>Não tens permissão para aceder a esta página.</p></PageWrap>;

  const TABS = isSuperAdmin
    ? [["pedidos","📦 Pedidos"],["produtos","🏷️ Produtos"],["cupoes","🎁 Cupões"],["mensagens","✉️ Mensagens"],["usuarios","👥 Utilizadores"],["seed","⚡ Configuração"]]
    : [["pedidos","📦 Pedidos"]]; // trabalhador só gere pedidos

  const naoLidas = mensagens.filter(m=>!m.lida).length;

  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <SectionTitle eyebrow={isSuperAdmin?"Admin Principal":"Painel de Trabalho"} title="Administração ZURA"/>

      <div style={{ display:"flex", gap:4, marginBottom:28, background:"#1e1e1e", borderRadius:4, padding:4, flexWrap:"wrap" }}>
        {TABS.map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, minWidth:100, padding:"10px", border:"none", background:tab===t?A:"transparent", color:tab===t?"#000":"#888", borderRadius:2, cursor:"pointer", fontSize:"0.8rem", fontWeight:tab===t?700:400, letterSpacing:1, textTransform:"uppercase", position:"relative" }}>
            {l}{t==="mensagens"&&naoLidas>0 && <span style={{ position:"absolute", top:2, right:6, background:"#c84e4e", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:"0.6rem", display:"flex", alignItems:"center", justifyContent:"center" }}>{naoLidas}</span>}
          </button>
        ))}
      </div>

      {/* PEDIDOS TAB */}
      {tab==="pedidos" && (
        <div>
          {loadingPedidos ? <p style={{color:"#888"}}>A carregar pedidos...</p> :
           pedidos.length===0 ? <p style={{color:"#888"}}>Nenhum pedido ainda.</p> :
           pedidos.map(p=>(
            <div key={p.id} style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:18, marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontSize:"0.68rem", color:"#888", letterSpacing:1, textTransform:"uppercase" }}>Pedido #{p.id.slice(-6).toUpperCase()}</div>
                  <div style={{ fontSize:"0.8rem", color:"#666" }}>{p.criadoEm?.toDate?.()?.toLocaleString("pt-MZ")||"—"}</div>
                </div>
                <select value={p.status||"pendente"} onChange={e=>changeStatus(p.id,e.target.value)}
                  style={{ background:STATUS_COLOR[p.status]||"#888", color:"#000", border:"none", borderRadius:2, padding:"4px 10px", fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", cursor:"pointer" }}>
                  {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:10 }}>
                <div style={{ width:48, height:48, borderRadius:4, background:p.imageUrl?"#000":(p.grad?`linear-gradient(135deg,${p.grad[0]},${p.grad[1]})`:"#2a2a2a"), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", flexShrink:0, overflow:"hidden" }}>{p.imageUrl ? <img src={p.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : (p.emoji||"🛍️")}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"0.9rem" }}>{p.produto} <span style={{color:"#888"}}>x{p.quantidade}</span></div>
                  <div style={{ color:A, fontWeight:700, fontSize:"0.88rem" }}>{p.total?.toLocaleString()} MT</div>
                </div>
              </div>
              <div style={{ borderTop:"1px solid #2a2a2a", paddingTop:10, fontSize:"0.8rem", color:"#aaa", display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                <div>👤 {p.nome}</div>
                <div>📞 {p.telefone}</div>
                <div>📍 {p.cidade}, {p.provincia}</div>
                <div>💳 {p.pagamento}</div>
                {p.userEmail && <div style={{gridColumn:"1 / -1", color:"#666"}}>✉️ {p.userEmail}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRODUTOS TAB — só super admin */}
      {tab==="produtos" && isSuperAdmin && (
        <div>
          <div style={{ marginBottom:20 }}>
            <Btn onClick={()=>setEditing({ id: Math.max(0,...products.map(p=>p.id||0))+1, name:"", category:"mulher", price:0, badge:null, emoji:"🛍️", grad:["#1a1a1a","#2a2a2a"] })}>+ Novo Produto</Btn>
          </div>
          {editing && <ProductEditor produto={editing} onSave={saveProduct} onCancel={()=>setEditing(null)} />}
          {products.map(p=>(
            <div key={p.docId||p.id} style={{ display:"flex", alignItems:"center", gap:14, background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:14, marginBottom:10 }}>
              <div style={{ width:48, height:48, borderRadius:4, background:`linear-gradient(135deg,${p.grad?.[0]||"#1a1a1a"},${p.grad?.[1]||"#2a2a2a"})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", flexShrink:0 }}>{p.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"0.9rem" }}>{p.name}</div>
                <div style={{ color:"#888", fontSize:"0.78rem" }}>{p.category} · {p.price?.toLocaleString()} MT {p.badge?`· ${p.badge}`:""}</div>
              </div>
              <button onClick={()=>setEditing(p)} style={{ background:"transparent", border:"1px solid #3a3a3a", color:"#f0ece4", padding:"6px 14px", borderRadius:2, cursor:"pointer", fontSize:"0.75rem" }}>Editar</button>
              {p.docId && <button onClick={()=>deleteProduct(p.docId)} style={{ background:"transparent", border:"1px solid #c84e4e", color:"#c84e4e", padding:"6px 14px", borderRadius:2, cursor:"pointer", fontSize:"0.75rem" }}>Apagar</button>}
            </div>
          ))}
        </div>
      )}

      {/* CUPÕES TAB — só super admin */}
      {tab==="cupoes" && isSuperAdmin && (
        <div>
          <div style={{ marginBottom:20 }}>
            <Btn onClick={()=>setEditingCupom({ codigo:"", desconto:10, tipo:"percentagem", ativo:true })}>+ Novo Cupão</Btn>
          </div>
          {editingCupom && <CupomEditor cupom={editingCupom} onSave={saveCupom} onCancel={()=>setEditingCupom(null)} />}
          {loadingCupoes ? <p style={{color:"#888"}}>A carregar cupões...</p> :
           cupoes.length===0 ? <p style={{color:"#888"}}>Nenhum cupão criado ainda.</p> :
           cupoes.map(c=>(
            <div key={c.id} style={{ display:"flex", alignItems:"center", gap:14, background:"#1a1a1a", border:`1px solid ${c.ativo?"#2a2a2a":"#c84e4e"}`, borderRadius:4, padding:14, marginBottom:10, flexWrap:"wrap", opacity:c.ativo?1:0.6 }}>
              <div style={{ width:48, height:48, borderRadius:4, background:"rgba(200,169,110,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", flexShrink:0 }}>🎁</div>
              <div style={{ flex:1, minWidth:140 }}>
                <div style={{ fontSize:"0.92rem", fontWeight:700, letterSpacing:1 }}>{c.codigo}</div>
                <div style={{ color:"#888", fontSize:"0.78rem" }}>{c.tipo==="percentagem" ? `${c.desconto}% de desconto` : `${c.desconto} MT de desconto`} {!c.ativo&&"· Inactivo"}</div>
              </div>
              <button onClick={()=>toggleCupomAtivo(c.id,c.ativo)} style={{ background:"transparent", border:`1px solid ${c.ativo?"#c84e4e":"#4caf7d"}`, color:c.ativo?"#c84e4e":"#4caf7d", padding:"6px 14px", borderRadius:2, cursor:"pointer", fontSize:"0.72rem" }}>{c.ativo?"Desactivar":"Activar"}</button>
              <button onClick={()=>setEditingCupom(c)} style={{ background:"transparent", border:"1px solid #3a3a3a", color:"#f0ece4", padding:"6px 14px", borderRadius:2, cursor:"pointer", fontSize:"0.75rem" }}>Editar</button>
              <button onClick={()=>deleteCupom(c.id)} style={{ background:"transparent", border:"1px solid #c84e4e", color:"#c84e4e", padding:"6px 14px", borderRadius:2, cursor:"pointer", fontSize:"0.75rem" }}>Apagar</button>
            </div>
          ))}
        </div>
      )}

      {/* MENSAGENS TAB — só super admin */}
      {tab==="mensagens" && isSuperAdmin && (
        <div>
          {loadingMsgs ? <p style={{color:"#888"}}>A carregar mensagens...</p> :
           mensagens.length===0 ? <p style={{color:"#888"}}>Nenhuma mensagem ainda.</p> :
           mensagens.map(m=>(
            <MensagemCard key={m.id} msg={m} marcarLida={marcarLida} responderMensagem={responderMensagem}/>
          ))}
        </div>
      )}

      {/* UTILIZADORES TAB — só super admin */}
      {tab==="usuarios" && isSuperAdmin && (
        <div>
          <p style={{ color:"#888", fontSize:"0.85rem", lineHeight:1.8, marginBottom:24 }}>
            Promove clientes a <strong style={{color:"#4e7cc8"}}>Trabalhador</strong> para que possam gerir o status de pedidos. Só tu (admin principal) podes editar produtos e ver mensagens.
          </p>
          {loadingUsers ? <p style={{color:"#888"}}>A carregar utilizadores...</p> :
           usuarios.length===0 ? <p style={{color:"#888"}}>Nenhum utilizador encontrado.</p> :
           usuarios.map(u=>(
            <div key={u.uid} style={{ display:"flex", alignItems:"center", gap:14, background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:14, marginBottom:10, flexWrap:"wrap" }}>
              <div style={{ width:40, height:40, borderRadius:"50%", background:`linear-gradient(135deg,#2a1f0e,${A})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", fontWeight:700, color:"#000", flexShrink:0 }}>
                {(u.nome||u.email||"?")[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:140 }}>
                <div style={{ fontSize:"0.88rem" }}>{u.nome||"Sem nome"}</div>
                <div style={{ color:"#888", fontSize:"0.78rem" }}>{u.email}</div>
              </div>
              {u.email===SUPER_ADMIN_EMAIL ? (
                <span style={{ background:"#4e7cc8", color:"#fff", padding:"5px 12px", borderRadius:2, fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase" }}>Admin Principal</span>
              ) : (
                <select value={u.role||"cliente"} onChange={e=>changeRole(u.uid,u.email,e.target.value)}
                  style={{ background:u.role==="trabalhador"?"#4e7cc8":"#2a2a2a", color:u.role==="trabalhador"?"#fff":"#aaa", border:"none", borderRadius:2, padding:"6px 12px", fontSize:"0.75rem", fontWeight:700, textTransform:"uppercase", cursor:"pointer" }}>
                  <option value="cliente">Cliente</option>
                  <option value="trabalhador">Trabalhador</option>
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SEED TAB — só super admin */}
      {tab==="seed" && isSuperAdmin && (
        <div>
          <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:24, marginBottom:16 }}>
            <h3 style={{ fontFamily:"Georgia,serif", fontSize:"1.2rem", marginBottom:10 }}>Importar Produtos Iniciais</h3>
            <p style={{ color:"#888", fontSize:"0.85rem", lineHeight:1.8, marginBottom:16 }}>
              Copia os 12 produtos originais (código) para o Firestore, tornando-os editáveis. Só precisas de fazer isto <strong style={{color:"#f0ece4"}}>uma vez</strong>.
            </p>
            <Btn disabled={seeding} onClick={seedProducts}>{seeding?"A importar...":"Importar Produtos"}</Btn>
          </div>
          <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:24 }}>
            <h3 style={{ fontFamily:"Georgia,serif", fontSize:"1.2rem", marginBottom:10 }}>Estado Actual</h3>
            <p style={{ color:"#888", fontSize:"0.85rem" }}>
              A loja está actualmente a mostrar <strong style={{color:A}}>{products.length}</strong> produtos
              {products[0]?.docId ? <> — vindos do <strong style={{color:"#7ed9af"}}>Firestore</strong> ✓</> : <> — vindos do <strong style={{color:"#c8a96e"}}>código local</strong> (ainda não importados)</>}.
            </p>
          </div>
        </div>
      )}
    </PageWrap>
  );
}

// ─── PRODUCT EDITOR (admin) ─────────────────────────────────────────────────────
// ─── CUPOM EDITOR (admin) ───────────────────────────────────────────────────────
// ─── MENSAGEM CARD (admin reply) ───────────────────────────────────────────────
function MensagemCard({ msg:m, marcarLida, responderMensagem }) {
  const [respostaTexto, setRespostaTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [editandoResposta, setEditandoResposta] = useState(false);

  async function enviar(){
    setEnviando(true);
    await responderMensagem(m.id, respostaTexto);
    setEnviando(false);
    setEditandoResposta(false);
    setRespostaTexto("");
  }

  return (
    <div style={{ background:"#1a1a1a", border:`1px solid ${m.lida?"#2a2a2a":A}`, borderRadius:4, padding:18, marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:6 }}>
        <div>
          <div style={{ fontSize:"0.95rem", fontWeight:m.lida?400:700 }}>{m.nome} {!m.lida && <span style={{color:A,fontSize:"0.68rem"}}>● NOVA</span>}</div>
          <div style={{ color:"#888", fontSize:"0.8rem" }}>{m.email} {m.telefone&&`· ${m.telefone}`}</div>
        </div>
        <div style={{ color:"#666", fontSize:"0.75rem" }}>{m.criadoEm?.toDate?.()?.toLocaleString("pt-MZ")||"—"}</div>
      </div>
      <p style={{ color:"#ccc", fontSize:"0.88rem", lineHeight:1.7, marginBottom:14 }}>{m.mensagem}</p>

      {m.respondida && !editandoResposta ? (
        <div style={{ background:"rgba(76,175,125,0.06)", border:"1px solid rgba(76,175,125,0.25)", borderRadius:4, padding:14, marginBottom:10 }}>
          <div style={{ color:"#7ed9af", fontSize:"0.7rem", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>A tua resposta</div>
          <p style={{ color:"#ccc", fontSize:"0.85rem", lineHeight:1.7, marginBottom:8 }}>{m.resposta}</p>
          <span onClick={()=>{ setEditandoResposta(true); setRespostaTexto(m.resposta||""); }} style={{ color:"#888", fontSize:"0.75rem", cursor:"pointer", textDecoration:"underline" }}>Editar resposta</span>
        </div>
      ) : (
        <div style={{ marginBottom:10 }}>
          <textarea value={respostaTexto} onChange={e=>setRespostaTexto(e.target.value)} rows={2} placeholder="Escreve uma resposta para o cliente..."
            style={{ width:"100%", background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#f0ece4", padding:"10px 12px", borderRadius:2, fontSize:"0.85rem", outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit", marginBottom:8 }}/>
          <div style={{ display:"flex", gap:8 }}>
            <button disabled={enviando} onClick={enviar} style={{ background:A, color:"#000", border:"none", padding:"7px 16px", borderRadius:2, cursor:"pointer", fontSize:"0.75rem", fontWeight:700 }}>{enviando?"A enviar...":"Enviar Resposta"}</button>
            {editandoResposta && <button onClick={()=>setEditandoResposta(false)} style={{ background:"transparent", border:"1px solid #3a3a3a", color:"#888", padding:"7px 16px", borderRadius:2, cursor:"pointer", fontSize:"0.75rem" }}>Cancelar</button>}
          </div>
        </div>
      )}

      {!m.lida && !m.respondida && <button onClick={()=>marcarLida(m.id)} style={{ background:"transparent", border:"1px solid #4caf7d", color:"#4caf7d", padding:"6px 14px", borderRadius:2, cursor:"pointer", fontSize:"0.75rem" }}>Marcar como lida (sem responder)</button>}
    </div>
  );
}

function CupomEditor({ cupom, onSave, onCancel }) {
  const [form, setForm] = useState({ ...cupom });
  function update(field, value){ setForm(f=>({...f, [field]:value})); }

  return (
    <div style={{ background:"#1a1a1a", border:`1px solid ${A}`, borderRadius:4, padding:24, marginBottom:24 }}>
      <h3 style={{ fontFamily:"Georgia,serif", fontSize:"1.2rem", marginBottom:18 }}>{cupom.id?"Editar Cupão":"Novo Cupão"}</h3>

      <FieldInput label="Código" placeholder="Ex: ZURA10" value={form.codigo} onChange={e=>update("codigo",e.target.value.toUpperCase())} required/>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:"0.72rem", letterSpacing:1, textTransform:"uppercase", color:"#888", display:"block", marginBottom:6 }}>Tipo de desconto</label>
          <select value={form.tipo} onChange={e=>update("tipo",e.target.value)}
            style={{ width:"100%", background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#f0ece4", padding:"11px 14px", borderRadius:2, fontSize:"0.88rem", outline:"none", boxSizing:"border-box" }}>
            <option value="percentagem">Percentagem (%)</option>
            <option value="fixo">Valor Fixo (MT)</option>
          </select>
        </div>
        <FieldInput label={form.tipo==="percentagem"?"Desconto (%)":"Desconto (MT)"} placeholder="10" value={form.desconto} onChange={e=>update("desconto",e.target.value)} type="number" required/>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <input type="checkbox" checked={form.ativo!==false} onChange={e=>update("ativo",e.target.checked)} style={{ width:18, height:18, cursor:"pointer" }}/>
        <label style={{ fontSize:"0.85rem", color:"#aaa" }}>Cupão activo</label>
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <GhostBtn onClick={onCancel}>Cancelar</GhostBtn>
        <Btn style={{ flex:1 }} onClick={()=>onSave(form)}>Guardar</Btn>
      </div>
    </div>
  );
}

// ─── PRODUCT EDITOR (admin) ─────────────────────────────────────────────────────
function ProductEditor({ produto, onSave, onCancel }) {
  const [form, setForm] = useState({
    ...produto,
    grad0: produto.grad?.[0] || "#1a1a1a",
    grad1: produto.grad?.[1] || "#2a2a2a",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function update(field, value){ setForm(f=>({...f, [field]:value})); }

  async function handleImageUpload(e){
    const file = e.target.files?.[0];
    if(!file) return;
    if(!file.type.startsWith("image/")){ setUploadError("Selecciona um ficheiro de imagem válido."); return; }
    if(file.size > 5*1024*1024){ setUploadError("Imagem demasiado grande (máx. 5MB)."); return; }
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "zura_unsigned");
      formData.append("folder", "produtos");

      const res = await fetch(`https://api.cloudinary.com/v1_1/dztfjib6h/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error?.message || "Erro no upload");

      update("imageUrl", data.secure_url);
      update("imagePublicId", data.public_id);
    } catch(e){
      console.error(e);
      setUploadError("Erro ao enviar imagem: "+e.message);
    } finally { setUploading(false); }
  }

  function removeImage(){
    // Nota: a imagem antiga fica no Cloudinary (apagar requer API assinada no backend).
    // Aqui só removemos a referência do produto.
    update("imageUrl", null);
    update("imagePublicId", null);
  }

  function handleSave(){
    if(!form.name || !form.price){ alert("Nome e preço são obrigatórios."); return; }
    const { grad0, grad1, docId, ...rest } = form;
    const cleaned = { ...rest, id:Number(form.id), price:Number(form.price), grad:[grad0,grad1] };
    if(form.oldPrice){ cleaned.oldPrice = Number(form.oldPrice); }
    else { delete cleaned.oldPrice; }
    if(!cleaned.badge) cleaned.badge = null;
    if(!cleaned.imageUrl){ delete cleaned.imageUrl; delete cleaned.imagePublicId; }
    onSave({ ...cleaned, docId });
  }

  return (
    <div style={{ background:"#1a1a1a", border:`1px solid ${A}`, borderRadius:4, padding:24, marginBottom:24 }}>
      <h3 style={{ fontFamily:"Georgia,serif", fontSize:"1.2rem", marginBottom:18 }}>{produto.docId?"Editar Produto":"Novo Produto"}</h3>

      <FieldInput label="Nome" placeholder="Ex: Vestido Capulana" value={form.name} onChange={e=>update("name",e.target.value)} required/>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:"0.72rem", letterSpacing:1, textTransform:"uppercase", color:"#888", display:"block", marginBottom:6 }}>Categoria</label>
          <select value={form.category} onChange={e=>update("category",e.target.value)}
            style={{ width:"100%", background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#f0ece4", padding:"11px 14px", borderRadius:2, fontSize:"0.88rem", outline:"none", boxSizing:"border-box" }}>
            {["mulher","homem","acessorios"].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:"0.72rem", letterSpacing:1, textTransform:"uppercase", color:"#888", display:"block", marginBottom:6 }}>Badge</label>
          <select value={form.badge||""} onChange={e=>update("badge",e.target.value||null)}
            style={{ width:"100%", background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#f0ece4", padding:"11px 14px", borderRadius:2, fontSize:"0.88rem", outline:"none", boxSizing:"border-box" }}>
            <option value="">Nenhum</option>
            <option value="new">Novo</option>
            <option value="sale">Vendidos</option>
            <option value="hot">Mais Vendido</option>
          </select>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <FieldInput label="Preço (MT)" placeholder="2850" value={form.price} onChange={e=>update("price",e.target.value)} type="number" required/>
        <FieldInput label="Preço Antigo (opcional)" placeholder="3500" value={form.oldPrice||""} onChange={e=>update("oldPrice",e.target.value)} type="number"/>
      </div>

      <FieldInput label="Emoji (usado se não houver foto)" placeholder="👗" value={form.emoji} onChange={e=>update("emoji",e.target.value)}/>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:8 }}>
        <div>
          <label style={{ fontSize:"0.72rem", letterSpacing:1, textTransform:"uppercase", color:"#888", display:"block", marginBottom:6 }}>Cor 1 (fundo)</label>
          <input type="color" value={form.grad0} onChange={e=>update("grad0",e.target.value)} style={{ width:"100%", height:40, border:"1px solid #2a2a2a", borderRadius:2, background:"#1e1e1e", cursor:"pointer" }}/>
        </div>
        <div>
          <label style={{ fontSize:"0.72rem", letterSpacing:1, textTransform:"uppercase", color:"#888", display:"block", marginBottom:6 }}>Cor 2 (fundo)</label>
          <input type="color" value={form.grad1} onChange={e=>update("grad1",e.target.value)} style={{ width:"100%", height:40, border:"1px solid #2a2a2a", borderRadius:2, background:"#1e1e1e", cursor:"pointer" }}/>
        </div>
      </div>

      {/* IMAGE UPLOAD */}
      <div style={{ marginBottom:18 }}>
        <label style={{ fontSize:"0.72rem", letterSpacing:1, textTransform:"uppercase", color:"#888", display:"block", marginBottom:8 }}>Foto do Produto</label>
        <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
          <div style={{ width:90, height:90, borderRadius:4, background:form.imageUrl?"#000":`linear-gradient(135deg,${form.grad0},${form.grad1})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.2rem", flexShrink:0, overflow:"hidden" }}>
            {form.imageUrl ? <img src={form.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : form.emoji}
          </div>
          <div style={{ flex:1 }}>
            <label style={{ display:"inline-block", background:"transparent", border:`1px solid ${A}`, color:A, padding:"8px 16px", borderRadius:2, cursor:"pointer", fontSize:"0.78rem", fontWeight:600 }}>
              {uploading ? "A enviar..." : form.imageUrl ? "Trocar Foto" : "Carregar Foto"}
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display:"none" }}/>
            </label>
            {form.imageUrl && (
              <button onClick={removeImage} style={{ marginLeft:8, background:"transparent", border:"1px solid #c84e4e", color:"#c84e4e", padding:"8px 14px", borderRadius:2, cursor:"pointer", fontSize:"0.78rem" }}>
                Remover
              </button>
            )}
            {uploadError && <div style={{ color:"#e88", fontSize:"0.78rem", marginTop:8 }}>{uploadError}</div>}
            <div style={{ color:"#666", fontSize:"0.72rem", marginTop:8 }}>JPG ou PNG, máx. 5MB. Sem foto, mostra o emoji sobre o fundo colorido.</div>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <GhostBtn onClick={onCancel}>Cancelar</GhostBtn>
        <Btn disabled={uploading} style={{ flex:1 }} onClick={handleSave}>Guardar</Btn>
      </div>
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
  const [sucesso, setSucesso] = useState("");

  async function handleLogin() {
    setErro(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      showToast("Bem-vindo de volta! 👋"); goPage("home");
    } catch(e) {
      setErro(e.code==="auth/invalid-credential"?"Email ou senha incorrectos.":"Erro ao entrar. Tenta novamente.");
    } finally { setLoading(false); }
  }

  async function handleForgotPassword() {
    setErro(""); setSucesso("");
    if(!email) { setErro("Insere o teu email no campo acima e clica novamente em 'Esqueceste a senha?'."); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSucesso(`Email enviado para ${email}. Verifica a tua caixa de entrada (e a pasta SPAM) e segue o link para definir uma nova senha.`);
    } catch(e) {
      console.error("Erro reset senha:", e.code, e.message);
      if(e.code==="auth/user-not-found") setErro("Não existe conta com este email.");
      else if(e.code==="auth/invalid-email") setErro("Email inválido.");
      else if(e.code==="auth/too-many-requests") setErro("Muitas tentativas. Aguarda alguns minutos.");
      else setErro("Erro: "+e.code);
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
      const role = email==="kitohoracio@gmail.com" ? "admin" : "cliente";
      await setDoc(doc(db,"users",cred.user.uid), { nome, email, role, criadoEm: serverTimestamp() });
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
            <button key={m} onClick={()=>{setMode(m);setErro("");setSucesso("");}} style={{ flex:1, padding:"10px", border:"none", background:mode===m?A:"transparent", color:mode===m?"#000":"#888", borderRadius:2, cursor:"pointer", fontSize:"0.82rem", fontWeight:mode===m?700:400, letterSpacing:1, textTransform:"uppercase", transition:"all 0.2s" }}>{l}</button>
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

          {sucesso && <div style={{ background:"rgba(76,175,125,0.1)", border:"1px solid rgba(76,175,125,0.3)", borderRadius:2, padding:"10px 14px", marginBottom:16, fontSize:"0.82rem", color:"#7ed9af", lineHeight:1.6 }}>✓ {sucesso}</div>}

          {mode==="login" && (
            <div style={{ textAlign:"right", marginBottom:16, marginTop:-8 }}>
              <span onClick={handleForgotPassword} style={{ color:"#888", fontSize:"0.8rem", cursor:"pointer", textDecoration:"underline" }}>
                Esqueceste a senha?
              </span>
            </div>
          )}

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

// ─── CONTA PAGE ───────────────────────────────────────────────────────────────
function ContaPage({ user, isStaff, userRole, goBack, showToast, goPage }) {
  const [pedidos,    setPedidos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("pedidos");
  const [minhasMensagens, setMinhasMensagens] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviandoMsg, setEnviandoMsg] = useState(false);

  useEffect(()=>{
    if(!user) return;
    fetchPedidos();
    fetchMinhasMensagens();
  },[user]);

  async function fetchMinhasMensagens(){
    setLoadingMsgs(true);
    try {
      const q = query(collection(db,"mensagens"), where("userId","==",user.uid));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d=>({id:d.id,...d.data()}));
      docs.sort((a,b)=>(b.criadoEm?.seconds||0)-(a.criadoEm?.seconds||0));
      setMinhasMensagens(docs);
    } catch(e){ console.log(e); }
    finally { setLoadingMsgs(false); }
  }

  async function enviarNovaMensagem(){
    if(!novaMensagem.trim()){ showToast("Escreve a tua mensagem antes de enviar."); return; }
    setEnviandoMsg(true);
    try {
      await addDoc(collection(db,"mensagens"), {
        userId: user.uid,
        nome: user.displayName || user.email.split("@")[0],
        email: user.email,
        telefone: "",
        mensagem: novaMensagem.trim(),
        lida: false, respondida: false, resposta: null, criadoEm: serverTimestamp(),
      });
      showToast("Mensagem enviada! Responderemos em breve 📩");
      setNovaMensagem("");
      await fetchMinhasMensagens();
    } catch(e){
      console.error(e);
      showToast("Erro ao enviar mensagem. Tenta novamente.");
    } finally { setEnviandoMsg(false); }
  }

  async function apagarMensagem(msgId){
    if(!window.confirm("Apagar esta mensagem definitivamente?")) return;
    try {
      await deleteDoc(doc(db,"mensagens",msgId));
      setMinhasMensagens(prev=>prev.filter(m=>m.id!==msgId));
      showToast("Mensagem apagada.");
    } catch(e){
      console.error(e);
      showToast("Erro ao apagar mensagem.");
    }
  }

  async function fetchPedidos(){
    setLoading(true);
    try {
      const q = query(collection(db,"pedidos"), where("userId","==",user.uid));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d=>({id:d.id,...d.data()}));
      docs.sort((a,b)=> (b.criadoEm?.seconds||0) - (a.criadoEm?.seconds||0));
      setPedidos(docs);
      // marca como vistas as atualizações de status (remove notificação)
      const naoVistos = docs.filter(p => p.status && p.status!=="pendente" && !p.clienteViu);
      naoVistos.forEach(p => updateDoc(doc(db,"pedidos",p.id), { clienteViu:true }).catch(()=>{}));
    } catch(e){ console.log(e); }
    finally { setLoading(false); }
  }

  async function cancelarPedido(pedidoId){
    if(!window.confirm("Tens a certeza que queres cancelar este pedido?")) return;
    try {
      await updateDoc(doc(db,"pedidos",pedidoId), { status:"cancelado" });
      setPedidos(prev => prev.map(p => p.id===pedidoId ? {...p, status:"cancelado"} : p));
      showToast("Pedido cancelado.");
    } catch(e){
      console.error(e);
      showToast("Erro ao cancelar pedido. Tenta novamente.");
    }
  }

  if(!user) return <PageWrap><BackBtn onClick={goBack}/><p style={{color:"#888"}}>Precisas de fazer login primeiro.</p></PageWrap>;

  const STATUS_COLOR = { pendente:"#c8a96e", processando:"#4e7cc8", enviado:"#4caf7d", entregue:"#4caf7d", cancelado:"#c84e4e" };
  const STATUS_LABEL = { pendente:"Pendente", processando:"Processando", enviado:"Enviado", entregue:"Entregue", cancelado:"Cancelado" };

  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      {/* PERFIL HEADER */}
      <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:36, padding:24, background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, flexWrap:"wrap" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg,#2a1f0e,${A})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.6rem", fontWeight:700, color:"#000", flexShrink:0 }}>
          {(user.displayName||user.email)[0].toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:"1.3rem", marginBottom:4 }}>{user.displayName||"Utilizador"}</div>
          <div style={{ color:"#888", fontSize:"0.85rem" }}>{user.email}</div>
        </div>
        {isStaff && (
          <button onClick={()=>goPage("admin")} style={{ background:"#4e7cc8", color:"#fff", border:"none", padding:"10px 18px", borderRadius:2, cursor:"pointer", fontSize:"0.78rem", fontWeight:700, letterSpacing:1, textTransform:"uppercase", display:"flex", alignItems:"center", gap:6 }}>
            ⚙️ Painel {userRole==="admin"?"Admin":"Trabalhador"}
          </button>
        )}
      </div>

      {/* TABS */}
      <div style={{ display:"flex", gap:4, marginBottom:28, background:"#1e1e1e", borderRadius:4, padding:4 }}>
        {[["pedidos","📦 Pedidos"],["mensagens","✉️ Mensagens"],["perfil","👤 Perfil"]].map(([t,l])=>(
          <button key={t} onClick={()=>setActiveTab(t)} style={{ flex:1, padding:"10px", border:"none", background:activeTab===t?A:"transparent", color:activeTab===t?"#000":"#888", borderRadius:2, cursor:"pointer", fontSize:"0.82rem", fontWeight:activeTab===t?700:400, letterSpacing:1, textTransform:"uppercase", position:"relative" }}>
            {l}
            {t==="mensagens" && minhasMensagens.some(m=>m.respondida) && <span style={{ position:"absolute", top:2, right:6, width:7, height:7, borderRadius:"50%", background:"#c84e4e" }}/>}
          </button>
        ))}
      </div>

      {/* PEDIDOS TAB */}
      {activeTab==="pedidos" && (
        <div>
          <SectionTitle eyebrow="Histórico" title="Os teus Pedidos"/>
          {loading ? (
            <p style={{ color:"#888" }}>A carregar pedidos...</p>
          ) : pedidos.length===0 ? (
            <div style={{ textAlign:"center", padding:"48px 0", color:"#888" }}>
              <div style={{ fontSize:"3rem", marginBottom:16 }}>📦</div>
              <p style={{ marginBottom:20 }}>Ainda não fizeste nenhum pedido.</p>
              <Btn onClick={()=>goPage("catalog")}>Ver Produtos</Btn>
            </div>
          ) : pedidos.map(p=>(
            <div key={p.id} style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:20, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:"0.68rem", color:"#888", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Pedido #{p.id.slice(-6).toUpperCase()}</div>
                  <div style={{ fontSize:"0.82rem", color:"#666" }}>{p.criadoEm?.toDate?.()?.toLocaleDateString("pt-MZ")||"—"}</div>
                </div>
                <span style={{ background:STATUS_COLOR[p.status]||"#888", color:p.status==="cancelado"?"#fff":"#000", padding:"3px 10px", borderRadius:2, fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase" }}>{STATUS_LABEL[p.status]||"Pendente"}</span>
              </div>
              <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:12 }}>
                <div style={{ width:56, height:56, borderRadius:4, background:p.imageUrl?"#000":(p.grad?`linear-gradient(135deg,${p.grad[0]},${p.grad[1]})`:"#2a2a2a"), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", flexShrink:0, overflow:"hidden" }}>
                  {p.imageUrl ? <img src={p.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : (p.emoji||"🛍️")}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"0.92rem", marginBottom:4 }}>{p.produto}</div>
                  <div style={{ color:"#888", fontSize:"0.8rem" }}>Qtd: {p.quantidade||1} · {p.tamanho||"padrão"}</div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:"0.85rem", marginBottom: p.status==="pendente" ? 14 : 0 }}>
                <span style={{ color:"#888" }}>📍 {p.cidade}, {p.provincia}</span>
                <span style={{ color:A, fontWeight:700 }}>{p.total?.toLocaleString()} MT</span>
              </div>
              {p.status==="pendente" && (
                <button onClick={()=>cancelarPedido(p.id)} style={{ width:"100%", background:"transparent", border:"1px solid #c84e4e", color:"#c84e4e", padding:"9px", borderRadius:2, cursor:"pointer", fontSize:"0.76rem", letterSpacing:1, textTransform:"uppercase", fontWeight:600 }}>
                  Cancelar Pedido
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MENSAGENS TAB */}
      {activeTab==="mensagens" && (
        <div>
          <SectionTitle eyebrow="Suporte" title="As tuas Mensagens"/>

          {/* NOVA MENSAGEM */}
          <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:20, marginBottom:24 }}>
            <div style={{ fontSize:"0.78rem", letterSpacing:1, textTransform:"uppercase", color:"#888", marginBottom:12 }}>Escreve uma nova mensagem</div>
            <textarea value={novaMensagem} onChange={e=>setNovaMensagem(e.target.value)} rows={3} placeholder="Em que podemos ajudar-te?"
              style={{ width:"100%", background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#f0ece4", padding:"12px 14px", borderRadius:2, fontSize:"0.88rem", outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit", marginBottom:14 }}/>
            <Btn disabled={enviandoMsg} onClick={enviarNovaMensagem}>{enviandoMsg?"A enviar...":"Enviar Mensagem"}</Btn>
          </div>

          {loadingMsgs ? (
            <p style={{ color:"#888" }}>A carregar mensagens...</p>
          ) : minhasMensagens.length===0 ? (
            <div style={{ textAlign:"center", padding:"48px 0", color:"#888" }}>
              <div style={{ fontSize:"3rem", marginBottom:16 }}>✉️</div>
              <p>Ainda não enviaste nenhuma mensagem de contacto.</p>
            </div>
          ) : minhasMensagens.map(m=>(
            <div key={m.id} style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:20, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12, gap:12 }}>
                <div style={{ fontSize:"0.78rem", color:"#666" }}>{m.criadoEm?.toDate?.()?.toLocaleDateString("pt-MZ")||"—"}</div>
                <span style={{ background:m.respondida?"#4caf7d":"#c8a96e", color:"#000", padding:"3px 10px", borderRadius:2, fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase" }}>
                  {m.respondida?"Respondida":"Pendente"}
                </span>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:"0.68rem", letterSpacing:1, textTransform:"uppercase", color:"#888", marginBottom:6 }}>A tua mensagem</div>
                <p style={{ color:"#ccc", fontSize:"0.88rem", lineHeight:1.7 }}>{m.mensagem}</p>
              </div>
              {m.respondida && m.resposta && (
                <div style={{ background:"rgba(200,169,110,0.06)", border:"1px solid rgba(200,169,110,0.2)", borderRadius:4, padding:16, marginBottom:14 }}>
                  <div style={{ fontSize:"0.68rem", letterSpacing:1, textTransform:"uppercase", color:A, marginBottom:6 }}>Resposta da ZURA</div>
                  <p style={{ color:"#f0ece4", fontSize:"0.88rem", lineHeight:1.7 }}>{m.resposta}</p>
                </div>
              )}
              <button onClick={()=>apagarMensagem(m.id)} style={{ background:"transparent", border:"1px solid #c84e4e", color:"#c84e4e", padding:"7px 16px", borderRadius:2, cursor:"pointer", fontSize:"0.72rem", letterSpacing:1, textTransform:"uppercase" }}>
                Apagar Mensagem
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PERFIL TAB */}
      {activeTab==="perfil" && (
        <div style={{ maxWidth:480 }}>
          <SectionTitle eyebrow="Dados" title="O teu Perfil"/>
          <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:24 }}>
            {[["Nome",user.displayName||"—"],["Email",user.email],["Membro desde",user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("pt-MZ") : "—"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid #2a2a2a", fontSize:"0.88rem" }}>
                <span style={{ color:"#888" }}>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:20 }}>
            <button onClick={async()=>{ await signOut(auth); showToast("Sessão terminada!"); goPage("home"); }} style={{ background:"transparent", border:"1px solid #c84e4e", color:"#c84e4e", padding:"12px 24px", borderRadius:2, cursor:"pointer", fontSize:"0.82rem", letterSpacing:1, textTransform:"uppercase" }}>
              Terminar Sessão
            </button>
          </div>
        </div>
      )}
    </PageWrap>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ filtered, filter, setFilter, wishlist, toggleWish, addToCart, openProduct, goPage }) {
  const FILTER_MAP = { todos:"Todos", novidades:"Novidades", mulher:"Mulher", homem:"Homem", acessorios:"Acessórios", sale:"Vendidos" };
  return (
    <>
      <div style={{ minHeight:"85vh", display:"flex", alignItems:"center", padding:"0 5%", background:"radial-gradient(ellipse at 70% 50%,rgba(200,169,110,0.07) 0%,transparent 60%)" }}>
        <div style={{ maxWidth:560 }}>
          <div style={{ fontSize:"0.72rem", letterSpacing:3, textTransform:"uppercase", color:A, marginBottom:18 }}>Nova Colecção — Inverno 2026</div>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(2.4rem,5vw,4rem)", lineHeight:1.1, marginBottom:22 }}>
            Moda que <em style={{ color:A }}>conta</em><br/>a tua história
          </h1>
          <p style={{ color:"#888", fontSize:"1rem", lineHeight:1.8, marginBottom:36, maxWidth:400 }}>
            Peças únicas inspiradas na riqueza cultural de Moçambique. Do capulana ao urbano.
          </p>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            <Btn onClick={()=>goPage("catalog")}>Ver Colecção</Btn>
            <GhostBtn onClick={()=>goPage("sobre")}>Nossa História</GhostBtn>
          </div>
        </div>
      </div>

      <div style={{ borderTop:"1px solid #2a2a2a", borderBottom:"1px solid #2a2a2a", padding:"28px 5%", display:"flex", justifyContent:"center", gap:60, flexWrap:"wrap" }}>
        {[["2.4k+","Clientes"],["180+","Produtos"],["7","Províncias"],["98%","Satisfação"]].map(([n,l])=>(
          <div key={l} style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:"2rem", color:A }}>{n}</div>
            <div style={{ fontSize:"0.72rem", color:"#888", textTransform:"uppercase", letterSpacing:1 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ padding:"72px 5%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:40 }}>
          <div>
            <div style={{ fontSize:"0.68rem", letterSpacing:3, textTransform:"uppercase", color:A, marginBottom:8 }}>Destaques</div>
            <h2 style={{ fontFamily:"Georgia,serif", fontSize:"1.9rem", margin:0 }}>Mais Vendidos</h2>
          </div>
          <span onClick={()=>goPage("catalog")} style={{ color:"#888", fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:1, borderBottom:"1px solid #2a2a2a", paddingBottom:2, cursor:"pointer" }}>Ver tudo</span>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:36, flexWrap:"wrap" }}>
          {Object.entries(FILTER_MAP).map(([k,v])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{ padding:"8px 20px", border:`1px solid ${filter===k?A:"#2a2a2a"}`, background:filter===k?"rgba(200,169,110,0.08)":"transparent", color:filter===k?A:"#888", fontSize:"0.76rem", letterSpacing:1, textTransform:"uppercase", cursor:"pointer", borderRadius:2 }}>{v}</button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:22 }}>
          {filtered.slice(0,8).map(p=><ProductCard key={p.id} product={p} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} openProduct={openProduct}/>)}
        </div>
        <div style={{ textAlign:"center", marginTop:40 }}>
          <GhostBtn onClick={()=>goPage("catalog")}>Ver Todos os Produtos</GhostBtn>
        </div>
      </div>

      <div style={{ margin:"0 5% 72px", background:"linear-gradient(135deg,#1e1508,#2d2010)", border:"1px solid rgba(200,169,110,0.2)", borderRadius:4, padding:"48px 56px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-50%", right:"-5%", width:360, height:360, background:"radial-gradient(circle,rgba(200,169,110,0.1),transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:"0.68rem", letterSpacing:3, textTransform:"uppercase", color:A, marginBottom:10 }}>Oferta Limitada</div>
          <h3 style={{ fontFamily:"Georgia,serif", fontSize:"2rem", marginBottom:10 }}>Colecção de Verão em Promoção</h3>
          <p style={{ color:"#888", fontSize:"0.88rem" }}>Apenas até ao fim do mês.</p>
          <Btn style={{ marginTop:20 }} onClick={()=>{ setFilter("sale"); goPage("catalog"); }}>Aproveitar Agora</Btn>
        </div>
        <div style={{ textAlign:"right", position:"relative" }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:"5.5rem", color:A, lineHeight:1 }}>30%</div>
          <div style={{ fontSize:"0.78rem", letterSpacing:2, textTransform:"uppercase", color:"#888" }}>de desconto</div>
        </div>
      </div>

      <Footer goPage={goPage}/>
    </>
  );
}

// ─── CATALOG PAGE ─────────────────────────────────────────────────────────────
function CatalogPage({ filtered:allProducts, filter, setFilter, wishlist, toggleWish, addToCart, openProduct, goBack }) {
  const FILTER_MAP = { todos:"Todos", novidades:"Novidades", mulher:"Mulher", homem:"Homem", acessorios:"Acessórios", sale:"Vendidos" };
  const filtered = filter==="todos" ? allProducts
    : filter==="novidades" ? allProducts
    : filter==="sale" ? allProducts.filter(p=>p.badge==="sale")
    : allProducts.filter(p=>p.category===filter);
  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <SectionTitle eyebrow="Loja Completa" title="Todos os Produtos"/>
      <div style={{ display:"flex", gap:8, marginBottom:36, flexWrap:"wrap" }}>
        {Object.entries(FILTER_MAP).map(([k,v])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{ padding:"8px 20px", border:`1px solid ${filter===k?A:"#2a2a2a"}`, background:filter===k?"rgba(200,169,110,0.08)":"transparent", color:filter===k?A:"#888", fontSize:"0.76rem", letterSpacing:1, textTransform:"uppercase", cursor:"pointer", borderRadius:2 }}>{v}</button>
        ))}
      </div>
      <div style={{ color:"#888", fontSize:"0.82rem", marginBottom:24 }}>{filtered.length} produtos encontrados</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:22 }}>
        {filtered.map(p=><ProductCard key={p.id} product={p} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} openProduct={openProduct}/>)}
      </div>
    </PageWrap>
  );
}

// ─── SEARCH PAGE ──────────────────────────────────────────────────────────────
function SearchPage({ products, query, setQuery, wishlist, toggleWish, addToCart, openProduct, goBack }) {
  const q = (query||"").trim().toLowerCase();
  const results = q==="" ? [] : products.filter(p =>
    p.name?.toLowerCase().includes(q) ||
    p.category?.toLowerCase().includes(q)
  );

  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <SectionTitle eyebrow="Pesquisa" title={q ? `Resultados para "${query}"` : "Pesquisar produtos"}/>

      <div style={{ marginBottom:28 }}>
        <input autoFocus type="text" value={query} onChange={e=>setQuery(e.target.value)}
          placeholder="Pesquisar por nome ou categoria..."
          style={{ width:"100%", background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#f0ece4", padding:"14px 18px", borderRadius:2, fontSize:"0.95rem", outline:"none", boxSizing:"border-box" }}/>
      </div>

      {q==="" ? (
        <p style={{ color:"#888", fontSize:"0.88rem" }}>Escreve algo para pesquisar no catálogo da ZURA.</p>
      ) : results.length===0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"#888" }}>
          <div style={{ fontSize:"3rem", marginBottom:16 }}>🔍</div>
          <p>Nenhum produto encontrado para "{query}".</p>
        </div>
      ) : (
        <>
          <div style={{ color:"#888", fontSize:"0.82rem", marginBottom:24 }}>{results.length} produto{results.length!==1?"s":""} encontrado{results.length!==1?"s":""}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:22 }}>
            {results.map(p=><ProductCard key={p.id} product={p} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} openProduct={openProduct}/>)}
          </div>
        </>
      )}
    </PageWrap>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product:p, wishlist, toggleWish, addToCart, openProduct }) {
  const [hov,setHov]=useState(false);
  const b=p.badge?BADGE[p.badge]:null;
  return (
    <div onClick={()=>openProduct(p)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"#1e1e1e", border:`1px solid ${hov?"rgba(200,169,110,0.3)":"#2a2a2a"}`, borderRadius:4, overflow:"hidden", cursor:"pointer", transform:hov?"translateY(-4px)":"translateY(0)", transition:"all 0.2s" }}>
      <div style={{ height:240, background:p.imageUrl?"#000":`linear-gradient(135deg,${p.grad[0]},${p.grad[1]})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3.5rem", position:"relative", overflow:"hidden" }}>
        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : p.emoji}
        {b&&<span style={{ position:"absolute",top:12,left:12,background:b.bg,color:b.color,padding:"3px 10px",borderRadius:2,fontSize:"0.63rem",letterSpacing:1,textTransform:"uppercase",fontWeight:700 }}>{b.label}</span>}
        <button onClick={e=>{e.stopPropagation();toggleWish(p.id);}} style={{ position:"absolute",top:12,right:12,width:32,height:32,background:"rgba(0,0,0,0.55)",border:"none",borderRadius:"50%",cursor:"pointer",fontSize:"0.88rem",display:"flex",alignItems:"center",justifyContent:"center" }}>
          {wishlist.has(p.id)?"❤️":"🤍"}
        </button>
      </div>
      <div style={{ padding:"14px 16px 18px" }}>
        <div style={{ fontSize:"0.66rem",letterSpacing:2,textTransform:"uppercase",color:"#888",marginBottom:5 }}>{p.category}</div>
        <div style={{ fontFamily:"Georgia,serif",fontSize:"1rem",marginBottom:12,lineHeight:1.3 }}>{p.name}</div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <span style={{ fontSize:"1.05rem",fontWeight:600,color:A }}>{p.price.toLocaleString()} MT</span>
            {p.oldPrice&&<span style={{ fontSize:"0.78rem",color:"#666",textDecoration:"line-through",marginLeft:6 }}>{p.oldPrice.toLocaleString()} MT</span>}
          </div>
          <button onClick={e=>{e.stopPropagation();addToCart(p);}}
            style={{ width:36,height:36,background:"transparent",border:"1px solid #3a3a3a",color:"#f0ece4",borderRadius:2,cursor:"pointer",fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center" }}
            onMouseEnter={e=>{e.currentTarget.style.background=A;e.currentTarget.style.color="#000";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#f0ece4";}}>+</button>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT PAGE ─────────────────────────────────────────────────────────────
function ProductPage({ product:p, qty, setQty, wishlist, toggleWish, addToCart, goBack, openProduct, showToast, user, goPage, products }) {
  const [selSize,    setSelSize]    = useState("M");
  const [medidas,    setMedidas]    = useState({ peito:"", cintura:"", anca:"", altura:"" });
  const [usarMedidas,setUsarMedidas]= useState(false);
  const [encomenda,  setEncomenda]  = useState({ nome:"", telefone:"", provincia:"", cidade:"", bairro:"", referencia:"", pagamento:"mpesa" });
  const [step,       setStep]       = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [pedidoId,   setPedidoId]   = useState(null);

  if(!p) return null;
  const b = p.badge?BADGE[p.badge]:null;
  const related = (products||PRODUCTS).filter(x=>x.category===p.category&&x.id!==p.id).slice(0,4);
  const totalPedido = p.price * qty;
  const PROVINCIAS = ["Nampula","Maputo","Beira","Quelimane","Tete","Nacala","Lichinga","Pemba","Xai-Xai","Inhambane","Chimoio","Mocuba"];
  const PAGAMENTOS = [
    { id:"mpesa",   label:"M-Pesa",               icon:"📱" },
    { id:"emola",   label:"e-Mola",               icon:"💳" },
    { id:"banco",   label:"Transferência BCI",     icon:"🏦" },
    { id:"entrega", label:"Pagamento na Entrega",  icon:"💵" },
  ];

  async function confirmarPedido() {
    setSaving(true);
    try {
      const pedido = {
        userId:    user ? user.uid : "anonimo",
        userEmail: user ? user.email : "anonimo",
        produto:   p.name,
        emoji:     p.emoji,
        grad:      p.grad||null,
        imageUrl:  p.imageUrl||null,
        preco:     p.price,
        quantidade:qty,
        total:     totalPedido,
        tamanho:   usarMedidas ? "personalizado" : selSize,
        medidas:   usarMedidas ? medidas : null,
        nome:      encomenda.nome,
        telefone:  encomenda.telefone,
        provincia: encomenda.provincia,
        cidade:    encomenda.cidade,
        bairro:    encomenda.bairro,
        referencia:encomenda.referencia,
        pagamento: encomenda.pagamento,
        status:    "pendente",
        criadoEm:  serverTimestamp(),
      };
      const ref = await addDoc(collection(db,"pedidos"), pedido);
      setPedidoId(ref.id);
      showToast("Pedido guardado com sucesso! 🎉");
    } catch(e) {
      console.error(e);
      showToast("Erro ao guardar pedido. Tenta novamente.");
    } finally { setSaving(false); }
  }

  function StepBar() {
    const steps = ["Produto","Medidas","Entrega","Confirmação"];
    return (
      <div style={{ display:"flex", alignItems:"center", marginBottom:36 }}>
        {steps.map((s,i)=>(
          <div key={s} style={{ display:"flex", alignItems:"center", flex:i<steps.length-1?1:"auto" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{ width:32,height:32,borderRadius:"50%",background:step>i+1?"#4caf7d":step===i+1?A:"#2a2a2a",color:step>i+1||step===i+1?"#000":"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem",fontWeight:700 }}>
                {step>i+1?"✓":i+1}
              </div>
              <span style={{ fontSize:"0.62rem",color:step===i+1?A:"#666",textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap" }}>{s}</span>
            </div>
            {i<steps.length-1&&<div style={{ flex:1,height:1,background:step>i+1?"#4caf7d":"#2a2a2a",margin:"0 6px",marginBottom:20 }}/>}
          </div>
        ))}
      </div>
    );
  }

  // STEP 1
  if(step===1) return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <StepBar/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:50 }}>
        <div style={{ background:p.imageUrl?"#000":`linear-gradient(135deg,${p.grad[0]},${p.grad[1]})`, borderRadius:4, minHeight:420, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"8rem", position:"relative", overflow:"hidden" }}>
          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : p.emoji}
          {b&&<span style={{ position:"absolute",top:20,left:20,background:b.bg,color:b.color,padding:"4px 14px",borderRadius:2,fontSize:"0.7rem",letterSpacing:1,textTransform:"uppercase",fontWeight:700 }}>{b.label}</span>}
        </div>
        <div style={{ display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <div style={{ fontSize:"0.68rem",letterSpacing:3,textTransform:"uppercase",color:A,marginBottom:8 }}>{p.category}</div>
          <h1 style={{ fontFamily:"Georgia,serif",fontSize:"2rem",marginBottom:16,lineHeight:1.2 }}>{p.name}</h1>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
            <span style={{ fontSize:"1.6rem",fontWeight:700,color:A }}>{p.price.toLocaleString()} MT</span>
            {p.oldPrice&&<><span style={{ fontSize:"0.95rem",color:"#666",textDecoration:"line-through" }}>{p.oldPrice.toLocaleString()} MT</span>
            <span style={{ background:"#c84e4e",color:"#fff",padding:"2px 8px",borderRadius:2,fontSize:"0.68rem",fontWeight:700 }}>{Math.round((1-p.price/p.oldPrice)*100)}% OFF</span></>}
          </div>
          <p style={{ color:"#888",fontSize:"0.88rem",lineHeight:1.8,marginBottom:22 }}>Peça exclusiva da colecção ZURA, criada com materiais premium inspirados na herança cultural moçambicana.</p>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:"#888",marginBottom:10 }}>Tamanho</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {["XS","S","M","L","XL","XXL"].map(s=>(
                <button key={s} onClick={()=>setSelSize(s)} style={{ width:44,height:44,border:`1px solid ${selSize===s?A:"#3a3a3a"}`,background:selSize===s?"rgba(200,169,110,0.12)":"transparent",color:selSize===s?A:"#f0ece4",fontSize:"0.8rem",cursor:"pointer",borderRadius:2 }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:"#888",marginBottom:10 }}>Quantidade</div>
            <div style={{ display:"flex",alignItems:"center",border:"1px solid #3a3a3a",borderRadius:2,width:"fit-content" }}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:44,height:44,background:"none",border:"none",color:"#f0ece4",fontSize:"1.1rem",cursor:"pointer" }}>−</button>
              <span style={{ width:48,textAlign:"center",fontSize:"0.95rem",borderLeft:"1px solid #3a3a3a",borderRight:"1px solid #3a3a3a",lineHeight:"44px" }}>{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{ width:44,height:44,background:"none",border:"none",color:"#f0ece4",fontSize:"1.1rem",cursor:"pointer" }}>+</button>
            </div>
          </div>
          <div style={{ background:"#1e1e1e",border:"1px solid #2a2a2a",borderRadius:4,padding:"14px 18px",marginBottom:22,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ color:"#888",fontSize:"0.85rem" }}>Subtotal ({qty} {qty===1?"unidade":"unidades"})</span>
            <span style={{ color:A,fontFamily:"Georgia,serif",fontSize:"1.2rem",fontWeight:700 }}>{totalPedido.toLocaleString()} MT</span>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <Btn style={{ flex:1,padding:14 }} onClick={()=>{ if(!user){ showToast("Cria uma conta ou entra para poder comprar 🔒"); goPage("auth"); return; } setStep(2); }}>Encomendar →</Btn>
            <button onClick={()=>addToCart(p,qty)} style={{ width:48,height:48,background:"transparent",border:"1px solid #3a3a3a",borderRadius:2,cursor:"pointer",fontSize:"1.1rem" }} title="Adicionar ao carrinho">🛒</button>
            <button onClick={()=>toggleWish(p.id)} style={{ width:48,height:48,background:"transparent",border:"1px solid #3a3a3a",borderRadius:2,cursor:"pointer",fontSize:"1.2rem" }}>
              {wishlist.has(p.id)?"❤️":"🤍"}
            </button>
          </div>
        </div>
      </div>
      <ProductReviews productId={p.id} user={user} showToast={showToast} goPage={goPage}/>

      {related.length>0&&(
        <div style={{ marginTop:60 }}>
          <SectionTitle eyebrow="Também podes gostar" title="Produtos Relacionados"/>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:20 }}>
            {related.map(rp=>(
              <div key={rp.id} onClick={()=>openProduct(rp)} style={{ background:"#1e1e1e",border:"1px solid #2a2a2a",borderRadius:4,overflow:"hidden",cursor:"pointer" }}>
                <div style={{ height:180,background:rp.imageUrl?"#000":`linear-gradient(135deg,${rp.grad[0]},${rp.grad[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.8rem",overflow:"hidden" }}>{rp.imageUrl ? <img src={rp.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : rp.emoji}</div>
                <div style={{ padding:"12px 14px" }}>
                  <div style={{ fontFamily:"Georgia,serif",fontSize:"0.92rem",marginBottom:6 }}>{rp.name}</div>
                  <span style={{ color:A,fontSize:"0.88rem",fontWeight:600 }}>{rp.price.toLocaleString()} MT</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageWrap>
  );

  // STEP 2
  if(step===2) return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <StepBar/>
      <div style={{ maxWidth:600,margin:"0 auto" }}>
        <h2 style={{ fontFamily:"Georgia,serif",fontSize:"1.6rem",marginBottom:8 }}>Medidas Personalizadas</h2>
        <p style={{ color:"#888",fontSize:"0.88rem",lineHeight:1.8,marginBottom:28 }}>Fornece as tuas medidas ou avança com o tamanho <strong style={{color:A}}>{selSize}</strong>.</p>
        <div style={{ display:"flex",gap:10,marginBottom:28 }}>
          <button onClick={()=>setUsarMedidas(false)} style={{ flex:1,padding:"12px",border:`1px solid ${!usarMedidas?A:"#2a2a2a"}`,background:!usarMedidas?"rgba(200,169,110,0.08)":"transparent",color:!usarMedidas?A:"#888",fontSize:"0.8rem",cursor:"pointer",borderRadius:2,letterSpacing:1,textTransform:"uppercase" }}>Tamanho {selSize}</button>
          <button onClick={()=>setUsarMedidas(true)} style={{ flex:1,padding:"12px",border:`1px solid ${usarMedidas?A:"#2a2a2a"}`,background:usarMedidas?"rgba(200,169,110,0.08)":"transparent",color:usarMedidas?A:"#888",fontSize:"0.8rem",cursor:"pointer",borderRadius:2,letterSpacing:1,textTransform:"uppercase" }}>📏 Medidas exactas</button>
        </div>
        {usarMedidas&&(
          <div style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:24,marginBottom:24 }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
              {[["peito","Peito","ex: 92"],["cintura","Cintura","ex: 72"],["anca","Anca","ex: 98"],["altura","Altura","ex: 165"]].map(([k,label,ph])=>(
                <div key={k}>
                  <label style={{ fontSize:"0.72rem",letterSpacing:1,textTransform:"uppercase",color:"#888",display:"block",marginBottom:6 }}>{label}</label>
                  <div style={{ position:"relative" }}>
                    <input type="number" placeholder={ph} value={medidas[k]} onChange={e=>setMedidas({...medidas,[k]:e.target.value})}
                      style={{ width:"100%",background:"#1e1e1e",border:"1px solid #2a2a2a",color:"#f0ece4",padding:"11px 40px 11px 14px",borderRadius:2,fontSize:"0.88rem",outline:"none",boxSizing:"border-box" }}/>
                    <span style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#666",fontSize:"0.75rem" }}>cm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display:"flex",gap:10 }}>
          <GhostBtn onClick={()=>setStep(1)}>← Voltar</GhostBtn>
          <Btn style={{ flex:1,padding:14 }} onClick={()=>setStep(3)}>Continuar →</Btn>
        </div>
      </div>
    </PageWrap>
  );

  // STEP 3
  if(step===3) return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <StepBar/>
      <div style={{ maxWidth:600,margin:"0 auto" }}>
        <h2 style={{ fontFamily:"Georgia,serif",fontSize:"1.6rem",marginBottom:28 }}>Detalhes de Entrega</h2>
        <div style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:24,marginBottom:16 }}>
          <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:A,marginBottom:18 }}>Os teus dados</div>
          <FieldInput label="Nome completo" placeholder="Ex: Maria João" value={encomenda.nome} onChange={e=>setEncomenda({...encomenda,nome:e.target.value})} required/>
          <FieldInput label="Telefone / WhatsApp" placeholder="Ex: 84 123 4567" value={encomenda.telefone} onChange={e=>setEncomenda({...encomenda,telefone:e.target.value})} type="tel" required/>
        </div>
        <div style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:24,marginBottom:16 }}>
          <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:A,marginBottom:18 }}>Localização</div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:"0.72rem",letterSpacing:1,textTransform:"uppercase",color:"#888",display:"block",marginBottom:6 }}>Província <span style={{color:A}}>*</span></label>
            <select value={encomenda.provincia} onChange={e=>setEncomenda({...encomenda,provincia:e.target.value})}
              style={{ width:"100%",background:"#1e1e1e",border:"1px solid #2a2a2a",color:encomenda.provincia?"#f0ece4":"#666",padding:"11px 14px",borderRadius:2,fontSize:"0.88rem",outline:"none",boxSizing:"border-box" }}>
              <option value="">Selecciona a província</option>
              {PROVINCIAS.map(pr=><option key={pr} value={pr}>{pr}</option>)}
            </select>
          </div>
          <FieldInput label="Cidade / Distrito" placeholder="Ex: Nampula cidade" value={encomenda.cidade} onChange={e=>setEncomenda({...encomenda,cidade:e.target.value})} required/>
          <FieldInput label="Bairro" placeholder="Ex: Muhala Expansão" value={encomenda.bairro} onChange={e=>setEncomenda({...encomenda,bairro:e.target.value})}/>
          <FieldInput label="Ponto de referência" placeholder="Ex: Perto do Mercado Central" value={encomenda.referencia} onChange={e=>setEncomenda({...encomenda,referencia:e.target.value})}/>
        </div>
        <div style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:24,marginBottom:24 }}>
          <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:A,marginBottom:18 }}>Forma de pagamento</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {PAGAMENTOS.map(pg=>(
              <button key={pg.id} onClick={()=>setEncomenda({...encomenda,pagamento:pg.id})}
                style={{ padding:"12px 14px",border:`1px solid ${encomenda.pagamento===pg.id?A:"#2a2a2a"}`,background:encomenda.pagamento===pg.id?"rgba(200,169,110,0.08)":"transparent",color:encomenda.pagamento===pg.id?A:"#888",borderRadius:2,cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:"0.82rem" }}>
                <span>{pg.icon}</span><span>{pg.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <GhostBtn onClick={()=>setStep(2)}>← Voltar</GhostBtn>
          <Btn style={{ flex:1,padding:14 }} onClick={()=>{ if(!encomenda.nome||!encomenda.telefone||!encomenda.provincia||!encomenda.cidade){ showToast("Preenche todos os campos obrigatórios!"); return; } setStep(4); }}>Rever Pedido →</Btn>
        </div>
      </div>
    </PageWrap>
  );

  // STEP 4
  const pgLabel = PAGAMENTOS.find(x=>x.id===encomenda.pagamento);
  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <StepBar/>
      {pedidoId ? (
        <div style={{ textAlign:"center",padding:"60px 20px",maxWidth:500,margin:"0 auto" }}>
          <div style={{ fontSize:"4rem",marginBottom:20 }}>🎉</div>
          <h2 style={{ fontFamily:"Georgia,serif",fontSize:"2rem",marginBottom:12,color:A }}>Pedido Confirmado!</h2>
          <p style={{ color:"#888",lineHeight:1.8,marginBottom:8 }}>Obrigado, <strong style={{color:"#f0ece4"}}>{encomenda.nome}</strong>!</p>
          <p style={{ color:"#888",lineHeight:1.8,marginBottom:8 }}>Pedido: <strong style={{color:A}}>#{pedidoId.slice(-6).toUpperCase()}</strong></p>
          <p style={{ color:"#888",lineHeight:1.8,marginBottom:28 }}>Entraremos em contacto via WhatsApp para <strong style={{color:"#f0ece4"}}>{encomenda.telefone}</strong>.</p>
          {!user && <p style={{ color:"#c8a96e",fontSize:"0.85rem",marginBottom:20 }}>💡 <span onClick={()=>goPage("auth")} style={{cursor:"pointer",textDecoration:"underline"}}>Cria uma conta</span> para acompanhar os teus pedidos!</p>}
          <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
            <Btn onClick={goBack}>Continuar a comprar</Btn>
            {user && <GhostBtn onClick={()=>goPage("conta")}>Ver Pedidos</GhostBtn>}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth:600,margin:"0 auto" }}>
          <h2 style={{ fontFamily:"Georgia,serif",fontSize:"1.6rem",marginBottom:28 }}>Confirmar Pedido</h2>
          <div style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:24,marginBottom:16 }}>
            <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:A,marginBottom:16 }}>Produto</div>
            <div style={{ display:"flex",gap:16,alignItems:"center" }}>
              <div style={{ width:72,height:72,background:`linear-gradient(135deg,${p.grad[0]},${p.grad[1]})`,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",flexShrink:0 }}>{p.emoji}</div>
              <div>
                <div style={{ fontFamily:"Georgia,serif",fontSize:"1rem",marginBottom:4 }}>{p.name}</div>
                <div style={{ color:"#888",fontSize:"0.82rem" }}>Tamanho: <span style={{color:A}}>{usarMedidas?"Personalizado":selSize}</span> · Qtd: <span style={{color:A}}>{qty}</span></div>
              </div>
            </div>
          </div>
          <div style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:24,marginBottom:16 }}>
            <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:A,marginBottom:16 }}>Entrega</div>
            {[["Cliente",encomenda.nome],["Telefone",encomenda.telefone],["Localização",`${encomenda.bairro?encomenda.bairro+", ":""}${encomenda.cidade}, ${encomenda.provincia}`],["Pagamento",`${pgLabel?.icon} ${pgLabel?.label}`]].map(([k,v])=>(
              <div key={k} style={{ display:"flex",justifyContent:"space-between",fontSize:"0.85rem",marginBottom:10,gap:16 }}>
                <span style={{color:"#888",flexShrink:0}}>{k}</span><span style={{textAlign:"right"}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background:"rgba(200,169,110,0.06)",border:"1px solid rgba(200,169,110,0.2)",borderRadius:4,padding:16,marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:"0.85rem",color:"#aaa" }}>Total a pagar</span>
            <span style={{ fontFamily:"Georgia,serif",fontSize:"1.4rem",color:A,fontWeight:700 }}>{totalPedido.toLocaleString()} MT</span>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <GhostBtn onClick={()=>setStep(3)}>← Editar</GhostBtn>
            <Btn disabled={saving} style={{ flex:1,padding:14 }} onClick={confirmarPedido}>
              {saving?"A guardar...":"✓ Confirmar Pedido"}
            </Btn>
          </div>
        </div>
      )}
    </PageWrap>
  );
}

// ─── RATING STARS (display + interactive) ──────────────────────────────────────
function RatingStars({ value, onChange, size=18, readOnly=false }) {
  const [hoverVal, setHoverVal] = useState(0);
  const display = hoverVal || value || 0;
  return (
    <div style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n}
          onClick={readOnly?undefined:()=>onChange(n)}
          onMouseEnter={readOnly?undefined:()=>setHoverVal(n)}
          onMouseLeave={readOnly?undefined:()=>setHoverVal(0)}
          style={{ fontSize:size, cursor:readOnly?"default":"pointer", color: n<=display ? A : "#3a3a3a", lineHeight:1 }}>
          ★
        </span>
      ))}
    </div>
  );
}

// ─── PRODUCT REVIEWS ─────────────────────────────────────────────────────────────
function ProductReviews({ productId, user, showToast, goPage }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [sending, setSending] = useState(false);
  const [jaAvaliou, setJaAvaliou] = useState(false);

  useEffect(()=>{ fetchReviews(); }, [productId]);

  async function fetchReviews(){
    setLoading(true);
    try {
      const q = query(collection(db,"avaliacoes"), where("produtoId","==",productId));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d=>({id:d.id,...d.data()}));
      docs.sort((a,b)=>(b.criadoEm?.seconds||0)-(a.criadoEm?.seconds||0));
      setReviews(docs);
      if(user) setJaAvaliou(docs.some(r=>r.userId===user.uid));
    } catch(e){ console.log(e); }
    finally { setLoading(false); }
  }

  async function enviarAvaliacao(){
    if(!user){ showToast("Entra na tua conta para avaliar 🔒"); goPage("auth"); return; }
    if(myRating===0){ showToast("Escolhe uma classificação de 1 a 5 estrelas."); return; }
    setSending(true);
    try {
      await addDoc(collection(db,"avaliacoes"), {
        produtoId: productId,
        userId: user.uid,
        nome: user.displayName || user.email.split("@")[0],
        rating: myRating,
        comentario: myComment.trim(),
        criadoEm: serverTimestamp(),
      });
      showToast("Avaliação enviada! Obrigado 🌟");
      setMyRating(0); setMyComment("");
      await fetchReviews();
    } catch(e){ console.error(e); showToast("Erro ao enviar avaliação."); }
    finally { setSending(false); }
  }

  const media = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length) : 0;

  return (
    <div style={{ marginTop:60, borderTop:"1px solid #2a2a2a", paddingTop:50 }}>
      <SectionTitle eyebrow="Opiniões de clientes" title="Avaliações"/>

      {!loading && reviews.length>0 && (
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:32 }}>
          <span style={{ fontFamily:"Georgia,serif", fontSize:"2.4rem", color:A }}>{media.toFixed(1)}</span>
          <div>
            <RatingStars value={Math.round(media)} readOnly/>
            <div style={{ color:"#888", fontSize:"0.8rem", marginTop:4 }}>{reviews.length} avaliação{reviews.length!==1?"ões":""}</div>
          </div>
        </div>
      )}

      {/* FORM */}
      {!jaAvaliou && (
        <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:4, padding:22, marginBottom:32 }}>
          <div style={{ fontSize:"0.78rem", letterSpacing:1, textTransform:"uppercase", color:"#888", marginBottom:12 }}>Deixa a tua avaliação</div>
          <div style={{ marginBottom:14 }}><RatingStars value={myRating} onChange={setMyRating} size={26}/></div>
          <textarea value={myComment} onChange={e=>setMyComment(e.target.value)} rows={3} placeholder="Conta-nos a tua experiência com este produto (opcional)..."
            style={{ width:"100%", background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#f0ece4", padding:"12px 14px", borderRadius:2, fontSize:"0.85rem", outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit", marginBottom:14 }}/>
          <Btn disabled={sending} onClick={enviarAvaliacao}>{sending?"A enviar...":"Enviar Avaliação"}</Btn>
        </div>
      )}
      {jaAvaliou && <p style={{ color:"#7ed9af", fontSize:"0.85rem", marginBottom:32 }}>✓ Já avaliaste este produto. Obrigado pelo teu feedback!</p>}

      {/* LIST */}
      {loading ? <p style={{color:"#888"}}>A carregar avaliações...</p> :
       reviews.length===0 ? <p style={{color:"#888", fontSize:"0.85rem"}}>Ainda não há avaliações para este produto. Sê o primeiro!</p> :
       reviews.map(r=>(
        <div key={r.id} style={{ borderBottom:"1px solid #2a2a2a", padding:"18px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, flexWrap:"wrap", gap:6 }}>
            <div>
              <div style={{ fontSize:"0.88rem", fontWeight:600 }}>{r.nome}</div>
              <RatingStars value={r.rating} readOnly size={14}/>
            </div>
            <span style={{ color:"#666", fontSize:"0.75rem" }}>{r.criadoEm?.toDate?.()?.toLocaleDateString("pt-MZ")||""}</span>
          </div>
          {r.comentario && <p style={{ color:"#aaa", fontSize:"0.85rem", lineHeight:1.7 }}>{r.comentario}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── INFO PAGE ────────────────────────────────────────────────────────────────
function InfoPage({ title, icon, goBack, content }) {
  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <div style={{ maxWidth:720 }}>
        <div style={{ fontSize:"2.5rem",marginBottom:16 }}>{icon}</div>
        <h1 style={{ fontFamily:"Georgia,serif",fontSize:"2.2rem",marginBottom:40 }}>{title}</h1>
        {content.map((section,i)=>(
          <div key={i} style={{ marginBottom:36 }}>
            {section.title&&<h3 style={{ color:A,fontSize:"0.85rem",letterSpacing:1,marginBottom:12,textTransform:"uppercase" }}>{section.title}</h3>}
            {section.text&&<p style={{ color:"#aaa",lineHeight:1.9,fontSize:"0.92rem" }}>{section.text}</p>}
            {section.items&&<ul style={{ color:"#aaa",lineHeight:2,fontSize:"0.92rem",paddingLeft:20 }}>{section.items.map((it,j)=><li key={j}>{it}</li>)}</ul>}
          </div>
        ))}
      </div>
    </PageWrap>
  );
}

// ─── TAMANHOS ─────────────────────────────────────────────────────────────────
function TamanhosPage({ goBack }) {
  const rows=[["XS","32–34","80–86","60–66","86–92"],["S","36–38","87–93","67–71","93–98"],["M","40–42","94–99","72–76","99–104"],["L","44–46","100–106","77–83","105–110"],["XL","48–50","107–113","84–90","111–116"]];
  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <div style={{ maxWidth:700 }}>
        <div style={{ fontSize:"2.5rem",marginBottom:16 }}>📏</div>
        <h1 style={{ fontFamily:"Georgia,serif",fontSize:"2.2rem",marginBottom:12 }}>Guia de Tamanhos</h1>
        <p style={{ color:"#888",marginBottom:36,lineHeight:1.8 }}>Todas as medidas em centímetros.</p>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.88rem" }}>
            <thead><tr>{["Tamanho","EU","Peito","Cintura","Anca"].map(h=><th key={h} style={{ padding:"12px 16px",textAlign:"left",borderBottom:"1px solid #2a2a2a",color:A,fontSize:"0.72rem",letterSpacing:1,textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>{rows.map(([size,...vals],i)=><tr key={size} style={{ background:i%2===0?"#161616":"transparent" }}><td style={{ padding:"12px 16px",fontWeight:700,color:A }}>{size}</td>{vals.map((v,j)=><td key={j} style={{ padding:"12px 16px",color:"#aaa" }}>{v}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    </PageWrap>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FaqPage({ goBack }) {
  const [open,setOpen]=useState(null);
  const faqs=[
    {q:"Quanto tempo demora a entrega em Nampula?",a:"Entregas em Nampula são realizadas em 1–2 dias úteis. Para outras províncias, entre 3–7 dias úteis."},
    {q:"Posso trocar um produto se não servir?",a:"Sim! Aceitamos trocas em 30 dias após a compra, desde que o produto esteja em perfeito estado."},
    {q:"Como sei qual tamanho escolher?",a:"Consulta o nosso Guia de Tamanhos. Em caso de dúvida, recomendamos escolher o tamanho maior."},
    {q:"Quais são as formas de pagamento?",a:"Aceitamos M-Pesa, e-Mola, transferência bancária (BCI) e pagamento na entrega para Nampula cidade."},
    {q:"Os produtos são originais?",a:"100%. Todos os produtos ZURA são originais, produzidos com materiais de alta qualidade."},
    {q:"Como posso acompanhar o meu pedido?",a:"Cria uma conta ZURA e consulta o histórico de pedidos na tua área pessoal."},
    {q:"Posso cancelar um pedido?",a:"Podes cancelar até 2 horas após a confirmação. Contacta-nos via WhatsApp."},
  ];
  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <div style={{ maxWidth:720 }}>
        <div style={{ fontSize:"2.5rem",marginBottom:16 }}>❓</div>
        <h1 style={{ fontFamily:"Georgia,serif",fontSize:"2.2rem",marginBottom:40 }}>Perguntas Frequentes</h1>
        {faqs.map((f,i)=>(
          <div key={i} style={{ borderBottom:"1px solid #2a2a2a" }}>
            <button onClick={()=>setOpen(open===i?null:i)} style={{ width:"100%",background:"none",border:"none",color:"#f0ece4",padding:"18px 0",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left",fontSize:"0.92rem" }}>
              <span>{f.q}</span><span style={{ color:A,fontSize:"1.2rem",flexShrink:0,marginLeft:16 }}>{open===i?"−":"+"}</span>
            </button>
            {open===i&&<p style={{ color:"#888",lineHeight:1.8,fontSize:"0.88rem",paddingBottom:18,marginTop:-4 }}>{f.a}</p>}
          </div>
        ))}
      </div>
    </PageWrap>
  );
}

// ─── CONTACTO ─────────────────────────────────────────────────────────────────
function ContactoPage({ goBack, goPage, user }) {
  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <div style={{ maxWidth:560 }}>
        <div style={{ fontSize:"2.5rem",marginBottom:16 }}>📬</div>
        <h1 style={{ fontFamily:"Georgia,serif",fontSize:"2.2rem",marginBottom:16 }}>Contacto</h1>
        <p style={{ color:"#888",lineHeight:1.8,marginBottom:40,fontSize:"0.92rem" }}>Responderemos em menos de 24 horas.</p>
        {[["📍","Morada","Nampula, Moçambique"],["📞","Telefone","+258 87 356 4398"],["✉️","Email","kitohoracio@gmail.com"],["⏰","Horário","Seg–Sáb: 8h–17h"]].map(([ic,lab,val])=>(
          <div key={lab} style={{ display:"flex",gap:16,marginBottom:24 }}>
            <span style={{ fontSize:"1.3rem" }}>{ic}</span>
            <div>
              <div style={{ fontSize:"0.72rem",letterSpacing:1,textTransform:"uppercase",color:A,marginBottom:4 }}>{lab}</div>
              <div style={{ color:"#aaa",fontSize:"0.88rem" }}>{val}</div>
            </div>
          </div>
        ))}

        <div style={{ background:"rgba(200,169,110,0.06)", border:"1px solid rgba(200,169,110,0.2)", borderRadius:4, padding:24, marginTop:16 }}>
          {user ? (
            <>
              <div style={{ fontSize:"0.95rem", marginBottom:10 }}>💬 Tens uma questão para nós?</div>
              <p style={{ color:"#aaa", fontSize:"0.85rem", lineHeight:1.7, marginBottom:18 }}>
                Escreve e acompanha as tuas mensagens na aba <strong style={{color:A}}>"Mensagens"</strong> da tua conta.
              </p>
              <Btn onClick={()=>goPage("conta")}>Ir para Mensagens</Btn>
            </>
          ) : (
            <>
              <div style={{ fontSize:"0.95rem", marginBottom:10 }}>🔒 Entra na tua conta para nos escrever</div>
              <p style={{ color:"#aaa", fontSize:"0.85rem", lineHeight:1.7, marginBottom:18 }}>
                Cria uma conta gratuita ou entra para enviares mensagens de suporte e acompanhares as respostas.
              </p>
              <Btn onClick={()=>goPage("auth")}>Entrar / Criar Conta</Btn>
            </>
          )}
        </div>
      </div>
    </PageWrap>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ goPage }) {
  return (
    <>
      <footer style={{ borderTop:"1px solid #2a2a2a",padding:"48px 5% 24px",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:40 }}>
        <div>
          <div style={{ fontFamily:"Georgia,serif",fontSize:"1.4rem",color:A,letterSpacing:2,marginBottom:14 }}>ZURA</div>
          <p style={{ color:"#888",fontSize:"0.83rem",lineHeight:1.8,maxWidth:220 }}>Moda moçambicana para quem celebra a sua identidade todos os dias.</p>
        </div>
        {[
          ["Loja",[["Ver tudo","catalog"],["Mulher","catalog"],["Homem","catalog"],["Acessórios","catalog"],["Vendidos","catalog"]]],
          ["Ajuda",[["Entregas","entregas"],["Devoluções","devolucoes"],["Tamanhos","tamanhos"],["FAQ","faq"]]],
          ["Empresa",[["Sobre Nós","sobre"],["Contacto","contacto"],["Carreiras","carreiras"]]],
        ].map(([title,links])=>(
          <div key={title}>
            <h4 style={{ fontSize:"0.68rem",letterSpacing:2,textTransform:"uppercase",color:"#888",marginBottom:14 }}>{title}</h4>
            <ul style={{ listStyle:"none",padding:0,margin:0 }}>
              {links.map(([label,pg])=>(
                <li key={label} style={{ marginBottom:10 }}>
                  <span onClick={()=>goPage(pg)} style={{ color:"#888",fontSize:"0.83rem",cursor:"pointer" }}
                    onMouseEnter={e=>e.target.style.color="#f0ece4"} onMouseLeave={e=>e.target.style.color="#888"}>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </footer>
      <div style={{ borderTop:"1px solid #2a2a2a",padding:"18px 5%",display:"flex",justifyContent:"space-between",color:"#555",fontSize:"0.73rem" }}>
        <span>© 2026 ZURA Store — Nampula, Moçambique</span>
        <span>Feito com ❤️ em Moçambique</span>
      </div>
    </>
  );
}

// ─── CONTENT ──────────────────────────────────────────────────────────────────
const ENTREGAS=[{title:"Nampula Cidade",text:"Entrega em 1–2 dias úteis. Gratuita para compras acima de 3.000 MT."},{title:"Outras Províncias",text:"Entrega em 3–7 dias úteis via transportadoras parceiras."},{title:"Zonas Remotas",text:"Para zonas de difícil acesso, o prazo pode ser de até 10 dias úteis."},{title:"Acompanhamento",text:"Receberás um código de rastreamento por SMS/WhatsApp após o envio."},{title:"Horário",text:"Segunda a sábado, das 8h às 17h."}];
const DEVOLUCOES=[{title:"Política de Trocas",text:"Aceitamos trocas em até 30 dias após a compra com etiqueta original."},{title:"Como devolver",items:["Contacta-nos via WhatsApp com o número do pedido","Aguarda confirmação e instruções","Envia o produto para Nampula","Troca processada em 3–5 dias úteis"]},{title:"Produtos não elegíveis",items:["Produtos lavados ou usados","Itens sem etiqueta original","Roupas íntimas"]},{title:"Reembolsos",text:"Para produtos defeituosos, reembolso total ou troca imediata."}];
const SOBRE=[{title:"A Nossa História",text:"A ZURA nasceu em Nampula em 2022 com missão de criar moda moçambicana que honra as nossas raízes. Hoje chegamos a mais de 2.400 clientes em todo o país."},{title:"A Nossa Missão",text:"Celebrar a identidade moçambicana através da moda. Do capulana ao urbano, sempre com qualidade premium e orgulho local."},{title:"Os Nossos Valores",items:["Autenticidade — produtos 100% originais","Qualidade — materiais premium","Comunidade — apoiamos artesãos locais","Sustentabilidade — práticas responsáveis"]},{title:"Impacto Local",text:"Trabalhamos com mais de 40 artesãos de Nampula, Ilha de Moçambique e Maputo."}];
const CARREIRAS=[{title:"Trabalha connosco",text:"A ZURA procura pessoas apaixonadas por moda e cultura moçambicana."},{title:"Vagas Actuais",items:["Designer de Moda — Nampula","Gestor de Redes Sociais — Remoto","Responsável de Logística — Nampula","Atendimento ao Cliente — Nampula"]},{title:"Como Candidatar",text:"Envia CV para kitohoracio@gmail.com com o título da vaga."},{title:"Estágios",text:"Recebemos estagiários em design, marketing e gestão. Mínimo 3 meses."}];
