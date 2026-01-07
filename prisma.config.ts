import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url: process.env.DATABASE_URL || "postgresql://postgres:password@127.0.0.1:5432/adani_tracker"
    },
});
