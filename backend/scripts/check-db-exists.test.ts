const baseUrl = process.env.API_BASE ?? "http://localhost:3015/api";
const url = `${baseUrl.replace(/\/$/, "")}/admin/db-exists`;

async function run() {
  const response = await fetch(url);
  const text = await response.text();
  let data: { exists?: boolean } | null = null;

  if (text) {
    try {
      data = JSON.parse(text) as { exists?: boolean };
    } catch (error) {
      throw new Error(`Invalid JSON response: ${text}`);
    }
  }

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
  }

  if (!data || typeof data.exists !== "boolean") {
    throw new Error(`Unexpected response shape: ${text}`);
  }

  console.log(`db-exists: ${data.exists}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
