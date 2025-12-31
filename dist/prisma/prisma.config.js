import { defineConfig } from '@prisma/client/edge';
export default defineConfig({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});
//# sourceMappingURL=prisma.config.js.map