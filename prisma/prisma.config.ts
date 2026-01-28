import { defineConfig } from '@prisma/client/edge'
console.log('database url is ---', process.env.DATABASE_URL)


export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
