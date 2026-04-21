'use client'
import { useState, useRef, useCallback } from 'react'

const COLS = 15
const ROWS = 15

const wordsData = {
  '1V': { answer: 'LUMEN',      dir: 'V', r: 0,  c: 14 },
  '2V': { answer: 'INNOVACION', dir: 'V', r: 1,  c: 13 },
  '3H': { answer: 'INCLUSION',  dir: 'H', r: 4,  c: 6  },
  '4H': { answer: 'COMUNIDAD',  dir: 'H', r: 6,  c: 6  },
  '5H': { answer: 'STARMAKER',  dir: 'H', r: 8,  c: 2  },
  '6V': { answer: 'STELLAR',    dir: 'V', r: 8,  c: 2  },
  '7H': { answer: 'EMBAJADOR',  dir: 'H', r: 10, c: 2  },
  '8H': { answer: 'XLM',        dir: 'H', r: 11, c: 1  },
}

const numMap = { '1V': 1, '2V': 2, '3H': 3, '4H': 4, '5H': 5, '6V': 6, '7H': 7, '8H': 8 }

const rc = (r, c) => `${r},${c}`

// Build cell data once at module level
const cellData = {}
for (const [wid, w] of Object.entries(wordsData)) {
  for (let i = 0; i < w.answer.length; i++) {
    const r = w.dir === 'V' ? w.r + i : w.r
    const c = w.dir === 'H' ? w.c + i : w.c
    const k = rc(r, c)
    if (!cellData[k]) cellData[k] = { letter: w.answer[i], wids: [], num: null }
    cellData[k].wids.push(wid)
  }
}
for (const [wid, w] of Object.entries(wordsData)) {
  const k = rc(w.r, w.c)
  const n = numMap[wid]
  if (!cellData[k].num || n < cellData[k].num) cellData[k].num = n
}

function getWordCells(wid) {
  const w = wordsData[wid]
  return Array.from({ length: w.answer.length }, (_, i) =>
    rc(w.dir === 'V' ? w.r + i : w.r, w.dir === 'H' ? w.c + i : w.c)
  )
}

const cluesH = [
  { wid: '3H', n: 3, text: 'Objetivo clave de Stellar: acceso financiero para todos.' },
  { wid: '4H', n: 4, text: 'Grupo de personas que colaboran y crecen dentro del ecosistema.' },
  { wid: '5H', n: 5, text: 'Nombre del programa de embajadores de Stellar x BAF en Latam.' },
  { wid: '7H', n: 7, text: 'Persona que representa y promueve la comunidad en su región.' },
  { wid: '8H', n: 8, text: 'Token nativo usado para pagar comisiones en la red.' },
]

const cluesV = [
  { wid: '1V', n: 1, text: 'Nombre completo de la moneda de Stellar.' },
  { wid: '2V', n: 2, text: 'Motor que impulsa nuevas soluciones dentro del ecosistema.' },
  { wid: '6V', n: 6, text: 'Red blockchain enfocada en pagos rápidos y accesibles a nivel global.' },
]

