declare module '*.json' {
  const value: Record<string, unknown>;
  export default value;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    PORT: string;
    [key: string]: string | undefined;
  }
}