import { useState } from "react";

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

// ─── helpers ────────────────────────────────────────────────────────────────
function Btn({ children, onClick, style={} }) {
  return <button onClick={onClick} style={{ background:A, color:"#000", border:"none", padding:"12px 28px", fontSize:"0.82rem", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", cursor:"pointer", borderRadius:2, ...style }}>{children}</button>;
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

// ─── main app ───────────────────────────────────────────────────────────────
export default function ZuraStore() {
  const [filter,    setFilter]    = useState("todos");
  const [cart,      setCart]      = useState([]);
  const [wishlist,  setWishlist]  = useState(new Set());
  const [cartOpen,  setCartOpen]  = useState(false);
  const [toast,     setToast]     = useState(null);
  const [page,      setPage]      = useState("home");
  const [selected,  setSelected]  = useState(null);
  const [qty,       setQty]       = useState(1);

  const filtered = filter==="todos" ? PRODUCTS
    : filter==="sale" ? PRODUCTS.filter(p=>p.badge==="sale")
    : PRODUCTS.filter(p=>p.category===filter);

  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(null),2500); }

  function addToCart(product,q=1){
    setCart(prev=>{
      const ex=prev.find(i=>i.id===product.id);
      if(ex) return prev.map(i=>i.id===product.id?{...i,qty:i.qty+q}:i);
      return [...prev,{...product,qty:q}];
    });
    showToast(`${product.name} adicionado!`);
  }
  function changeQty(id,d){ setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+d)}:i)); }
  function removeFromCart(id){ setCart(prev=>prev.filter(i=>i.id!==id)); }
  function toggleWish(id){ setWishlist(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; }); }
  function openProduct(p){ setSelected(p); setQty(1); setPage("product"); window.scrollTo({top:0}); }
  function goPage(p){ setPage(p); window.scrollTo({top:0}); }

  function navFilter(label){
    const map={"Novidades":"todos","Mulher":"mulher","Homem":"homem","Acessórios":"acessorios","Sale":"sale"};
    setFilter(map[label]||"todos");
    goPage("home");
  }

  return (
    <div style={ROOT}>
      {/* ── NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(13,13,13,0.95)", backdropFilter:"blur(12px)", borderBottom:"1px solid #2a2a2a", padding:"0 5%", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
        <span onClick={()=>goPage("home")} style={{ fontFamily:"Georgia,serif", fontSize:"1.6rem", color:A, letterSpacing:2, cursor:"pointer" }}>ZURA</span>
        <ul style={{ display:"flex", gap:28, listStyle:"none", margin:0, padding:0 }}>
          {["Novidades","Mulher","Homem","Acessórios","Sale"].map(l=>(
            <li key={l}><span onClick={()=>navFilter(l)} style={{ color:"#888", fontSize:"0.82rem", letterSpacing:1, textTransform:"uppercase", cursor:"pointer" }}>{l}</span></li>
          ))}
        </ul>
        <button onClick={()=>setCartOpen(true)} style={{ background:A, color:"#000", border:"none", padding:"8px 20px", borderRadius:2, fontSize:"0.8rem", fontWeight:700, letterSpacing:1, textTransform:"uppercase", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          🛒 Carrinho
          <span style={{ background:"#000", color:A, borderRadius:"50%", width:18, height:18, fontSize:"0.68rem", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{cartCount}</span>
        </button>
      </nav>

      {/* ── PAGES ── */}
      {page==="home"    && <HomePage filtered={filtered} filter={filter} setFilter={setFilter} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} openProduct={openProduct} goPage={goPage} />}
      {page==="product" && <ProductPage product={selected} qty={qty} setQty={setQty} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} goBack={()=>goPage("home")} openProduct={openProduct} showToast={showToast} />}
      {page==="catalog" && <CatalogPage filtered={PRODUCTS} filter={filter} setFilter={setFilter} wishlist={wishlist} toggleWish={toggleWish} addToCart={addToCart} openProduct={openProduct} goBack={()=>goPage("home")} />}
      {page==="entregas"   && <InfoPage title="Entregas" icon="🚚" goBack={()=>goPage("home")} content={ENTREGAS} />}
      {page==="devolucoes" && <InfoPage title="Devoluções" icon="↩️" goBack={()=>goPage("home")} content={DEVOLUCOES} />}
      {page==="tamanhos"   && <TamanhosPage goBack={()=>goPage("home")} />}
      {page==="faq"        && <FaqPage goBack={()=>goPage("home")} />}
      {page==="sobre"      && <InfoPage title="Sobre Nós" icon="🌍" goBack={()=>goPage("home")} content={SOBRE} />}
      {page==="contacto"   && <ContactoPage goBack={()=>goPage("home")} showToast={showToast} />}
      {page==="carreiras"  && <InfoPage title="Carreiras" icon="💼" goBack={()=>goPage("home")} content={CARREIRAS} />}

      {/* ── CART PANEL ── */}
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
                      <button onClick={()=>changeQty(item.id,1)}  style={{ width:24,height:24,background:"#1e1e1e",border:"1px solid #3a3a3a",color:"#f0ece4",borderRadius:2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
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
                <button onClick={()=>{ showToast("Pedido confirmado! Obrigado 🎉"); setCart([]); setCartOpen(false); }} style={{ width:"100%", background:A, color:"#000", border:"none", padding:16, fontSize:"0.85rem", fontWeight:700, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", borderRadius:2 }}>
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position:"fixed", bottom:32, right:32, background:"#161616", border:`1px solid ${A}`, borderRadius:4, padding:"14px 22px", display:"flex", alignItems:"center", gap:10, fontSize:"0.85rem", zIndex:300, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", animation:"slideUp 0.3s ease" }}>
          <span style={{ color:"#4caf7d" }}>✓</span> {toast}
        </div>
      )}
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

// ─── HOME PAGE ───────────────────────────────────────────────────────────────
function HomePage({ filtered, filter, setFilter, wishlist, toggleWish, addToCart, openProduct, goPage }) {
  const FILTER_MAP = { todos:"Todos", mulher:"Mulher", homem:"Homem", acessorios:"Acessórios", sale:"Sale" };
  return (
    <>
      {/* HERO */}
      <div style={{ minHeight:"85vh", display:"flex", alignItems:"center", padding:"0 5%", background:"radial-gradient(ellipse at 70% 50%,rgba(200,169,110,0.07) 0%,transparent 60%)" }}>
        <div style={{ maxWidth:560 }}>
          <div style={{ fontSize:"0.72rem", letterSpacing:3, textTransform:"uppercase", color:A, marginBottom:18 }}>Nova Colecção — Inverno 2026</div>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(2.6rem,5vw,4rem)", lineHeight:1.1, marginBottom:22 }}>
            Moda que <em style={{ color:A }}>conta</em><br/>a tua história
          </h1>
          <p style={{ color:"#888", fontSize:"1rem", lineHeight:1.8, marginBottom:36, maxWidth:400 }}>
            Peças únicas inspiradas na riqueza cultural de Moçambique. Do capulana ao urbano — feito para quem não passa despercebido.
          </p>
          <div style={{ display:"flex", gap:14 }}>
            <Btn onClick={()=>goPage("catalog")}>Ver Colecção</Btn>
            <GhostBtn onClick={()=>goPage("sobre")}>Nossa História</GhostBtn>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ borderTop:"1px solid #2a2a2a", borderBottom:"1px solid #2a2a2a", padding:"28px 5%", display:"flex", justifyContent:"center", gap:60, flexWrap:"wrap" }}>
        {[["2.4k+","Clientes"],["180+","Produtos"],["7","Províncias"],["98%","Satisfação"]].map(([n,l])=>(
          <div key={l} style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:"2rem", color:A }}>{n}</div>
            <div style={{ fontSize:"0.72rem", color:"#888", textTransform:"uppercase", letterSpacing:1 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* PRODUCTS */}
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

      {/* PROMO BANNER */}
      <div style={{ margin:"0 5% 72px", background:"linear-gradient(135deg,#1e1508,#2d2010)", border:"1px solid rgba(200,169,110,0.2)", borderRadius:4, padding:"48px 56px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-50%", right:"-5%", width:360, height:360, background:"radial-gradient(circle,rgba(200,169,110,0.1),transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:"0.68rem", letterSpacing:3, textTransform:"uppercase", color:A, marginBottom:10 }}>Oferta Limitada</div>
          <h3 style={{ fontFamily:"Georgia,serif", fontSize:"2rem", marginBottom:10 }}>Colecção de Verão em Saldo</h3>
          <p style={{ color:"#888", fontSize:"0.88rem" }}>Apenas até ao fim do mês. Não percas.</p>
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
function CatalogPage({ filtered, filter, setFilter, wishlist, toggleWish, addToCart, openProduct, goBack }) {
  const FILTER_MAP = { todos:"Todos", mulher:"Mulher", homem:"Homem", acessorios:"Acessórios", sale:"Sale" };
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

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product:p, wishlist, toggleWish, addToCart, openProduct }) {
  const [hov,setHov]=useState(false);
  const b=p.badge?BADGE[p.badge]:null;
  return (
    <div onClick={()=>openProduct(p)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"#1e1e1e", border:`1px solid ${hov?"rgba(200,169,110,0.3)":"#2a2a2a"}`, borderRadius:4, overflow:"hidden", cursor:"pointer", transform:hov?"translateY(-4px)":"translateY(0)", transition:"all 0.2s" }}>
      <div style={{ height:240, background:`linear-gradient(135deg,${p.grad[0]},${p.grad[1]})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3.5rem", position:"relative" }}>
        {p.emoji}
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
function ProductPage({ product:p, qty, setQty, wishlist, toggleWish, addToCart, goBack, openProduct, showToast }) {
  const [selSize, setSelSize] = useState("M");
  const [medidas, setMedidas] = useState({ peito:"", cintura:"", anca:"", altura:"" });
  const [usarMedidas, setUsarMedidas] = useState(false);
  const [encomenda, setEncomenda] = useState({ nome:"", telefone:"", provincia:"", cidade:"", bairro:"", referencia:"", pagamento:"mpesa" });
  const [step, setStep] = useState(1); // 1=produto, 2=medidas, 3=entrega, 4=confirmacao
  const [pedidoFeito, setPedidoFeito] = useState(false);

  if(!p) return null;
  const b = p.badge ? BADGE[p.badge] : null;
  const related = PRODUCTS.filter(x=>x.category===p.category&&x.id!==p.id).slice(0,4);

  const PROVINCIAS = ["Nampula","Maputo","Beira","Quelimane","Tete","Nacala","Lichinga","Pemba","Xai-Xai","Inhambane","Chimoio","Mocuba"];
  const PAGAMENTOS = [
    { id:"mpesa",   label:"M-Pesa",            icon:"📱" },
    { id:"emola",   label:"e-Mola",            icon:"💳" },
    { id:"banco",   label:"Transferência BCI", icon:"🏦" },
    { id:"entrega", label:"Pagamento na Entrega", icon:"💵" },
  ];

  const totalPedido = p.price * qty;

  function Input({ label, placeholder, value, onChange, type="text", required=false }) {
    return (
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:"0.72rem", letterSpacing:1, textTransform:"uppercase", color:"#888", display:"block", marginBottom:6 }}>
          {label}{required&&<span style={{color:A}}> *</span>}
        </label>
        <input type={type} placeholder={placeholder} value={value} onChange={onChange}
          style={{ width:"100%", background:"#1e1e1e", border:"1px solid #2a2a2a", color:"#f0ece4", padding:"11px 14px", borderRadius:2, fontSize:"0.88rem", outline:"none", boxSizing:"border-box" }}/>
      </div>
    );
  }

  function StepBar() {
    const steps = ["Produto","Medidas","Entrega","Confirmação"];
    return (
      <div style={{ display:"flex", alignItems:"center", marginBottom:36, gap:0 }}>
        {steps.map((s,i)=>(
          <div key={s} style={{ display:"flex", alignItems:"center", flex: i<steps.length-1?1:"auto" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:step>i+1?"#4caf7d":step===i+1?A:"#2a2a2a", color:step>i+1||step===i+1?"#000":"#888", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", fontWeight:700, transition:"all 0.3s" }}>
                {step>i+1 ? "✓" : i+1}
              </div>
              <span style={{ fontSize:"0.65rem", color:step===i+1?A:"#666", textTransform:"uppercase", letterSpacing:1, whiteSpace:"nowrap" }}>{s}</span>
            </div>
            {i<steps.length-1 && <div style={{ flex:1, height:1, background:step>i+1?"#4caf7d":"#2a2a2a", margin:"0 8px", marginBottom:20, transition:"all 0.3s" }}/>}
          </div>
        ))}
      </div>
    );
  }

  // STEP 1 — Produto
  function Step1() {
    return (
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:50 }}>
        <div style={{ background:`linear-gradient(135deg,${p.grad[0]},${p.grad[1]})`, borderRadius:4, minHeight:420, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"8rem", position:"relative" }}>
          {p.emoji}
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

          {/* TAMANHO */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:"#888",marginBottom:10 }}>Tamanho</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {["XS","S","M","L","XL","XXL"].map(s=>(
                <button key={s} onClick={()=>setSelSize(s)} style={{ width:44,height:44,border:`1px solid ${selSize===s?A:"#3a3a3a"}`,background:selSize===s?"rgba(200,169,110,0.12)":"transparent",color:selSize===s?A:"#f0ece4",fontSize:"0.8rem",cursor:"pointer",borderRadius:2 }}>{s}</button>
              ))}
            </div>
          </div>

          {/* QUANTIDADE */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:"#888",marginBottom:10 }}>Quantidade</div>
            <div style={{ display:"flex",alignItems:"center",gap:0,border:"1px solid #3a3a3a",borderRadius:2,width:"fit-content" }}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:44,height:44,background:"none",border:"none",color:"#f0ece4",fontSize:"1.1rem",cursor:"pointer" }}>−</button>
              <span style={{ width:48,textAlign:"center",fontSize:"0.95rem",borderLeft:"1px solid #3a3a3a",borderRight:"1px solid #3a3a3a",lineHeight:"44px" }}>{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{ width:44,height:44,background:"none",border:"none",color:"#f0ece4",fontSize:"1.1rem",cursor:"pointer" }}>+</button>
            </div>
          </div>

          {/* TOTAL */}
          <div style={{ background:"#1e1e1e",border:"1px solid #2a2a2a",borderRadius:4,padding:"14px 18px",marginBottom:22,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ color:"#888",fontSize:"0.85rem" }}>Subtotal ({qty} {qty===1?"unidade":"unidades"})</span>
            <span style={{ color:A,fontFamily:"Georgia,serif",fontSize:"1.2rem",fontWeight:700 }}>{totalPedido.toLocaleString()} MT</span>
          </div>

          <div style={{ display:"flex",gap:10 }}>
            <Btn style={{ flex:1,padding:14 }} onClick={()=>setStep(2)}>Encomendar →</Btn>
            <button onClick={()=>{ addToCart(p,qty); }} style={{ width:48,height:48,background:"transparent",border:"1px solid #3a3a3a",borderRadius:2,cursor:"pointer",fontSize:"1.1rem",title:"Adicionar ao carrinho" }}
              title="Adicionar ao carrinho">🛒</button>
            <button onClick={()=>toggleWish(p.id)} style={{ width:48,height:48,background:"transparent",border:"1px solid #3a3a3a",borderRadius:2,cursor:"pointer",fontSize:"1.2rem" }}>
              {wishlist.has(p.id)?"❤️":"🤍"}
            </button>
          </div>
          <div style={{ marginTop:16 }}>
            {["✓  Entrega em todo Moçambique","✓  Troca gratuita em 30 dias","✓  Produto 100% original ZURA"].map(f=>(
              <div key={f} style={{ fontSize:"0.8rem",color:"#888",marginBottom:6 }}>{f}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // STEP 2 — Medidas
  function Step2() {
    return (
      <div style={{ maxWidth:600, margin:"0 auto" }}>
        <h2 style={{ fontFamily:"Georgia,serif",fontSize:"1.6rem",marginBottom:8 }}>Medidas Personalizadas</h2>
        <p style={{ color:"#888",fontSize:"0.88rem",lineHeight:1.8,marginBottom:28 }}>
          Para garantir o melhor ajuste, podes fornecer as tuas medidas. Se preferires, avançamos com o tamanho <strong style={{color:A}}>{selSize}</strong> seleccionado.
        </p>

        {/* TOGGLE */}
        <div style={{ display:"flex",gap:10,marginBottom:28 }}>
          <button onClick={()=>setUsarMedidas(false)} style={{ flex:1,padding:"12px",border:`1px solid ${!usarMedidas?A:"#2a2a2a"}`,background:!usarMedidas?"rgba(200,169,110,0.08)":"transparent",color:!usarMedidas?A:"#888",fontSize:"0.8rem",cursor:"pointer",borderRadius:2,letterSpacing:1,textTransform:"uppercase" }}>
            Usar tamanho {selSize}
          </button>
          <button onClick={()=>setUsarMedidas(true)} style={{ flex:1,padding:"12px",border:`1px solid ${usarMedidas?A:"#2a2a2a"}`,background:usarMedidas?"rgba(200,169,110,0.08)":"transparent",color:usarMedidas?A:"#888",fontSize:"0.8rem",cursor:"pointer",borderRadius:2,letterSpacing:1,textTransform:"uppercase" }}>
            📏 Usar medidas exactas
          </button>
        </div>

        {usarMedidas && (
          <div style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:24,marginBottom:24 }}>
            <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:A,marginBottom:20 }}>Insere as tuas medidas (em cm)</div>
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
            <div style={{ marginTop:16,padding:"10px 14px",background:"rgba(200,169,110,0.06)",borderRadius:2,fontSize:"0.8rem",color:"#888" }}>
              💡 Consulta o nosso <span style={{color:A,cursor:"pointer"}}>Guia de Tamanhos</span> para saber como medir correctamente.
            </div>
          </div>
        )}

        {/* RESUMO */}
        <div style={{ background:"#1e1e1e",border:"1px solid #2a2a2a",borderRadius:4,padding:16,marginBottom:24 }}>
          <div style={{ fontSize:"0.72rem",letterSpacing:1,textTransform:"uppercase",color:"#888",marginBottom:10 }}>Resumo do pedido</div>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.88rem",marginBottom:6 }}>
            <span style={{color:"#aaa"}}>{p.name}</span><span>{qty}x</span>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.88rem",marginBottom:6 }}>
            <span style={{color:"#aaa"}}>Tamanho</span><span style={{color:A}}>{usarMedidas?"Personalizado":selSize}</span>
          </div>
          <div style={{ borderTop:"1px solid #2a2a2a",marginTop:10,paddingTop:10,display:"flex",justifyContent:"space-between" }}>
            <span style={{color:"#aaa"}}>Total</span><span style={{color:A,fontWeight:700}}>{totalPedido.toLocaleString()} MT</span>
          </div>
        </div>

        <div style={{ display:"flex",gap:10 }}>
          <GhostBtn onClick={()=>setStep(1)}>← Voltar</GhostBtn>
          <Btn style={{ flex:1,padding:14 }} onClick={()=>setStep(3)}>Continuar → Entrega</Btn>
        </div>
      </div>
    );
  }

  // STEP 3 — Entrega
  function Step3() {
    function validar(){
      if(!encomenda.nome||!encomenda.telefone||!encomenda.provincia||!encomenda.cidade){
        showToast("Preenche todos os campos obrigatórios!"); return;
      }
      setStep(4);
    }
    return (
      <div style={{ maxWidth:600,margin:"0 auto" }}>
        <h2 style={{ fontFamily:"Georgia,serif",fontSize:"1.6rem",marginBottom:8 }}>Detalhes de Entrega</h2>
        <p style={{ color:"#888",fontSize:"0.88rem",marginBottom:28 }}>Preenche os dados para recebermos o teu pedido.</p>

        <div style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:24,marginBottom:20 }}>
          <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:A,marginBottom:18 }}>Os teus dados</div>
          <Input label="Nome completo" placeholder="Ex: Maria João" value={encomenda.nome} onChange={e=>setEncomenda({...encomenda,nome:e.target.value})} required/>
          <Input label="Telefone / WhatsApp" placeholder="Ex: 84 123 4567" value={encomenda.telefone} onChange={e=>setEncomenda({...encomenda,telefone:e.target.value})} type="tel" required/>
        </div>

        <div style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:24,marginBottom:20 }}>
          <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:A,marginBottom:18 }}>Localização de entrega</div>

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:"0.72rem",letterSpacing:1,textTransform:"uppercase",color:"#888",display:"block",marginBottom:6 }}>Província <span style={{color:A}}>*</span></label>
            <select value={encomenda.provincia} onChange={e=>setEncomenda({...encomenda,provincia:e.target.value})}
              style={{ width:"100%",background:"#1e1e1e",border:"1px solid #2a2a2a",color:encomenda.provincia?"#f0ece4":"#666",padding:"11px 14px",borderRadius:2,fontSize:"0.88rem",outline:"none",boxSizing:"border-box" }}>
              <option value="">Selecciona a província</option>
              {PROVINCIAS.map(pr=><option key={pr} value={pr}>{pr}</option>)}
            </select>
          </div>

          <Input label="Cidade / Distrito" placeholder="Ex: Nampula cidade" value={encomenda.cidade} onChange={e=>setEncomenda({...encomenda,cidade:e.target.value})} required/>
          <Input label="Bairro / Zona" placeholder="Ex: Muhala Expansão" value={encomenda.bairro} onChange={e=>setEncomenda({...encomenda,bairro:e.target.value})}/>
          <Input label="Ponto de referência" placeholder="Ex: Perto do Mercado Central" value={encomenda.referencia} onChange={e=>setEncomenda({...encomenda,referencia:e.target.value})}/>
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
          <Btn style={{ flex:1,padding:14 }} onClick={validar}>Rever Pedido →</Btn>
        </div>
      </div>
    );
  }

  // STEP 4 — Confirmação
  function Step4() {
    const pgLabel = PAGAMENTOS.find(x=>x.id===encomenda.pagamento);
    function confirmar(){
      setPedidoFeito(true);
      showToast("Pedido confirmado! Entraremos em contacto 🎉");
    }
    if(pedidoFeito) return (
      <div style={{ textAlign:"center",padding:"60px 20px",maxWidth:500,margin:"0 auto" }}>
        <div style={{ fontSize:"4rem",marginBottom:20 }}>🎉</div>
        <h2 style={{ fontFamily:"Georgia,serif",fontSize:"2rem",marginBottom:12,color:A }}>Pedido Confirmado!</h2>
        <p style={{ color:"#888",lineHeight:1.8,marginBottom:12 }}>Obrigado, <strong style={{color:"#f0ece4"}}>{encomenda.nome}</strong>! O teu pedido foi recebido.</p>
        <p style={{ color:"#888",lineHeight:1.8,marginBottom:32 }}>Entraremos em contacto via WhatsApp para <strong style={{color:"#f0ece4"}}>{encomenda.telefone}</strong> com os detalhes de pagamento e prazo de entrega.</p>
        <div style={{ background:"#1e1e1e",border:"1px solid #2a2a2a",borderRadius:4,padding:20,marginBottom:28,textAlign:"left" }}>
          <div style={{ fontSize:"0.72rem",letterSpacing:1,textTransform:"uppercase",color:A,marginBottom:12 }}>Resumo</div>
          {[["Produto",p.name],["Quantidade",qty],["Total",totalPedido.toLocaleString()+" MT"],["Entrega",`${encomenda.cidade}, ${encomenda.provincia}`],["Pagamento",pgLabel?.label]].map(([k,v])=>(
            <div key={k} style={{ display:"flex",justifyContent:"space-between",fontSize:"0.85rem",marginBottom:8 }}>
              <span style={{color:"#888"}}>{k}</span><span>{v}</span>
            </div>
          ))}
        </div>
        <Btn onClick={goBack} style={{ padding:"14px 32px" }}>Continuar a comprar</Btn>
      </div>
    );
    return (
      <div style={{ maxWidth:600,margin:"0 auto" }}>
        <h2 style={{ fontFamily:"Georgia,serif",fontSize:"1.6rem",marginBottom:8 }}>Confirmar Pedido</h2>
        <p style={{ color:"#888",fontSize:"0.88rem",marginBottom:28 }}>Verifica os detalhes antes de confirmar.</p>

        <div style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:24,marginBottom:16 }}>
          <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:A,marginBottom:16 }}>Produto</div>
          <div style={{ display:"flex",gap:16,alignItems:"center" }}>
            <div style={{ width:72,height:72,background:`linear-gradient(135deg,${p.grad[0]},${p.grad[1]})`,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",flexShrink:0 }}>{p.emoji}</div>
            <div>
              <div style={{ fontFamily:"Georgia,serif",fontSize:"1rem",marginBottom:4 }}>{p.name}</div>
              <div style={{ color:"#888",fontSize:"0.82rem" }}>Tamanho: <span style={{color:A}}>{usarMedidas?"Personalizado":selSize}</span> · Qtd: <span style={{color:A}}>{qty}</span></div>
              {usarMedidas&&Object.values(medidas).some(v=>v)&&<div style={{ color:"#888",fontSize:"0.78rem",marginTop:4 }}>Medidas: {Object.entries(medidas).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}cm`).join(", ")}</div>}
            </div>
          </div>
        </div>

        <div style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:24,marginBottom:16 }}>
          <div style={{ fontSize:"0.72rem",letterSpacing:2,textTransform:"uppercase",color:A,marginBottom:16 }}>Entrega</div>
          {[["Cliente",encomenda.nome],["Telefone",encomenda.telefone],["Localização",`${encomenda.bairro?encomenda.bairro+", ":""}${encomenda.cidade}, ${encomenda.provincia}`],encomenda.referencia&&["Referência",encomenda.referencia],["Pagamento",`${pgLabel?.icon} ${pgLabel?.label}`]].filter(Boolean).map(([k,v])=>(
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
          <Btn style={{ flex:1,padding:14 }} onClick={confirmar}>✓ Confirmar Pedido</Btn>
        </div>
      </div>
    );
  }

  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <StepBar/>
      {step===1 && <Step1/>}
      {step===2 && <Step2/>}
      {step===3 && <Step3/>}
      {step===4 && <Step4/>}

      {/* RELATED — só no step 1 */}
      {step===1 && related.length>0 && (
        <div style={{ marginTop:80 }}>
          <SectionTitle eyebrow="Também podes gostar" title="Produtos Relacionados"/>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:20 }}>
            {related.map(rp=>(
              <div key={rp.id} onClick={()=>openProduct(rp)} style={{ background:"#1e1e1e",border:"1px solid #2a2a2a",borderRadius:4,overflow:"hidden",cursor:"pointer" }}>
                <div style={{ height:180,background:`linear-gradient(135deg,${rp.grad[0]},${rp.grad[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.8rem" }}>{rp.emoji}</div>
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
}

// ─── INFO PAGE (generic) ──────────────────────────────────────────────────────
function InfoPage({ title, icon, goBack, content }) {
  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <div style={{ maxWidth:720 }}>
        <div style={{ fontSize:"2.5rem",marginBottom:16 }}>{icon}</div>
        <h1 style={{ fontFamily:"Georgia,serif",fontSize:"2.2rem",marginBottom:40 }}>{title}</h1>
        {content.map((section,i)=>(
          <div key={i} style={{ marginBottom:36 }}>
            {section.title&&<h3 style={{ color:A,fontSize:"1rem",letterSpacing:1,marginBottom:12,textTransform:"uppercase",fontSize:"0.85rem" }}>{section.title}</h3>}
            {section.text&&<p style={{ color:"#aaa",lineHeight:1.9,fontSize:"0.92rem" }}>{section.text}</p>}
            {section.items&&<ul style={{ color:"#aaa",lineHeight:2,fontSize:"0.92rem",paddingLeft:20 }}>{section.items.map((it,j)=><li key={j}>{it}</li>)}</ul>}
          </div>
        ))}
      </div>
    </PageWrap>
  );
}

// ─── TAMANHOS PAGE ────────────────────────────────────────────────────────────
function TamanhosPage({ goBack }) {
  const rows = [
    ["XS","32–34","80–86","60–66","86–92"],
    ["S", "36–38","87–93","67–71","93–98"],
    ["M", "40–42","94–99","72–76","99–104"],
    ["L", "44–46","100–106","77–83","105–110"],
    ["XL","48–50","107–113","84–90","111–116"],
  ];
  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <div style={{ maxWidth:700 }}>
        <div style={{ fontSize:"2.5rem",marginBottom:16 }}>📏</div>
        <h1 style={{ fontFamily:"Georgia,serif",fontSize:"2.2rem",marginBottom:12 }}>Guia de Tamanhos</h1>
        <p style={{ color:"#888",marginBottom:36,lineHeight:1.8 }}>Todas as medidas estão em centímetros. Em caso de dúvida, recomendamos escolher o tamanho maior.</p>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.88rem" }}>
            <thead>
              <tr>
                {["Tamanho","EU","Peito","Cintura","Anca"].map(h=>(
                  <th key={h} style={{ padding:"12px 16px",textAlign:"left",borderBottom:"1px solid #2a2a2a",color:A,fontSize:"0.72rem",letterSpacing:1,textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([size,...vals],i)=>(
                <tr key={size} style={{ background:i%2===0?"#161616":"transparent" }}>
                  <td style={{ padding:"12px 16px",fontWeight:700,color:A }}>{size}</td>
                  {vals.map((v,j)=><td key={j} style={{ padding:"12px 16px",color:"#aaa" }}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:36,padding:20,background:"#1e1e1e",borderRadius:4,border:"1px solid #2a2a2a" }}>
          <div style={{ color:A,fontSize:"0.78rem",letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Como medir</div>
          <ul style={{ color:"#aaa",lineHeight:2,fontSize:"0.88rem",paddingLeft:20 }}>
            <li><strong style={{color:"#f0ece4"}}>Peito:</strong> mede na parte mais larga, debaixo dos braços</li>
            <li><strong style={{color:"#f0ece4"}}>Cintura:</strong> mede na parte mais estreita do tronco</li>
            <li><strong style={{color:"#f0ece4"}}>Anca:</strong> mede na parte mais larga dos quadris</li>
          </ul>
        </div>
      </div>
    </PageWrap>
  );
}

// ─── FAQ PAGE ─────────────────────────────────────────────────────────────────
function FaqPage({ goBack }) {
  const [open,setOpen]=useState(null);
  const faqs=[
    { q:"Quanto tempo demora a entrega em Nampula?", a:"Entregas em Nampula são realizadas em 1–2 dias úteis. Para outras províncias, entre 3–7 dias úteis dependendo da localização." },
    { q:"Posso trocar um produto se não servir?", a:"Sim! Aceitamos trocas em 30 dias após a compra, desde que o produto esteja em perfeito estado, com etiqueta e embalagem original." },
    { q:"Como sei qual tamanho escolher?", a:"Consulta o nosso Guia de Tamanhos com tabela de medidas detalhada. Em caso de dúvida, recomendamos escolher o tamanho maior." },
    { q:"Quais são as formas de pagamento?", a:"Aceitamos M-Pesa, e-Mola, transferência bancária (BCI, Millennium BIM) e pagamento na entrega para Nampula cidade." },
    { q:"Os produtos são originais?", a:"100%. Todos os produtos ZURA são originais, produzidos localmente em Moçambique com materiais de alta qualidade." },
    { q:"Fazem entregas para Cabo Delgado?", a:"Sim, entregamos em todo o país. Para zonas remotas, o prazo pode ser de até 10 dias úteis." },
    { q:"Como posso acompanhar o meu pedido?", a:"Após a confirmação do pagamento, receberás um código de rastreamento por SMS ou WhatsApp." },
    { q:"Posso cancelar um pedido?", a:"Podes cancelar até 2 horas após a confirmação. Contacta-nos via WhatsApp: +258 84 000 0000." },
  ];
  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <div style={{ maxWidth:720 }}>
        <div style={{ fontSize:"2.5rem",marginBottom:16 }}>❓</div>
        <h1 style={{ fontFamily:"Georgia,serif",fontSize:"2.2rem",marginBottom:12 }}>Perguntas Frequentes</h1>
        <p style={{ color:"#888",marginBottom:40,lineHeight:1.8 }}>Não encontraste resposta? Contacta-nos via WhatsApp.</p>
        {faqs.map((f,i)=>(
          <div key={i} style={{ borderBottom:"1px solid #2a2a2a" }}>
            <button onClick={()=>setOpen(open===i?null:i)} style={{ width:"100%",background:"none",border:"none",color:"#f0ece4",padding:"18px 0",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left",fontSize:"0.92rem" }}>
              <span>{f.q}</span>
              <span style={{ color:A,fontSize:"1.2rem",flexShrink:0,marginLeft:16 }}>{open===i?"−":"+"}</span>
            </button>
            {open===i&&<p style={{ color:"#888",lineHeight:1.8,fontSize:"0.88rem",paddingBottom:18,marginTop:-4 }}>{f.a}</p>}
          </div>
        ))}
      </div>
    </PageWrap>
  );
}

// ─── CONTACTO PAGE ────────────────────────────────────────────────────────────
function ContactoPage({ goBack, showToast }) {
  const [form,setForm]=useState({nome:"",email:"",tel:"",msg:""});
  function submit(){
    if(!form.nome||!form.msg){ showToast("Preenche o nome e a mensagem!"); return; }
    showToast("Mensagem enviada! Responderemos em breve 📩");
    setForm({nome:"",email:"",tel:"",msg:""});
  }
  return (
    <PageWrap>
      <BackBtn onClick={goBack}/>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:60 }}>
        <div>
          <div style={{ fontSize:"2.5rem",marginBottom:16 }}>📬</div>
          <h1 style={{ fontFamily:"Georgia,serif",fontSize:"2.2rem",marginBottom:16 }}>Contacto</h1>
          <p style={{ color:"#888",lineHeight:1.8,marginBottom:40,fontSize:"0.92rem" }}>Estamos à disposição para te ajudar. Responderemos em menos de 24 horas.</p>
          {[["📍","Morada","Nampula, Moçambique"],["📞","Telefone","+258 84 000 0000"],["✉️","Email","info@zurastore.co.mz"],["⏰","Horário","Seg–Sáb: 8h–17h"]].map(([ic,lab,val])=>(
            <div key={lab} style={{ display:"flex",gap:16,marginBottom:24 }}>
              <span style={{ fontSize:"1.3rem" }}>{ic}</span>
              <div>
                <div style={{ fontSize:"0.72rem",letterSpacing:1,textTransform:"uppercase",color:A,marginBottom:4 }}>{lab}</div>
                <div style={{ color:"#aaa",fontSize:"0.88rem" }}>{val}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h2 style={{ fontFamily:"Georgia,serif",fontSize:"1.4rem",marginBottom:28 }}>Envia uma mensagem</h2>
          {[["nome","Nome completo","text"],["email","Email","email"],["tel","Telefone","tel"]].map(([k,ph,type])=>(
            <input key={k} type={type} placeholder={ph} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}
              style={{ width:"100%",background:"#1e1e1e",border:"1px solid #2a2a2a",color:"#f0ece4",padding:"12px 14px",borderRadius:2,fontSize:"0.88rem",marginBottom:12,outline:"none",boxSizing:"border-box" }}/>
          ))}
          <textarea placeholder="A tua mensagem..." value={form.msg} onChange={e=>setForm({...form,msg:e.target.value})} rows={5}
            style={{ width:"100%",background:"#1e1e1e",border:"1px solid #2a2a2a",color:"#f0ece4",padding:"12px 14px",borderRadius:2,fontSize:"0.88rem",marginBottom:16,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit" }}/>
          <Btn onClick={submit} style={{ width:"100%",padding:14 }}>Enviar Mensagem</Btn>
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
          ["Loja",    [["Ver tudo","catalog"],["Mulher","catalog"],["Homem","catalog"],["Acessórios","catalog"],["Sale","catalog"]]],
          ["Ajuda",   [["Entregas","entregas"],["Devoluções","devolucoes"],["Tamanhos","tamanhos"],["FAQ","faq"]]],
          ["Empresa", [["Sobre Nós","sobre"],["Contacto","contacto"],["Carreiras","carreiras"]]],
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

// ─── CONTENT DATA ─────────────────────────────────────────────────────────────
const ENTREGAS = [
  { title:"Nampula Cidade", text:"Entrega em 1–2 dias úteis. Gratuita para compras acima de 3.000 MT." },
  { title:"Outras Províncias", text:"Entrega em 3–7 dias úteis via transportadoras parceiras. Taxa calculada no checkout com base na localização." },
  { title:"Zonas Remotas", text:"Para zonas de difícil acesso, o prazo pode ser de até 10 dias úteis. Entraremos em contacto para confirmar." },
  { title:"Acompanhamento", text:"Receberás um código de rastreamento por SMS/WhatsApp após o envio do teu pedido." },
  { title:"Horário de Entregas", text:"Segunda a sábado, das 8h às 17h. Não fazemos entregas aos domingos e feriados." },
];

const DEVOLUCOES = [
  { title:"Política de Trocas", text:"Aceitamos trocas em até 30 dias após a compra. O produto deve estar em perfeito estado, com etiqueta original e embalagem." },
  { title:"Como devolver", items:["Contacta-nos via WhatsApp com o número do pedido","Aguarda a confirmação e instruções de devolução","Envia o produto para a nossa morada em Nampula","Após recepção, processamos a troca em 3–5 dias úteis"] },
  { title:"Produtos não elegíveis", items:["Produtos lavados ou usados","Itens sem etiqueta original","Roupas íntimas por razões de higiene","Produtos em promoção final de série"] },
  { title:"Reembolsos", text:"Para produtos defeituosos, oferecemos reembolso total ou troca imediata. Reembolsos são processados em 5–10 dias úteis." },
];

const SOBRE = [
  { title:"A Nossa História", text:"A ZURA nasceu em Nampula em 2022, com uma missão simples: criar moda moçambicana que honra as nossas raízes e fala ao mundo moderno. Começámos com 3 pessoas e hoje chegamos a mais de 2.400 clientes em todo o país." },
  { title:"A Nossa Missão", text:"Celebrar a identidade moçambicana através da moda. Cada peça conta uma história — do capulana ao urbano, do artesão ao designer — sempre com qualidade premium e orgulho local." },
  { title:"Os Nossos Valores", items:["Autenticidade — produtos 100% originais e moçambicanos","Qualidade — materiais premium, acabamentos cuidados","Comunidade — apoiamos artesãos e designers locais","Sustentabilidade — práticas responsáveis e duradouras"] },
  { title:"Impacto Local", text:"Trabalhamos directamente com mais de 40 artesãos e costureiros de Nampula, Ilha de Moçambique e Maputo. Cada compra apoia directamente estas famílias." },
];

const CARREIRAS = [
  { title:"Trabalha connosco", text:"A ZURA está sempre à procura de pessoas apaixonadas por moda, cultura moçambicana e excelência. Se partilhas os nossos valores, queremos conhecer-te." },
  { title:"Vagas Actuais", items:["Designer de Moda — Nampula (presencial)","Gestor de Redes Sociais — Remoto","Responsável de Logística — Nampula","Atendimento ao Cliente — Nampula"] },
  { title:"Como Candidatar", text:"Envia o teu CV e portfólio (se aplicável) para carreiras@zurastore.co.mz com o título da vaga no assunto. Respondemos a todas as candidaturas em até 7 dias." },
  { title:"Estágios", text:"Recebemos estagiários nas áreas de design, marketing digital e gestão. Período mínimo de 3 meses. Contacta-nos para saber mais." },
];
