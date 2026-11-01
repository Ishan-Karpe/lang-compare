export const prerender = true;
// Language choices live in localStorage, so a server render can't match them. The
// static build is served as a client-rendered shell anyway, so every mode now is.
export const ssr = false;
