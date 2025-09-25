// Test-only declarations to help tsc resolve test imports that use .js extensions
// and GJS/resource module specifiers. Kept intentionally loose (any) to avoid
// creating brittle type mappings for the test environment.

export {};

declare global {
  // 'imports' is a GJS global in the GNOME Shell runtime. We only declare it for
  // the type-checker in tests; avoid redeclare errors by augmenting global.
  var imports: any;
}

// Match any relative or absolute import that ends with .js
declare module "*.js" {
  const value: any;
  export = value;
}

// Match resource:///org/gnome/... style imports used in GNOME Shell integration
declare module "resource://*" {
  const m: any;
  export = m;
}

// Match gi:// namespace imports used in GJS
declare module "gi://*" {
  const m: any;
  export = m;
}

// Fallback wildcard so other odd specifiers in tests won't block the type-check
declare module "*";
