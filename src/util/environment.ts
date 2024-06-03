function getEnvVar(key: string): string {
  return process.env[key] || '';
}

function getEnvVarOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function envVarLoader(key: string): () => string {
  return function (): string {
    return getEnvVar(key);
  }
}

export default {
  getEnvVar,
  getEnvVarOrDefault,
  envVarLoader,
}
