import { registerAdapter } from "./registry";
import { victoriasSecret } from "./victoriasSecret";
import { hm } from "./hm";

registerAdapter(victoriasSecret);

export { findAdapter, listAdapters } from "./registry";