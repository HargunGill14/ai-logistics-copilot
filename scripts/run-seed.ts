import { seed } from './seed-demo'

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
