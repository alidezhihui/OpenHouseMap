import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
