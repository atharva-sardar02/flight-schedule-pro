var fe=Object.defineProperty,pe=Object.defineProperties;var ye=Object.getOwnPropertyDescriptors;var L=Object.getOwnPropertySymbols;var H=Object.prototype.hasOwnProperty,K=Object.prototype.propertyIsEnumerable;var q=(e,t,o)=>t in e?fe(e,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[t]=o,h=(e,t)=>{for(var o in t||(t={}))H.call(t,o)&&q(e,o,t[o]);if(L)for(var o of L(t))K.call(t,o)&&q(e,o,t[o]);return e},E=(e,t)=>pe(e,ye(t));var I=(e,t)=>{var o={};for(var n in e)H.call(e,n)&&t.indexOf(n)<0&&(o[n]=e[n]);if(e!=null&&L)for(var n of L(e))t.indexOf(n)<0&&K.call(e,n)&&(o[n]=e[n]);return o};import{r as s,R as T,a as J}from"./react-vendor-ClLnrwvH.js";var X={exports:{}},z={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var me=s,he=Symbol.for("react.element"),ve=Symbol.for("react.fragment"),ke=Object.prototype.hasOwnProperty,Ce=me.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,ge={key:!0,ref:!0,__self:!0,__source:!0};function Q(e,t,o){var n,r={},c=null,a=null;o!==void 0&&(c=""+o),t.key!==void 0&&(c=""+t.key),t.ref!==void 0&&(a=t.ref);for(n in t)ke.call(t,n)&&!ge.hasOwnProperty(n)&&(r[n]=t[n]);if(e&&e.defaultProps)for(n in t=e.defaultProps,t)r[n]===void 0&&(r[n]=t[n]);return{$$typeof:he,type:e,key:c,ref:a,props:r,_owner:Ce.current}}z.Fragment=ve;z.jsx=Q;z.jsxs=Q;X.exports=z;var M=X.exports;/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),ee=(...e)=>e.filter((t,o,n)=>!!t&&t.trim()!==""&&n.indexOf(t)===o).join(" ").trim();/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Se={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Me=s.forwardRef((d,l)=>{var u=d,{color:e="currentColor",size:t=24,strokeWidth:o=2,absoluteStrokeWidth:n,className:r="",children:c,iconNode:a}=u,i=I(u,["color","size","strokeWidth","absoluteStrokeWidth","className","children","iconNode"]);return s.createElement("svg",h(E(h({ref:l},Se),{width:t,height:t,stroke:e,strokeWidth:n?Number(o)*24/Number(t):o,className:ee("lucide",r)}),i),[...a.map(([y,f])=>s.createElement(y,f)),...Array.isArray(c)?c:[c]])});/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=(e,t)=>{const o=s.forwardRef((a,c)=>{var i=a,{className:n}=i,r=I(i,["className"]);return s.createElement(Me,h({ref:c,iconNode:t,className:ee(`lucide-${xe(e)}`,n)},r))});return o.displayName=`${e}`,o};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dt=p("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ft=p("Ban",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m4.9 4.9 14.2 14.2",key:"1m5liu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pt=p("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yt=p("CalendarClock",[["path",{d:"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5",key:"1osxxc"}],["path",{d:"M16 2v4",key:"4m81vk"}],["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M3 10h5",key:"r794hk"}],["path",{d:"M17.5 17.5 16 16.3V14",key:"akvzfd"}],["circle",{cx:"16",cy:"16",r:"6",key:"qoo3c4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mt=p("CalendarPlus",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["path",{d:"M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8",key:"3spt84"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M16 19h6",key:"xwg31i"}],["path",{d:"M19 16v6",key:"tddt3s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ht=p("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vt=p("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kt=p("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ct=p("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gt=p("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xt=p("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const St=p("Cloud",[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mt=p("GripVertical",[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rt=p("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wt=p("List",[["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 18h.01",key:"1tta3j"}],["path",{d:"M3 6h.01",key:"1rqtza"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 18h13",key:"1lx6n3"}],["path",{d:"M8 6h13",key:"ik3vkj"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bt=p("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Et=p("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const It=p("MapPin",[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const At=p("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nt=p("Plane",[["path",{d:"M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",key:"1v9wt8"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tt=p("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pt=p("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _t=p("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ot=p("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ft=p("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lt=p("TrendingDown",[["polyline",{points:"22 17 13.5 8.5 8.5 13.5 2 7",key:"1r2t7k"}],["polyline",{points:"16 17 22 17 22 11",key:"11uiuu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jt=p("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dt=p("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zt=p("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ut=p("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $t=p("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);function Y(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function B(...e){return t=>{let o=!1;const n=e.map(r=>{const c=Y(r,t);return!o&&typeof c=="function"&&(o=!0),c});if(o)return()=>{for(let r=0;r<n.length;r++){const c=n[r];typeof c=="function"?c():Y(e[r],null)}}}}function D(...e){return s.useCallback(B(...e),e)}function _(e,t,{checkForDefaultPrevented:o=!0}={}){return function(r){if(e==null||e(r),o===!1||!r.defaultPrevented)return t==null?void 0:t(r)}}function te(e,t=[]){let o=[];function n(c,a){const i=s.createContext(a),l=o.length;o=[...o,a];const d=y=>{var k;const m=y,{scope:f,children:C}=m,g=I(m,["scope","children"]),x=((k=f==null?void 0:f[e])==null?void 0:k[l])||i,v=s.useMemo(()=>g,Object.values(g));return M.jsx(x.Provider,{value:v,children:C})};d.displayName=c+"Provider";function u(y,f){var x;const C=((x=f==null?void 0:f[e])==null?void 0:x[l])||i,g=s.useContext(C);if(g)return g;if(a!==void 0)return a;throw new Error(`\`${y}\` must be used within \`${c}\``)}return[d,u]}const r=()=>{const c=o.map(a=>s.createContext(a));return function(i){const l=(i==null?void 0:i[e])||c;return s.useMemo(()=>({[`__scope${e}`]:E(h({},i),{[e]:l})}),[i,l])}};return r.scopeName=e,[n,Re(r,...t)]}function Re(...e){const t=e[0];if(e.length===1)return t;const o=()=>{const n=e.map(r=>({useScope:r(),scopeName:r.scopeName}));return function(c){const a=n.reduce((i,{useScope:l,scopeName:d})=>{const y=l(c)[`__scope${d}`];return h(h({},i),y)},{});return s.useMemo(()=>({[`__scope${t.scopeName}`]:a}),[a])}};return o.scopeName=t.scopeName,o}function Z(e){const t=we(e),o=s.forwardRef((n,r)=>{const d=n,{children:c}=d,a=I(d,["children"]),i=s.Children.toArray(c),l=i.find(Ee);if(l){const u=l.props.children,y=i.map(f=>f===l?s.Children.count(u)>1?s.Children.only(null):s.isValidElement(u)?u.props.children:null:f);return M.jsx(t,E(h({},a),{ref:r,children:s.isValidElement(u)?s.cloneElement(u,void 0,y):null}))}return M.jsx(t,E(h({},a),{ref:r,children:c}))});return o.displayName=`${e}.Slot`,o}function we(e){const t=s.forwardRef((o,n)=>{const a=o,{children:r}=a,c=I(a,["children"]);if(s.isValidElement(r)){const i=Ae(r),l=Ie(c,r.props);return r.type!==s.Fragment&&(l.ref=n?B(n,i):i),s.cloneElement(r,l)}return s.Children.count(r)>1?s.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var be=Symbol("radix.slottable");function Ee(e){return s.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===be}function Ie(e,t){const o=h({},t);for(const n in t){const r=e[n],c=t[n];/^on[A-Z]/.test(n)?r&&c?o[n]=(...i)=>{const l=c(...i);return r(...i),l}:r&&(o[n]=r):n==="style"?o[n]=h(h({},r),c):n==="className"&&(o[n]=[r,c].filter(Boolean).join(" "))}return h(h({},e),o)}function Ae(e){var n,r;let t=(n=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:n.get,o=t&&"isReactWarning"in t&&t.isReactWarning;return o?e.ref:(t=(r=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:r.get,o=t&&"isReactWarning"in t&&t.isReactWarning,o?e.props.ref:e.props.ref||e.ref)}function Ne(e){const t=e+"CollectionProvider",[o,n]=te(t),[r,c]=o(t,{collectionRef:{current:null},itemMap:new Map}),a=x=>{const{scope:v,children:m}=x,k=T.useRef(null),R=T.useRef(new Map).current;return M.jsx(r,{scope:v,itemMap:R,collectionRef:k,children:m})};a.displayName=t;const i=e+"CollectionSlot",l=Z(i),d=T.forwardRef((x,v)=>{const{scope:m,children:k}=x,R=c(i,m),S=D(v,R.collectionRef);return M.jsx(l,{ref:S,children:k})});d.displayName=i;const u=e+"CollectionItemSlot",y="data-radix-collection-item",f=Z(u),C=T.forwardRef((x,v)=>{const A=x,{scope:m,children:k}=A,R=I(A,["scope","children"]),S=T.useRef(null),w=D(v,S),P=c(u,m);return T.useEffect(()=>(P.itemMap.set(S,h({ref:S},R)),()=>void P.itemMap.delete(S))),M.jsx(f,{[y]:"",ref:w,children:k})});C.displayName=u;function g(x){const v=c(e+"CollectionConsumer",x);return T.useCallback(()=>{const k=v.collectionRef.current;if(!k)return[];const R=Array.from(k.querySelectorAll(`[${y}]`));return Array.from(v.itemMap.values()).sort((P,A)=>R.indexOf(P.ref.current)-R.indexOf(A.ref.current))},[v.collectionRef,v.itemMap])}return[{Provider:a,Slot:d,ItemSlot:C},g,n]}var O=globalThis!=null&&globalThis.document?s.useLayoutEffect:()=>{},Te=J[" useId ".trim().toString()]||(()=>{}),Pe=0;function _e(e){const[t,o]=s.useState(Te());return O(()=>{o(n=>n!=null?n:String(Pe++))},[e]),e||(t?`radix-${t}`:"")}function Oe(e){const t=Fe(e),o=s.forwardRef((n,r)=>{const d=n,{children:c}=d,a=I(d,["children"]),i=s.Children.toArray(c),l=i.find(je);if(l){const u=l.props.children,y=i.map(f=>f===l?s.Children.count(u)>1?s.Children.only(null):s.isValidElement(u)?u.props.children:null:f);return M.jsx(t,E(h({},a),{ref:r,children:s.isValidElement(u)?s.cloneElement(u,void 0,y):null}))}return M.jsx(t,E(h({},a),{ref:r,children:c}))});return o.displayName=`${e}.Slot`,o}function Fe(e){const t=s.forwardRef((o,n)=>{const a=o,{children:r}=a,c=I(a,["children"]);if(s.isValidElement(r)){const i=ze(r),l=De(c,r.props);return r.type!==s.Fragment&&(l.ref=n?B(n,i):i),s.cloneElement(r,l)}return s.Children.count(r)>1?s.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var Le=Symbol("radix.slottable");function je(e){return s.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===Le}function De(e,t){const o=h({},t);for(const n in t){const r=e[n],c=t[n];/^on[A-Z]/.test(n)?r&&c?o[n]=(...i)=>{const l=c(...i);return r(...i),l}:r&&(o[n]=r):n==="style"?o[n]=h(h({},r),c):n==="className"&&(o[n]=[r,c].filter(Boolean).join(" "))}return h(h({},e),o)}function ze(e){var n,r;let t=(n=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:n.get,o=t&&"isReactWarning"in t&&t.isReactWarning;return o?e.ref:(t=(r=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:r.get,o=t&&"isReactWarning"in t&&t.isReactWarning,o?e.props.ref:e.props.ref||e.ref)}var Ue=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],ne=Ue.reduce((e,t)=>{const o=Oe(`Primitive.${t}`),n=s.forwardRef((r,c)=>{const d=r,{asChild:a}=d,i=I(d,["asChild"]),l=a?o:t;return typeof window!="undefined"&&(window[Symbol.for("radix-ui")]=!0),M.jsx(l,E(h({},i),{ref:c}))});return n.displayName=`Primitive.${t}`,E(h({},e),{[t]:n})},{});function $e(e){const t=s.useRef(e);return s.useEffect(()=>{t.current=e}),s.useMemo(()=>(...o)=>{var n;return(n=t.current)==null?void 0:n.call(t,...o)},[])}var Ve=J[" useInsertionEffect ".trim().toString()]||O;function Be({prop:e,defaultProp:t,onChange:o=()=>{},caller:n}){const[r,c,a]=We({defaultProp:t,onChange:o}),i=e!==void 0,l=i?e:r;{const u=s.useRef(e!==void 0);s.useEffect(()=>{const y=u.current;y!==i&&console.warn(`${n} is changing from ${y?"controlled":"uncontrolled"} to ${i?"controlled":"uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`),u.current=i},[i,n])}const d=s.useCallback(u=>{var y;if(i){const f=Ge(u)?u(e):u;f!==e&&((y=a.current)==null||y.call(a,f))}else c(u)},[i,e,c,a]);return[l,d]}function We({defaultProp:e,onChange:t}){const[o,n]=s.useState(e),r=s.useRef(o),c=s.useRef(t);return Ve(()=>{c.current=t},[t]),s.useEffect(()=>{var a;r.current!==o&&((a=c.current)==null||a.call(c,o),r.current=o)},[o,r]),[o,n,c]}function Ge(e){return typeof e=="function"}var qe=s.createContext(void 0);function He(e){const t=s.useContext(qe);return e||t||"ltr"}var $="rovingFocusGroup.onEntryFocus",Ke={bubbles:!1,cancelable:!0},F="RovingFocusGroup",[V,oe,Ye]=Ne(F),[Ze,Vt]=te(F,[Ye]),[Je,Xe]=Ze(F),re=s.forwardRef((e,t)=>M.jsx(V.Provider,{scope:e.__scopeRovingFocusGroup,children:M.jsx(V.Slot,{scope:e.__scopeRovingFocusGroup,children:M.jsx(Qe,E(h({},e),{ref:t}))})}));re.displayName=F;var Qe=s.forwardRef((e,t)=>{const W=e,{__scopeRovingFocusGroup:o,orientation:n,loop:r=!1,dir:c,currentTabStopId:a,defaultCurrentTabStopId:i,onCurrentTabStopIdChange:l,onEntryFocus:d,preventScrollOnEntryFocus:u=!1}=W,y=I(W,["__scopeRovingFocusGroup","orientation","loop","dir","currentTabStopId","defaultCurrentTabStopId","onCurrentTabStopIdChange","onEntryFocus","preventScrollOnEntryFocus"]),f=s.useRef(null),C=D(t,f),g=He(c),[x,v]=Be({prop:a,defaultProp:i!=null?i:null,onChange:l,caller:F}),[m,k]=s.useState(!1),R=$e(d),S=oe(o),w=s.useRef(!1),[P,A]=s.useState(0);return s.useEffect(()=>{const b=f.current;if(b)return b.addEventListener($,R),()=>b.removeEventListener($,R)},[R]),M.jsx(Je,{scope:o,orientation:n,dir:g,loop:r,currentTabStopId:x,onItemFocus:s.useCallback(b=>v(b),[v]),onItemShiftTab:s.useCallback(()=>k(!0),[]),onFocusableItemAdd:s.useCallback(()=>A(b=>b+1),[]),onFocusableItemRemove:s.useCallback(()=>A(b=>b-1),[]),children:M.jsx(ne.div,E(h({tabIndex:m||P===0?-1:0,"data-orientation":n},y),{ref:C,style:h({outline:"none"},e.style),onMouseDown:_(e.onMouseDown,()=>{w.current=!0}),onFocus:_(e.onFocus,b=>{const ae=!w.current;if(b.target===b.currentTarget&&ae&&!m){const G=new CustomEvent($,Ke);if(b.currentTarget.dispatchEvent(G),!G.defaultPrevented){const U=S().filter(N=>N.focusable),le=U.find(N=>N.active),ue=U.find(N=>N.id===x),de=[le,ue,...U].filter(Boolean).map(N=>N.ref.current);ie(de,u)}}w.current=!1}),onBlur:_(e.onBlur,()=>k(!1))}))})}),se="RovingFocusGroupItem",ce=s.forwardRef((e,t)=>{const v=e,{__scopeRovingFocusGroup:o,focusable:n=!0,active:r=!1,tabStopId:c,children:a}=v,i=I(v,["__scopeRovingFocusGroup","focusable","active","tabStopId","children"]),l=_e(),d=c||l,u=Xe(se,o),y=u.currentTabStopId===d,f=oe(o),{onFocusableItemAdd:C,onFocusableItemRemove:g,currentTabStopId:x}=u;return s.useEffect(()=>{if(n)return C(),()=>g()},[n,C,g]),M.jsx(V.ItemSlot,{scope:o,id:d,focusable:n,active:r,children:M.jsx(ne.span,E(h({tabIndex:y?0:-1,"data-orientation":u.orientation},i),{ref:t,onMouseDown:_(e.onMouseDown,m=>{n?u.onItemFocus(d):m.preventDefault()}),onFocus:_(e.onFocus,()=>u.onItemFocus(d)),onKeyDown:_(e.onKeyDown,m=>{if(m.key==="Tab"&&m.shiftKey){u.onItemShiftTab();return}if(m.target!==m.currentTarget)return;const k=nt(m,u.orientation,u.dir);if(k!==void 0){if(m.metaKey||m.ctrlKey||m.altKey||m.shiftKey)return;m.preventDefault();let S=f().filter(w=>w.focusable).map(w=>w.ref.current);if(k==="last")S.reverse();else if(k==="prev"||k==="next"){k==="prev"&&S.reverse();const w=S.indexOf(m.currentTarget);S=u.loop?ot(S,w+1):S.slice(w+1)}setTimeout(()=>ie(S))}}),children:typeof a=="function"?a({isCurrentTabStop:y,hasTabStop:x!=null}):a}))})});ce.displayName=se;var et={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function tt(e,t){return t!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}function nt(e,t,o){const n=tt(e.key,o);if(!(t==="vertical"&&["ArrowLeft","ArrowRight"].includes(n))&&!(t==="horizontal"&&["ArrowUp","ArrowDown"].includes(n)))return et[n]}function ie(e,t=!1){const o=document.activeElement;for(const n of e)if(n===o||(n.focus({preventScroll:t}),document.activeElement!==o))return}function ot(e,t){return e.map((o,n)=>e[(t+n)%e.length])}var Bt=re,Wt=ce;function rt(e,t){return s.useReducer((o,n)=>{const r=t[o][n];return r!=null?r:o},e)}var st=e=>{const{present:t,children:o}=e,n=ct(t),r=typeof o=="function"?o({present:n.isPresent}):s.Children.only(o),c=D(n.ref,it(r));return typeof o=="function"||n.isPresent?s.cloneElement(r,{ref:c}):null};st.displayName="Presence";function ct(e){const[t,o]=s.useState(),n=s.useRef(null),r=s.useRef(e),c=s.useRef("none"),a=e?"mounted":"unmounted",[i,l]=rt(a,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return s.useEffect(()=>{const d=j(n.current);c.current=i==="mounted"?d:"none"},[i]),O(()=>{const d=n.current,u=r.current;if(u!==e){const f=c.current,C=j(d);e?l("MOUNT"):C==="none"||(d==null?void 0:d.display)==="none"?l("UNMOUNT"):l(u&&f!==C?"ANIMATION_OUT":"UNMOUNT"),r.current=e}},[e,l]),O(()=>{var d;if(t){let u;const y=(d=t.ownerDocument.defaultView)!=null?d:window,f=g=>{const v=j(n.current).includes(CSS.escape(g.animationName));if(g.target===t&&v&&(l("ANIMATION_END"),!r.current)){const m=t.style.animationFillMode;t.style.animationFillMode="forwards",u=y.setTimeout(()=>{t.style.animationFillMode==="forwards"&&(t.style.animationFillMode=m)})}},C=g=>{g.target===t&&(c.current=j(n.current))};return t.addEventListener("animationstart",C),t.addEventListener("animationcancel",f),t.addEventListener("animationend",f),()=>{y.clearTimeout(u),t.removeEventListener("animationstart",C),t.removeEventListener("animationcancel",f),t.removeEventListener("animationend",f)}}else l("ANIMATION_END")},[t,l]),{isPresent:["mounted","unmountSuspended"].includes(i),ref:s.useCallback(d=>{n.current=d?getComputedStyle(d):null,o(d)},[])}}function j(e){return(e==null?void 0:e.animationName)||"none"}function it(e){var n,r;let t=(n=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:n.get,o=t&&"isReactWarning"in t&&t.isReactWarning;return o?e.ref:(t=(r=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:r.get,o=t&&"isReactWarning"in t&&t.isReactWarning,o?e.props.ref:e.props.ref||e.ref)}function Gt(e){const[t,o]=s.useState(void 0);return O(()=>{if(e){o({width:e.offsetWidth,height:e.offsetHeight});const n=new ResizeObserver(r=>{if(!Array.isArray(r)||!r.length)return;const c=r[0];let a,i;if("borderBoxSize"in c){const l=c.borderBoxSize,d=Array.isArray(l)?l[0]:l;a=d.inlineSize,i=d.blockSize}else a=e.offsetWidth,i=e.offsetHeight;o({width:a,height:i})});return n.observe(e,{box:"border-box"}),()=>n.unobserve(e)}else o(void 0)},[e]),t}export{dt as A,ft as B,ht as C,He as D,_e as E,Vt as F,Mt as G,Bt as H,Wt as I,pt as J,Ot as K,Rt as L,At as M,Nt as P,Pt as R,_t as S,Dt as T,zt as U,$t as X,yt as a,Et as b,B as c,bt as d,Ct as e,St as f,kt as g,xt as h,gt as i,M as j,Lt as k,jt as l,wt as m,It as n,te as o,st as p,ne as q,D as r,_ as s,Gt as t,Be as u,vt as v,Ut as w,Tt as x,Ft as y,mt as z};