export default function Crucigrama() {
  const [values, setValues] = useState({})
  const [cellStates, setCellStates] = useState({})
  const [activeWord, setActiveWord] = useState(null)
  const [highlighted, setHighlighted] = useState([])
  const [msg, setMsg] = useState(null)

  // Refs to avoid stale closures in event handlers
  const activeWordRef = useRef(null)
  const valuesRef = useRef({})
  const inputRefs = useRef({})

  const doHighlight = useCallback((wid) => {
    activeWordRef.current = wid
    setActiveWord(wid)
    setHighlighted(wid ? getWordCells(wid) : [])
  }, [])

  const handleFocus = useCallback((k) => {
    const wids = cellData[k]?.wids || []
    if (wids.length === 0) return
    if (wids.length === 1) {
      doHighlight(wids[0])
      return
    }
    const current = activeWordRef.current
    const next = current && wids.includes(current)
      ? wids[(wids.indexOf(current) + 1) % wids.length]
      : wids[0]
    doHighlight(next)
  }, [doHighlight])

  const handleChange = useCallback((k, rawValue) => {
    const letters = rawValue.replace(/[^a-zA-Z]/g, '').toUpperCase()
    const letter = letters ? letters[letters.length - 1] : ''

    const newValues = { ...valuesRef.current, [k]: letter }
    if (!letter) delete newValues[k]
    valuesRef.current = newValues
    setValues({ ...newValues })
    setCellStates(prev => ({ ...prev, [k]: '' }))

    if (letter) {
      const aw = activeWordRef.current
      if (aw) {
        const cells = getWordCells(aw)
        const i = cells.indexOf(k)
        if (i < cells.length - 1) {
          setTimeout(() => inputRefs.current[cells[i + 1]]?.focus(), 0)
        }
      }
    }
  }, [])

  const handleKeyDown = useCallback((e, k) => {
    if (e.key === 'Backspace') {
      if (!valuesRef.current[k]) {
        e.preventDefault()
        const aw = activeWordRef.current
        if (aw) {
          const cells = getWordCells(aw)
          const i = cells.indexOf(k)
          if (i > 0) inputRefs.current[cells[i - 1]]?.focus()
        }
      }
      return
    }

    if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault()
      const [r, c] = k.split(',').map(Number)
      const nk = e.key === 'ArrowRight' ? rc(r, c + 1)
               : e.key === 'ArrowLeft'  ? rc(r, c - 1)
               : e.key === 'ArrowDown'  ? rc(r + 1, c)
               :                          rc(r - 1, c)
      if (inputRefs.current[nk]) inputRefs.current[nk].focus()
    }
  }, [])

  const checkAll = useCallback(() => {
    let all = true, any = false
    const newStates = {}
    for (const [k, data] of Object.entries(cellData)) {
      const val = valuesRef.current[k] || ''
      if (val) {
        any = true
        const ok = val === data.letter
        newStates[k] = ok ? 'correct' : 'error'
        if (!ok) all = false
      } else {
        all = false
        newStates[k] = ''
      }
    }
    setCellStates(newStates)
    if (!any) { setMsg(null); return }
    setMsg(all
      ? { text: '🌟 ¡CRUCIGRAMA COMPLETADO! +40 PUNTOS 🌟', type: 'win' }
      : { text: '✗ HAY ERRORES — REVISA LAS CELDAS MARCADAS', type: 'err' }
    )
  }, [])

  const revealAll = useCallback(() => {
    const newValues = {}
    const newStates = {}
    for (const k of Object.keys(cellData)) {
      newValues[k] = cellData[k].letter
      newStates[k] = 'correct'
    }
    valuesRef.current = newValues
    setValues(newValues)
    setCellStates(newStates)
    setMsg({ text: '✓ RESPUESTAS REVELADAS', type: 'win' })
  }, [])

  const clearAll = useCallback(() => {
    valuesRef.current = {}
    setValues({})
    setCellStates({})
    setMsg(null)
    doHighlight(null)
  }, [doHighlight])

  const highlightedSet = new Set(highlighted)

  const getCellClass = (k) => {
    const state = cellStates[k] || ''
    if (state === 'correct') return 'cell letter correct'
    if (state === 'error')   return 'cell letter error-cell'
    if (highlightedSet.has(k)) return 'cell letter highlighted'
    return 'cell letter'
  }

  return (
    <div className="container">
      <div className="header">
        <div className="title-block">
          <div className="title-brush" />
          <h1 className="title">CRUCI STELLAR</h1>
        </div>
        <div className="badge">+40 PUNTOS</div>
      </div>

      <div className="main">
        <div className="grid-container">
          <div
            style={{
              display: 'inline-grid',
              gap: 'var(--gap)',
              gridTemplateColumns: `repeat(${COLS}, var(--cell))`,
              gridTemplateRows: `repeat(${ROWS}, var(--cell))`,
            }}
          >
            {Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const k = rc(r, c)
                const data = cellData[k]
                if (!data) return <div key={k} className="cell block" />
                return (
                  <div key={k} className={getCellClass(k)}>
                    {data.num && <span className="cnum">{data.num}</span>}
                    <input
                      ref={el => { if (el) inputRefs.current[k] = el }}
                      className="cinput"
                      value={values[k] || ''}
                      onFocus={() => handleFocus(k)}
                      onChange={e => handleChange(k, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, k)}
                    />
                  </div>
                )
              })
            )}
          </div>

          <div className="btn-row">
            <button className="btn btn-check" onClick={checkAll}>VERIFICAR</button>
            <button className="btn btn-reveal" onClick={revealAll}>REVELAR</button>
            <button className="btn btn-clear" onClick={clearAll}>BORRAR</button>
          </div>

          {msg && <div className={`msg ${msg.type} show`}>{msg.text}</div>}
        </div>

        <div className="clues-panel">
          <div className="clues-box">
            <div className="clues-header">— HORIZONTAL</div>
            {cluesH.map(({ wid, n, text }) => (
              <div
                key={wid}
                className={`clue${activeWord === wid ? ' active' : ''}`}
                onClick={() => {
                  doHighlight(wid)
                  setTimeout(() => inputRefs.current[getWordCells(wid)[0]]?.focus(), 0)
                }}
              >
                <span className="cn">{n}</span>
                <span className="ct">{text}</span>
              </div>
            ))}
          </div>

          <div className="clues-box">
            <div className="clues-header">— VERTICAL</div>
            {cluesV.map(({ wid, n, text }) => (
              <div
                key={wid}
                className={`clue${activeWord === wid ? ' active' : ''}`}
                onClick={() => {
                  doHighlight(wid)
                  setTimeout(() => inputRefs.current[getWordCells(wid)[0]]?.focus(), 0)
                }}
              >
                <span className="cn">{n}</span>
                <span className="ct">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
