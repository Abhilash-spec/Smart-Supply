(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/_b04de9._.js", {

"[project]/lib/supabase.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, k: __turbopack_refresh__, m: module, z: require } = __turbopack_context__;
{
__turbopack_esm__({
    "ensureDefaultSetup": (()=>ensureDefaultSetup),
    "supabase": (()=>supabase)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_import__("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-client] (ecmascript)");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://fonsbumfimsnuykxiwaq.supabase.co") || '';
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvbnNidW1maW1zbnV5a3hpd2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1OTUyNDIsImV4cCI6MjA5NzE3MTI0Mn0.iKP1OPIXngVwQC7UMMPNGiOCSxtH5O0C73rzycCOGMk") || '';
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createBrowserClient"])(supabaseUrl, supabaseAnonKey);
async function ensureDefaultSetup() {
    try {
        // 1. Check for Tenant
        let { data: tenant } = await supabase.from('tenants').select('id').limit(1).maybeSingle();
        if (!tenant) {
            // Try to create one — may fail due to RLS
            const { data: newTenant, error } = await supabase.from('tenants').insert({
                name: 'SmartSupply Default Tenant',
                slug: 'default-tenant',
                tier: 'starter',
                status: 'active'
            }).select('id').maybeSingle();
            if (!error && newTenant) {
                tenant = newTenant;
            } else {
                // INSERT failed (RLS or duplicate) — retry select in case another session created it
                console.warn('Tenant insert failed (likely RLS), retrying select...', error?.message);
                const { data: retryTenant } = await supabase.from('tenants').select('id').limit(1).maybeSingle();
                tenant = retryTenant;
            }
        }
        if (!tenant?.id) {
            console.error('No tenant found and unable to create one. Check Supabase RLS policies on the tenants table.');
            return {
                tenantId: null,
                orgId: null,
                supplierId: null
            };
        }
        // 2. Check for Organization (Retailer)
        let { data: org } = await supabase.from('organizations').select('id').eq('type', 'retailer').limit(1).maybeSingle();
        if (!org) {
            const { data: newOrg, error } = await supabase.from('organizations').insert({
                tenant_id: tenant.id,
                name: 'SmartSupply Default Org',
                slug: 'default-org',
                type: 'retailer',
                status: 'active'
            }).select('id').maybeSingle();
            if (!error && newOrg) {
                org = newOrg;
            } else {
                console.warn('Org insert failed, retrying select...', error?.message);
                const { data: retryOrg } = await supabase.from('organizations').select('id').limit(1).maybeSingle();
                org = retryOrg;
            }
        }
        // 3. Check for Supplier (for Purchase Orders)
        let { data: supplier } = await supabase.from('organizations').select('id').eq('type', 'supplier').limit(1).maybeSingle();
        if (!supplier) {
            const { data: newSupplier, error } = await supabase.from('organizations').insert({
                tenant_id: tenant.id,
                name: 'Global Pharma Distributors',
                slug: 'global-pharma-distributors',
                type: 'supplier',
                status: 'active'
            }).select('id').maybeSingle();
            if (!error && newSupplier) {
                supplier = newSupplier;
            } else {
                console.warn('Supplier insert failed, retrying select...', error?.message);
                const { data: retrySupplier } = await supabase.from('organizations').select('id').eq('type', 'supplier').limit(1).maybeSingle();
                supplier = retrySupplier;
            }
        }
        // 4. Ensure Supplier Profile exists
        let { data: supplierProfile } = await supabase.from('supplier_profiles').select('id').eq('organization_id', supplier?.id).limit(1).maybeSingle();
        if (!supplierProfile && supplier?.id) {
            const { data: newProfile } = await supabase.from('supplier_profiles').insert({
                tenant_id: tenant.id,
                organization_id: supplier.id,
                business_name: 'Global Pharma Distributors'
            }).select('id').maybeSingle();
            supplierProfile = newProfile || null;
        }
        // 5. Ensure Warehouse exists
        let { data: warehouse } = await supabase.from('warehouses').select('id').eq('organization_id', org?.id).limit(1).maybeSingle();
        if (!warehouse && org?.id) {
            const { data: newWarehouse } = await supabase.from('warehouses').insert({
                tenant_id: tenant.id,
                organization_id: org.id,
                name: 'Main Retail Storefront',
                code: 'MAIN-01',
                type: 'store'
            }).select('id').maybeSingle();
            warehouse = newWarehouse || null;
        }
        return {
            tenantId: tenant?.id,
            orgId: org?.id,
            supplierId: supplier?.id,
            supplierProfileId: supplierProfile?.id,
            warehouseId: warehouse?.id
        };
    } catch (err) {
        console.error('Error ensuring default setup:', err);
        return {
            tenantId: null,
            orgId: null,
            supplierId: null,
            supplierProfileId: null,
            warehouseId: null
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_refresh__.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ui/prism.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, k: __turbopack_refresh__, m: module, z: require } = __turbopack_context__;
{
__turbopack_esm__({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ogl$2f$src$2f$core$2f$Renderer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/ogl/src/core/Renderer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ogl$2f$src$2f$extras$2f$Triangle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/ogl/src/extras/Triangle.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ogl$2f$src$2f$core$2f$Program$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/ogl/src/core/Program.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ogl$2f$src$2f$core$2f$Mesh$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/ogl/src/core/Mesh.js [app-client] (ecmascript)");
;
var _s = __turbopack_refresh__.signature();
;
;
const Prism = ({ height = 3.5, baseWidth = 5.5, animationType = 'rotate', glow = 1, offset = {
    x: 0,
    y: 0
}, noise = 0.5, transparent = true, scale = 3.6, hueShift = 0, colorFrequency = 1, hoverStrength = 2, inertia = 0.05, bloom = 1, suspendWhenOffscreen = false, timeScale = 0.5 })=>{
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const container = containerRef.current;
        if (!container) return;
        const H = Math.max(0.001, height);
        const BW = Math.max(0.001, baseWidth);
        const BASE_HALF = BW * 0.5;
        const GLOW = Math.max(0.0, glow);
        const NOISE = Math.max(0.0, noise);
        const offX = offset?.x ?? 0;
        const offY = offset?.y ?? 0;
        const SAT = transparent ? 1.5 : 1;
        const SCALE = Math.max(0.001, scale);
        const HUE = hueShift || 0;
        const CFREQ = Math.max(0.0, colorFrequency || 1);
        const BLOOM = Math.max(0.0, bloom || 1);
        const RSX = 1;
        const RSY = 1;
        const RSZ = 1;
        const TS = Math.max(0, timeScale || 1);
        const HOVSTR = Math.max(0, hoverStrength || 1);
        const INERT = Math.max(0, Math.min(1, inertia || 0.12));
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const renderer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ogl$2f$src$2f$core$2f$Renderer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Renderer"]({
            dpr,
            alpha: transparent,
            antialias: false
        });
        const gl = renderer.gl;
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        Object.assign(gl.canvas.style, {
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
            display: 'block'
        });
        container.appendChild(gl.canvas);
        const vertex = /* glsl */ `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
        const fragment = /* glsl */ `
      precision highp float;

      uniform vec2  iResolution;
      uniform float iTime;

      uniform float uHeight;
      uniform float uBaseHalf;
      uniform mat3  uRot;
      uniform int   uUseBaseWobble;
      uniform float uGlow;
      uniform vec2  uOffsetPx;
      uniform float uNoise;
      uniform float uSaturation;
      uniform float uScale;
      uniform float uHueShift;
      uniform float uColorFreq;
      uniform float uBloom;
      uniform float uCenterShift;
      uniform float uInvBaseHalf;
      uniform float uInvHeight;
      uniform float uMinAxis;
      uniform float uPxScale;
      uniform float uTimeScale;

      vec4 tanh4(vec4 x){
        vec4 e2x = exp(2.0*x);
        return (e2x - 1.0) / (e2x + 1.0);
      }

      float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float sdOctaAnisoInv(vec3 p){
        vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
        float m = q.x + q.y + q.z - 1.0;
        return m * uMinAxis * 0.5773502691896258;
      }

      float sdPyramidUpInv(vec3 p){
        float oct = sdOctaAnisoInv(p);
        float halfSpace = -p.y;
        return max(oct, halfSpace);
      }

      mat3 hueRotation(float a){
        float c = cos(a), s = sin(a);
        mat3 W = mat3(
          0.299, 0.587, 0.114,
          0.299, 0.587, 0.114,
          0.299, 0.587, 0.114
        );
        mat3 U = mat3(
           0.701, -0.587, -0.114,
          -0.299,  0.413, -0.114,
          -0.300, -0.588,  0.886
        );
        mat3 V = mat3(
           0.168, -0.331,  0.500,
           0.328,  0.035, -0.500,
          -0.497,  0.296,  0.201
        );
        return W + U * c + V * s;
      }

      void main(){
        vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;

        float z = 5.0;
        float d = 0.0;

        vec3 p;
        vec4 o = vec4(0.0);

        float centerShift = uCenterShift;
        float cf = uColorFreq;

        mat2 wob = mat2(1.0);
        if (uUseBaseWobble == 1) {
          float t = iTime * uTimeScale;
          float c0 = cos(t + 0.0);
          float c1 = cos(t + 33.0);
          float c2 = cos(t + 11.0);
          wob = mat2(c0, c1, c2, c0);
        }

        const int STEPS = 100;
        for (int i = 0; i < STEPS; i++) {
          p = vec3(f, z);
          p.xz = p.xz * wob;
          p = uRot * p;
          vec3 q = p;
          q.y += centerShift;
          d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
          z -= d;
          o += (sin((p.y + z) * cf + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
        }

        o = tanh4(o * o * (uGlow * uBloom) / 1e5);

        vec3 col = o.rgb;
        float n = rand(gl_FragCoord.xy + vec2(iTime));
        col += (n - 0.5) * uNoise;
        col = clamp(col, 0.0, 1.0);

        float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);

        if(abs(uHueShift) > 0.0001){
          col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
        }

        gl_FragColor = vec4(col, o.a);
      }
    `;
        const geometry = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ogl$2f$src$2f$extras$2f$Triangle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Triangle"](gl);
        const iResBuf = new Float32Array(2);
        const offsetPxBuf = new Float32Array(2);
        const program = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ogl$2f$src$2f$core$2f$Program$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Program"](gl, {
            vertex,
            fragment,
            uniforms: {
                iResolution: {
                    value: iResBuf
                },
                iTime: {
                    value: 0
                },
                uHeight: {
                    value: H
                },
                uBaseHalf: {
                    value: BASE_HALF
                },
                uUseBaseWobble: {
                    value: 1
                },
                uRot: {
                    value: new Float32Array([
                        1,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        1
                    ])
                },
                uGlow: {
                    value: GLOW
                },
                uOffsetPx: {
                    value: offsetPxBuf
                },
                uNoise: {
                    value: NOISE
                },
                uSaturation: {
                    value: SAT
                },
                uScale: {
                    value: SCALE
                },
                uHueShift: {
                    value: HUE
                },
                uColorFreq: {
                    value: CFREQ
                },
                uBloom: {
                    value: BLOOM
                },
                uCenterShift: {
                    value: H * 0.25
                },
                uInvBaseHalf: {
                    value: 1 / BASE_HALF
                },
                uInvHeight: {
                    value: 1 / H
                },
                uMinAxis: {
                    value: Math.min(BASE_HALF, H)
                },
                uPxScale: {
                    value: 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE)
                },
                uTimeScale: {
                    value: TS
                }
            }
        });
        const mesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ogl$2f$src$2f$core$2f$Mesh$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](gl, {
            geometry,
            program
        });
        const resize = ()=>{
            const w = container.clientWidth || 1;
            const h = container.clientHeight || 1;
            renderer.setSize(w, h);
            iResBuf[0] = gl.drawingBufferWidth;
            iResBuf[1] = gl.drawingBufferHeight;
            offsetPxBuf[0] = offX * dpr;
            offsetPxBuf[1] = offY * dpr;
            program.uniforms.uPxScale.value = 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE);
        };
        const ro = new ResizeObserver(resize);
        ro.observe(container);
        resize();
        const rotBuf = new Float32Array(9);
        const setMat3FromEuler = (yawY, pitchX, rollZ, out)=>{
            const cy = Math.cos(yawY), sy = Math.sin(yawY);
            const cx = Math.cos(pitchX), sx = Math.sin(pitchX);
            const cz = Math.cos(rollZ), sz = Math.sin(rollZ);
            const r00 = cy * cz + sy * sx * sz;
            const r01 = -cy * sz + sy * sx * cz;
            const r02 = sy * cx;
            const r10 = cx * sz;
            const r11 = cx * cz;
            const r12 = -sx;
            const r20 = -sy * cz + cy * sx * sz;
            const r21 = sy * sz + cy * sx * cz;
            const r22 = cy * cx;
            out[0] = r00;
            out[1] = r10;
            out[2] = r20;
            out[3] = r01;
            out[4] = r11;
            out[5] = r21;
            out[6] = r02;
            out[7] = r12;
            out[8] = r22;
            return out;
        };
        const NOISE_IS_ZERO = NOISE < 1e-6;
        let raf = 0;
        const t0 = performance.now();
        const startRAF = ()=>{
            if (raf) return;
            raf = requestAnimationFrame(render);
        };
        const stopRAF = ()=>{
            if (!raf) return;
            cancelAnimationFrame(raf);
            raf = 0;
        };
        const rnd = ()=>Math.random();
        const wX = (0.3 + rnd() * 0.6) * RSX;
        const wY = (0.2 + rnd() * 0.7) * RSY;
        const wZ = (0.1 + rnd() * 0.5) * RSZ;
        const phX = rnd() * Math.PI * 2;
        const phZ = rnd() * Math.PI * 2;
        let yaw = 0, pitch = 0, roll = 0;
        let targetYaw = 0, targetPitch = 0;
        const lerp = (a, b, t)=>a + (b - a) * t;
        const pointer = {
            x: 0,
            y: 0,
            inside: true
        };
        const onMove = (e)=>{
            const ww = Math.max(1, window.innerWidth);
            const wh = Math.max(1, window.innerHeight);
            const cx = ww * 0.5;
            const cy = wh * 0.5;
            const nx = (e.clientX - cx) / (ww * 0.5);
            const ny = (e.clientY - cy) / (wh * 0.5);
            pointer.x = Math.max(-1, Math.min(1, nx));
            pointer.y = Math.max(-1, Math.min(1, ny));
            pointer.inside = true;
        };
        const onLeave = ()=>{
            pointer.inside = false;
        };
        const onBlur = ()=>{
            pointer.inside = false;
        };
        let onPointerMove = null;
        if (animationType === 'hover') {
            onPointerMove = (e)=>{
                onMove(e);
                startRAF();
            };
            window.addEventListener('pointermove', onPointerMove, {
                passive: true
            });
            window.addEventListener('mouseleave', onLeave);
            window.addEventListener('blur', onBlur);
            program.uniforms.uUseBaseWobble.value = 0;
        } else if (animationType === '3drotate') {
            program.uniforms.uUseBaseWobble.value = 0;
        } else {
            program.uniforms.uUseBaseWobble.value = 1;
        }
        const render = (t)=>{
            const time = (t - t0) * 0.001;
            program.uniforms.iTime.value = time;
            let continueRAF = true;
            if (animationType === 'hover') {
                const maxPitch = 0.6 * HOVSTR;
                const maxYaw = 0.6 * HOVSTR;
                targetYaw = (pointer.inside ? -pointer.x : 0) * maxYaw;
                targetPitch = (pointer.inside ? pointer.y : 0) * maxPitch;
                const prevYaw = yaw;
                const prevPitch = pitch;
                const prevRoll = roll;
                yaw = lerp(prevYaw, targetYaw, INERT);
                pitch = lerp(prevPitch, targetPitch, INERT);
                roll = lerp(prevRoll, 0, 0.1);
                program.uniforms.uRot.value = setMat3FromEuler(yaw, pitch, roll, rotBuf);
                if (NOISE_IS_ZERO) {
                    const settled = Math.abs(yaw - targetYaw) < 1e-4 && Math.abs(pitch - targetPitch) < 1e-4 && Math.abs(roll) < 1e-4;
                    if (settled) continueRAF = false;
                }
            } else if (animationType === '3drotate') {
                const tScaled = time * TS;
                yaw = tScaled * wY;
                pitch = Math.sin(tScaled * wX + phX) * 0.6;
                roll = Math.sin(tScaled * wZ + phZ) * 0.5;
                program.uniforms.uRot.value = setMat3FromEuler(yaw, pitch, roll, rotBuf);
                if (TS < 1e-6) continueRAF = false;
            } else {
                rotBuf[0] = 1;
                rotBuf[1] = 0;
                rotBuf[2] = 0;
                rotBuf[3] = 0;
                rotBuf[4] = 1;
                rotBuf[5] = 0;
                rotBuf[6] = 0;
                rotBuf[7] = 0;
                rotBuf[8] = 1;
                program.uniforms.uRot.value = rotBuf;
                if (TS < 1e-6) continueRAF = false;
            }
            renderer.render({
                scene: mesh
            });
            if (continueRAF) {
                raf = requestAnimationFrame(render);
            } else {
                raf = 0;
            }
        };
        if (suspendWhenOffscreen) {
            const io = new IntersectionObserver((entries)=>{
                const vis = entries.some((e)=>e.isIntersecting);
                if (vis) startRAF();
                else stopRAF();
            });
            io.observe(container);
            startRAF();
            container.__prismIO = io;
        } else {
            startRAF();
        }
        return ()=>{
            stopRAF();
            ro.disconnect();
            if (animationType === 'hover') {
                if (onPointerMove) window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('mouseleave', onLeave);
                window.removeEventListener('blur', onBlur);
            }
            if (suspendWhenOffscreen) {
                const io = container.__prismIO;
                if (io) io.disconnect();
                delete container.__prismIO;
            }
            if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
        };
    }, [
        height,
        baseWidth,
        animationType,
        glow,
        noise,
        offset?.x,
        offset?.y,
        scale,
        transparent,
        hueShift,
        colorFrequency,
        timeScale,
        hoverStrength,
        inertia,
        bloom,
        suspendWhenOffscreen
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full relative",
        ref: containerRef
    }, void 0, false, {
        fileName: "[project]/components/ui/prism.tsx",
        lineNumber: 454,
        columnNumber: 10
    }, this);
};
_s(Prism, "8puyVO4ts1RhCfXUmci3vLI3Njw=");
_c = Prism;
const __TURBOPACK__default__export__ = Prism;
var _c;
__turbopack_refresh__.register(_c, "Prism");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_refresh__.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/login/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, k: __turbopack_refresh__, m: module, z: require } = __turbopack_context__;
{
__turbopack_esm__({
    "default": (()=>LoginPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Silk$2e$jsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/components/Silk.jsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/lock.js [app-client] (ecmascript) <export default as Lock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/mail.js [app-client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/eye-off.js [app-client] (ecmascript) <export default as EyeOff>");
;
var _s = __turbopack_refresh__.signature();
"use client";
;
;
;
;
;
;
;
function LoginPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [showPassword, setShowPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
                email,
                password
            });
            if (error) {
                // Attempt to log failure silently (fails if RLS isn't configured for inserts)
                try {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('login_attempts').insert({
                        email,
                        ip_address: '127.0.0.1',
                        user_agent: window.navigator.userAgent,
                        success: false,
                        failure_reason: error.message
                    });
                } catch (e) {
                // Ignore RLS errors
                }
                throw error;
            }
            // Attempt to log success silently
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('login_attempts').insert({
                    email,
                    ip_address: '127.0.0.1',
                    user_agent: window.navigator.userAgent,
                    success: true
                });
            } catch (e) {
            // Ignore RLS errors
            }
            // Route based on role
            const role = data.user?.user_metadata?.role || 'admin';
            if (role === 'superadmin') {
                window.location.href = "/superadmin";
            } else if (role === 'vendor') {
                window.location.href = "/vendor";
            } else if (role === 'staff') {
                const staffType = data.user?.user_metadata?.staff_type;
                window.location.href = staffType === 'vendor' ? "/vendor/pos" : "/pos";
            } else {
                window.location.href = "/" // Default admin dashboard
                ;
            }
        } catch (err) {
            setError(err.message || "Invalid credentials.");
        } finally{
            setLoading(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "jsx-29d0965edc381d3e" + " " + "flex min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "jsx-29d0965edc381d3e" + " " + "hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center login-gradient",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-29d0965edc381d3e" + " " + "absolute inset-0 z-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Silk$2e$jsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            speed: 5,
                            scale: 1,
                            color: "#5227FF",
                            noiseIntensity: 1.5,
                            rotation: 0
                        }, void 0, false, {
                            fileName: "[project]/app/login/page.tsx",
                            lineNumber: 85,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/login/page.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-29d0965edc381d3e" + " " + "relative z-10 text-center px-12 max-w-lg",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-29d0965edc381d3e" + " " + "flex items-center justify-center gap-3 mb-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-29d0965edc381d3e" + " " + "h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-29d0965edc381d3e" + " " + "text-2xl font-black text-white",
                                        children: "S"
                                    }, void 0, false, {
                                        fileName: "[project]/app/login/page.tsx",
                                        lineNumber: 98,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/login/page.tsx",
                                    lineNumber: 97,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/login/page.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "jsx-29d0965edc381d3e" + " " + "text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight",
                                children: [
                                    "Smart",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-29d0965edc381d3e" + " " + "text-[#35ed7e]",
                                        children: "Supply"
                                    }, void 0, false, {
                                        fileName: "[project]/app/login/page.tsx",
                                        lineNumber: 102,
                                        columnNumber: 18
                                    }, this),
                                    " AI"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/login/page.tsx",
                                lineNumber: 101,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "jsx-29d0965edc381d3e" + " " + "mt-4 text-lg text-blue-100/70 leading-relaxed",
                                children: "Enterprise supply chain intelligence for modern retail businesses"
                            }, void 0, false, {
                                fileName: "[project]/app/login/page.tsx",
                                lineNumber: 104,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-29d0965edc381d3e" + " " + "mt-8 flex items-center justify-center gap-6 text-blue-200/50 text-xs font-medium uppercase tracking-widest",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-29d0965edc381d3e",
                                        children: "Inventory"
                                    }, void 0, false, {
                                        fileName: "[project]/app/login/page.tsx",
                                        lineNumber: 108,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-29d0965edc381d3e" + " " + "h-1 w-1 rounded-full bg-blue-200/30"
                                    }, void 0, false, {
                                        fileName: "[project]/app/login/page.tsx",
                                        lineNumber: 109,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-29d0965edc381d3e",
                                        children: "Procurement"
                                    }, void 0, false, {
                                        fileName: "[project]/app/login/page.tsx",
                                        lineNumber: 110,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-29d0965edc381d3e" + " " + "h-1 w-1 rounded-full bg-blue-200/30"
                                    }, void 0, false, {
                                        fileName: "[project]/app/login/page.tsx",
                                        lineNumber: 111,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-29d0965edc381d3e",
                                        children: "Analytics"
                                    }, void 0, false, {
                                        fileName: "[project]/app/login/page.tsx",
                                        lineNumber: 112,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/login/page.tsx",
                                lineNumber: 107,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/login/page.tsx",
                        lineNumber: 95,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/login/page.tsx",
                lineNumber: 82,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "jsx-29d0965edc381d3e" + " " + "w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-background",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "jsx-29d0965edc381d3e" + " " + "w-full max-w-md",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-29d0965edc381d3e" + " " + "lg:hidden mb-10 text-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-29d0965edc381d3e" + " " + "inline-flex items-center gap-2 mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-29d0965edc381d3e" + " " + "h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "jsx-29d0965edc381d3e" + " " + "text-lg font-black text-primary",
                                            children: "S"
                                        }, void 0, false, {
                                            fileName: "[project]/app/login/page.tsx",
                                            lineNumber: 124,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/login/page.tsx",
                                        lineNumber: 123,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-29d0965edc381d3e" + " " + "text-2xl font-black tracking-tight",
                                        children: "SmartSupply"
                                    }, void 0, false, {
                                        fileName: "[project]/app/login/page.tsx",
                                        lineNumber: 126,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/login/page.tsx",
                                lineNumber: 122,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/login/page.tsx",
                            lineNumber: 121,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-29d0965edc381d3e" + " " + "mb-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-29d0965edc381d3e" + " " + "flex items-center gap-3 mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-29d0965edc381d3e" + " " + "h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
                                                className: "h-5 w-5 text-primary"
                                            }, void 0, false, {
                                                fileName: "[project]/app/login/page.tsx",
                                                lineNumber: 133,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/login/page.tsx",
                                            lineNumber: 132,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-29d0965edc381d3e",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "jsx-29d0965edc381d3e" + " " + "text-2xl font-bold tracking-tight",
                                                children: "Welcome Back"
                                            }, void 0, false, {
                                                fileName: "[project]/app/login/page.tsx",
                                                lineNumber: 136,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/login/page.tsx",
                                            lineNumber: 135,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/login/page.tsx",
                                    lineNumber: 131,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "jsx-29d0965edc381d3e" + " " + "text-sm text-muted-foreground mt-2 ml-[52px]",
                                    children: "Sign in to your SmartSupply account"
                                }, void 0, false, {
                                    fileName: "[project]/app/login/page.tsx",
                                    lineNumber: 139,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/login/page.tsx",
                            lineNumber: 130,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            onSubmit: handleLogin,
                            className: "jsx-29d0965edc381d3e" + " " + "space-y-5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-29d0965edc381d3e" + " " + "space-y-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-29d0965edc381d3e" + " " + "space-y-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "login-email",
                                                    className: "jsx-29d0965edc381d3e" + " " + "text-sm font-medium",
                                                    children: "Email Address"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/login/page.tsx",
                                                    lineNumber: 145,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-29d0965edc381d3e" + " " + "relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"], {
                                                            className: "absolute left-3.5 top-3 h-4 w-4 text-muted-foreground"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/login/page.tsx",
                                                            lineNumber: 147,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            id: "login-email",
                                                            type: "email",
                                                            required: true,
                                                            value: email,
                                                            onChange: (e)=>setEmail(e.target.value),
                                                            placeholder: "name@company.com",
                                                            className: "jsx-29d0965edc381d3e" + " " + "flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent shadow-sm"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/login/page.tsx",
                                                            lineNumber: 148,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/login/page.tsx",
                                                    lineNumber: 146,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/login/page.tsx",
                                            lineNumber: 144,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-29d0965edc381d3e" + " " + "space-y-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-29d0965edc381d3e" + " " + "flex items-center justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            htmlFor: "login-password",
                                                            className: "jsx-29d0965edc381d3e" + " " + "text-sm font-medium",
                                                            children: "Password"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/login/page.tsx",
                                                            lineNumber: 162,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                            href: "/forgot-password",
                                                            className: "text-xs font-medium text-primary hover:underline",
                                                            children: "Forgot password?"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/login/page.tsx",
                                                            lineNumber: 163,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/login/page.tsx",
                                                    lineNumber: 161,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-29d0965edc381d3e" + " " + "relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
                                                            className: "absolute left-3.5 top-3 h-4 w-4 text-muted-foreground"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/login/page.tsx",
                                                            lineNumber: 166,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            id: "login-password",
                                                            type: showPassword ? "text" : "password",
                                                            required: true,
                                                            value: password,
                                                            onChange: (e)=>setPassword(e.target.value),
                                                            placeholder: "••••••••",
                                                            className: "jsx-29d0965edc381d3e" + " " + "flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 pr-10 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent shadow-sm"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/login/page.tsx",
                                                            lineNumber: 167,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: ()=>setShowPassword(!showPassword),
                                                            className: "jsx-29d0965edc381d3e" + " " + "absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors",
                                                            children: showPassword ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {
                                                                className: "h-4 w-4"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/login/page.tsx",
                                                                lineNumber: 181,
                                                                columnNumber: 37
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                                className: "h-4 w-4"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/login/page.tsx",
                                                                lineNumber: 181,
                                                                columnNumber: 70
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/login/page.tsx",
                                                            lineNumber: 176,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/login/page.tsx",
                                                    lineNumber: 165,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/login/page.tsx",
                                            lineNumber: 160,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/login/page.tsx",
                                    lineNumber: 143,
                                    columnNumber: 13
                                }, this),
                                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-29d0965edc381d3e" + " " + "text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-29d0965edc381d3e" + " " + "h-2 w-2 rounded-full bg-destructive flex-shrink-0"
                                        }, void 0, false, {
                                            fileName: "[project]/app/login/page.tsx",
                                            lineNumber: 189,
                                            columnNumber: 17
                                        }, this),
                                        error
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/login/page.tsx",
                                    lineNumber: 188,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "submit",
                                    disabled: loading,
                                    className: "jsx-29d0965edc381d3e" + " " + "flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 active:scale-[0.98]",
                                    children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-29d0965edc381d3e" + " " + "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "jsx-29d0965edc381d3e" + " " + "h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"
                                            }, void 0, false, {
                                                fileName: "[project]/app/login/page.tsx",
                                                lineNumber: 201,
                                                columnNumber: 19
                                            }, this),
                                            "Signing in..."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/login/page.tsx",
                                        lineNumber: 200,
                                        columnNumber: 17
                                    }, this) : "Sign In"
                                }, void 0, false, {
                                    fileName: "[project]/app/login/page.tsx",
                                    lineNumber: 194,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/login/page.tsx",
                            lineNumber: 142,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-29d0965edc381d3e" + " " + "mt-8 text-center text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "jsx-29d0965edc381d3e" + " " + "text-muted-foreground",
                                    children: "Don't have an account? "
                                }, void 0, false, {
                                    fileName: "[project]/app/login/page.tsx",
                                    lineNumber: 209,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/register",
                                    className: "font-semibold text-primary hover:underline",
                                    children: "Register here"
                                }, void 0, false, {
                                    fileName: "[project]/app/login/page.tsx",
                                    lineNumber: 210,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/login/page.tsx",
                            lineNumber: 208,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-29d0965edc381d3e" + " " + "mt-10 pt-6 border-t text-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "jsx-29d0965edc381d3e" + " " + "text-xs text-muted-foreground",
                                children: "Secured by Supabase Auth · SmartSupply AI © 2026"
                            }, void 0, false, {
                                fileName: "[project]/app/login/page.tsx",
                                lineNumber: 216,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/login/page.tsx",
                            lineNumber: 215,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/login/page.tsx",
                    lineNumber: 119,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/login/page.tsx",
                lineNumber: 118,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: "29d0965edc381d3e",
                children: ".login-gradient.jsx-29d0965edc381d3e{background:linear-gradient(135deg,#0a0d3a 0%,#1a1060 30%,#0f1a5c 60%,#0a0d3a 100%)}.login-mesh.jsx-29d0965edc381d3e{background:radial-gradient(at 20%,#5865f240 0%,#0000 60%),radial-gradient(at 80% 20%,#ec48bd26 0%,#0000 50%),radial-gradient(at 60% 80%,#35ed7e14 0%,#0000 50%);animation:12s ease-in-out infinite alternate meshShift}@keyframes meshShift{0%{opacity:.8;transform:scale(1)translate(0)}50%{opacity:1;transform:scale(1.05)translate(-10px,5px)}to{opacity:.85;transform:scale(1.02)translate(5px,-5px)}}.login-icon-bubble.jsx-29d0965edc381d3e{-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid #ffffff26;border-radius:16px;justify-content:center;align-items:center;width:56px;height:56px;display:flex;box-shadow:0 8px 32px #0000004d}.login-icon-bubble-blue.jsx-29d0965edc381d3e{background:#5865f259}.login-icon-bubble-magenta.jsx-29d0965edc381d3e{background:#ec48bd4d}.login-icon-bubble-green.jsx-29d0965edc381d3e{background:#35ed7e40}.login-icon-bubble-purple.jsx-29d0965edc381d3e{background:#8b5cf64d}.login-icon-bubble-teal.jsx-29d0965edc381d3e{background:#14b8a64d}.login-float.jsx-29d0965edc381d3e{animation-timing-function:ease-in-out;animation-iteration-count:infinite}.login-float-1.jsx-29d0965edc381d3e{animation:6s ease-in-out infinite floatUp}.login-float-2.jsx-29d0965edc381d3e{animation:7s ease-in-out .5s infinite floatDiag}.login-float-3.jsx-29d0965edc381d3e{animation:8s ease-in-out 1s infinite floatUp}.login-float-4.jsx-29d0965edc381d3e{animation:6.5s ease-in-out 1.5s infinite floatDiag}.login-float-5.jsx-29d0965edc381d3e{animation:7.5s ease-in-out 2s infinite floatUp}.login-float-6.jsx-29d0965edc381d3e{animation:9s ease-in-out .3s infinite floatDiag}@keyframes floatUp{0%,to{transform:translateY(0)rotate(0)}50%{transform:translateY(-20px)rotate(3deg)}}@keyframes floatDiag{0%,to{transform:translate(0)rotate(0)}33%{transform:translate(10px,-15px)rotate(-2deg)}66%{transform:translate(-5px,-10px)rotate(2deg)}}.login-spin-slow.jsx-29d0965edc381d3e{animation:12s linear infinite spinSlow}@keyframes spinSlow{0%{transform:rotate(0)}to{transform:rotate(360deg)}}.login-orbit-1.jsx-29d0965edc381d3e{animation:8s ease-in-out infinite orbitPulse}.login-orbit-2.jsx-29d0965edc381d3e{animation:10s ease-in-out 2s infinite orbitPulse}@keyframes orbitPulse{0%,to{opacity:1;transform:translate(-50%,-50%)scale(1)}50%{opacity:.6;transform:translate(-50%,-50%)scale(1.05)}}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/login/page.tsx",
        lineNumber: 80,
        columnNumber: 5
    }, this);
}
_s(LoginPage, "p3XbpjdEf9SwF4K81BMAX4TkxhY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = LoginPage;
var _c;
__turbopack_refresh__.register(_c, "LoginPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_refresh__.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/login/page.tsx [app-rsc] (ecmascript, Next.js server component, client modules)": ((__turbopack_context__) => {

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, t: require } = __turbopack_context__;
{
}}),
}]);

//# sourceMappingURL=_b04de9._.js.map