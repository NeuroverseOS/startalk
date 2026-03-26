/**
 * Type stubs for private/platform dependencies.
 * These are provided by the MentraOS SDK and NeuroverseOS governance
 * packages at runtime. The stubs allow typecheck and tests to pass
 * in environments where those packages aren't installed.
 */

declare module '@mentra/sdk' {
  export class AppServer {
    constructor(config: { packageName: string; apiKey: string; port: number });
    start(): void;
    protected onSession(session: AppSession, sessionId: string, userId: string): Promise<void>;
    protected onStop(sessionId: string, userId: string, reason: string): Promise<void>;
  }

  export interface AppSession {
    settings: {
      get<T>(key: string, defaultValue: T): T;
    };
    layouts: {
      showTextWall(text: string): void;
      showDoubleTextWall(header: string, body: string): void;
    };
    dashboard: {
      content: {
        writeToMain(text: string): void;
      };
    };
    events: {
      onButtonPress(handler: (data: ButtonPress) => void): void;
      onTranscription(handler: (data: TranscriptionData) => void): void;
    };
    storage: {
      get(key: string): Promise<unknown>;
      set(key: string, value: unknown): Promise<void>;
    };
  }

  export interface ButtonPress {
    pressType: 'short' | 'long';
  }

  export interface TranscriptionData {
    text: string;
    isFinal: boolean;
  }
}

declare module 'neuroverseos-governance/adapters/mentraos' {
  export class MentraGovernedExecutor {
    constructor(world: any, callbacks: { onBlock: (r: any) => void; onPause: (r: any) => void }, rules: any);
    evaluate(intent: string, context: AppContext): { allowed: boolean };
  }
  export const DEFAULT_USER_RULES: any;
  export interface AppContext {
    appId: string;
    aiProviderDeclared: boolean;
    declaredAIProviders: string[];
    dataRetentionOptedIn: boolean;
    aiDataTypesSent: number;
    glassesModel: string | undefined;
  }
}

declare module 'neuroverseos-governance/engine/guard-engine' {
  export function evaluateGuard(event: any, world: any, options: { level: string }): { status: string; reason?: string };
}

declare module 'neuroverseos-governance/engine/simulate-engine' {
  export function simulateWorld(world: any, options: { stateOverrides: Record<string, any> }): { finalState: Record<string, any> };
}

declare module 'neuroverseos-governance/types' {
  export interface GuardEvent {
    intent: string;
    direction: 'input' | 'output';
    contentFields: Record<string, string>;
  }
  export interface WorldDefinition {
    [key: string]: any;
  }
}

declare module 'neuroverseos-governance/engine/bootstrap-parser' {
  export function parseWorldMarkdown(md: string): { world: any; issues: Array<{ severity: string }> };
}

declare module 'neuroverseos-governance/engine/bootstrap-emitter' {
  export function emitWorldDefinition(world: any): { world: any };
}
