import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? 'Inteligência para o campo'
  const sub   = searchParams.get('sub')   ?? 'Clima · NDVI · Solo · IA · Cotações'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #1a7a3c 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', width: '600px', height: '600px',
          borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)',
          top: '-200px', right: '-150px',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', width: '400px', height: '400px',
          borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)',
          bottom: '-150px', left: '50px',
          display: 'flex',
        }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '72px 80px', flex: 1 }}>

          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '56px' }}>
            <div style={{
              width: '52px', height: '52px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px',
            }}>
              🌿
            </div>
            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>
              CampoClima
            </span>
            <div style={{
              marginLeft: '12px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '100px',
              padding: '4px 14px',
              display: 'flex',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '500' }}>
                agtech · brasil
              </span>
            </div>
          </div>

          {/* Title */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '22px',
              fontWeight: '500',
              margin: '0 0 16px 0',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}>
              Plataforma agrícola
            </p>
            <h1 style={{
              color: '#ffffff',
              fontSize: '68px',
              fontWeight: '800',
              lineHeight: '1.1',
              margin: '0 0 24px 0',
              letterSpacing: '-2px',
              maxWidth: '900px',
            }}>
              {title}
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '26px',
              fontWeight: '400',
              margin: 0,
            }}>
              {sub}
            </p>
          </div>

          {/* Bottom tags */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '48px' }}>
            {['🌤 Clima em tempo real', '🛰 NDVI por satélite', '🤖 IA agronômica', '📈 Cotações CEPEA'].map(tag => (
              <div key={tag} style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: '100px',
                padding: '8px 18px',
                display: 'flex',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', fontWeight: '500' }}>
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
