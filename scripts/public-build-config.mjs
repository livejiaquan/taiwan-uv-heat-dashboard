export const DEFAULT_PUBLIC_BASE_PATH = "/taiwan-uv-heat-dashboard/";

const pathPattern = /^\/(?:[A-Za-z0-9._~-]+\/)*$/;

export const resolvePublicBasePath = (value) => {
  const basePath = value ?? DEFAULT_PUBLIC_BASE_PATH;

  if (
    typeof basePath !== "string" ||
    !pathPattern.test(basePath) ||
    basePath.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error(
      "PUBLIC_BASE_PATH must be an absolute path such as / or /project/; URLs, query strings, and dot segments are not allowed.",
    );
  }

  return basePath;
};

export const expectedAssetPrefix = (basePath) => `${basePath}assets/`;
