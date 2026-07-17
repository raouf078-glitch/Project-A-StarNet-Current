// vite.config.js
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
function lucideSafeImport() {
  return {
    name: "lucide-safe-import",
    transform(code, id) {
      if (!/\.[jt]sx?$/.test(id) || id.includes("node_modules")) return;
      const re = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]lucide-react['"]/g;
      if (!re.test(code)) return;
      re.lastIndex = 0;
      const bindings = [];
      const cleaned = code.replace(re, (_, nameList) => {
        for (const raw of nameList.split(",")) {
          const trimmed = raw.trim();
          if (!trimmed) continue;
          const [orig, alias] = trimmed.split(/\s+as\s+/).map((s) => s.trim());
          bindings.push({ orig, alias: alias || orig });
        }
        return "";
      });
      if (!bindings.length) return;
      const header = `import * as __lucide from 'lucide-react';
` + bindings.map((b) => `const ${b.alias} = __lucide["${b.orig}"] || __lucide.Circle;`).join("\n") + "\n";
      return { code: header + cleaned, map: null };
    }
  };
}
function reactHooksAutoImport() {
  const HOOKS = [
    "useState",
    "useEffect",
    "useRef",
    "useCallback",
    "useMemo",
    "useContext",
    "useReducer",
    "useLayoutEffect",
    "useId",
    "useTransition",
    "useDeferredValue",
    "useImperativeHandle",
    "useInsertionEffect",
    "useSyncExternalStore",
    "useDebugValue",
    "memo",
    "forwardRef",
    "createContext",
    "lazy",
    "Suspense"
  ];
  const HOOK_CALL = HOOKS.map((h) => `\\b${h}\\b`).join("|");
  const HOOK_RE = new RegExp(HOOK_CALL, "g");
  return {
    name: "react-hooks-auto-import",
    transform(code, id) {
      if (!/\.[jt]sx?$/.test(id) || id.includes("node_modules")) return;
      const used = /* @__PURE__ */ new Set();
      for (const m of code.matchAll(HOOK_RE)) used.add(m[0]);
      if (!used.size) return;
      const importRe = /import\s+(?:(\w+)\s*,\s*)?\{\s*([^}]*)\}\s*from\s*['"]react['"]/;
      const importReG = new RegExp(importRe.source, "g");
      const defaultImportRe = /import\s+(\w+)\s+from\s*['"]react['"]/;
      const allMatches = [...code.matchAll(importReG)];
      const firstMatch = allMatches[0] || null;
      const defaultMatch = !firstMatch && code.match(defaultImportRe);
      const alreadyImported = /* @__PURE__ */ new Set();
      for (const m of allMatches) {
        for (const name of m[2].split(",")) {
          const t = name.replace(/\s+as\s+\w+/, "").trim();
          if (t) alreadyImported.add(t);
        }
      }
      const missing = [...used].filter((h) => !alreadyImported.has(h));
      if (!missing.length) return;
      if (firstMatch) {
        const firstNames = /* @__PURE__ */ new Set();
        for (const name of firstMatch[2].split(",")) {
          const t = name.replace(/\s+as\s+\w+/, "").trim();
          if (t) firstNames.add(t);
        }
        const merged = [.../* @__PURE__ */ new Set([...firstNames, ...missing])];
        const defaultPart = firstMatch[1] ? `${firstMatch[1]}, ` : "";
        const newImport = `import ${defaultPart}{ ${merged.join(", ")} } from 'react'`;
        return { code: code.replace(importRe, newImport), map: null };
      }
      if (defaultMatch) {
        const newImport = `import ${defaultMatch[1]}, { ${missing.join(", ")} } from 'react'`;
        return { code: code.replace(defaultImportRe, newImport), map: null };
      }
      return { code: `import { ${missing.join(", ")} } from 'react';
` + code, map: null };
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [reactHooksAutoImport(), lucideSafeImport(), react()],
  base: process.env.VITE_BASE || "/",
  cacheDir: "./.vite",
  resolve: {
    preserveSymlinks: true
  },
  server: {
    host: true,
    allowedHosts: true,
    hmr: false
  },
  // Pre-bundle ALL libraries that generated code may import.
  // Without this, Vite discovers new imports at runtime, triggers re-optimization,
  // and invalidates existing chunks — causing 404s in the browser.
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router-dom",
      "lucide-react",
      "date-fns",
      "date-fns/locale",
      "phaser",
      "leaflet",
      "react-leaflet",
      "qrcode.react",
      "@supabase/supabase-js"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG4vLyBSZXdyaXRlcyBgaW1wb3J0IHsgTWF5YmVJbnZhbGlkIH0gZnJvbSAnbHVjaWRlLXJlYWN0J2AgaW50byBhIG5hbWVzcGFjZVxuLy8gaW1wb3J0IHdpdGggcGVyLWljb24gZmFsbGJhY2sgc28gQUktaGFsbHVjaW5hdGVkIGljb24gbmFtZXMgZG9uJ3QgY3Jhc2ggdGhlIGFwcC5cbmZ1bmN0aW9uIGx1Y2lkZVNhZmVJbXBvcnQoKSB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2x1Y2lkZS1zYWZlLWltcG9ydCcsXG4gICAgdHJhbnNmb3JtKGNvZGUsIGlkKSB7XG4gICAgICBpZiAoIS9cXC5banRdc3g/JC8udGVzdChpZCkgfHwgaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSByZXR1cm5cbiAgICAgIGNvbnN0IHJlID0gL2ltcG9ydFxccypcXHtcXHMqKFtefV0rKVxccypcXH1cXHMqZnJvbVxccypbJ1wiXWx1Y2lkZS1yZWFjdFsnXCJdL2dcbiAgICAgIGlmICghcmUudGVzdChjb2RlKSkgcmV0dXJuXG4gICAgICByZS5sYXN0SW5kZXggPSAwXG5cbiAgICAgIGNvbnN0IGJpbmRpbmdzID0gW11cbiAgICAgIGNvbnN0IGNsZWFuZWQgPSBjb2RlLnJlcGxhY2UocmUsIChfLCBuYW1lTGlzdCkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IHJhdyBvZiBuYW1lTGlzdC5zcGxpdCgnLCcpKSB7XG4gICAgICAgICAgY29uc3QgdHJpbW1lZCA9IHJhdy50cmltKClcbiAgICAgICAgICBpZiAoIXRyaW1tZWQpIGNvbnRpbnVlXG4gICAgICAgICAgY29uc3QgW29yaWcsIGFsaWFzXSA9IHRyaW1tZWQuc3BsaXQoL1xccythc1xccysvKS5tYXAocyA9PiBzLnRyaW0oKSlcbiAgICAgICAgICBiaW5kaW5ncy5wdXNoKHsgb3JpZywgYWxpYXM6IGFsaWFzIHx8IG9yaWcgfSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJydcbiAgICAgIH0pXG5cbiAgICAgIGlmICghYmluZGluZ3MubGVuZ3RoKSByZXR1cm5cbiAgICAgIGNvbnN0IGhlYWRlciA9IGBpbXBvcnQgKiBhcyBfX2x1Y2lkZSBmcm9tICdsdWNpZGUtcmVhY3QnO1xcbmAgK1xuICAgICAgICBiaW5kaW5ncy5tYXAoYiA9PiBgY29uc3QgJHtiLmFsaWFzfSA9IF9fbHVjaWRlW1wiJHtiLm9yaWd9XCJdIHx8IF9fbHVjaWRlLkNpcmNsZTtgKS5qb2luKCdcXG4nKSArICdcXG4nXG4gICAgICByZXR1cm4geyBjb2RlOiBoZWFkZXIgKyBjbGVhbmVkLCBtYXA6IG51bGwgfVxuICAgIH0sXG4gIH1cbn1cblxuLy8gQXV0by1pbmplY3RzIG1pc3NpbmcgUmVhY3QgaG9vayBpbXBvcnRzIGluIEFJLWdlbmVyYXRlZCBjb2RlLlxuLy8gU2FtZSBkZWZlbnNpdmUgcGF0dGVybiBhcyBsdWNpZGVTYWZlSW1wb3J0IFx1MjAxNCBpZiB0aGUgQUkgd3JpdGVzIHVzZVJlZigpXG4vLyBidXQgZm9yZ2V0cyB0byBhZGQgaXQgdG8gdGhlIGltcG9ydCBzdGF0ZW1lbnQsIHRoaXMgcGx1Z2luIHBhdGNoZXMgaXQgYXQgYnVpbGQgdGltZS5cbmZ1bmN0aW9uIHJlYWN0SG9va3NBdXRvSW1wb3J0KCkge1xuICBjb25zdCBIT09LUyA9IFtcbiAgICAndXNlU3RhdGUnLCAndXNlRWZmZWN0JywgJ3VzZVJlZicsICd1c2VDYWxsYmFjaycsICd1c2VNZW1vJyxcbiAgICAndXNlQ29udGV4dCcsICd1c2VSZWR1Y2VyJywgJ3VzZUxheW91dEVmZmVjdCcsICd1c2VJZCcsXG4gICAgJ3VzZVRyYW5zaXRpb24nLCAndXNlRGVmZXJyZWRWYWx1ZScsICd1c2VJbXBlcmF0aXZlSGFuZGxlJyxcbiAgICAndXNlSW5zZXJ0aW9uRWZmZWN0JywgJ3VzZVN5bmNFeHRlcm5hbFN0b3JlJywgJ3VzZURlYnVnVmFsdWUnLFxuICAgICdtZW1vJywgJ2ZvcndhcmRSZWYnLCAnY3JlYXRlQ29udGV4dCcsICdsYXp5JywgJ1N1c3BlbnNlJyxcbiAgXVxuICBjb25zdCBIT09LX0NBTEwgPSBIT09LUy5tYXAoaCA9PiBgXFxcXGIke2h9XFxcXGJgKS5qb2luKCd8JylcbiAgY29uc3QgSE9PS19SRSA9IG5ldyBSZWdFeHAoSE9PS19DQUxMLCAnZycpXG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAncmVhY3QtaG9va3MtYXV0by1pbXBvcnQnLFxuICAgIHRyYW5zZm9ybShjb2RlLCBpZCkge1xuICAgICAgaWYgKCEvXFwuW2p0XXN4PyQvLnRlc3QoaWQpIHx8IGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkgcmV0dXJuXG5cbiAgICAgIGNvbnN0IHVzZWQgPSBuZXcgU2V0KClcbiAgICAgIGZvciAoY29uc3QgbSBvZiBjb2RlLm1hdGNoQWxsKEhPT0tfUkUpKSB1c2VkLmFkZChtWzBdKVxuICAgICAgaWYgKCF1c2VkLnNpemUpIHJldHVyblxuXG4gICAgICBjb25zdCBpbXBvcnRSZSA9IC9pbXBvcnRcXHMrKD86KFxcdyspXFxzKixcXHMqKT9cXHtcXHMqKFtefV0qKVxcfVxccypmcm9tXFxzKlsnXCJdcmVhY3RbJ1wiXS9cbiAgICAgIGNvbnN0IGltcG9ydFJlRyA9IG5ldyBSZWdFeHAoaW1wb3J0UmUuc291cmNlLCAnZycpXG4gICAgICBjb25zdCBkZWZhdWx0SW1wb3J0UmUgPSAvaW1wb3J0XFxzKyhcXHcrKVxccytmcm9tXFxzKlsnXCJdcmVhY3RbJ1wiXS9cblxuICAgICAgY29uc3QgYWxsTWF0Y2hlcyA9IFsuLi5jb2RlLm1hdGNoQWxsKGltcG9ydFJlRyldXG4gICAgICBjb25zdCBmaXJzdE1hdGNoID0gYWxsTWF0Y2hlc1swXSB8fCBudWxsXG4gICAgICBjb25zdCBkZWZhdWx0TWF0Y2ggPSAhZmlyc3RNYXRjaCAmJiBjb2RlLm1hdGNoKGRlZmF1bHRJbXBvcnRSZSlcblxuICAgICAgY29uc3QgYWxyZWFkeUltcG9ydGVkID0gbmV3IFNldCgpXG4gICAgICBmb3IgKGNvbnN0IG0gb2YgYWxsTWF0Y2hlcykge1xuICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgbVsyXS5zcGxpdCgnLCcpKSB7XG4gICAgICAgICAgY29uc3QgdCA9IG5hbWUucmVwbGFjZSgvXFxzK2FzXFxzK1xcdysvLCAnJykudHJpbSgpXG4gICAgICAgICAgaWYgKHQpIGFscmVhZHlJbXBvcnRlZC5hZGQodClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBtaXNzaW5nID0gWy4uLnVzZWRdLmZpbHRlcihoID0+ICFhbHJlYWR5SW1wb3J0ZWQuaGFzKGgpKVxuICAgICAgaWYgKCFtaXNzaW5nLmxlbmd0aCkgcmV0dXJuXG5cbiAgICAgIGlmIChmaXJzdE1hdGNoKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0TmFtZXMgPSBuZXcgU2V0KClcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGZpcnN0TWF0Y2hbMl0uc3BsaXQoJywnKSkge1xuICAgICAgICAgIGNvbnN0IHQgPSBuYW1lLnJlcGxhY2UoL1xccythc1xccytcXHcrLywgJycpLnRyaW0oKVxuICAgICAgICAgIGlmICh0KSBmaXJzdE5hbWVzLmFkZCh0KVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1lcmdlZCA9IFsuLi5uZXcgU2V0KFsuLi5maXJzdE5hbWVzLCAuLi5taXNzaW5nXSldXG4gICAgICAgIGNvbnN0IGRlZmF1bHRQYXJ0ID0gZmlyc3RNYXRjaFsxXSA/IGAke2ZpcnN0TWF0Y2hbMV19LCBgIDogJydcbiAgICAgICAgY29uc3QgbmV3SW1wb3J0ID0gYGltcG9ydCAke2RlZmF1bHRQYXJ0fXsgJHttZXJnZWQuam9pbignLCAnKX0gfSBmcm9tICdyZWFjdCdgXG4gICAgICAgIHJldHVybiB7IGNvZGU6IGNvZGUucmVwbGFjZShpbXBvcnRSZSwgbmV3SW1wb3J0KSwgbWFwOiBudWxsIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGRlZmF1bHRNYXRjaCkge1xuICAgICAgICBjb25zdCBuZXdJbXBvcnQgPSBgaW1wb3J0ICR7ZGVmYXVsdE1hdGNoWzFdfSwgeyAke21pc3Npbmcuam9pbignLCAnKX0gfSBmcm9tICdyZWFjdCdgXG4gICAgICAgIHJldHVybiB7IGNvZGU6IGNvZGUucmVwbGFjZShkZWZhdWx0SW1wb3J0UmUsIG5ld0ltcG9ydCksIG1hcDogbnVsbCB9XG4gICAgICB9XG5cbiAgICAgIC8vIE5vIHJlYWN0IGltcG9ydCBhdCBhbGwgXHUyMDE0IGFkZCBvbmVcbiAgICAgIHJldHVybiB7IGNvZGU6IGBpbXBvcnQgeyAke21pc3Npbmcuam9pbignLCAnKX0gfSBmcm9tICdyZWFjdCc7XFxuYCArIGNvZGUsIG1hcDogbnVsbCB9XG4gICAgfSxcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3RIb29rc0F1dG9JbXBvcnQoKSwgbHVjaWRlU2FmZUltcG9ydCgpLCByZWFjdCgpXSxcbiAgYmFzZTogcHJvY2Vzcy5lbnYuVklURV9CQVNFIHx8ICcvJyxcbiAgY2FjaGVEaXI6ICcuLy52aXRlJyxcbiAgcmVzb2x2ZToge1xuICAgIHByZXNlcnZlU3ltbGlua3M6IHRydWUsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IHRydWUsXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICAgIGhtcjogZmFsc2UsXG4gIH0sXG4gIC8vIFByZS1idW5kbGUgQUxMIGxpYnJhcmllcyB0aGF0IGdlbmVyYXRlZCBjb2RlIG1heSBpbXBvcnQuXG4gIC8vIFdpdGhvdXQgdGhpcywgVml0ZSBkaXNjb3ZlcnMgbmV3IGltcG9ydHMgYXQgcnVudGltZSwgdHJpZ2dlcnMgcmUtb3B0aW1pemF0aW9uLFxuICAvLyBhbmQgaW52YWxpZGF0ZXMgZXhpc3RpbmcgY2h1bmtzIFx1MjAxNCBjYXVzaW5nIDQwNHMgaW4gdGhlIGJyb3dzZXIuXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdyZWFjdCcsXG4gICAgICAncmVhY3QtZG9tJyxcbiAgICAgICdyZWFjdC1kb20vY2xpZW50JyxcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICdsdWNpZGUtcmVhY3QnLFxuICAgICAgJ2RhdGUtZm5zJyxcbiAgICAgICdkYXRlLWZucy9sb2NhbGUnLFxuICAgICAgJ3BoYXNlcicsXG4gICAgICAnbGVhZmxldCcsXG4gICAgICAncmVhY3QtbGVhZmxldCcsXG4gICAgICAncXJjb2RlLnJlYWN0JyxcbiAgICAgICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnLFxuICAgIF0sXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFJbEIsU0FBUyxtQkFBbUI7QUFDMUIsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sVUFBVSxNQUFNLElBQUk7QUFDbEIsVUFBSSxDQUFDLGFBQWEsS0FBSyxFQUFFLEtBQUssR0FBRyxTQUFTLGNBQWMsRUFBRztBQUMzRCxZQUFNLEtBQUs7QUFDWCxVQUFJLENBQUMsR0FBRyxLQUFLLElBQUksRUFBRztBQUNwQixTQUFHLFlBQVk7QUFFZixZQUFNLFdBQVcsQ0FBQztBQUNsQixZQUFNLFVBQVUsS0FBSyxRQUFRLElBQUksQ0FBQyxHQUFHLGFBQWE7QUFDaEQsbUJBQVcsT0FBTyxTQUFTLE1BQU0s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
