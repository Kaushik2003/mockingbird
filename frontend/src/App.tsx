import { LogInWithAnonAadhaar, useAnonAadhaar } from '@anon-aadhaar/react'
import { useEffect, useState } from 'react'
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
  max-width: 32rem;
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
  background-color: ${props => props.$status === 'active' ? '#ecfdf5' : '#fef2f2'};
  color: ${props => props.$status === 'active' ? '#047857' : '#991b1b'};
  border: ${props => props.$status === 'active' ? '1px solid #059669' : '1px solid #991b1b'};
  text-align: left;
`

const Button = styled.button`
  background-color: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  width: 100%;
  &:hover {
    background-color: #1d4ed8;
  }
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`

const Label = styled.div`
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.25rem;
  font-weight: 600;
`

const Value = styled.div`
  font-family: monospace;
  background-color: #f9fafb;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #e5e7eb;
  word-break: break-all;
  margin-bottom: 1rem;
`

const API_URL = 'http://localhost:3000/api';

function App() {
  const [anonAadhaar] = useAnonAadhaar()
  const [userId, setUserId] = useState<number | null>(null)
  const [agentWallet, setAgentWallet] = useState<string | null>(null)
  const [agentStatus, setAgentStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // 1. Auto-verify when Anon Aadhaar logs in
  useEffect(() => {
    if (anonAadhaar.status === 'logged-in' && !userId) {
      verifyIdentity()
    }
  }, [anonAadhaar.status, userId])

  // Poll agent status if wallet exists
  useEffect(() => {
    if (agentWallet) {
      const interval = setInterval(fetchAgentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [agentWallet])

  const verifyIdentity = async () => {
    setLoading(true)
    try {
      // Simulate extraction of nullifier/commitment from proof
      // In a real app, extract from anonAadhaar.pcd
      const mockCommitment = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");

      const res = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitment: mockCommitment })
      })
      const data = await res.json()
      if (data.success) {
        setUserId(data.userId)
        console.log("Verified! User ID:", data.userId)
      }
    } catch (err) {
      console.error("Verification failed", err)
    } finally {
      setLoading(false)
    }
  }

  const createAgent = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/create-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      const data = await res.json()
      if (data.success) {
        setAgentWallet(data.walletAddress)
      }
    } catch (err) {
      console.error("Agent creation failed", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAgentStatus = async () => {
    if (!agentWallet) return;
    try {
      const res = await fetch(`${API_URL}/agent/${agentWallet}`);
      if (res.ok) {
        const data = await res.json();
        setAgentStatus(data);
      }
    } catch (err) {
      console.error("Status fetch failed", err);
    }
  }

  return (
    <Container>
      <Card>
        <Title>Mockingbird Treasury</Title>
        <Subtitle>Identity-Gated Autonomous Agents</Subtitle>

        {!userId ? (
          <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <p>Please verify your identity to continue.</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <LogInWithAnonAadhaar nullifierSeed={1234} />
            </div>
          </div>
        ) : (
          <div>
            <StatusContainer $status="active">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                ✅ <strong>Identity Verified</strong>
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                User ID: {userId}<br/>
                Merkle Root Updated.
              </div>
            </StatusContainer>

            {!agentWallet ? (
              <div style={{ marginTop: '2rem' }}>
                <p>Deploy your autonomous treasury agent.</p>
                <Button onClick={createAgent} disabled={loading}>
                  {loading ? 'Deploying...' : 'Create Agent Wallet'}
                </Button>
              </div>
            ) : (
              <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                <Label>Agent Wallet Address</Label>
                <Value>{agentWallet}</Value>

                <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #ffeeba', color: '#856404' }}>
                  <strong>⚠️ Demo Action:</strong><br/>
                  Send Base Sepolia USDC/ETH to this address to activate the agent loop.
                </div>

                {agentStatus && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                    <strong>Agent Status:</strong> {agentStatus.status}<br/>
                    {agentStatus.metrics ? (
                      <>
                        <strong>Health Factor:</strong> {Number(agentStatus.metrics.health_factor).toFixed(2)}<br/>
                        <strong>Collateral:</strong> ${Number(agentStatus.metrics.collateral_usd).toFixed(2)}<br/>
                        <strong>Debt:</strong> ${Number(agentStatus.metrics.debt_usd).toFixed(2)}
                      </>
                    ) : (
                      <em>Waiting for funds...</em>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </Container>
  )
}

export default App
