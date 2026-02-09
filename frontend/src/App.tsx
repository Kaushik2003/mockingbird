import { LogInWithAnonAadhaar, useAnonAadhaar } from '@anon-aadhaar/react'
import { useEffect } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f3f4f6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  text-align: center;
  max-width: 28rem;
  width: 100%;
`

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
`

const Subtitle = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
`

const StatusContainer = styled.div<{ $status: string }>`
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: ${props => props.$status === 'logged-in' ? '#ecfdf5' : '#fff'};
  color: ${props => props.$status === 'logged-in' ? '#047857' : '#374151'};
  border: ${props => props.$status === 'logged-in' ? '1px solid #059669' : 'none'};
`

function App() {
  const [anonAadhaar] = useAnonAadhaar()

  useEffect(() => {
    console.log('Anon Aadhaar status: ', anonAadhaar.status)
  }, [anonAadhaar])

  return (
    <Container>
      <Card>
        <Title>Identity Verification</Title>
        <Subtitle>Securely verify your identity with Anon Aadhaar</Subtitle>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LogInWithAnonAadhaar nullifierSeed={1234} />
        </div>

        {anonAadhaar?.status === 'logged-in' && (
          <StatusContainer $status={anonAadhaar.status}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>✅ Verified</div>
            <div style={{ fontSize: '0.875rem' }}>Your identity has been successfully verified without revealing personal data.</div>
          </StatusContainer>
        )}
      </Card>
    </Container>
  )
}

export default App
