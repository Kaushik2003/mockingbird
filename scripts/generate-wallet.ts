import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const privateKey = generatePrivateKey()
const account = privateKeyToAccount(privateKey)

console.log('New wallet created:')
console.log('Private Key:', privateKey)
console.log('Address:', account.address)
console.log('\nAdd this to your .env file:')
console.log(`PRIVATE_KEY=${privateKey}`)