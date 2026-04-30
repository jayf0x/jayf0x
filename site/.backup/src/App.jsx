import { ColumnTerrain } from './components/ColumnTerrain'
import { TERRAIN } from './config/terrain'

export function App() {
  return (
    <>
      <ColumnTerrain />

      {/* Site panel — scrolls over the fixed canvas */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: TERRAIN.sitePanelWidth,
          margin: '0 auto',
          minHeight: '100vh',
          background: TERRAIN.sitePanelBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1a1a2e',
          fontFamily: 'inherit',
          fontSize: '1rem',
        }}
      >
        {/* site content goes here */}
      </div>
    </>
  )
}
