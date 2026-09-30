export const OCEAN_RUNTIME_POLICY=Object.freeze({
  network:'local-only',
  analytics:false,
  paidServices:false,
  externalAssets:false,
  maxDevicePixelRatio:2
});

export function clampDevicePixelRatio(value){
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0)return 1;
  return Math.min(2,Math.max(1,n));
}
