export interface Configuration {
  port: number;
}

export function loadConfiguration(): Configuration {
  const port = parseInt(process.env.PORT || "3000");
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error("[Config] Invalid port number");
  }

  return {
    port
  };
}
