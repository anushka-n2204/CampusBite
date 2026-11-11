import { NextResponse } from "next/server";
import { Client } from "pg";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleSetup(request);
}

export async function GET(request: Request) {
  return handleSetup(request);
}

async function handleSetup(request: Request) {
  const url = new URL(request.url);
  const passcode = url.searchParams.get("passcode") || request.headers.get("x-passcode");
  const expectedPasscode = process.env.APP_PASSCODE?.trim();

  if (expectedPasscode && passcode !== expectedPasscode) {
    return NextResponse.json({ error: "Unauthorized passcode." }, { status: 401 });
  }

  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    return NextResponse.json(
      { error: "No POSTGRES_URL found in environment variables." },
      { status: 500 }
    );
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 1. Run 00_starter_example.sql
    const starterPath = path.join(process.cwd(), "seed", "00_starter_example.sql");
    const starterSql = fs.readFileSync(starterPath, "utf-8");
    await client.query(starterSql);

    // 2. Run campusbite.sql
    const campusbitePath = path.join(process.cwd(), "seed", "campusbite.sql");
    const campusbiteSql = fs.readFileSync(campusbitePath, "utf-8");
    await client.query(campusbiteSql);

    await client.end();

    return NextResponse.json({
      ok: true,
      message: "Database schemas (tasks and CampusBite tables/functions) created successfully!",
    });
  } catch (err: unknown) {
    await client.end().catch(() => {});
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
