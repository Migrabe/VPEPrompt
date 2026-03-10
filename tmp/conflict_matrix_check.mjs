import { computeFromState } from '../server/prompt_engine.js';

function has(obj, path) {
  return path.split('.').every((part) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, part)) {
      obj = obj[part];
      return true;
    }
    return false;
  });
}

function get(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

const cases = [
  {
    id: 'C1',
    title: 'quickStyle x fashionFoodStyle -> mutual exclusion',
    state: {
      aiModel: 'stable-diffusion',
      promptFormat: 'flat',
      quickStyle: '1917',
      fashionFoodStyle: 'vogue-polished',
      mainSubject: 'test subject'
    },
    assert: (json) => {
      const q = get(json, 'parameters.quick_style');
      const f = get(json, 'parameters.fashion_food_style');
      return !!q && !f;
    }
  },
  {
    id: 'C2',
    title: 'motionBlurMode requires flat format',
    state: {
      aiModel: 'stable-diffusion',
      promptFormat: 'structured',
      motionBlurMode: true,
      mainSubject: 'runner'
    },
    assert: (json) => {
      const mode = get(json, 'modes.motion_blur');
      const mb = get(json, 'parameters.motion_blur');
      return mode === undefined && mb === undefined;
    }
  },
  {
    id: 'C3',
    title: 'grid3x3 incompatible with midjourney format',
    state: {
      aiModel: 'midjourney',
      promptFormat: 'midjourney',
      grid3x3Mode: true,
      mainSubject: 'city skyline'
    },
    assert: (json) => get(json, 'modes.grid3x3') === undefined
  },
  {
    id: 'C4',
    title: 'quickStyle clears manual optics fields',
    state: {
      aiModel: 'stable-diffusion',
      promptFormat: 'flat',
      quickStyle: '1917',
      lens: 'shot on Panavision C-Series Anamorphic',
      focalLength: '35mm',
      aperture: 'f/1.4',
      mainSubject: 'portrait'
    },
    assert: (json) => {
      const quick = get(json, 'parameters.quick_style');
      const camera = get(json, 'parameters.camera');
      return !!quick && camera === undefined;
    }
  },
  {
    id: 'C5',
    title: 'dall-e-3 strips negative prompt',
    state: {
      aiModel: 'dall-e-3',
      promptFormat: 'structured',
      negativePrompt: 'blurry, low quality',
      mainSubject: 'product shot'
    },
    assert: (json) => !has(json, 'negative')
  }
];

let failed = 0;
for (const t of cases) {
  const out = computeFromState(t.state);
  const ok = t.assert(out.json || {});
  console.log(`${ok ? 'PASS' : 'FAIL'} ${t.id} - ${t.title}`);
  if (!ok) {
    failed += 1;
    console.log('  JSON:', JSON.stringify(out.json || {}, null, 2));
  }
}

if (failed) {
  console.error(`SUMMARY: FAIL (${failed}/${cases.length} failed)`);
  process.exit(1);
}

console.log(`SUMMARY: PASS (${cases.length}/${cases.length})`);
