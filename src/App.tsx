import { useState, useEffect } from 'react'
import './index.css'

// ── PWA Install Hook ─────────────────────────────────────────────────────────
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true)
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    }
  }

  return { install, isIOS, isInstalled, deferredPrompt }
}

// ── Install Modal ────────────────────────────────────────────────────────────
function InstallModal({ onClose, pwaInstall }: { onClose: () => void, pwaInstall: ReturnType<typeof usePWAInstall> }) {
  const { install, isIOS, deferredPrompt } = pwaInstall
  const appUrl = window.location.href

  const copyLink = () => {
    navigator.clipboard.writeText(appUrl)
    alert("¡Enlace copiado!")
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Descargar Luquita PRO</h3>
        
        {isIOS ? (
          <div className="ios-install-guide">
            <p><strong>Para instalar en iPhone / iOS:</strong></p>
            <ol>
              <li>Toca el ícono de <strong>Compartir</strong> <span style={{fontSize:'1.2em'}}>⎋</span> en la barra inferior de Safari.</li>
              <li>Selecciona <strong>"Agregar a Inicio"</strong> (Add to Home Screen).</li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          <div className="android-install-guide">
            <p>Instala Luquita en tu dispositivo para un acceso rápido y sin conexión.</p>
            <button className="share-btn mb" style={{marginTop: 15}} onClick={() => { install(); onClose(); }}>
              ⬇️ Instalar Aplicación
            </button>
          </div>
        ) : (
          <div className="other-install-guide">
            <p>Abre esta página en Safari (iOS) o Chrome (Android) para instalar la aplicación móvil.</p>
          </div>
        )}

        <div className="copy-link-section">
          <p style={{marginTop: 15}}>O copia el enlace para abrirlo en tu navegador móvil:</p>
          <button className="nav-btn" style={{width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: '#fff'}} onClick={copyLink}>
            📋 Copiar Enlace
          </button>
        </div>

        <button className="nav-btn mt" style={{width: '100%', marginTop: 15, border: '1px solid rgba(255,255,255,0.05)'}} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}


// ── Tasas hardcoded (editables) ─────────────────────────────────────────────
const DEFAULT_RATES = {
  bcvUSD: 36.72,
  bcvEUR: 39.81,
  binance: 37.45,
}

// ── Visitas ──────────────────────────────────────────────────────────────────
function useVisits() {
  const [visits, setVisits] = useState(0)
  useEffect(() => {
    const k = 'luquita_visits'
    const n = parseInt(localStorage.getItem(k) || '0') + 1
    localStorage.setItem(k, String(n))
    setVisits(n)
  }, [])
  return visits
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function num(v: string) { return parseFloat(v.replace(',', '.')) || 0 }
function bs(n: number) {
  if (!n && n !== 0) return '—'
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Tipos de tab ─────────────────────────────────────────────────────────────
type Tab = 'inicio' | 'convertir' | 'graficos' | 'historial'

// ════════════════════════════════════════════════════════════════════════════
// APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState<Tab>('convertir')
  const [rates] = useState(DEFAULT_RATES)
  const visits = useVisits()
  const [showInstallModal, setShowInstallModal] = useState(false)
  const pwaInstall = usePWAInstall()
  const { isInstalled } = pwaInstall

  // Cambio manual
  const [tasaManual, setTasaManual] = useState('')
  const [monto, setMonto] = useState('')

  const tasaNum  = num(tasaManual)
  const montoNum = num(monto)
  const montoEntregado = tasaNum > 0 && montoNum > 0 ? tasaNum * montoNum : null

  // Diferencias (vs manual)
  function diff(rateEquiv: number) {
    if (!montoEntregado) return null
    const diffBs  = montoEntregado - rateEquiv
    const diffUSD = rates.bcvUSD > 0 ? diffBs / rates.bcvUSD : 0
    return { diffBs, diffUSD }
  }

  const bcvUSDEquiv  = montoNum * rates.bcvUSD
  const bcvEUREquiv  = montoNum * rates.bcvEUR
  const binanceEquiv = montoNum * rates.binance

  const diffBCV     = diff(bcvUSDEquiv)
  const diffEUR     = diff(bcvEUREquiv)
  const diffBinance = diff(binanceEquiv)

  return (
    <div className="app">
      <div className="app-bg" />
      <img src="/logo.png" className="logo-bg" alt="" />

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <img src="/logo.png" alt="Luquita" className="header-logo" />
          <div>
            <div className="header-name">Luquita<span>PRO</span></div>
          </div>
        </div>
        <div className="header-right">
          {!isInstalled && (
            <button className="icon-btn" style={{width: 'auto', padding: '0 12px', borderRadius: '18px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', borderColor: 'var(--accent-b)', background: 'var(--accent-d)'}} onClick={() => setShowInstallModal(true)}>
              Descargar
            </button>
          )}
          <button className="icon-btn" title="Actualizar">↻</button>
          <button className="icon-btn" title="Configuración">⚙</button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="main">
        {tab === 'inicio' && <InicioTab rates={rates} visits={visits} />}
        {tab === 'convertir' && (
          <ConvertirTab
            tasaManual={tasaManual} setTasaManual={setTasaManual}
            monto={monto} setMonto={setMonto}
            montoEntregado={montoEntregado}
            rates={rates}
            montoNum={montoNum}
            bcvUSDEquiv={bcvUSDEquiv}
            bcvEUREquiv={bcvEUREquiv}
            binanceEquiv={binanceEquiv}
            diffBCV={diffBCV}
            diffEUR={diffEUR}
            diffBinance={diffBinance}
          />
        )}
        {tab === 'graficos'  && <PlaceholderTab icon="📈" label="Gráficos próximamente" />}
        {tab === 'historial' && <PlaceholderTab icon="📋" label="Historial próximamente" />}
      </main>

      {/* ── Bottom nav ── */}
      <nav className="bottom-nav">
        {([
          { id: 'inicio',    icon: '🏠', label: 'Inicio'    },
          { id: 'convertir', icon: '💱', label: 'Convertir' },
          { id: 'graficos',  icon: '📊', label: 'Gráficos'  },
          { id: 'historial', icon: '📋', label: 'Historial' },
        ] as { id: Tab; icon: string; label: string }[]).map(t => (
          <button
            key={t.id}
            className={`nav-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Modals ── */}
      {showInstallModal && <InstallModal onClose={() => setShowInstallModal(false)} pwaInstall={pwaInstall} />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: INICIO
// ════════════════════════════════════════════════════════════════════════════
function InicioTab({ rates, visits }: { rates: typeof DEFAULT_RATES; visits: number }) {
  return (
    <div className="tab-content anim">
      <div className="card mb">
        <div className="card-header">
          <span className="chip chip-green">🇻🇪 TASA OFICIAL DE REFERENCIA</span>
        </div>
        <div style={{ padding: '16px 20px 20px' }}>
          <div className="rate-title">🇺🇸 DÓLAR BCV</div>
          <div className="rate-big">{rates.bcvUSD.toFixed(2)} <span className="rate-unit">Bs</span></div>
        </div>
      </div>

      <div className="section-label">TODAS LAS TASAS</div>
      <div className="card mb">
        {[
          { flag:'🇺🇸', name:'Dólar BCV',      sub:'Oficial Banco Central', val: rates.bcvUSD },
          { flag:'🇪🇺', name:'Euro BCV',       sub:'Oficial Banco Central', val: rates.bcvEUR },
          { flag:'₮',   name:'USDT Binance',   sub:'Referencia P2P Mercado', val: rates.binance },
        ].map((r, i) => (
          <div key={i} className={`rate-row${i < 2 ? ' bordered' : ''}`}>
            <div className="rate-row-left">
              <span className="rate-flag">{r.flag}</span>
              <div>
                <div className="rate-row-name">{r.name}</div>
                <div className="rate-row-sub">{r.sub}</div>
              </div>
            </div>
            <div className="rate-row-val">{r.val.toFixed(2)} Bs</div>
          </div>
        ))}
      </div>

      <div className="visits-bar">
        <span className="visits-dot" />
        VISITAS: <strong>{visits.toLocaleString()}</strong>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: CONVERTIR
// ════════════════════════════════════════════════════════════════════════════
interface ConvertirProps {
  tasaManual: string; setTasaManual: (v: string) => void
  monto: string; setMonto: (v: string) => void
  montoEntregado: number | null
  rates: typeof DEFAULT_RATES
  montoNum: number
  bcvUSDEquiv: number; bcvEUREquiv: number; binanceEquiv: number
  diffBCV: { diffBs: number; diffUSD: number } | null
  diffEUR: { diffBs: number; diffUSD: number } | null
  diffBinance: { diffBs: number; diffUSD: number } | null
}

function ConvertirTab({
  tasaManual, setTasaManual, monto, setMonto,
  montoEntregado, montoNum,
  bcvUSDEquiv, bcvEUREquiv, binanceEquiv,
  diffBCV, diffEUR, diffBinance,
}: ConvertirProps) {

  function share() {
    const txt = [
      `💱 Luquita PRO — Resultado`,
      `Tasa Manual: ${tasaManual} Bs/$`,
      `Monto: $${monto}`,
      `Entregado: ${montoEntregado ? bs(montoEntregado) : '—'} Bs`,
      diffBCV ? `vs BCV: ${diffBCV.diffBs >= 0 ? '+' : ''}${bs(diffBCV.diffBs)} Bs (${diffBCV.diffUSD >= 0 ? '+' : ''}${bs(Math.abs(diffBCV.diffUSD))} $)` : '',
    ].filter(Boolean).join('\n')
    if (navigator.share) navigator.share({ text: txt })
    else navigator.clipboard.writeText(txt)
  }

  return (
    <div className="tab-content">

      {/* ── CONFIGURACIÓN CAMBIO MANUAL ── */}
      <div className="card mb anim">
        <div className="card-header">
          <span>⚙</span>
          <span className="card-header-title">CONFIGURACIÓN CAMBIO MANUAL</span>
        </div>
        <div className="manual-grid">
          <div className="input-group">
            <label>TASA MANUAL (BS)</label>
            <input
              className="big-input"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={tasaManual}
              onChange={e => setTasaManual(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>MONTO A CAMBIAR ($)</label>
            <input
              className="big-input"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={monto}
              onChange={e => setMonto(e.target.value)}
            />
          </div>
        </div>
        <div className="result-row">
          <span className="result-label">MONTO ENTREGADO (BS)</span>
          <span className="result-value">
            {montoEntregado !== null ? `${bs(montoEntregado)} Bs` : '—'}
          </span>
        </div>
      </div>

      {/* ── TASA DÓLAR BCV ── */}
      <RateCard
        title="TASA DÓLAR BCV"
        symbol="$"
        chipLabel="USD"
        amount={montoNum}
        equiv={bcvUSDEquiv}
        equivLabel="EQUIVALENTE AL BCV"
        diff={diffBCV}
        diffLabel={d => d.diffBs >= 0 ? 'Diferencia a tu favor:' : 'Diferencia contra BCV:'}
        currency="$"
      />

      {/* ── TASA EURO BCV ── */}
      <RateCard
        title="TASA EURO BCV"
        symbol="€"
        chipLabel="EUR"
        amount={montoNum}
        equiv={bcvEUREquiv}
        equivLabel="EQUIVALENTE AL BCV"
        diff={diffEUR}
        diffLabel={d => d.diffBs >= 0 ? 'Diferencia a tu favor:' : 'Diferencia contra Euro:'}
        currency="€"
      />

      {/* ── TASA USDT BINANCE ── */}
      <RateCard
        title="TASA USDT BINANCE"
        symbol="₮"
        chipLabel="USDT"
        amount={montoNum}
        equiv={binanceEquiv}
        equivLabel="EQUIVALENTE BINANCE"
        diff={diffBinance}
        diffLabel={d => d.diffBs >= 0 ? 'Diferencia a tu favor:' : 'Diferencia bajo Binance:'}
        currency="$"
      />

      {/* ── Compartir ── */}
      <button className="share-btn mb" onClick={share}>
        📤 COMPARTIR RESULTADO
      </button>

      {/* ── Calculadoras adicionales ── */}
      <div className="section-label" style={{ marginTop: 4 }}>CALCULADORAS ADICIONALES</div>
      <div className="extras-grid">
        {['📊 Porcentaje', '💰 Interés', '📈 Inversión', '🏦 Ahorro'].map(l => (
          <button key={l} className="extra-btn">{l}</button>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// RATE CARD
// ════════════════════════════════════════════════════════════════════════════
interface RateCardProps {
  title: string
  symbol: string
  chipLabel: string
  amount: number
  equiv: number
  equivLabel: string
  diff: { diffBs: number; diffUSD: number } | null
  diffLabel: (d: { diffBs: number; diffUSD: number }) => string
  currency: string
}

function RateCard({ title, symbol, chipLabel, amount, equiv, equivLabel, diff, diffLabel, currency }: RateCardProps) {
  const positive = diff ? diff.diffBs >= 0 : true
  return (
    <div className="card mb anim">
      <div className="rate-card-header">
        <div>
          <div className="rate-card-title">{title}</div>
          <div className="rate-big-amount">
            <span className="currency-sym">{symbol}</span>
            {amount > 0 ? amount : '0'}
          </div>
        </div>
        <span className="chip chip-dark">{chipLabel}</span>
      </div>
      <div className="rate-card-body">
        <div className="equiv-label">{equivLabel}</div>
        <div className="equiv-value">
          Bs. {amount > 0 ? bs(equiv) : '0,00'}<span className="equiv-unit" />
        </div>
        {diff && (
          <div className={`diff-box${positive ? '' : ' diff-negative'}`}>
            <span className="diff-label">{diffLabel(diff)}</span>
            <div className="diff-values">
              <span className="diff-bs">
                {diff.diffBs >= 0 ? '+' : ''}{bs(diff.diffBs)} Bs
              </span>
              <span className="diff-usd">
                {diff.diffUSD >= 0 ? '+' : ''}{bs(Math.abs(diff.diffUSD))} {currency}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER
// ════════════════════════════════════════════════════════════════════════════
function PlaceholderTab({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="placeholder-tab">
      <span className="placeholder-icon">{icon}</span>
      <span className="placeholder-label">{label}</span>
    </div>
  )
}
