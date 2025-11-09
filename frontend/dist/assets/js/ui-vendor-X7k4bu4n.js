var ge=Object.defineProperty,Ee=Object.defineProperties;var xe=Object.getOwnPropertyDescriptors;var $=Object.getOwnPropertySymbols;var Z=Object.prototype.hasOwnProperty,J=Object.prototype.propertyIsEnumerable;var X=(e,t,r)=>t in e?ge(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,h=(e,t)=>{for(var r in t||(t={}))Z.call(t,r)&&X(e,r,t[r]);if($)for(var r of $(t))J.call(t,r)&&X(e,r,t[r]);return e},M=(e,t)=>Ee(e,xe(t));var P=(e,t)=>{var r={};for(var n in e)Z.call(e,n)&&t.indexOf(n)<0&&(r[n]=e[n]);if(e!=null&&$)for(var n of $(e))t.indexOf(n)<0&&J.call(e,n)&&(r[n]=e[n]);return r};import{r as s,R as L,a as be,b as we,c as re}from"./react-vendor-C9zT986Q.js";var oe={exports:{}},V={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Re=s,Se=Symbol.for("react.element"),Me=Symbol.for("react.fragment"),Pe=Object.prototype.hasOwnProperty,Ie=Re.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,Ae={key:!0,ref:!0,__self:!0,__source:!0};function se(e,t,r){var n,o={},c=null,a=null;r!==void 0&&(c=""+r),t.key!==void 0&&(c=""+t.key),t.ref!==void 0&&(a=t.ref);for(n in t)Pe.call(t,n)&&!Ae.hasOwnProperty(n)&&(o[n]=t[n]);if(e&&e.defaultProps)for(n in t=e.defaultProps,t)o[n]===void 0&&(o[n]=t[n]);return{$$typeof:Se,type:e,key:c,ref:a,props:o,_owner:Ie.current}}V.Fragment=Me;V.jsx=se;V.jsxs=se;oe.exports=V;var w=oe.exports;/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),ce=(...e)=>e.filter((t,r,n)=>!!t&&t.trim()!==""&&n.indexOf(t)===r).join(" ").trim();/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Te={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ne=s.forwardRef((u,d)=>{var l=u,{color:e="currentColor",size:t=24,strokeWidth:r=2,absoluteStrokeWidth:n,className:o="",children:c,iconNode:a}=l,i=P(l,["color","size","strokeWidth","absoluteStrokeWidth","className","children","iconNode"]);return s.createElement("svg",h(M(h({ref:d},Te),{width:t,height:t,stroke:e,strokeWidth:n?Number(r)*24/Number(t):r,className:ce("lucide",o)}),i),[...a.map(([m,f])=>s.createElement(m,f)),...Array.isArray(c)?c:[c]])});/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=(e,t)=>{const r=s.forwardRef((a,c)=>{var i=a,{className:n}=i,o=P(i,["className"]);return s.createElement(Ne,h({ref:c,iconNode:t,className:ce(`lucide-${Oe(e)}`,n)},o))});return r.displayName=`${e}`,r};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const At=p("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ot=p("Ban",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m4.9 4.9 14.2 14.2",key:"1m5liu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tt=p("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nt=p("CalendarClock",[["path",{d:"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5",key:"1osxxc"}],["path",{d:"M16 2v4",key:"4m81vk"}],["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M3 10h5",key:"r794hk"}],["path",{d:"M17.5 17.5 16 16.3V14",key:"akvzfd"}],["circle",{cx:"16",cy:"16",r:"6",key:"qoo3c4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lt=p("CalendarPlus",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["path",{d:"M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8",key:"3spt84"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M16 19h6",key:"xwg31i"}],["path",{d:"M19 16v6",key:"tddt3s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _t=p("CalendarX",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"m14 14-4 4",key:"rymu2i"}],["path",{d:"m10 14 4 4",key:"3sz06r"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dt=p("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ft=p("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jt=p("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bt=p("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ut=p("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zt=p("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $t=p("Cloud",[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wt=p("GripVertical",[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vt=p("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gt=p("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ht=p("List",[["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 18h.01",key:"1tta3j"}],["path",{d:"M3 6h.01",key:"1rqtza"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 18h13",key:"1lx6n3"}],["path",{d:"M8 6h13",key:"ik3vkj"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kt=p("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qt=p("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yt=p("MapPin",[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xt=p("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zt=p("Plane",[["path",{d:"M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",key:"1v9wt8"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jt=p("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qt=p("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const en=p("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tn=p("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nn=p("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rn=p("TrendingDown",[["polyline",{points:"22 17 13.5 8.5 8.5 13.5 2 7",key:"1r2t7k"}],["polyline",{points:"16 17 22 17 22 11",key:"11uiuu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const on=p("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sn=p("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cn=p("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const an=p("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ln=p("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);function Q(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function Y(...e){return t=>{let r=!1;const n=e.map(o=>{const c=Q(o,t);return!r&&typeof c=="function"&&(r=!0),c});if(r)return()=>{for(let o=0;o<n.length;o++){const c=n[o];typeof c=="function"?c():Q(e[o],null)}}}}function D(...e){return s.useCallback(Y(...e),e)}function O(e,t,{checkForDefaultPrevented:r=!0}={}){return function(o){if(e==null||e(o),r===!1||!o.defaultPrevented)return t==null?void 0:t(o)}}function ie(e,t=[]){let r=[];function n(c,a){const i=s.createContext(a),d=r.length;r=[...r,a];const u=m=>{var k;const v=m,{scope:f,children:E}=v,x=P(v,["scope","children"]),g=((k=f==null?void 0:f[e])==null?void 0:k[d])||i,C=s.useMemo(()=>x,Object.values(x));return w.jsx(g.Provider,{value:C,children:E})};u.displayName=c+"Provider";function l(m,f){var g;const E=((g=f==null?void 0:f[e])==null?void 0:g[d])||i,x=s.useContext(E);if(x)return x;if(a!==void 0)return a;throw new Error(`\`${m}\` must be used within \`${c}\``)}return[u,l]}const o=()=>{const c=r.map(a=>s.createContext(a));return function(i){const d=(i==null?void 0:i[e])||c;return s.useMemo(()=>({[`__scope${e}`]:M(h({},i),{[e]:d})}),[i,d])}};return o.scopeName=e,[n,Le(o,...t)]}function Le(...e){const t=e[0];if(e.length===1)return t;const r=()=>{const n=e.map(o=>({useScope:o(),scopeName:o.scopeName}));return function(c){const a=n.reduce((i,{useScope:d,scopeName:u})=>{const m=d(c)[`__scope${u}`];return h(h({},i),m)},{});return s.useMemo(()=>({[`__scope${t.scopeName}`]:a}),[a])}};return r.scopeName=t.scopeName,r}function ee(e){const t=_e(e),r=s.forwardRef((n,o)=>{const u=n,{children:c}=u,a=P(u,["children"]),i=s.Children.toArray(c),d=i.find(Fe);if(d){const l=d.props.children,m=i.map(f=>f===d?s.Children.count(l)>1?s.Children.only(null):s.isValidElement(l)?l.props.children:null:f);return w.jsx(t,M(h({},a),{ref:o,children:s.isValidElement(l)?s.cloneElement(l,void 0,m):null}))}return w.jsx(t,M(h({},a),{ref:o,children:c}))});return r.displayName=`${e}.Slot`,r}function _e(e){const t=s.forwardRef((r,n)=>{const a=r,{children:o}=a,c=P(a,["children"]);if(s.isValidElement(o)){const i=Be(o),d=je(c,o.props);return o.type!==s.Fragment&&(d.ref=n?Y(n,i):i),s.cloneElement(o,d)}return s.Children.count(o)>1?s.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var De=Symbol("radix.slottable");function Fe(e){return s.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===De}function je(e,t){const r=h({},t);for(const n in t){const o=e[n],c=t[n];/^on[A-Z]/.test(n)?o&&c?r[n]=(...i)=>{const d=c(...i);return o(...i),d}:o&&(r[n]=o):n==="style"?r[n]=h(h({},o),c):n==="className"&&(r[n]=[o,c].filter(Boolean).join(" "))}return h(h({},e),r)}function Be(e){var n,o;let t=(n=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:n.get,r=t&&"isReactWarning"in t&&t.isReactWarning;return r?e.ref:(t=(o=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:o.get,r=t&&"isReactWarning"in t&&t.isReactWarning,r?e.props.ref:e.props.ref||e.ref)}function Ue(e){const t=e+"CollectionProvider",[r,n]=ie(t),[o,c]=r(t,{collectionRef:{current:null},itemMap:new Map}),a=g=>{const{scope:C,children:v}=g,k=L.useRef(null),R=L.useRef(new Map).current;return w.jsx(o,{scope:C,itemMap:R,collectionRef:k,children:v})};a.displayName=t;const i=e+"CollectionSlot",d=ee(i),u=L.forwardRef((g,C)=>{const{scope:v,children:k}=g,R=c(i,v),b=D(C,R.collectionRef);return w.jsx(d,{ref:b,children:k})});u.displayName=i;const l=e+"CollectionItemSlot",m="data-radix-collection-item",f=ee(l),E=L.forwardRef((g,C)=>{const I=g,{scope:v,children:k}=I,R=P(I,["scope","children"]),b=L.useRef(null),S=D(C,b),A=c(l,v);return L.useEffect(()=>(A.itemMap.set(b,h({ref:b},R)),()=>void A.itemMap.delete(b))),w.jsx(f,{[m]:"",ref:S,children:k})});E.displayName=l;function x(g){const C=c(e+"CollectionConsumer",g);return L.useCallback(()=>{const k=C.collectionRef.current;if(!k)return[];const R=Array.from(k.querySelectorAll(`[${m}]`));return Array.from(C.itemMap.values()).sort((A,I)=>R.indexOf(A.ref.current)-R.indexOf(I.ref.current))},[C.collectionRef,C.itemMap])}return[{Provider:a,Slot:u,ItemSlot:E},x,n]}function ze(e){const t=$e(e),r=s.forwardRef((n,o)=>{const u=n,{children:c}=u,a=P(u,["children"]),i=s.Children.toArray(c),d=i.find(Ve);if(d){const l=d.props.children,m=i.map(f=>f===d?s.Children.count(l)>1?s.Children.only(null):s.isValidElement(l)?l.props.children:null:f);return w.jsx(t,M(h({},a),{ref:o,children:s.isValidElement(l)?s.cloneElement(l,void 0,m):null}))}return w.jsx(t,M(h({},a),{ref:o,children:c}))});return r.displayName=`${e}.Slot`,r}function $e(e){const t=s.forwardRef((r,n)=>{const a=r,{children:o}=a,c=P(a,["children"]);if(s.isValidElement(o)){const i=He(o),d=Ge(c,o.props);return o.type!==s.Fragment&&(d.ref=n?Y(n,i):i),s.cloneElement(o,d)}return s.Children.count(o)>1?s.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var We=Symbol("radix.slottable");function Ve(e){return s.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===We}function Ge(e,t){const r=h({},t);for(const n in t){const o=e[n],c=t[n];/^on[A-Z]/.test(n)?o&&c?r[n]=(...i)=>{const d=c(...i);return o(...i),d}:o&&(r[n]=o):n==="style"?r[n]=h(h({},o),c):n==="className"&&(r[n]=[o,c].filter(Boolean).join(" "))}return h(h({},e),r)}function He(e){var n,o;let t=(n=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:n.get,r=t&&"isReactWarning"in t&&t.isReactWarning;return r?e.ref:(t=(o=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:o.get,r=t&&"isReactWarning"in t&&t.isReactWarning,r?e.props.ref:e.props.ref||e.ref)}var Ke=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],U=Ke.reduce((e,t)=>{const r=ze(`Primitive.${t}`),n=s.forwardRef((o,c)=>{const u=o,{asChild:a}=u,i=P(u,["asChild"]),d=a?r:t;return typeof window!="undefined"&&(window[Symbol.for("radix-ui")]=!0),w.jsx(d,M(h({},i),{ref:c}))});return n.displayName=`Primitive.${t}`,M(h({},e),{[t]:n})},{});function qe(e,t){e&&be.flushSync(()=>e.dispatchEvent(t))}function G(e){const t=s.useRef(e);return s.useEffect(()=>{t.current=e}),s.useMemo(()=>(...r)=>{var n;return(n=t.current)==null?void 0:n.call(t,...r)},[])}function Ye(e,t=globalThis==null?void 0:globalThis.document){const r=G(e);s.useEffect(()=>{const n=o=>{o.key==="Escape"&&r(o)};return t.addEventListener("keydown",n,{capture:!0}),()=>t.removeEventListener("keydown",n,{capture:!0})},[r,t])}var Xe="DismissableLayer",K="dismissableLayer.update",Ze="dismissableLayer.pointerDownOutside",Je="dismissableLayer.focusOutside",te,ae=s.createContext({layers:new Set,layersWithOutsidePointerEventsDisabled:new Set,branches:new Set}),le=s.forwardRef((e,t)=>{var j;const I=e,{disableOutsidePointerEvents:r=!1,onEscapeKeyDown:n,onPointerDownOutside:o,onFocusOutside:c,onInteractOutside:a,onDismiss:i}=I,d=P(I,["disableOutsidePointerEvents","onEscapeKeyDown","onPointerDownOutside","onFocusOutside","onInteractOutside","onDismiss"]),u=s.useContext(ae),[l,m]=s.useState(null),f=(j=l==null?void 0:l.ownerDocument)!=null?j:globalThis==null?void 0:globalThis.document,[,E]=s.useState({}),x=D(t,y=>m(y)),g=Array.from(u.layers),[C]=[...u.layersWithOutsidePointerEventsDisabled].slice(-1),v=g.indexOf(C),k=l?g.indexOf(l):-1,R=u.layersWithOutsidePointerEventsDisabled.size>0,b=k>=v,S=et(y=>{const _=y.target,B=[...u.branches].some(T=>T.contains(_));!b||B||(o==null||o(y),a==null||a(y),y.defaultPrevented||i==null||i())},f),A=tt(y=>{const _=y.target;[...u.branches].some(T=>T.contains(_))||(c==null||c(y),a==null||a(y),y.defaultPrevented||i==null||i())},f);return Ye(y=>{k===u.layers.size-1&&(n==null||n(y),!y.defaultPrevented&&i&&(y.preventDefault(),i()))},f),s.useEffect(()=>{if(l)return r&&(u.layersWithOutsidePointerEventsDisabled.size===0&&(te=f.body.style.pointerEvents,f.body.style.pointerEvents="none"),u.layersWithOutsidePointerEventsDisabled.add(l)),u.layers.add(l),ne(),()=>{r&&u.layersWithOutsidePointerEventsDisabled.size===1&&(f.body.style.pointerEvents=te)}},[l,f,r,u]),s.useEffect(()=>()=>{l&&(u.layers.delete(l),u.layersWithOutsidePointerEventsDisabled.delete(l),ne())},[l,u]),s.useEffect(()=>{const y=()=>E({});return document.addEventListener(K,y),()=>document.removeEventListener(K,y)},[]),w.jsx(U.div,M(h({},d),{ref:x,style:h({pointerEvents:R?b?"auto":"none":void 0},e.style),onFocusCapture:O(e.onFocusCapture,A.onFocusCapture),onBlurCapture:O(e.onBlurCapture,A.onBlurCapture),onPointerDownCapture:O(e.onPointerDownCapture,S.onPointerDownCapture)}))});le.displayName=Xe;var Qe="DismissableLayerBranch",ue=s.forwardRef((e,t)=>{const r=s.useContext(ae),n=s.useRef(null),o=D(t,n);return s.useEffect(()=>{const c=n.current;if(c)return r.branches.add(c),()=>{r.branches.delete(c)}},[r.branches]),w.jsx(U.div,M(h({},e),{ref:o}))});ue.displayName=Qe;function et(e,t=globalThis==null?void 0:globalThis.document){const r=G(e),n=s.useRef(!1),o=s.useRef(()=>{});return s.useEffect(()=>{const c=i=>{if(i.target&&!n.current){let d=function(){de(Ze,r,u,{discrete:!0})};const u={originalEvent:i};i.pointerType==="touch"?(t.removeEventListener("click",o.current),o.current=d,t.addEventListener("click",o.current,{once:!0})):d()}else t.removeEventListener("click",o.current);n.current=!1},a=window.setTimeout(()=>{t.addEventListener("pointerdown",c)},0);return()=>{window.clearTimeout(a),t.removeEventListener("pointerdown",c),t.removeEventListener("click",o.current)}},[t,r]),{onPointerDownCapture:()=>n.current=!0}}function tt(e,t=globalThis==null?void 0:globalThis.document){const r=G(e),n=s.useRef(!1);return s.useEffect(()=>{const o=c=>{c.target&&!n.current&&de(Je,r,{originalEvent:c},{discrete:!1})};return t.addEventListener("focusin",o),()=>t.removeEventListener("focusin",o)},[t,r]),{onFocusCapture:()=>n.current=!0,onBlurCapture:()=>n.current=!1}}function ne(){const e=new CustomEvent(K);document.dispatchEvent(e)}function de(e,t,r,{discrete:n}){const o=r.originalEvent.target,c=new CustomEvent(e,{bubbles:!1,cancelable:!0,detail:r});t&&o.addEventListener(e,t,{once:!0}),n?qe(o,c):o.dispatchEvent(c)}var un=le,dn=ue,F=globalThis!=null&&globalThis.document?s.useLayoutEffect:()=>{},nt="Portal",rt=s.forwardRef((e,t)=>{var d;const i=e,{container:r}=i,n=P(i,["container"]),[o,c]=s.useState(!1);F(()=>c(!0),[]);const a=r||o&&((d=globalThis==null?void 0:globalThis.document)==null?void 0:d.body);return a?we.createPortal(w.jsx(U.div,M(h({},n),{ref:t})),a):null});rt.displayName=nt;function ot(e,t){return s.useReducer((r,n)=>{const o=t[r][n];return o!=null?o:r},e)}var st=e=>{const{present:t,children:r}=e,n=ct(t),o=typeof r=="function"?r({present:n.isPresent}):s.Children.only(r),c=D(n.ref,it(o));return typeof r=="function"||n.isPresent?s.cloneElement(o,{ref:c}):null};st.displayName="Presence";function ct(e){const[t,r]=s.useState(),n=s.useRef(null),o=s.useRef(e),c=s.useRef("none"),a=e?"mounted":"unmounted",[i,d]=ot(a,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return s.useEffect(()=>{const u=W(n.current);c.current=i==="mounted"?u:"none"},[i]),F(()=>{const u=n.current,l=o.current;if(l!==e){const f=c.current,E=W(u);e?d("MOUNT"):E==="none"||(u==null?void 0:u.display)==="none"?d("UNMOUNT"):d(l&&f!==E?"ANIMATION_OUT":"UNMOUNT"),o.current=e}},[e,d]),F(()=>{var u;if(t){let l;const m=(u=t.ownerDocument.defaultView)!=null?u:window,f=x=>{const C=W(n.current).includes(CSS.escape(x.animationName));if(x.target===t&&C&&(d("ANIMATION_END"),!o.current)){const v=t.style.animationFillMode;t.style.animationFillMode="forwards",l=m.setTimeout(()=>{t.style.animationFillMode==="forwards"&&(t.style.animationFillMode=v)})}},E=x=>{x.target===t&&(c.current=W(n.current))};return t.addEventListener("animationstart",E),t.addEventListener("animationcancel",f),t.addEventListener("animationend",f),()=>{m.clearTimeout(l),t.removeEventListener("animationstart",E),t.removeEventListener("animationcancel",f),t.removeEventListener("animationend",f)}}else d("ANIMATION_END")},[t,d]),{isPresent:["mounted","unmountSuspended"].includes(i),ref:s.useCallback(u=>{n.current=u?getComputedStyle(u):null,r(u)},[])}}function W(e){return(e==null?void 0:e.animationName)||"none"}function it(e){var n,o;let t=(n=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:n.get,r=t&&"isReactWarning"in t&&t.isReactWarning;return r?e.ref:(t=(o=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:o.get,r=t&&"isReactWarning"in t&&t.isReactWarning,r?e.props.ref:e.props.ref||e.ref)}var at=re[" useInsertionEffect ".trim().toString()]||F;function lt({prop:e,defaultProp:t,onChange:r=()=>{},caller:n}){const[o,c,a]=ut({defaultProp:t,onChange:r}),i=e!==void 0,d=i?e:o;{const l=s.useRef(e!==void 0);s.useEffect(()=>{const m=l.current;m!==i&&console.warn(`${n} is changing from ${m?"controlled":"uncontrolled"} to ${i?"controlled":"uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`),l.current=i},[i,n])}const u=s.useCallback(l=>{var m;if(i){const f=dt(l)?l(e):l;f!==e&&((m=a.current)==null||m.call(a,f))}else c(l)},[i,e,c,a]);return[d,u]}function ut({defaultProp:e,onChange:t}){const[r,n]=s.useState(e),o=s.useRef(r),c=s.useRef(t);return at(()=>{c.current=t},[t]),s.useEffect(()=>{var a;o.current!==r&&((a=c.current)==null||a.call(c,r),o.current=r)},[r,o]),[r,n,c]}function dt(e){return typeof e=="function"}var ft=re[" useId ".trim().toString()]||(()=>{}),pt=0;function yt(e){const[t,r]=s.useState(ft());return F(()=>{r(n=>n!=null?n:String(pt++))},[e]),e||(t?`radix-${t}`:"")}var ht=s.createContext(void 0);function mt(e){const t=s.useContext(ht);return e||t||"ltr"}var H="rovingFocusGroup.onEntryFocus",vt={bubbles:!1,cancelable:!0},z="RovingFocusGroup",[q,fe,kt]=Ue(z),[Ct,fn]=ie(z,[kt]),[gt,Et]=Ct(z),pe=s.forwardRef((e,t)=>w.jsx(q.Provider,{scope:e.__scopeRovingFocusGroup,children:w.jsx(q.Slot,{scope:e.__scopeRovingFocusGroup,children:w.jsx(xt,M(h({},e),{ref:t}))})}));pe.displayName=z;var xt=s.forwardRef((e,t)=>{const j=e,{__scopeRovingFocusGroup:r,orientation:n,loop:o=!1,dir:c,currentTabStopId:a,defaultCurrentTabStopId:i,onCurrentTabStopIdChange:d,onEntryFocus:u,preventScrollOnEntryFocus:l=!1}=j,m=P(j,["__scopeRovingFocusGroup","orientation","loop","dir","currentTabStopId","defaultCurrentTabStopId","onCurrentTabStopIdChange","onEntryFocus","preventScrollOnEntryFocus"]),f=s.useRef(null),E=D(t,f),x=mt(c),[g,C]=lt({prop:a,defaultProp:i!=null?i:null,onChange:d,caller:z}),[v,k]=s.useState(!1),R=G(u),b=fe(r),S=s.useRef(!1),[A,I]=s.useState(0);return s.useEffect(()=>{const y=f.current;if(y)return y.addEventListener(H,R),()=>y.removeEventListener(H,R)},[R]),w.jsx(gt,{scope:r,orientation:n,dir:x,loop:o,currentTabStopId:g,onItemFocus:s.useCallback(y=>C(y),[C]),onItemShiftTab:s.useCallback(()=>k(!0),[]),onFocusableItemAdd:s.useCallback(()=>I(y=>y+1),[]),onFocusableItemRemove:s.useCallback(()=>I(y=>y-1),[]),children:w.jsx(U.div,M(h({tabIndex:v||A===0?-1:0,"data-orientation":n},m),{ref:E,style:h({outline:"none"},e.style),onMouseDown:O(e.onMouseDown,()=>{S.current=!0}),onFocus:O(e.onFocus,y=>{const _=!S.current;if(y.target===y.currentTarget&&_&&!v){const B=new CustomEvent(H,vt);if(y.currentTarget.dispatchEvent(B),!B.defaultPrevented){const T=b().filter(N=>N.focusable),ve=T.find(N=>N.active),ke=T.find(N=>N.id===g),Ce=[ve,ke,...T].filter(Boolean).map(N=>N.ref.current);me(Ce,l)}}S.current=!1}),onBlur:O(e.onBlur,()=>k(!1))}))})}),ye="RovingFocusGroupItem",he=s.forwardRef((e,t)=>{const C=e,{__scopeRovingFocusGroup:r,focusable:n=!0,active:o=!1,tabStopId:c,children:a}=C,i=P(C,["__scopeRovingFocusGroup","focusable","active","tabStopId","children"]),d=yt(),u=c||d,l=Et(ye,r),m=l.currentTabStopId===u,f=fe(r),{onFocusableItemAdd:E,onFocusableItemRemove:x,currentTabStopId:g}=l;return s.useEffect(()=>{if(n)return E(),()=>x()},[n,E,x]),w.jsx(q.ItemSlot,{scope:r,id:u,focusable:n,active:o,children:w.jsx(U.span,M(h({tabIndex:m?0:-1,"data-orientation":l.orientation},i),{ref:t,onMouseDown:O(e.onMouseDown,v=>{n?l.onItemFocus(u):v.preventDefault()}),onFocus:O(e.onFocus,()=>l.onItemFocus(u)),onKeyDown:O(e.onKeyDown,v=>{if(v.key==="Tab"&&v.shiftKey){l.onItemShiftTab();return}if(v.target!==v.currentTarget)return;const k=Rt(v,l.orientation,l.dir);if(k!==void 0){if(v.metaKey||v.ctrlKey||v.altKey||v.shiftKey)return;v.preventDefault();let b=f().filter(S=>S.focusable).map(S=>S.ref.current);if(k==="last")b.reverse();else if(k==="prev"||k==="next"){k==="prev"&&b.reverse();const S=b.indexOf(v.currentTarget);b=l.loop?St(b,S+1):b.slice(S+1)}setTimeout(()=>me(b))}}),children:typeof a=="function"?a({isCurrentTabStop:m,hasTabStop:g!=null}):a}))})});he.displayName=ye;var bt={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function wt(e,t){return t!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}function Rt(e,t,r){const n=wt(e.key,r);if(!(t==="vertical"&&["ArrowLeft","ArrowRight"].includes(n))&&!(t==="horizontal"&&["ArrowUp","ArrowDown"].includes(n)))return bt[n]}function me(e,t=!1){const r=document.activeElement;for(const n of e)if(n===r||(n.focus({preventScroll:t}),document.activeElement!==r))return}function St(e,t){return e.map((r,n)=>e[(t+n)%e.length])}var pn=pe,yn=he;function hn(e){const[t,r]=s.useState(void 0);return F(()=>{if(e){r({width:e.offsetWidth,height:e.offsetHeight});const n=new ResizeObserver(o=>{if(!Array.isArray(o)||!o.length)return;const c=o[0];let a,i;if("borderBoxSize"in c){const d=c.borderBoxSize,u=Array.isArray(d)?d[0]:d;a=u.inlineSize,i=u.blockSize}else a=e.offsetWidth,i=e.offsetHeight;r({width:a,height:i})});return n.observe(e,{box:"border-box"}),()=>n.unobserve(e)}else r(void 0)},[e]),t}export{tn as $,Yt as A,Tt as B,Dt as C,hn as D,Ft as E,an as F,Wt as G,At as H,_t as I,Vt as J,Jt as K,Gt as L,Xt as M,nn as N,Ot as O,U as P,Lt as Q,un as R,en as S,sn as T,cn as U,mt as V,yt as W,ln as X,fn as Y,pn as Z,yn as _,jt as a,Nt as b,Y as c,qt as d,ie as e,Ue as f,dn as g,lt as h,st as i,w as j,O as k,G as l,rt as m,F as n,qe as o,Kt as p,Bt as q,$t as r,Zt as s,zt as t,D as u,Ut as v,rn as w,on as x,Qt as y,Ht as z};
