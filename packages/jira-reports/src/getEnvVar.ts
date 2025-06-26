export function getEnvVar(name: string): string {
  const variable = process.env[name]
  if (!variable) {
    throw new Error(`Expected ${name} to be set in environment, but it isn't`)
  }

  return variable
}
