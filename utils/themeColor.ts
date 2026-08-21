function hexToHsl(hex: string) {
  hex = hex.replace(/^#/, '');
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    const hexVal = Math.round(255 * color).toString(16).padStart(2, '0');
    return hexVal;
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function applyThemeColor(hexColor: string) {
  try {
    const { h, s, l } = hexToHsl(hexColor);
    
    const shades = {
      50: hslToHex(h, s, 97),
      100: hslToHex(h, s, 92),
      200: hslToHex(h, s, 83),
      300: hslToHex(h, s, 72),
      400: hslToHex(h, s, 60),
      500: hexColor,
      600: hslToHex(h, s, Math.max(10, l - 10)),
      700: hslToHex(h, s, Math.max(8, l - 18)),
      800: hslToHex(h, s, Math.max(6, l - 26)),
      900: hslToHex(h, s, Math.max(4, l - 34)),
      950: hslToHex(h, s, Math.max(2, l - 42)),
    };

    const root = document.documentElement;
    Object.entries(shades).forEach(([shade, hex]) => {
      root.style.setProperty(`--primary-${shade}`, hex);
    });
  } catch (error) {
    console.error('Failed to apply custom theme color', error);
  }
}

export function resetThemeColor() {
  const root = document.documentElement;
  const defaults = {
    50: '#f4f6f8',
    100: '#e3e8ee',
    200: '#c8d2df',
    300: '#a1b2c7',
    400: '#758caa',
    500: '#546d8e',
    600: '#425674',
    700: '#36465f',
    800: '#303b4f',
    900: '#2a3344',
    950: '#1b212f',
  };
  Object.entries(defaults).forEach(([shade, hex]) => {
    root.style.setProperty(`--primary-${shade}`, hex);
  });
}
