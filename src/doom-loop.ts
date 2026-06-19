export class DoomLoopTracker {
  private count = 0;
  private lastKey = "";
  constructor(private readonly threshold: number) {}

  private key(toolName: string, input: unknown): string {
    return toolName + "\u0000" + JSON.stringify(input ?? null);
  }

  /** Record an observation. Returns the new consecutive count for this (tool,input). */
  observe(toolName: string, input: unknown): number {
    const k = this.key(toolName, input);
    if (k === this.lastKey) this.count++;
    else { this.lastKey = k; this.count = 1; }
    return this.count;
  }

  /** Call BEFORE observe to ask "if I observe this now, would it hit the threshold?" */
  isLooping(toolName: string, input: unknown): boolean {
    const k = this.key(toolName, input);
    const nextCount = (k === this.lastKey ? this.count : 0) + 1;
    return nextCount >= this.threshold;
  }
}
