import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export const assertPublicBuildEnv = (env) => {
  if (env.VITE_CWA_API_KEY || env.CWA_API_KEY) throw new Error("Credentials must only be supplied to the collection step, never the public build.");
};

export const assertPublicArtifacts = async (dir) => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await assertPublicArtifacts(path);
    else if (/\.(js|json|html|css|map)$/.test(entry.name)) {
      const content = await readFile(path, "utf8");
      if (/CWA-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}|Authorization[=%]|replace-with-your-cwa-open-data-authorization-key|opendata\.cwa\.gov\.tw\/api\//i.test(content)) {
        throw new Error(`Public artifact safety check failed: ${entry.name}`);
      }
    }
  }
};
