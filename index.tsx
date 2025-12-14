import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, update, remove, get } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAklmsuYWvws9GiMuKLRRG9NrW8wKgryeA",
  authDomain: "happyhome-bc5e7.firebaseapp.com",
  databaseURL: "https://happyhome-bc5e7-default-rtdb.firebaseio.com",
  projectId: "happyhome-bc5e7",
  storageBucket: "happyhome-bc5e7.firebasestorage.app",
  messagingSenderId: "1057692254640",
  appId: "1:1057692254640:web:529edffc6161fee4025675",
  measurementId: "G-8SQ0EGSFN1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const analytics = getAnalytics(app);

// --- Constants & Data Models ---
const DEFAULT_CHAINS = [
  "الفرجاني", "المحلاوي ماركت", "المحلاوي استورز", "هايبر المحلاوي",
  "العثيم ماركت", "هايبر القدس", "هايبر الشرقية", "أبا ماركت", "صن مول",
  "الجيزاوي", "أسواق الشرقية"
];

const DEFAULT_COMPANIES = ["Fine", "Zeina", "Papia & familia", "White", "Clasy", "GoodCare", "Dolphin"];

// Product Definitions based on prompt images
const SOFT_ROSE_PRODUCTS = {
  "مناديل سحب": [
    "Soft 500 single", "Soft 600 single", "Soft 400 3*1", "Soft 500 3*1 (3ply)",
    "Soft 500 (3*1) classic", "Soft 500 (3*1) smart", "Soft 600 (3*1) 3ply",
    "New mazika 220 (4*1)", "New Mazika 250 (5*1)"
  ],
  "مناديل مطبخ (Kitchen)": [
    "Kitchen 2 Rolls", "Kitchen 4 Rolls", "Kitchen 6 Rolls",
    "2 Rolls compress", "6 Rolls compress", "Mega Roll L", "Soft Rose XL", "Soft Rose XXL"
  ],
  "تواليت فنادق (Hotel Toilet)": [
    "Soft 2 Hotels Jumbo", "Soft 2 Hotels mauve", "Soft 2 Hotel Compress",
    "Soft 6 Hotels Jumbo", "Soft 6 Hotels mauve", "Soft 6 Hotel Compress"
  ],
  "Dolphin": [
    "Dolphin 2 Toilet Rolls", "Dolphin 9 Toilet Rolls", "Dolphin 18 Toilet Rolls", "Dolphin 24 Toilet Rolls"
  ]
};

const COMPETITOR_PRODUCTS_TEMPLATE = {
  "Fine": {
    "مناديل سحب": ["550 singel fluffy", "550 Singel Prestige", "550 singel claccic", "480 (4*1) Fluffy", "550 (3*1) classic", "550 (3*1) Fluffy", "550 (3*1) Prestige", "550 (6*1) Fluffy", "550 (6*1) Prestige"],
    "مناديل مطبخ": ["2 Rolls super towel", "2 Rolls duetto towel", "2 Rolls super towel pro", "6 Rolls super towel", "6 Rolls duetto towel", "6 Rolls super towel pr", "Mega Rool 480 sheets", "Super mega 375 sheets", "Super mega 700 sheets"],
    "تواليت": ["2 Toilet Deluxe", "2 Toilet comfort XL", "2 Toilet smart", "2 Toilet duetto", "6 Toilet duetto", "6 Toilet Deluxe", "6 Toilet comfort XL", "6 Toilet smart", "24 بكره comfort", "L", "XL", "XXL"]
  },
  "Zeina": {
    "مناديل سحب": ["550 Single classic", "550 Single Trio", "550 Single aroma", "400 (4*1) classic", "400 (4*1) trio", "550 (3*1) classic", "550 (3*1) Trio", "550 (3*1) aroma", "550 (6*1) classic", "550 (6*1) Trio", "777 (3*1)"],
    "مناديل مطبخ": ["2 Rolls classic", "2 Rolls Extra", "2 Rolls sponge", "2 Rolls Trio", "6 Rolls classic", "6 Rolls Extra", "6 Rolls sponge", "6 Rolls Trio", "Roll L", "Jumbo Xl", "Jumbo XXL"],
    "تواليت": ["2 Toilet compress", "6 Toilet compress", "6 Toilet Trio", "6 Toilet لافندر", "6 + 2 Toilet", "10 + 2 Toilet"]
  },
  "Papia & familia": {
    "مناديل سحب": ["550 papia Single", "550 papia (3*1) 2ply", "550 papia (3*1) 3 ply", "550 papia (6*1) 3 ply", "550 familia Single", "550 familia (3*1) 2ply", "550 familia (3*1) 3 ply", "550 familia (6*1) 3 ply", "700 familia (3*1)"],
    "مناديل مطبخ": ["2 Rolls papia", "4 Rolls papia", "6 Rolls papia", "2 Rolls Familia", "4 Rolls Familia", "6 Rolls Familia", "6+2 Rolls Familia", "Papia plus xl", "Papia plus XXL", "Familia XL", "Familia XXL"],
    "تواليت": ["2 Toilet papia", "4 Toilet papia", "6 Toilet papia", "2 Toilet familia", "4 Toilet familia", "6 Toilet familia", "24 Toilet"]
  },
  "White": {
    "مناديل سحب": ["550 single", "550 (3*1) L", "400 (3*1)", "550 (3*1) Flexi", "210 (5*1)"],
    "مناديل مطبخ": ["2 Rolls shef", "4 Rolls shef", "6 Rolls shef", "2 Rolls shef pro", "4 Rolls shef pro", "6 Rolls shef pro", "Mega Roll", "Maxx Roll"],
    "تواليت": ["2 Rolls compress", "6 Rolls compress", "12 Rolls compress"]
  },
  "GoodCare": {
    "مناديل سحب": ["550 single"],
    "تواليت": ["2 Toilet"],
    "مناديل مطبخ": ["2 kitchen", "6 Kitchen"]
  },
  "Generic": {
    "مناديل سحب": Array(5).fill(""),
    "تواليت": Array(5).fill(""),
    "مناديل مطبخ": Array(10).fill("")
  }
};

