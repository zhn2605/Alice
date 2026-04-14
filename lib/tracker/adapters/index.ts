import { registerAdapter } from "./registry";
import { victoriasSecret } from "./victoriasSecret";

registerAdapter(victoriasSecret);

export { findAdapter, listAdapters } from "./registry";

