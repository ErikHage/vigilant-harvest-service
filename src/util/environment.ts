function getEnvVar(key: string): string {
  return process.env[key] || '';
}

export default {
  getEnvVar,
}