// --- Styles ---
const styles = {
  glass: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    color: '#fff',
  },
  glassInput: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#fff',
    padding: '8px',
    borderRadius: '6px',
    outline: 'none',
    width: '100%',
  },
  glassButton: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    padding: '8px 16px',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    transition: '0.3s',
    fontWeight: 'bold',
  },
  sectionHeader: {
    background: 'rgba(255, 255, 255, 0.2)',
    padding: '10px',
    borderRadius: '4px',
    margin: '10px 0',
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center' as const,
  }
};

// --- Helper Functions ---
const exportToExcel = (data: any[], fileName: string) => {
  // @ts-ignore
  if (typeof XLSX === 'undefined') {
    alert("Excel library loading...");
    return;
  }
  // @ts-ignore
  const ws = XLSX.utils.json_to_sheet(data);
  // @ts-ignore
  const wb = XLSX.utils.book_new();
  // @ts-ignore
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  // @ts-ignore
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// --- Components ---

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
  }).format(time);

  return <div style={{ fontSize: '0.9rem', color: '#eee' }}>{formatDate}</div>;
};

// --- Main App Component ---

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [theme, setTheme] = useState('glass'); // glass, light, dark
  const [currentPage, setCurrentPage] = useState('home');
  const [appData, setAppData] = useState<any>({
    chains: DEFAULT_CHAINS,
    companies: DEFAULT_COMPANIES,
    prices: {},
    contacts: [],
    settings: {
      appName: 'Modern Trade Soft Rose',
      sidebarItems: [
        { id: 'softrose', label: 'أسعار سوفت روز' },
        { id: 'competitors', label: 'أسعار الشركات المنافسة' },
        { id: 'registered', label: 'الأسعار المسجلة' },
        { id: 'contacts', label: 'أرقام السلاسل' }
      ]
    }
  });

  // Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authError, setAuthError] = useState('');

  // Refs for printing
  const printRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  useEffect(() => {
    // Online Users Counter
    const onlineRef = ref(db, 'info/connected');
    const connectedRef = ref(db, '.info/connected');
    const userStatusRef = ref(db, 'status/' + (user ? user.username : 'guest-' + Date.now()));
    
    // Listen for connection state
    const unsubConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // We're connected (or reconnected)!
        const con = push(ref(db, 'onlineUsers'));
        // When I disconnect, remove this device
        // @ts-ignore - onDisconnect type mismatch in some versions
        // onDisconnect(con).remove();
        // For simple counter, let's just listen to a value in DB
      }
    });

    // Simple online count simulation
    const countRef = ref(db, 'onlineCount');
    const unsubCount = onValue(countRef, (s) => setOnlineCount(s.val() || 1));

    // Load App Data
    const dataRef = ref(db, 'appData');
    const unsubData = onValue(dataRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setAppData(prev => ({ ...prev, ...val }));
      } else {
        // Initialize if empty
        set(ref(db, 'appData'), appData);
      }
    });

    return () => {
      unsubConnected();
      unsubCount();
      unsubData();
    };
  }, [user]);

  // Update Online Count when user logs in
  useEffect(() => {
    if (user) {
      const countRef = ref(db, 'onlineCount');
      get(countRef).then(snap => {
        const current = snap.val() || 0;
        set(countRef, current + 1);
      });
      return () => {
        get(countRef).then(snap => {
          const current = snap.val() || 1;
          set(countRef, current - 1);
        });
      }
    }
  }, [user]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === 'admin' && loginPass === 'admin') {
      setUser({ username: 'admin', role: 'admin' });
      return;
    }

    // Check registered users
    const usersRef = ref(db, 'users');
    const snap = await get(usersRef);
    let found = false;
    if (snap.exists()) {
      snap.forEach(child => {
        const u = child.val();
        if (u.username === loginUser && u.password === loginPass) {
          setUser(u);
          found = true;
        }
      });
    }

    if (!found) setAuthError('بيانات الدخول غير صحيحة');
  };

  const handleLogout = () => {
    setUser(null);
    setLoginUser('');
    setLoginPass('');
    setCurrentPage('home');
  };

  // --- Theme Styles ---
  const getThemeStyle = () => {
    if (theme === 'light') return { background: '#f8fafc', color: '#1e293b' };
    if (theme === 'dark') return { background: '#0f172a', color: '#fff' };
    // Glass (Default)
    return { 
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', // Deep Blue base
      color: '#fff',
      minHeight: '100vh'
    };
  };

  const containerClass = theme === 'glass' ? styles.glass : {
    background: theme === 'light' ? '#fff' : '#1e293b',
    color: theme === 'light' ? '#000' : '#fff',
    border: '1px solid #ccc',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  };

  // --- Sub-Components for Pages ---

  const Sidebar = () => (
    <div style={{ ...containerClass, width: '250px', display: 'flex', flexDirection: 'column', padding: '20px', gap: '15px', height: '90vh', position: 'sticky', top: '20px' }} className="no-print">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{appData.settings.appName}</h2>
      {appData.settings.sidebarItems.map((item: any) => (
        <button 
          key={item.id}
          style={styles.glassButton}
          onClick={() => setCurrentPage(item.id)}
        >
          {item.label}
        </button>
      ))}
      <div style={{ marginTop: 'auto' }}>
        <button style={{ ...styles.glassButton, width: '100%', background: 'rgba(200, 50, 50, 0.4)' }} onClick={() => setCurrentPage('home')}>الصفحة الرئيسية</button>
      </div>
      <div style={{ fontSize: '0.8rem', textAlign: 'center', opacity: 0.7 }}>
        <p>مع تحيات المطور<br/>Amir Lamay</p>
      </div>
    </div>
  );

  const TopBar = () => (
    <div style={{ ...containerClass, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }} className="no-print">
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button style={styles.glassButton} onClick={() => setCurrentPage('settings')}>⚙️ الإعدادات</button>
        <select 
          style={styles.glassInput} 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="glass">زجاجي (Windows 10)</option>
          <option value="light">فاتح</option>
          <option value="dark">داكن</option>
        </select>
      </div>
      <Clock />
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span>المستخدمين: {onlineCount}</span>
        <button style={{ ...styles.glassButton, background: 'red' }} onClick={handleLogout}>خروج</button>
      </div>
    </div>
  );

  // --- Views ---

  // 1. Soft Rose Prices
  const SoftRoseView = () => {
    const [chain, setChain] = useState('');
    const [showPrices, setShowPrices] = useState(false);
    const [prices, setPrices] = useState<any>({});
    const [customItems, setCustomItems] = useState<any>({});

    useEffect(() => {
      if (chain && appData.prices && appData.prices[chain] && appData.prices[chain]['SoftRose']) {
        setPrices(appData.prices[chain]['SoftRose']);
      } else {
        setPrices({});
      }
    }, [chain]);

    const handlePriceChange = (category: string, item: string, val: string) => {
      setPrices((prev: any) => ({
        ...prev,
        [category]: { ...prev[category], [item]: val }
      }));
    };

    const savePrices = () => {
      if (!chain) return alert("اختر سلسلة أولاً");
      update(ref(db, `appData/prices/${chain}/SoftRose`), prices);
      alert("تم الحفظ بنجاح");
    };

    const printPrices = () => {
      window.print();
    };

    const addChain = () => {
      const name = prompt("اسم السلسلة الجديدة:");
      if (name) {
        const newChains = [...appData.chains, name];
        update(ref(db, 'appData'), { chains: newChains });
      }
    };

    const exportExcel = () => {
        let rows: any[] = [];
        Object.keys(SOFT_ROSE_PRODUCTS).forEach(cat => {
            // @ts-ignore
            SOFT_ROSE_PRODUCTS[cat].forEach(item => {
                const p = prices[cat]?.[item] || "";
                rows.push({ "الصنف": item, "السعر": p, "القسم": cat });
            });
        });
        exportToExcel(rows, `SoftRose_${chain || 'Prices'}`);
    }

    return (
      <div style={{...containerClass, padding: '20px', flex: 1}}>
         <div className="no-print">
            <h2 style={{borderBottom: '1px solid white', paddingBottom: '10px'}}>أسعار سوفت روز</h2>
            <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px'}}>
            <label>اسم السلسلة:</label>
            <select style={styles.glassInput} value={chain} onChange={e => setChain(e.target.value)}>
                <option value="">اختر السلسلة</option>
                {appData.chains.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button style={styles.glassButton} onClick={addChain}>+ سلسلة جديدة</button>
            <button style={styles.glassButton} onClick={() => setShowPrices(true)}>اظهر الأسعار</button>
            <button style={{...styles.glassButton, background: 'green'}} onClick={exportExcel}>تصدير Excel</button>
            </div>
        </div>

        {showPrices && (
          <div ref={printRef} className="print-area">
            <div className="print-header" style={{display: 'none', textAlign: 'center', marginBottom: '20px'}}>
                <h1>أسعار سوفت روز - {chain}</h1>
                <p>{new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            <div className="no-print" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '10px'}}>
              <button style={styles.glassButton} onClick={savePrices}>💾 حفظ</button>
              <button style={styles.glassButton} onClick={printPrices}>🖨 طباعة</button>
            </div>
            
            {Object.entries(SOFT_ROSE_PRODUCTS).map(([category, items]) => (
              <div key={category} style={{marginBottom: '20px'}}>
                <div style={styles.sectionHeader}>{category}</div>
                <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', fontWeight: 'bold', marginBottom: '5px', padding: '0 10px'}}>
                    <div>الصنف</div>
                    <div>السعر</div>
                </div>
                {/* @ts-ignore */}
                {items.map((item: string) => (
                  <div key={item} style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '5px', alignItems: 'center', padding: '5px', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                    <div>{item}</div>
                    <input 
                      type="number" 
                      style={{...styles.glassInput, textAlign: 'center'}} 
                      value={prices[category]?.[item] || ''} 
                      onChange={(e) => handlePriceChange(category, item, e.target.value)}
                    />
                  </div>
                ))}
                {/* Extra dynamic fields */}
                {[...Array(10)].map((_, i) => {
                    const extraKey = `extra_${i}`;
                    return (
                        <div key={i} style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '5px'}}>
                            <input 
                                placeholder="صنف إضافي"
                                style={styles.glassInput}
                                value={prices[category]?.[`${extraKey}_name`] || ''}
                                onChange={e => handlePriceChange(category, `${extraKey}_name`, e.target.value)}
                            />
                            <input 
                                placeholder="السعر"
                                type="number"
                                style={styles.glassInput}
                                value={prices[category]?.[`${extraKey}_price`] || ''}
                                onChange={e => handlePriceChange(category, `${extraKey}_price`, e.target.value)}
                            />
                        </div>
                    )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 2. Competitor Prices
  const CompetitorView = () => {
    const [chain, setChain] = useState('');
    const [company, setCompany] = useState('');
    const [prices, setPrices] = useState<any>({});
    const [products, setProducts] = useState<any>(null);

    const loadPrices = () => {
      if(!chain || !company) return;
      // Define products based on company or generic
      // @ts-ignore
      let defaultProds = COMPETITOR_PRODUCTS_TEMPLATE[company] || COMPETITOR_PRODUCTS_TEMPLATE['Generic'];
      
      // Load saved data
      const savedData = appData.prices[chain]?.[company] || {};
      setPrices(savedData);
      setProducts(defaultProds);
    };

    const handlePriceChange = (category: string, itemIdx: any, field: 'name' | 'price', value: string) => {
      setPrices((prev: any) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [itemIdx]: { ...prev[category]?.[itemIdx], [field]: value }
        }
      }));
    };

    const savePrices = () => {
        if(!chain || !company) return;
        update(ref(db, `appData/prices/${chain}/${company}`), prices);
        alert("تم الحفظ");
    };
    
    const addCompany = () => {
        const name = prompt("اسم الشركة:");
        if (name) {
            const newComps = [...appData.companies, name];
            update(ref(db, 'appData'), { companies: newComps });
        }
    };

    const printPrices = () => window.print();

    const exportExcel = () => {
        let rows: any[] = [];
        if(products) {
            Object.keys(products).forEach(cat => {
                // Predefined
                products[cat].forEach((item: string, idx: number) => {
                     // Check if overwritten in prices state or use default name
                     const pName = prices[cat]?.[`pre_${idx}`]?.name || item;
                     const pPrice = prices[cat]?.[`pre_${idx}`]?.price || "";
                     rows.push({ "الشركة": company, "القسم": cat, "الصنف": pName, "السعر": pPrice });
                });
                // Extras
                 [...Array(10)].forEach((_, i) => {
                    const pName = prices[cat]?.[`extra_${i}`]?.name;
                    const pPrice = prices[cat]?.[`extra_${i}`]?.price;
                    if(pName || pPrice) {
                        rows.push({ "الشركة": company, "القسم": cat, "الصنف": pName, "السعر": pPrice });
                    }
                 });
            });
        }
        exportToExcel(rows, `Competitor_${company}_${chain}`);
    }


    return (
      <div style={{...containerClass, padding: '20px', flex: 1}}>
        <div className="no-print">
            <h2>أسعار الشركات المنافسة</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px'}}>
                <div style={{display: 'flex', gap: '10px'}}>
                    <select style={styles.glassInput} value={chain} onChange={e => setChain(e.target.value)}>
                        <option value="">اختر السلسلة</option>
                        {appData.chains.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select style={styles.glassInput} value={company} onChange={e => setCompany(e.target.value)}>
                        <option value="">اختر الشركة</option>
                        {appData.companies.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button style={styles.glassButton} onClick={addCompany}>+ شركة</button>
                    <button style={styles.glassButton} onClick={loadPrices}>أضف/عرض الأسعار</button>
                </div>
            </div>
        </div>

        {products && (
            <div className="print-area">
                <div className="print-header" style={{display: 'none', textAlign: 'center'}}>
                    <h1>{company} - {chain}</h1>
                </div>
                <div className="no-print" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '10px'}}>
                    <button style={styles.glassButton} onClick={savePrices}>💾 حفظ</button>
                    <button style={styles.glassButton} onClick={printPrices}>🖨 طباعة</button>
                    <button style={{...styles.glassButton, background: 'green'}} onClick={exportExcel}>Excel</button>
                </div>

                {Object.keys(products).map(cat => (
                    <div key={cat} style={{marginBottom: '15px'}}>
                        <div style={{...styles.sectionHeader, background: '#ccc', color: '#000'}}>{cat}</div>
                        {/* Predefined Items */}
                        {products[cat].map((item: string, idx: number) => (
                            <div key={`pre_${idx}`} style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '5px'}}>
                                <input 
                                    style={styles.glassInput} 
                                    defaultValue={item}
                                    value={prices[cat]?.[`pre_${idx}`]?.name !== undefined ? prices[cat][`pre_${idx}`].name : item}
                                    onChange={(e) => handlePriceChange(cat, `pre_${idx}`, 'name', e.target.value)}
                                />
                                <input 
                                    type="number" 
                                    placeholder="السعر"
                                    style={styles.glassInput}
                                    value={prices[cat]?.[`pre_${idx}`]?.price || ''}
                                    onChange={(e) => handlePriceChange(cat, `pre_${idx}`, 'price', e.target.value)}
                                />
                            </div>
                        ))}
                        {/* Extra Items (5-10 slots) */}
                         {[...Array(10)].map((_, i) => (
                            <div key={`extra_${i}`} style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '5px'}}>
                                <input 
                                    placeholder="صنف إضافي"
                                    style={styles.glassInput}
                                    value={prices[cat]?.[`extra_${i}`]?.name || ''}
                                    onChange={(e) => handlePriceChange(cat, `extra_${i}`, 'name', e.target.value)}
                                />
                                <input 
                                    type="number" 
                                    placeholder="السعر"
                                    style={styles.glassInput}
                                    value={prices[cat]?.[`extra_${i}`]?.price || ''}
                                    onChange={(e) => handlePriceChange(cat, `extra_${i}`, 'price', e.target.value)}
                                />
                            </div>
                        ))}
                        {/* Button to add price inside section handled by just having empty slots */}
                    </div>
                ))}
                 <div className="no-print" style={{marginTop: '20px'}}>
                    <button style={{...styles.glassButton, width: '100%'}} onClick={savePrices}>أضف الأسعار (حفظ)</button>
                 </div>
            </div>
        )}
      </div>
    );
  };

  // 3. Registered Prices & Reports
  const ReportsView = () => {
    const [chain, setChain] = useState('');
    const [company, setCompany] = useState('');
    const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
    const [reportData, setReportData] = useState<any>(null);

    const generateReport = (mode: 'single' | 'all') => {
        if(!chain) return alert("اختر السلسلة");
        
        const chainData = appData.prices[chain] || {};
        let data: any = {};

        if (mode === 'single') {
            if(!company) return alert("اختر الشركة");
            if (company === 'Soft Rose') {
                 data['Soft Rose'] = chainData['SoftRose'];
            } else {
                 data[company] = chainData[company];
            }
        } else {
            // All companies including Soft Rose
            if(chainData['SoftRose']) data['Soft Rose'] = chainData['SoftRose'];
            appData.companies.forEach((c: string) => {
                if(chainData[c]) data[c] = chainData[c];
            });
        }
        setReportData(data);
        setViewMode(mode);
    };

    const renderCompanyTable = (compName: string, compData: any) => {
        if(!compData) return null;
        
        // Flatten data for display
        // Logic depends on structure difference between SoftRose and Competitors
        let rows: any[] = [];
        
        Object.keys(compData).forEach(cat => {
            if (compName === 'Soft Rose') {
                // Soft Rose structure: { Category: { ItemName: Price } }
                 Object.entries(compData[cat]).forEach(([item, price]) => {
                     // Filter out empty extra fields
                     if(item.includes('_name') && !price) return; 
                     if(item.includes('_price')) return; // handle pairs
                     // For saved SoftRose, logic is simpler if we just iterate keys
                     // But we have custom structure there. 
                     // Let's assume standard key-value for Soft Rose base items
                     if(!item.includes('_')) {
                         rows.push({cat, item, price});
                     } else if (item.includes('_name')) {
                         const id = item.split('_name')[0];
                         const p = compData[cat][`${id}_price`];
                         if(price || p) rows.push({cat, item: price, price: p});
                     }
                 });
            } else {
                // Competitor structure: { Category: { pre_0: {name, price} } }
                Object.values(compData[cat] || {}).forEach((val: any) => {
                    if(val && val.name && val.price) {
                        rows.push({cat, item: val.name, price: val.price});
                    }
                });
            }
        });

        return (
            <div className="company-report-block" style={{border: '1px solid #ccc', padding: '10px', margin: '5px', width: '30%', breakInside: 'avoid'}}>
                <h3 style={{textAlign: 'center', background: '#eee', color: '#000', padding: '5px'}}>{compName}</h3>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '12px'}}>
                    <thead>
                        <tr style={{borderBottom: '1px solid #000'}}>
                            <th>الصنف</th>
                            <th>السعر</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} style={{borderBottom: '1px solid #ddd'}}>
                                <td>{r.item}</td>
                                <td>{r.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div style={{...containerClass, padding: '20px', flex: 1}}>
            <div className="no-print">
                <h2>الأسعار المسجلة</h2>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
                    <select style={styles.glassInput} value={chain} onChange={e => setChain(e.target.value)}>
                        <option value="">اختر السلسلة</option>
                        {appData.chains.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select style={styles.glassInput} value={company} onChange={e => setCompany(e.target.value)}>
                        <option value="">اختر الشركة</option>
                        <option value="Soft Rose">أسعار سوفت روز</option>
                        {appData.companies.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    
                    <button style={styles.glassButton} onClick={() => generateReport('single')}>اظهر الأسعار</button>
                    <button style={{...styles.glassButton, background: '#eab308'}} onClick={() => generateReport('all')}>الأسعار كاملة</button>
                </div>
            </div>

            {reportData && (
                <div className="print-area">
                    <div className="no-print" style={{margin: '10px 0'}}>
                        <button style={styles.glassButton} onClick={() => window.print()}>طباعة التقرير</button>
                    </div>
                    
                    <div className="print-header" style={{textAlign: 'center', marginBottom: '20px'}}>
                         <h1>تقرير الأسعار - {chain}</h1>
                         <h3>{new Date().getFullYear()}</h3>
                    </div>

                    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
                        {Object.keys(reportData).map(cName => (
                            <React.Fragment key={cName}>
                                {renderCompanyTable(cName, reportData[cName])}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
  };

  // 4. Chain Numbers (Contacts)
  const ContactsView = () => {
    const [contacts, setContacts] = useState<any[]>([]);
    const [newContact, setNewContact] = useState({
        chain: '', branch: '', manager: '', managerPhone: '', supervisor: '', supervisorPhone: ''
    });

    useEffect(() => {
        if(appData.contacts) setContacts(appData.contacts);
    }, [appData]);

    const saveContact = () => {
        if(!newContact.chain) return alert("ادخل اسم السلسلة");
        const updated = [...contacts, { ...newContact, id: Date.now() }];
        update(ref(db, 'appData'), { contacts: updated });
        setNewContact({ chain: '', branch: '', manager: '', managerPhone: '', supervisor: '', supervisorPhone: '' });
    };

    const deleteContact = (id: number) => {
        const updated = contacts.filter(c => c.id !== id);
        update(ref(db, 'appData'), { contacts: updated });
    };

    const exportExcel = () => {
        exportToExcel(contacts, "Chain_Contacts");
    };

    return (
        <div style={{...containerClass, padding: '20px', flex: 1}}>
            <h2>أرقام السلاسل</h2>
            <div className="no-print" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px'}}>
                <select style={styles.glassInput} value={newContact.chain} onChange={e => setNewContact({...newContact, chain: e.target.value})}>
                    <option value="">اسم السلسلة</option>
                    {appData.chains.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="الفرع" style={styles.glassInput} value={newContact.branch} onChange={e => setNewContact({...newContact, branch: e.target.value})} />
                <div />
                <input placeholder="مدير الفرع" style={styles.glassInput} value={newContact.manager} onChange={e => setNewContact({...newContact, manager: e.target.value})} />
                <input placeholder="رقم الهاتف" style={styles.glassInput} value={newContact.managerPhone} onChange={e => setNewContact({...newContact, managerPhone: e.target.value})} />
                <div />
                <input placeholder="مشرف الفرع" style={styles.glassInput} value={newContact.supervisor} onChange={e => setNewContact({...newContact, supervisor: e.target.value})} />
                <input placeholder="رقم الهاتف" style={styles.glassInput} value={newContact.supervisorPhone} onChange={e => setNewContact({...newContact, supervisorPhone: e.target.value})} />
                <button style={{...styles.glassButton, background: 'green'}} onClick={saveContact}>أضف</button>
            </div>

            <button style={{...styles.glassButton, marginBottom: '10px'}} onClick={exportExcel}>تصدير Excel</button>

            <table style={{width: '100%', borderCollapse: 'collapse', color: 'inherit'}}>
                <thead>
                    <tr style={{background: 'rgba(255,255,255,0.2)'}}>
                        <th style={{padding: '10px'}}>السلسلة</th>
                        <th>الفرع</th>
                        <th>المدير</th>
                        <th>تليفون المدير</th>
                        <th>المشرف</th>
                        <th>تليفون المشرف</th>
                        <th className="no-print">تحكم</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.map((c, i) => (
                        <tr key={i} style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                            <td style={{padding: '10px'}}>{c.chain}</td>
                            <td>{c.branch}</td>
                            <td>{c.manager}</td>
                            <td>{c.managerPhone}</td>
                            <td>{c.supervisor}</td>
                            <td>{c.supervisorPhone}</td>
                            <td className="no-print">
                                <button style={{color: 'red', background: 'none', border: 'none', cursor: 'pointer'}} onClick={() => deleteContact(c.id)}>حذف</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
  };

  // 5. Settings
  const SettingsView = () => {
    const [appName, setAppName] = useState(appData.settings.appName);
    const [users, setUsers] = useState<any[]>([]);
    const [newUser, setNewUser] = useState({ username: '', password: '' });

    useEffect(() => {
        // Load users
        get(ref(db, 'users')).then(snap => {
            if(snap.exists()) setUsers(Object.values(snap.val()));
        });
    }, []);

    const saveSettings = () => {
        update(ref(db, 'appData/settings'), { appName });
        alert("تم حفظ الإعدادات");
    };

    const addUser = () => {
        if(users.length >= 50) return alert("الحد الأقصى 50 مستخدم");
        if(!newUser.username || !newUser.password) return;
        
        const userRef = push(ref(db, 'users'));
        set(userRef, { ...newUser, id: userRef.key });
        setUsers([...users, { ...newUser, id: userRef.key }]);
        setNewUser({ username: '', password: '' });
    };

    const deleteUser = (uid: string) => {
        remove(ref(db, `users/${uid}`));
        setUsers(users.filter(u => u.id !== uid));
    };

    return (
        <div style={{...containerClass, padding: '20px', flex: 1}}>
            <h2>الإعدادات</h2>
            <div style={{marginBottom: '20px'}}>
                <label>اسم البرنامج:</label>
                <input style={styles.glassInput} value={appName} onChange={e => setAppName(e.target.value)} />
                <button style={{...styles.glassButton, marginTop: '10px'}} onClick={saveSettings}>حفظ الاسم</button>
            </div>

            <hr style={{borderColor: 'rgba(255,255,255,0.2)'}} />
            
            <h3>إدارة المستخدمين ({users.length}/50)</h3>
            <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                <input placeholder="اسم المستخدم" style={styles.glassInput} value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                <input placeholder="كلمة المرور" style={styles.glassInput} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                <button style={styles.glassButton} onClick={addUser}>إضافة مستخدم</button>
            </div>
            
            <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                {users.map(u => (
                    <div key={u.id} style={{display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.2)', marginBottom: '5px', borderRadius: '4px'}}>
                        <span>{u.username}</span>
                        <button onClick={() => deleteUser(u.id)} style={{color: 'red', background: 'none', border: 'none', cursor: 'pointer'}}>حذف</button>
                    </div>
                ))}
            </div>
        </div>
    )
  };

  // --- Main Render ---

  if (!user) {
    return (
      <div style={{ ...styles.glass, height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '40px', borderRadius: '16px', width: '300px', backdropFilter: 'blur(20px)' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>تسجيل الدخول</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="اسم المستخدم" style={styles.glassInput} value={loginUser} onChange={e => setLoginUser(e.target.value)} />
            <input type="password" placeholder="كلمة المرور" style={styles.glassInput} value={loginPass} onChange={e => setLoginPass(e.target.value)} />
            <button type="submit" style={{ ...styles.glassButton, background: '#3b82f6' }}>دخول</button>
            {authError && <p style={{ color: '#f87171', textAlign: 'center' }}>{authError}</p>}
          </form>
        </div>
      </div>
    );
  }

  // Inject Print CSS
  const printStyles = `
    @media print {
        @page { size: landscape; margin: 10mm; }
        body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
        .print-area { display: block !important; width: 100%; }
        .print-header { display: block !important; }
        input { border: none !important; background: transparent !important; color: black !important; }
        /* Make report blocks align nicely */
        .company-report-block { width: 30% !important; float: right; margin: 1%; page-break-inside: avoid; }
    }
  `;

  return (
    <div style={{ display: 'flex', ...getThemeStyle() }}>
      <style>{printStyles}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' }}>
            {currentPage === 'home' && (
                <div style={{textAlign: 'center', marginTop: '100px'}}>
                    <h1>مرحباً بك في {appData.settings.appName}</h1>
                    <p>اختر من القائمة الجانبية للبدء</p>
                </div>
            )}
            {currentPage === 'softrose' && <SoftRoseView />}
            {currentPage === 'competitors' && <CompetitorView />}
            {currentPage === 'registered' && <ReportsView />}
            {currentPage === 'contacts' && <ContactsView />}
            {currentPage === 'settings' && <SettingsView />}
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
